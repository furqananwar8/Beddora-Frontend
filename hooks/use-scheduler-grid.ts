"use client";

import { useMemo, useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  format,
  startOfWeek,
  endOfWeek,
  addDays,
} from "date-fns";
import { toast } from "sonner";
import { useDashboard } from "@/lib/context/dashboard-context";
import type { WeekTemplate, DateOverrides } from "@/lib/context/dashboard-context";
import useCampaigns from "@/hooks/useCampaigns";
import { syncCampaignSchedulesNow } from "@/api/services/campaigns.api";
import type { SyncedCampaign } from "@/components/dashboard/scheduler/synced-campaigns-list";
import {
  SCHEDULER_DAYS,
  backendDateToISO,
  buildDateOverridesFromSchedules,
  buildSchedulesFromState,
  buildWeeklyTemplateFromSchedules,
  createEmptyWeekTemplate,
  createZeroSchedule,
  extractCampaignsFromSseMessage,
  formatDateISO,
  getScheduleDate,
  getWeekDayKey,
} from "@/components/dashboard/scheduler/scheduler-utils";

type WeeklyDraft = {
  weekTemplate?: WeekTemplate;
  dateOverrides?: DateOverrides;
};

export function useSchedulerGrid() {
  const queryClient = useQueryClient();
  const {
    selectedCampaign,
    campaignSchedules,
    setWeekTemplate,
    setDateOverride,
  } = useDashboard();

  const [mode, setMode] = useState<"WEEK" | "DATE">("WEEK");
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncedCampaigns, setSyncedCampaigns] = useState<SyncedCampaign[]>([]);
  const [syncModalOpen, setSyncModalOpen] = useState(false);
  const [syncProgressItems, setSyncProgressItems] = useState<SyncedCampaign[]>(
    [],
  );
  const [syncLastEventAtMs, setSyncLastEventAtMs] = useState<number | null>(
    null,
  );
  const [syncCompleted, setSyncCompleted] = useState(false);

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

  const activeWeekStart =
    weekStart ?? firstBackendWeekStart ?? defaultWeekStart;
  const activeSelectedDate =
    selectedDate ?? firstBackendScheduleDate ?? defaultDate;

  const weekStartDate = useMemo(
    () => new Date(`${activeWeekStart}T00:00:00`),
    [activeWeekStart],
  );
  const weekEndDate = useMemo(
    () => endOfWeek(weekStartDate, { weekStartsOn: 1 }),
    [weekStartDate],
  );
  const weekRangeLabel = useMemo(
    () => `${format(weekStartDate, "MMM d")} - ${format(weekEndDate, "MMM d")}`,
    [weekStartDate, weekEndDate],
  );

  const allScheduledDates = useMemo(() => {
    const schedules = apiCampaignData?.schedules;
    if (!schedules) return [];

    const dates = schedules
      .map((s) => backendDateToISO(getScheduleDate(s)))
      .filter((date): date is string => Boolean(date));
    return Array.from(new Set(dates)).sort();
  }, [apiCampaignData?.schedules]);

  const previousScheduledWeekStart = useMemo(() => {
    if (allScheduledDates.length === 0) return null;
    const targetDateStr = allScheduledDates
      .slice()
      .reverse()
      .find((dStr) => {
        const d = new Date(`${dStr}T00:00:00`);
        return d < weekStartDate;
      });
    if (!targetDateStr) return null;
    return formatDateISO(
      startOfWeek(new Date(`${targetDateStr}T00:00:00`), { weekStartsOn: 1 }),
    );
  }, [allScheduledDates, weekStartDate]);

  const nextScheduledWeekStart = useMemo(() => {
    if (allScheduledDates.length === 0) return null;
    const targetDateStr = allScheduledDates.find((dStr) => {
      const d = new Date(`${dStr}T00:00:00`);
      return d > weekEndDate;
    });
    if (!targetDateStr) return null;
    return formatDateISO(
      startOfWeek(new Date(`${targetDateStr}T00:00:00`), { weekStartsOn: 1 }),
    );
  }, [allScheduledDates, weekEndDate]);

  const previousScheduledDate = useMemo(() => {
    if (allScheduledDates.length === 0) return null;
    const currentD = new Date(`${activeSelectedDate}T00:00:00`);
    return (
      allScheduledDates
        .slice()
        .reverse()
        .find((dStr) => {
          const d = new Date(`${dStr}T00:00:00`);
          return d < currentD;
        }) ?? null
    );
  }, [allScheduledDates, activeSelectedDate]);

  const nextScheduledDate = useMemo(() => {
    if (allScheduledDates.length === 0) return null;
    const currentD = new Date(`${activeSelectedDate}T00:00:00`);
    return (
      allScheduledDates.find((dStr) => {
        const d = new Date(`${dStr}T00:00:00`);
        return d > currentD;
      }) ?? null
    );
  }, [allScheduledDates, activeSelectedDate]);

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

  const campaignSchedule = useMemo(() => {
    const campaignDraft = campaignSchedules[selectedCampaignKey];
    const draft = (campaignDraft?.weeks?.[activeWeekStart] as WeeklyDraft) ?? {};

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
  }, [activeWeekStart, backendSchedule, campaignSchedules, selectedCampaignKey]);

  const campaignIdNum =
    Number(selectedCampaignKey) || apiCampaignData?.campaignId || 0;

  const saveSchedules = useMemo(() => {
    if (!campaignIdNum) return [];

    const campaignDraft = campaignSchedules[selectedCampaignKey];
    const weeks = campaignDraft?.weeks ?? {};

    return Object.entries(weeks).flatMap(([weekStart, draft]) =>
      buildSchedulesFromState(
        undefined,
        draft.weekTemplate ?? createEmptyWeekTemplate(),
        draft.dateOverrides ?? {},
        campaignIdNum,
        weekStart,
      ),
    );
  }, [campaignIdNum, campaignSchedules, selectedCampaignKey]);

  const handleSyncNow = async () => {
    setSyncModalOpen(true);
    setSyncCompleted(false);
    setSyncProgressItems([]);
    setSyncLastEventAtMs(Date.now());
    setIsSyncing(true);

    try {
      await syncCampaignSchedulesNow();
      toast.success("Campaign schedule sync started.");
    } catch (error) {
      console.error("SchedulerGrid - sync now failed:", error);
      toast.error("Unable to start campaign schedule sync.");
    }
  };

  useEffect(() => {
    if (!syncModalOpen || syncCompleted) return;
    if (syncLastEventAtMs === null) return;

    const completionWindowMs = 4500;

    const t = window.setTimeout(() => {
      if (Date.now() - syncLastEventAtMs < completionWindowMs) return;
      if (syncProgressItems.length === 0) return;

      setSyncCompleted(true);
      setIsSyncing(false);

      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      refetchCampaigns();
    }, completionWindowMs);

    return () => window.clearTimeout(t);
  }, [
    queryClient,
    refetchCampaigns,
    syncCompleted,
    syncLastEventAtMs,
    syncModalOpen,
    syncProgressItems.length,
  ]);

  const navigateToPreviousScheduledWeek = () => {
    if (previousScheduledWeekStart) {
      setWeekStart(previousScheduledWeekStart);
    }
  };

  const navigateToNextScheduledWeek = () => {
    if (nextScheduledWeekStart) {
      setWeekStart(nextScheduledWeekStart);
    }
  };

  const navigateToPreviousScheduledDate = () => {
    if (previousScheduledDate) {
      setSelectedDate(previousScheduledDate);
    }
  };

  const navigateToNextScheduledDate = () => {
    if (nextScheduledDate) {
      setSelectedDate(nextScheduledDate);
    }
  };

  // Pending schedule save is managed at the DashboardProvider level now.

  useEffect(() => {
    const es = new EventSource(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/campaign-schedules/events`,
    );

    es.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        const fetchedCampaigns = extractCampaignsFromSseMessage(msg);

        if (fetchedCampaigns.length > 0) {
          setSyncedCampaigns((current) => {
            const byId = new Map(
              current.map((campaign) => [campaign.id, campaign]),
            );

            fetchedCampaigns.forEach((campaign) => {
              byId.set(campaign.id, campaign);
            });

            return Array.from(byId.values());
          });

          setSyncProgressItems((current) => {
            const byId = new Map(
              current.map((campaign) => [campaign.id, campaign]),
            );

            const beforeSize = byId.size;

            fetchedCampaigns.forEach((campaign) => {
              byId.set(campaign.id, campaign);
            });

            const updated = Array.from(byId.values());

            if (byId.size !== beforeSize) {
              setSyncLastEventAtMs(Date.now());
            }

            return updated;
          });

          setSyncModalOpen((open) => {
            if (!open) {
              toast.success(
                `${fetchedCampaigns.length} campaign${
                  fetchedCampaigns.length === 1 ? "" : "s"
                } fetched from sync.`,
              );
            }
            return open;
          });
        }
      } catch (error) {
        console.error("SchedulerGrid - invalid SSE payload", error);
      }
    };

    es.onerror = () => {
      // Browser auto-reconnects by default.
    };

    return () => es.close();
  }, []);

  const weekTemplate = campaignSchedule.weekTemplate;
  const dateOverrides = campaignSchedule.dateOverrides || {};
  const selectedOverride = dateOverrides[activeSelectedDate];
  const selectedWeekKey = getWeekDayKey(activeSelectedDate);
  const inheritedSchedule =
    weekTemplate[selectedWeekKey] ?? createZeroSchedule();
  const activeDateSchedule = selectedOverride ?? inheritedSchedule;
  const selectedDateLabel = new Date(
    `${activeSelectedDate}T00:00:00`,
  ).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  const clearWeeklyTemplate = () => {
    if (!selectedCampaign) return;

    const emptyTemplate = createEmptyWeekTemplate();
    setWeekTemplate(selectedCampaign.id, activeWeekStart, emptyTemplate);

    SCHEDULER_DAYS.forEach((_, dayIndex) => {
      const dateISO = formatDateISO(addDays(weekStartDate, dayIndex));
      setDateOverride(
        selectedCampaign.id,
        activeWeekStart,
        dateISO,
        createZeroSchedule(),
      );
    });
  };

  const toggleWeeklyCell = (dayIndex: number, hourIndex: number) => {
    if (!selectedCampaign) return;

    const day = SCHEDULER_DAYS[dayIndex];
    const currentDay = weekTemplate[day] ?? createZeroSchedule();
    const nextDay = [...currentDay];
    nextDay[hourIndex] = !nextDay[hourIndex];
    setWeekTemplate(selectedCampaign.id, activeWeekStart, {
      ...weekTemplate,
      [day]: nextDay,
    });

    const dateISO = formatDateISO(addDays(weekStartDate, dayIndex));
    if (Object.hasOwn(dateOverrides, dateISO)) {
      setDateOverride(
        selectedCampaign.id,
        activeWeekStart,
        dateISO,
        nextDay,
      );
    }
  };

  const toggleFullDay = (dayIndex: number) => {
    if (!selectedCampaign) return;

    const day = SCHEDULER_DAYS[dayIndex];
    const currentDay = weekTemplate[day] ?? createZeroSchedule();
    const isAllActive = currentDay.every(Boolean);
    const nextDay = Array(24).fill(!isAllActive);
    setWeekTemplate(selectedCampaign.id, activeWeekStart, {
      ...weekTemplate,
      [day]: nextDay,
    });

    const dateISO = formatDateISO(addDays(weekStartDate, dayIndex));
    if (Object.hasOwn(dateOverrides, dateISO)) {
      setDateOverride(
        selectedCampaign.id,
        activeWeekStart,
        dateISO,
        nextDay,
      );
    }
  };

  const toggleDateHour = (hourIndex: number) => {
    if (!selectedCampaign) return;

    const nextSchedule = [...activeDateSchedule];
    nextSchedule[hourIndex] = !nextSchedule[hourIndex];
    setDateOverride(
      selectedCampaign.id,
      activeWeekStart,
      activeSelectedDate,
      nextSchedule,
    );
  };

  const isPastHour = (dateISO: string, hourIndex: number) => {
    const now = new Date();
    const currentHour = now.getHours();
    const dateToCheck = new Date(`${dateISO}T00:00:00`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    dateToCheck.setHours(0, 0, 0, 0);

    if (dateToCheck < today) return true;
    if (dateToCheck.getTime() === today.getTime()) {
      return hourIndex < currentHour;
    }
    return false;
  };

  return {
    selectedCampaign,
    days: SCHEDULER_DAYS,
    mode,
    setMode,
    isSyncing,
    syncedCampaigns,
    syncModalOpen,
    setSyncModalOpen,
    syncProgressItems,
    syncCompleted,
    defaultDate,
    activeWeekStart,
    activeSelectedDate,
    setWeekStart,
    setSelectedDate,
    weekRangeLabel,
    weekStartDate,
    weekDates,
    weekTemplate,
    dateOverrides,
    selectedDateLabel,
    activeDateSchedule,
    allScheduledDates,
    previousScheduledWeekStart,
    nextScheduledWeekStart,
    previousScheduledDate,
    nextScheduledDate,
    handleSyncNow,
    navigateToPreviousScheduledWeek,
    navigateToNextScheduledWeek,
    navigateToPreviousScheduledDate,
    navigateToNextScheduledDate,
    clearWeeklyTemplate,
    toggleWeeklyCell,
    toggleFullDay,
    toggleDateHour,
    setWeekTemplate,
    setDateOverride,
    isPastHour,
  };
}
