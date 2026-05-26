"use client";

import { useMemo, useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useDashboard,
  DayKey,
  WeekTemplate,
  DateOverrides,
} from "@/lib/context/dashboard-context";
import { Button } from "@/components/ui/button";
import { RefreshCw, X } from "lucide-react";
import { CalendarIcon } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  format,
  startOfWeek,
  endOfWeek,
  addDays,
  differenceInCalendarDays,
} from "date-fns";
import useCampaigns from "@/hooks/useCampaigns";
import { toast } from "react-hot-toast";
import {
  BackendTimeSlot,
  BackendSchedule,
  syncCampaignSchedulesNow,
} from "@/api/services/campaigns.api";

const days: DayKey[] = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
const hours = Array.from({ length: 24 }, (_, i) =>
  i.toString().padStart(2, "0"),
);
const weekKeys = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"] as const;

type SyncedCampaign = {
  id: string;
  name: string;
  state: string;
  scheduleCount: number | null;
};

type CampaignScheduleDraft = {
  weekTemplate?: WeekTemplate;
  dateOverrides?: DateOverrides;
};

type BackendTimeSlotLike = BackendTimeSlot & {
  start?: string;
  end?: string;
  start_time?: string;
  end_time?: string;
};

type BackendScheduleLike = BackendSchedule & {
  schedule_date?: string | null;
  time_slots?: BackendTimeSlot[];
  slots?: BackendTimeSlot[];
};

function formatDateISO(date: Date) {
  return format(date, "yyyy-MM-dd");
}

function backendDateToISO(dateString: string | null): string | null {
  if (!dateString) return null;

  if (/^\d{8}$/.test(dateString)) {
    return `${dateString.slice(0, 4)}-${dateString.slice(4, 6)}-${dateString.slice(6, 8)}`;
  }

  if (/^\d{4}-\d{2}-\d{2}/.test(dateString)) {
    return dateString.slice(0, 10);
  }

  return `${dateString.slice(0, 4)}-${dateString.slice(4, 6)}-${dateString.slice(6, 8)}`;
}

function getWeekDayKey(dateString: string): DayKey {
  const date = new Date(`${dateString}T00:00:00`);
  const dayKey = weekKeys[date.getDay()];
  return dayKey as DayKey;
}

function timeSlotsToBooleanSchedule(timeSlots: BackendTimeSlot[]) {
  const schedule = Array(24).fill(false);

  timeSlots.forEach((timeSlot) => {
    const { startTime, endTime } = normalizeTimeSlot(timeSlot);
    const startHour = parseTimeSlotHour(startTime);
    const rawEndHour = parseTimeSlotHour(endTime);
    if (startHour === null || rawEndHour === null) return;

    const endHour =
      rawEndHour <= startHour && rawEndHour === 0 ? 24 : rawEndHour;

    for (let hour = startHour; hour < endHour; hour += 1) {
      const normalizedHour = hour % 24;
      if (normalizedHour >= 0) schedule[normalizedHour] = true;
    }
  });

  return schedule;
}

function normalizeTimeSlot(timeSlot: BackendTimeSlot): BackendTimeSlot {
  const slot = timeSlot as BackendTimeSlotLike;

  return {
    startTime: slot.startTime ?? slot.start_time ?? slot.start ?? "",
    endTime: slot.endTime ?? slot.end_time ?? slot.end ?? "",
  };
}

function getScheduleDate(schedule: BackendSchedule) {
  const normalized = schedule as BackendScheduleLike;
  return normalized.scheduleDate ?? normalized.schedule_date ?? null;
}

function getScheduleTimeSlots(schedule: BackendSchedule) {
  const normalized = schedule as BackendScheduleLike;
  return (
    normalized.timeSlots ??
    normalized.time_slots ??
    normalized.slots ??
    []
  );
}

function parseTimeSlotHour(time: string | number | null | undefined) {
  if (typeof time === "number") {
    return time >= 0 && time <= 24 ? time : null;
  }

  if (!time) return null;

  const hour = Number.parseInt(String(time).slice(0, 2), 10);
  if (Number.isNaN(hour) || hour < 0 || hour > 24) return null;
  return hour;
}

function buildDateOverridesFromSchedules(
  schedules: BackendSchedule[],
): DateOverrides {
  return schedules.reduce((acc, schedule) => {
    const scheduleISO = backendDateToISO(getScheduleDate(schedule));
    if (!scheduleISO) return acc;
    const slotSchedule = timeSlotsToBooleanSchedule(
      getScheduleTimeSlots(schedule),
    );
    const current = acc[scheduleISO] ?? createZeroSchedule();
    acc[scheduleISO] = current.map(
      (active, hour) => active || slotSchedule[hour],
    );
    return acc;
  }, {} as DateOverrides);
}

function buildWeeklyTemplateFromSchedules(
  schedules: BackendSchedule[],
  weekStartISO: string,
): WeekTemplate {
  const template = createEmptyWeekTemplate();
  const weekStartDate = new Date(`${weekStartISO}T00:00:00`);

  schedules.forEach((schedule) => {
    const scheduleDate = getScheduleDate(schedule);
    const slotSchedule = timeSlotsToBooleanSchedule(
      getScheduleTimeSlots(schedule),
    );

    if (scheduleDate) {
      const scheduleISO = backendDateToISO(scheduleDate);
      if (!scheduleISO) return;
      const scheduledDate = new Date(`${scheduleISO}T00:00:00`);
      const dayIndex = differenceInCalendarDays(scheduledDate, weekStartDate);
      if (dayIndex < 0 || dayIndex >= days.length) return;
      const dayKey = days[dayIndex];
      template[dayKey] = template[dayKey].map(
        (active, hour) => active || slotSchedule[hour],
      );
    } else {
      days.forEach((day) => {
        template[day] = template[day].map(
          (active, hour) => active || slotSchedule[hour],
        );
      });
    }
  });

  return template;
}

function booleanScheduleToTimeSlots(schedule: boolean[]) {
  const slots: BackendTimeSlot[] = [];
  let start: number | null = null;
  for (let h = 0; h <= 24; h += 1) {
    const active = h < 24 ? Boolean(schedule[h]) : false;
    if (active && start === null) start = h;
    if (!active && start !== null) {
      const end = h;
      const startStr = String(start).padStart(2, "0") + ":00";
      const endStr = String(end).padStart(2, "0") + ":00";
      slots.push({ startTime: startStr, endTime: endStr });
      start = null;
    }
  }
  return slots;
}

function isoToBackendDate(iso: string) {
  // iso: YYYY-MM-DD -> backend YYYYMMDD
  return iso.replace(/-/g, "");
}

function buildSchedulesFromState(
  existingSchedules: BackendSchedule[] | undefined,
  weekTemplate: WeekTemplate,
  dateOverrides: DateOverrides,
  campaignIdNum: number,
  weekStartISO?: string,
) {
  const result: BackendSchedule[] = [];

  if (existingSchedules) {
    result.push(...existingSchedules.map((s) => ({ ...s })));
  }

  // If a concrete week start is provided, emit date-specific schedules for each
  // weekday that has active hours. Otherwise fall back to a single recurring
  // schedule (scheduleDate: null) that represents the union across days.
  if (weekStartISO) {
    const base = new Date(`${weekStartISO}T00:00:00`);
    days.forEach((d, di) => {
      const daySchedule = weekTemplate[d] ?? createZeroSchedule();
      if (!daySchedule.some(Boolean)) return;
      const iso = formatDateISO(addDays(base, di));
      if (Object.hasOwn(dateOverrides, iso)) return;
      result.push({
        id: -1,
        campaignId: campaignIdNum,
        scheduleDate: isoToBackendDate(iso),
        endDate: null,
        timeSlots: booleanScheduleToTimeSlots(daySchedule),
        timezone: "UTC",
        action: "PAUSE",
        bidAdjustment: null,
        status: "DRAFT",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    });
  } else {
    const unionSchedule = Array(24).fill(false);
    days.forEach((d) => {
      (weekTemplate[d] || []).forEach((val, h) => {
        if (val) unionSchedule[h] = true;
      });
    });
    if (unionSchedule.some(Boolean)) {
      result.push({
        id: -1,
        campaignId: campaignIdNum,
        scheduleDate: null,
        endDate: null,
        timeSlots: booleanScheduleToTimeSlots(unionSchedule),
        timezone: "UTC",
        action: "PAUSE",
        bidAdjustment: null,
        status: "DRAFT",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
  }

  // date-specific overrides
  Object.keys(dateOverrides).forEach((iso) => {
    const bools = dateOverrides[iso];
    if (!bools || !bools.some(Boolean)) return;
    result.push({
      id: -Date.now(),
      campaignId: campaignIdNum,
      scheduleDate: isoToBackendDate(iso),
      endDate: null,
      timeSlots: booleanScheduleToTimeSlots(bools),
      timezone: "UTC",
      action: "PAUSE",
      bidAdjustment: null,
      status: "DRAFT",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  });

  return result;
}

function createEmptyWeekTemplate(): WeekTemplate {
  return days.reduce((acc, day) => {
    acc[day] = Array(24).fill(false);
    return acc;
  }, {} as WeekTemplate);
}

function createZeroSchedule() {
  return Array(24).fill(false);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readString(value: unknown) {
  return typeof value === "string" ? value : undefined;
}

function readCampaignId(value: unknown) {
  if (typeof value === "number" || typeof value === "string") {
    return String(value);
  }

  return undefined;
}

function toSyncedCampaign(value: unknown): SyncedCampaign | null {
  if (!isRecord(value)) return null;

  const id = readCampaignId(value.campaignId ?? value.id);
  if (!id) return null;

  const schedules = Array.isArray(value.schedules) ? value.schedules : null;

  return {
    id,
    name: readString(value.name) ?? `Campaign ${id}`,
    state: readString(value.state) ?? "unknown",
    scheduleCount: schedules ? schedules.length : null,
  };
}

function extractCampaignsFromSseMessage(message: unknown) {
  if (!isRecord(message)) return [];

  const candidates = [
    message.campaigns,
    message.fetchedCampaigns,
    message.syncedCampaigns,
    message.campaign,
  ];

  if (isRecord(message.data)) {
    candidates.push(message.data.campaigns, message.data.campaign);
  } else {
    candidates.push(message.data);
  }

  return candidates.flatMap((candidate) => {
    if (Array.isArray(candidate)) {
      return candidate
        .map(toSyncedCampaign)
        .filter((campaign): campaign is SyncedCampaign => Boolean(campaign));
    }

    const campaign = toSyncedCampaign(candidate);
    return campaign ? [campaign] : [];
  });
}

export function SchedulerGrid() {
  const {
    selectedCampaign,
    campaignSchedules,
    setWeekTemplate,
    setDateOverride,
    deleteDateOverride,
    setPendingScheduleSave,
  } = useDashboard();
  const [mode, setMode] = useState<"WEEK" | "DATE">("WEEK");
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncedCampaigns, setSyncedCampaigns] = useState<SyncedCampaign[]>([]);

  const tomorrow = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() + 1);
    return date;
  }, []);
  const defaultDate = formatDateISO(tomorrow);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const today = useMemo(() => new Date(), []);
  const defaultWeekStart = useMemo(
    () => formatDateISO(startOfWeek(today, { weekStartsOn: 1 })),
    [today],
  );
  const [weekStart, setWeekStart] = useState<string | null>(null);
  const campaignsQuery = useCampaigns({ page: 1, limit: 20 });
  const { refetch: refetchCampaigns } = campaignsQuery;

  if (campaignsQuery.data) {
    console.log("SchedulerGrid - campaigns list:", {
      meta: campaignsQuery.data.meta,
      campaignCount: campaignsQuery.data.data.length,
      campaigns: campaignsQuery.data.data.map((c) => ({
        id: c.campaignId,
        name: c.name,
        state: c.state,
        dailyBudget: c.dailyBudget,
        scheduleCount: c.schedules.length,
      })),
    });
  }
  if (campaignsQuery.isLoading) console.log("SchedulerGrid - campaigns loading...");
  if (campaignsQuery.error) console.log("SchedulerGrid - campaigns error:", campaignsQuery.error);

  const selectedCampaignKey = selectedCampaign?.id ?? "";
  const apiCampaignData = selectedCampaign
    ? campaignsQuery.data?.data?.find(
        (c) => c.campaignId === Number(selectedCampaign.id),
      )
    : undefined;

  const firstBackendScheduleDate = useMemo(() => {
    return (
      apiCampaignData?.schedules
        .map((schedule) => backendDateToISO(getScheduleDate(schedule)))
        .find((date): date is string => Boolean(date)) ?? null
    );
  }, [apiCampaignData?.schedules]);
  const firstBackendWeekStart = firstBackendScheduleDate
    ? formatDateISO(
        startOfWeek(new Date(`${firstBackendScheduleDate}T00:00:00`), {
          weekStartsOn: 1,
        }),
      )
    : null;
  const activeWeekStart = weekStart ?? firstBackendWeekStart ?? defaultWeekStart;
  const activeSelectedDate = selectedDate ?? firstBackendScheduleDate ?? defaultDate;

  const weekStartDate = new Date(`${activeWeekStart}T00:00:00`);
  const weekEndDate = endOfWeek(weekStartDate, { weekStartsOn: 1 });
  const weekRangeLabel = `${format(weekStartDate, "MMM d")} - ${format(weekEndDate, "MMM d")}`;
  const weekDates = useMemo(() => {
    const base = new Date(`${activeWeekStart}T00:00:00`);
    return Array.from({ length: 7 }, (_, i) =>
      format(addDays(base, i), "MMM d"),
    );
  }, [activeWeekStart]);

  const backendSchedule = useMemo(() => {
    if (!apiCampaignData) return undefined;

    return {
      weekTemplate: buildWeeklyTemplateFromSchedules(
        apiCampaignData.schedules,
        activeWeekStart,
      ),
      dateOverrides: buildDateOverridesFromSchedules(apiCampaignData.schedules),
    };
  }, [activeWeekStart, apiCampaignData]);

  const campaignSchedule = useMemo(
    () => {
      const draft =
        (campaignSchedules[selectedCampaignKey] as CampaignScheduleDraft) ??
        {};

      return {
        weekTemplate: {
          ...(backendSchedule?.weekTemplate ?? createEmptyWeekTemplate()),
          ...(draft.weekTemplate ?? {}),
        },
        dateOverrides: {
          ...(backendSchedule?.dateOverrides ?? {}),
          ...(draft.dateOverrides ?? {}),
        },
      };
    },
    [backendSchedule, campaignSchedules, selectedCampaignKey],
  );

  const serializedWeekTemplate = JSON.stringify(campaignSchedule.weekTemplate);
  const serializedDateOverrides = JSON.stringify(campaignSchedule.dateOverrides);

  // Debug logs: selected campaign and resolved schedule data
  console.log("SchedulerGrid - selectedCampaign:", selectedCampaign);
  const campaignIdNum =
    Number(selectedCampaignKey) || apiCampaignData?.campaignId || 0;
  const saveSchedules = useMemo(
    () =>
      buildSchedulesFromState(
        undefined,
        campaignSchedule.weekTemplate,
        campaignSchedule.dateOverrides,
        campaignIdNum,
        activeWeekStart,
      ),
    [
      activeWeekStart,
      campaignIdNum,
      campaignSchedule.dateOverrides,
      campaignSchedule.weekTemplate,
    ],
  );

  const handleSyncNow = async () => {
    setIsSyncing(true);

    try {
      await syncCampaignSchedulesNow();
      toast.success("Campaign schedule sync started.");
    } catch (error) {
      console.error("SchedulerGrid - sync now failed:", error);
      toast.error("Unable to start campaign schedule sync.");
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    const resolved = buildSchedulesFromState(
      apiCampaignData?.schedules,
      campaignSchedule.weekTemplate,
      campaignSchedule.dateOverrides,
      campaignIdNum,
      activeWeekStart,
    );

    console.log("SchedulerGrid - schedules changed:", resolved);

    const readable = resolved.map((s) => ({
      scheduleDate: getScheduleDate(s)
        ? backendDateToISO(getScheduleDate(s))
        : null,
      timeSlots: getScheduleTimeSlots(s),
    }));

    console.log("SchedulerGrid - readable schedule map:", readable);
    console.log("SchedulerGrid - backend slot mapping:", {
      selectedCampaignId: selectedCampaignKey,
      activeWeekStart,
      firstBackendScheduleDate,
      backendSchedules: apiCampaignData?.schedules.map((schedule) => ({
        scheduleDate: getScheduleDate(schedule)
          ? backendDateToISO(getScheduleDate(schedule))
          : null,
        rawTimeSlots: getScheduleTimeSlots(schedule),
        normalizedTimeSlots: getScheduleTimeSlots(schedule).map(normalizeTimeSlot),
        activeHours: timeSlotsToBooleanSchedule(getScheduleTimeSlots(schedule))
          .map((active, hour) => (active ? hour : null))
          .filter((hour): hour is number => hour !== null),
      })),
      activeWeekCells: days.map((day) => ({
        day,
        activeHours: (campaignSchedule.weekTemplate[day] ?? [])
          .map((active, hour) => (active ? hour : null))
          .filter((hour): hour is number => hour !== null),
      })),
      dateOverrideKeys: Object.keys(campaignSchedule.dateOverrides),
    });
  }, [
    campaignIdNum,
    campaignSchedule.weekTemplate,
    campaignSchedule.dateOverrides,
    serializedWeekTemplate,
    serializedDateOverrides,
    apiCampaignData?.schedules,
    activeWeekStart,
    firstBackendScheduleDate,
    selectedCampaignKey,
  ]);

  useEffect(() => {
    if (!selectedCampaign || !campaignIdNum) {
      setPendingScheduleSave(null);
      return;
    }

    setPendingScheduleSave({
      campaignId: campaignIdNum,
      campaignName: selectedCampaign.name,
      schedules: saveSchedules,
    });
  }, [
    campaignIdNum,
    saveSchedules,
    selectedCampaign,
    setPendingScheduleSave,
  ]);

  useEffect(() => {
    const es = new EventSource("/api/v1/campaign-schedules/events");

    es.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        const fetchedCampaigns = extractCampaignsFromSseMessage(msg);

        if (fetchedCampaigns.length > 0) {
          setSyncedCampaigns((current) => {
            const byId = new Map(current.map((campaign) => [campaign.id, campaign]));
            fetchedCampaigns.forEach((campaign) => {
              byId.set(campaign.id, campaign);
            });
            return Array.from(byId.values());
          });

          toast.success(`${fetchedCampaigns.length} campaign${fetchedCampaigns.length === 1 ? "" : "s"} fetched from sync.`);
          refetchCampaigns();
        }

      } catch (error) {
        console.error("SchedulerGrid - invalid SSE payload", error);
      }
    };

    es.onerror = () => {
      // Browser auto-reconnects every ~3s by default.
      // No manual restart needed unless you want custom backoff.
    };

    return () => {
      es.close();
    };
  }, [refetchCampaigns]);

  if (!selectedCampaign) return null;

  const weekTemplate = campaignSchedule.weekTemplate;
  const dateOverrides = campaignSchedule.dateOverrides || {};
  const selectedOverride = dateOverrides[activeSelectedDate];
  const selectedWeekKey = getWeekDayKey(activeSelectedDate);
  const inheritedSchedule =
    weekTemplate[selectedWeekKey] ?? createZeroSchedule();
  const activeDateSchedule = selectedOverride ?? inheritedSchedule;
  const isOverrideActive = Boolean(selectedOverride);
  const selectedDateLabel = new Date(
    `${activeSelectedDate}T00:00:00`,
  ).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  const clearWeeklyTemplate = () => {
    const emptyTemplate = createEmptyWeekTemplate();
    setWeekTemplate(selectedCampaign.id, emptyTemplate);

    days.forEach((_, dayIndex) => {
      const dateISO = formatDateISO(addDays(weekStartDate, dayIndex));
      setDateOverride(selectedCampaign.id, dateISO, createZeroSchedule());
    });
  };

  const toggleWeeklyCell = (dayIndex: number, hourIndex: number) => {
    const day = days[dayIndex];
    const currentDay = weekTemplate[day] ?? createZeroSchedule();
    const nextDay = [...currentDay];
    nextDay[hourIndex] = !nextDay[hourIndex];
    setWeekTemplate(selectedCampaign.id, {
      ...weekTemplate,
      [day]: nextDay,
    });
    try {
      const dateISO = formatDateISO(addDays(weekStartDate, dayIndex));
      if (Object.hasOwn(dateOverrides, dateISO)) {
        setDateOverride(selectedCampaign.id, dateISO, nextDay);
      }

      const newActive = nextDay[hourIndex];
      console.log("SchedulerGrid - cell click (WEEK):", {
        date: dateISO,
        weekday: day,
        hour: `${String(hourIndex).padStart(2, "0")}:00`,
        active: newActive,
        actionEnabled: Boolean(newActive),
      });
    } catch (e) {
      console.log("SchedulerGrid - cell click (WEEK) error computing date", e);
    }
  };

  const toggleFullDay = (dayIndex: number) => {
    const day = days[dayIndex];
    const currentDay = weekTemplate[day] ?? createZeroSchedule();
    const isAllActive = currentDay.every(Boolean);
    const nextDay = Array(24).fill(!isAllActive);
    setWeekTemplate(selectedCampaign.id, {
      ...weekTemplate,
      [day]: nextDay,
    });
    try {
      const dateISO = formatDateISO(addDays(weekStartDate, dayIndex));
      if (Object.hasOwn(dateOverrides, dateISO)) {
        setDateOverride(selectedCampaign.id, dateISO, nextDay);
      }

      console.log("SchedulerGrid - toggle full day:", {
        date: dateISO,
        weekday: day,
        newActive: !isAllActive,
        actionEnabled: !isAllActive,
      });
    } catch (e) {
      console.log("SchedulerGrid - toggle full day error", e);
    }
  };

  const toggleDateHour = (hourIndex: number) => {
    const nextSchedule = [...activeDateSchedule];
    nextSchedule[hourIndex] = !nextSchedule[hourIndex];
    setDateOverride(selectedCampaign.id, activeSelectedDate, nextSchedule);
    try {
      const newActive = nextSchedule[hourIndex];
      console.log("SchedulerGrid - cell click (DATE):", {
        date: activeSelectedDate,
        hour: `${String(hourIndex).padStart(2, "0")}:00`,
        active: newActive,
        actionEnabled: Boolean(newActive),
      });
    } catch (e) {
      console.log("SchedulerGrid - cell click (DATE) error", e);
    }
  };

  return (
    <div className="space-y-6">
      {/* Campaign Name Header */}

      <div className="grid gap-6 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex gap-4">
          <Tabs
            value={mode}
            onValueChange={(value) => setMode(value as "WEEK" | "DATE")}
            className="w-full md:w-auto"
          >
            <TabsList className="bg-zinc-100 p-1 dark:bg-zinc-900">
              <TabsTrigger className="cursor-pointer" value="WEEK">
                Week Mode
              </TabsTrigger>
              <TabsTrigger className="cursor-pointer" value="DATE">
                Date Mode
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            {mode === "WEEK" && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    <span>{weekRangeLabel}</span>
                  </Button>
                </PopoverTrigger>

                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    value={activeWeekStart}
                    min={defaultDate}
                    onChange={(val: string) => {
                      const picked = new Date(`${val}T00:00:00`);
                      const start = startOfWeek(picked, { weekStartsOn: 1 });
                      setWeekStart(formatDateISO(start));
                    }}
                  />
                </PopoverContent>
              </Popover>
            )}
            {mode === "DATE" && (
              // <div className="w-full max-w-sm">
              //   <Calendar value={selectedDate} min={defaultDate} onChange={setSelectedDate} />
              // </div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(activeSelectedDate, "PPP")}
                  </Button>
                </PopoverTrigger>

                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    value={activeSelectedDate}
                    min={defaultDate}
                    onChange={setSelectedDate}
                  />
                </PopoverContent>
              </Popover>
            )}

            <Button
              variant="outline"
              onClick={handleSyncNow}
              disabled={isSyncing}
              className="w-full sm:w-auto"
            >
              <RefreshCw
                className={cn("mr-2 h-4 w-4", isSyncing && "animate-spin")}
              />
              {isSyncing ? "Syncing" : "Sync Now"}
            </Button>
          </div>
        </div>

        {mode === "DATE" && (
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                  Selected date: {selectedDateLabel}
                </p>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  {isOverrideActive
                    ? "Showing a custom override for this date."
                    : `Showing weekly template for ${selectedWeekKey}. Any change creates a date override.`}
                </p>
              </div>
              {isOverrideActive && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    deleteDateOverride(selectedCampaign.id, activeSelectedDate)
                  }
                >
                  Reset to Weekly Template
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {syncedCampaigns.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
          <div className="border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Fetched campaigns
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Latest campaigns received from the sync event.
            </p>
          </div>

          <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {syncedCampaigns.map((campaign) => (
              <div
                key={campaign.id}
                className="grid gap-2 px-4 py-3 text-sm sm:grid-cols-[1fr_auto_auto] sm:items-center"
              >
                <div>
                  <div className="font-medium text-zinc-900 dark:text-zinc-100">
                    {campaign.name}
                  </div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-400">
                    ID: {campaign.id}
                  </div>
                </div>
                <div className="text-xs font-semibold uppercase text-zinc-500 dark:text-zinc-400">
                  {campaign.state}
                </div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400">
                  {campaign.scheduleCount === null
                    ? "Schedules: unknown"
                    : `Schedules: ${campaign.scheduleCount}`}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border bg-white dark:bg-zinc-900 dark:border-zinc-800 animate-in fade-in slide-in-from-bottom-2 duration-500">
        <div className="min-w-200">
          <div className="grid grid-cols-[80px_repeat(24,1fr)] border-b dark:border-zinc-800">
            <div className="flex items-center justify-center border-r p-3 text-[10px] font-bold text-zinc-400 dark:border-zinc-800 uppercase tracking-widest">
              Day
            </div>
            <div className="col-span-24 relative flex items-center justify-between p-2 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
              <span>Hours (00 - 23)</span>
              {mode === "WEEK" ? (
                <Button variant="destructive" onClick={clearWeeklyTemplate}>
                  <X />
                  Clear All
                </Button>
              ) : null}
            </div>
          </div>

          <div className="grid grid-cols-[80px_repeat(24,1fr)] border-b dark:border-zinc-800">
            <div className="border-r dark:border-zinc-800" />
            {hours.map((h) => (
              <div
                key={h}
                className="flex items-center justify-center p-2 text-[10px] font-bold text-zinc-400"
              >
                {h}
              </div>
            ))}
          </div>

          {mode === "WEEK" ? (
            <>
              <div className="grid grid-cols-[80px_repeat(24,1fr)] border-b dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/20">
                <div className="flex items-center justify-center border-r p-2 text-[10px] font-black text-zinc-400 dark:border-zinc-800 uppercase tracking-wider">
                  All Week
                </div>
                {hours.map((_, hIndex) => {
                  const isAllWeekActive = days.every(
                    (_, dIndex) => weekTemplate[days[dIndex]]?.[hIndex],
                  );

                  const handleToggleAllWeek = () => {
                    const updated = { ...weekTemplate };
                    days.forEach((day) => {
                      const row = [...(updated[day] ?? createZeroSchedule())];
                      row[hIndex] = !isAllWeekActive;
                      updated[day] = row;
                    });
                    setWeekTemplate(selectedCampaign.id, updated);
                    try {
                      const affectedDates = days.map((day, di) => {
                        const dateISO = formatDateISO(
                          addDays(weekStartDate, di),
                        );

                        if (Object.hasOwn(dateOverrides, dateISO)) {
                          const row = [
                            ...(dateOverrides[dateISO] ??
                              updated[day] ??
                              createZeroSchedule()),
                          ];
                          row[hIndex] = !isAllWeekActive;
                          setDateOverride(selectedCampaign.id, dateISO, row);
                        }

                        return dateISO;
                      });

                      console.log("SchedulerGrid - toggle all-week hour:", {
                        hour: `${String(hIndex).padStart(2, "0")}:00`,
                        newActive: !isAllWeekActive,
                        affectedDates,
                        actionEnabled: !isAllWeekActive,
                      });
                    } catch (e) {
                      console.log("SchedulerGrid - toggle all-week error", e);
                    }
                  };

                  return (
                    <div
                      key={`switch-${hIndex}`}
                      className="flex items-center justify-center p-2 border-r last:border-0 dark:border-zinc-800"
                    >
                      <Switch
                        size="sm"
                        checked={isAllWeekActive}
                        onCheckedChange={handleToggleAllWeek}
                        className="scale-90 cursor-pointer"
                      />
                    </div>
                  );
                })}
              </div>

              {days.map((day, dIndex) => (
                <div
                  key={`${selectedCampaign.id}-${day}`}
                  className="grid grid-cols-[80px_repeat(24,1fr)] border-b last:border-0 dark:border-zinc-800"
                >
                  <div className="flex flex-col items-center justify-center border-r p-4 text-xs font-black text-zinc-900 dark:text-zinc-100 dark:border-zinc-800">
                    <div className="flex items-center gap-2">
                      <div
                        className="text-sm cursor-pointer"
                        onClick={() => toggleFullDay(dIndex)}
                      >
                        {day}
                      </div>
                    </div>
                    <div className="text-[11px] font-normal text-zinc-500 dark:text-zinc-400">
                      {weekDates[dIndex]}
                    </div>
                  </div>
                  {hours.map((_, hIndex) => {
                    const isActive = weekTemplate[day]?.[hIndex] ?? false;
                    return (
                      <div
                        key={`${selectedCampaign.id}-${dIndex}-${hIndex}`}
                        onClick={() => toggleWeeklyCell(dIndex, hIndex)}
                        className={cn(
                          "h-17 border-r last:border-0 dark:border-zinc-800 cursor-pointer transition-all duration-75 active:scale-95",
                          isActive
                            ? "bg-indigo-600 hover:bg-indigo-700 shadow-inner"
                            : "bg-white hover:bg-zinc-50 dark:bg-zinc-900 dark:hover:bg-zinc-800",
                        )}
                      />
                    );
                  })}
                </div>
              ))}
            </>
          ) : (
            <div className="grid grid-cols-[80px_repeat(24,1fr)] border-b last:border-0 dark:border-zinc-800">
              <div className="flex items-center justify-center border-r p-4 text-xs font-black text-zinc-900 dark:text-zinc-100 dark:border-zinc-800">
                {selectedDateLabel}
              </div>
              {hours.map((_, hIndex) => (
                <div
                  key={`${selectedCampaign.id}-date-${hIndex}`}
                  onClick={() => toggleDateHour(hIndex)}
                  className={cn(
                    "h-12 border-r last:border-0 dark:border-zinc-800 cursor-pointer transition-all duration-75 active:scale-95",
                    activeDateSchedule[hIndex]
                      ? "bg-indigo-600 hover:bg-indigo-700 shadow-inner"
                      : "bg-white hover:bg-zinc-50 dark:bg-zinc-900 dark:hover:bg-zinc-800",
                  )}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
