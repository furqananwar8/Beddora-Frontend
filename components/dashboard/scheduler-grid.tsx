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
import { Trash2, X } from "lucide-react";
import { CalendarIcon } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format, startOfWeek, endOfWeek, addDays } from "date-fns";
import useCampaigns from "@/hooks/useCampaigns";
import { toast, Toaster } from "react-hot-toast";
import {
  staticCampaignData,
  BackendTimeSlot,
  BackendSchedule,
  BackendCampaign,
} from "@/data/static-campaigns";

const days: DayKey[] = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
const hours = Array.from({ length: 24 }, (_, i) =>
  i.toString().padStart(2, "0"),
);
const weekKeys = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"] as const;

function formatDateISO(date: Date) {
  return date.toISOString().slice(0, 10);
}

function backendDateToISO(dateString: string | null): string | null {
  if (!dateString) return null;
  if (dateString.length !== 8) return null;
  return `${dateString.slice(0, 4)}-${dateString.slice(4, 6)}-${dateString.slice(6, 8)}`;
}

function getWeekDayKey(dateString: string): DayKey {
  const date = new Date(`${dateString}T00:00:00`);
  const dayKey = weekKeys[date.getDay()];
  return dayKey as DayKey;
}

function timeSlotsToBooleanSchedule(timeSlots: BackendTimeSlot[]) {
  const schedule = Array(24).fill(false);

  timeSlots.forEach(({ startTime, endTime }) => {
    const startHour = parseInt(startTime.slice(0, 2), 10);
    const endHour = parseInt(endTime.slice(0, 2), 10);
    for (let hour = startHour; hour < endHour && hour < 24; hour += 1) {
      if (hour >= 0) schedule[hour] = true;
    }
  });

  return schedule;
}

function buildDateOverridesFromSchedules(
  schedules: BackendSchedule[],
): DateOverrides {
  return schedules.reduce((acc, schedule) => {
    const scheduleISO = backendDateToISO(schedule.scheduleDate);
    if (!scheduleISO) return acc;
    acc[scheduleISO] = timeSlotsToBooleanSchedule(schedule.timeSlots);
    return acc;
  }, {} as DateOverrides);
}

function buildWeeklyTemplateFromSchedules(
  schedules: BackendSchedule[],
): WeekTemplate {
  const template = createEmptyWeekTemplate();

  schedules.forEach((schedule) => {
    const slotSchedule = timeSlotsToBooleanSchedule(schedule.timeSlots);

    if (schedule.scheduleDate) {
      const scheduleISO = backendDateToISO(schedule.scheduleDate);
      if (!scheduleISO) return;
      const dayKey = getWeekDayKey(scheduleISO);
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
  fallbackSchedules: BackendSchedule[] | undefined,
  weekTemplate: WeekTemplate,
  dateOverrides: DateOverrides,
  campaignIdNum: number,
  weekStartISO?: string,
) {
  const result: BackendSchedule[] = [];

  // include fallback schedules first (to preserve ids/status)
  if (fallbackSchedules) {
    result.push(...fallbackSchedules.map((s) => ({ ...s })));
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

export function SchedulerGrid() {
  const {
    selectedCampaign,
    campaignSchedules,
    setWeekTemplate,
    setDateOverride,
    deleteDateOverride,
  } = useDashboard();
  const [mode, setMode] = useState<"WEEK" | "DATE">("WEEK");

  const tomorrow = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() + 1);
    return date;
  }, []);
  const defaultDate = formatDateISO(tomorrow);
  const [selectedDate, setSelectedDate] = useState<string>(defaultDate);

  const today = useMemo(() => new Date(), []);
  const defaultWeekStart = useMemo(
    () => formatDateISO(startOfWeek(today, { weekStartsOn: 1 })),
    [today],
  );
  const [weekStart, setWeekStart] = useState<string>(defaultWeekStart);

  const weekStartDate = new Date(`${weekStart}T00:00:00`);
  const weekEndDate = endOfWeek(weekStartDate, { weekStartsOn: 1 });
  const weekRangeLabel = `${format(weekStartDate, "MMM d")} - ${format(weekEndDate, "MMM d")}`;
  const weekDates = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) =>
      format(addDays(weekStartDate, i), "MMM d"),
    );
  }, [weekStart]);

  if (!selectedCampaign) return null;

  // Example: fetch paused campaigns (page 3, limit 20) using TanStack Query
  const campaignsQuery = useCampaigns({ page: 3, limit: 20, state: "paused" });
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

  // Try to get campaign data from API response first, then fall back to static data
  const apiCampaignData = campaignsQuery.data?.data?.find(
    (c) => c.campaignId === Number(selectedCampaign.id),
  );
  const fallbackData = apiCampaignData || staticCampaignData[selectedCampaign.id];
  const fallbackSchedule = fallbackData
    ? {
        weekTemplate: buildWeeklyTemplateFromSchedules(fallbackData.schedules),
        dateOverrides: buildDateOverridesFromSchedules(fallbackData.schedules),
      }
    : undefined;

  const campaignSchedule = {
    weekTemplate:
      campaignSchedules[selectedCampaign.id]?.weekTemplate ??
      fallbackSchedule?.weekTemplate ??
      createEmptyWeekTemplate(),
    dateOverrides: {
      ...(fallbackSchedule?.dateOverrides ?? {}),
      ...(campaignSchedules[selectedCampaign.id]?.dateOverrides ?? {}),
    },
  };

  // Debug logs: selected campaign and resolved schedule data
  console.log("SchedulerGrid - selectedCampaign:", selectedCampaign);
  // Build a backend-shaped campaign object from current state
  const campaignIdNum =
    Number(selectedCampaign.id) || fallbackData?.campaignId || 0;
  const resolvedSchedules = buildSchedulesFromState(
    fallbackData?.schedules,
    campaignSchedule.weekTemplate,
    campaignSchedule.dateOverrides,
    campaignIdNum,
    weekStart,
  );

  const resolvedBackendCampaign: BackendCampaign = {
    campaignId: campaignIdNum,
    name: selectedCampaign.name,
    campaignType: fallbackData?.campaignType ?? "sponsoredProducts",
    targetingType: fallbackData?.targetingType ?? "auto",
    state: (selectedCampaign.status || "ACTIVE").toLowerCase(),
    dailyBudget: fallbackData?.dailyBudget ?? 0,
    startDate: fallbackData?.startDate ?? formatDateISO(new Date()),
    endDate: fallbackData?.endDate ?? null,
    premiumBidAdjustment: fallbackData?.premiumBidAdjustment ?? false,
    bidding: fallbackData?.bidding ?? {
      strategy: "autoForSales",
      adjustments: [],
    },
    profileId: fallbackData?.profileId ?? 0,
    lastSyncedAt: fallbackData?.lastSyncedAt ?? new Date().toISOString(),
    schedules: resolvedSchedules,
  };

  console.log(
    "SchedulerGrid - resolvedBackendCampaign:",
    resolvedBackendCampaign,
  );

  const selectedCampaignId = Number(selectedCampaign.id);

  useEffect(() => {
    const resolved = buildSchedulesFromState(
      fallbackData?.schedules,
      campaignSchedule.weekTemplate,
      campaignSchedule.dateOverrides,
      campaignIdNum,
      weekStart,
    );

    console.log("SchedulerGrid - schedules changed:", resolved);

    const readable = resolved.map((s) => ({
      scheduleDate: s.scheduleDate ? backendDateToISO(s.scheduleDate) : null,
      timeSlots: s.timeSlots,
    }));

    console.log("SchedulerGrid - readable schedule map:", readable);
  }, [
    JSON.stringify(campaignSchedule.weekTemplate),
    JSON.stringify(campaignSchedule.dateOverrides),
    weekStart,
  ]);

  useEffect(() => {
    const es = new EventSource("/api/v1/campaign-schedules/events");

    es.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);

        if (msg.campaignId !== selectedCampaignId) {
          return;
        }

        switch (msg.type) {
          case "SCHEDULE_EXECUTING":
            toast(`Campaign ${msg.campaignId} schedule is operating…`, {
              icon: "⏳",
            });
            break;
          case "SCHEDULE_COMPLETED":
            toast.success(`Campaign ${msg.campaignId} schedule completed.`);
            break;
          case "SCHEDULE_FAILED":
            toast.error(`Campaign ${msg.campaignId} failed: ${msg.error}`);
            break;
          default:
            break;
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
  }, [selectedCampaignId]);

  const weekTemplate = campaignSchedule.weekTemplate;
  const dateOverrides = campaignSchedule.dateOverrides || {};
  const selectedOverride = dateOverrides[selectedDate];
  const selectedWeekKey = getWeekDayKey(selectedDate);
  const inheritedSchedule =
    weekTemplate[selectedWeekKey] ?? createZeroSchedule();
  const activeDateSchedule = selectedOverride ?? inheritedSchedule;
  const isOverrideActive = Boolean(selectedOverride);
  const selectedDateLabel = new Date(
    `${selectedDate}T00:00:00`,
  ).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  const clearWeeklyTemplate = () => {
    setWeekTemplate(selectedCampaign.id, createEmptyWeekTemplate());
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
    setDateOverride(selectedCampaign.id, selectedDate, nextSchedule);
    try {
      const newActive = nextSchedule[hourIndex];
      console.log("SchedulerGrid - cell click (DATE):", {
        date: selectedDate,
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
      <Toaster position="top-right" />
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
                    value={weekStart}
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
                    {selectedDate ? (
                      format(selectedDate, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>

                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    value={selectedDate}
                    min={defaultDate}
                    onChange={setSelectedDate}
                  />
                </PopoverContent>
              </Popover>
            )}
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
                    deleteDateOverride(selectedCampaign.id, selectedDate)
                  }
                >
                  Reset to Weekly Template
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

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
                      const affectedDates = days.map((_, di) =>
                        formatDateISO(addDays(weekStartDate, di)),
                      );
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
