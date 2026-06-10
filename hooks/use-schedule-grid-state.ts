"use client";

import { useMemo, useCallback } from "react";
import type {
  WeekTemplate,
  DateOverrides,
} from "@/lib/context/dashboard-context";
import {
  SCHEDULER_DAYS,
  formatDateISO,
  buildDateOverridesFromSchedules,
  buildWeeklyTemplateFromSchedules,
  createEmptyWeekTemplate,
  createZeroSchedule,
  getWeekDayKey,
} from "@/components/dashboard/scheduler/scheduler-utils";

type WeeklyDraft = {
  weekTemplate?: WeekTemplate;
  dateOverrides?: DateOverrides;
  action?: "ENABLED" | "PAUSED";
};

interface UseScheduleGridStateOptions {
  selectedCampaign: any;
  activeWeekStart: string;
  activeSelectedDate: string;
  campaignSchedules: Record<string, any>;
  setWeekTemplate: (
    campaignId: string,
    weekStart: string,
    template: WeekTemplate,
  ) => void;
  setDateOverride: (
    campaignId: string,
    weekStart: string,
    dateISO: string,
    schedule: boolean[],
  ) => void;
  setWeekAction: (
    campaignId: string,
    weekStart: string,
    action: "ENABLED" | "PAUSED",
  ) => void;
  weekStartDate: string;
}

// ── Pure ISO string date math (no timezone issues) ──
function addDaysISO(isoDate: string, days: number): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  date.setUTCDate(date.getUTCDate() + days);
  const yy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(date.getUTCDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

export function useScheduleGridState({
  selectedCampaign,
  activeWeekStart,
  activeSelectedDate,
  campaignSchedules,
  setWeekTemplate,
  setDateOverride,
  setWeekAction,
  weekStartDate,
}: UseScheduleGridStateOptions) {
  const selectedCampaignKey = selectedCampaign?.id ?? "";

  const backendSchedule = useMemo(() => {
    if (!selectedCampaign?.schedules) return undefined;

    return {
      weekTemplate: buildWeeklyTemplateFromSchedules(
        selectedCampaign.schedules,
        activeWeekStart,
      ),
      dateOverrides: buildDateOverridesFromSchedules(
        selectedCampaign.schedules,
      ),
    };
  }, [activeWeekStart, selectedCampaign?.schedules]);

  const campaignSchedule = useMemo(() => {
    const campaignDraft = campaignSchedules[selectedCampaignKey];
    const draft =
      (campaignDraft?.weeks?.[activeWeekStart] as WeeklyDraft) ?? {};

    return {
      weekTemplate: {
        ...(backendSchedule?.weekTemplate ?? createEmptyWeekTemplate()),
        ...(draft.weekTemplate ?? {}),
      },
      dateOverrides: {
        ...(backendSchedule?.dateOverrides ?? {}),
        ...(draft.dateOverrides ?? {}),
      },
      action: draft.action ?? "ENABLED",
    };
  }, [
    activeWeekStart,
    backendSchedule,
    campaignSchedules,
    selectedCampaignKey,
  ]);

  const weekTemplate = campaignSchedule.weekTemplate as any;
  const dateOverrides = campaignSchedule.dateOverrides || {};
  const weekAction = campaignSchedule.action;

  const selectedOverride = dateOverrides[activeSelectedDate];
  const selectedWeekKey = getWeekDayKey(activeSelectedDate);
  const inheritedSchedule =
    weekTemplate[selectedWeekKey] ?? createZeroSchedule();
  const activeDateSchedule = selectedOverride ?? inheritedSchedule;

  // Pure string-based date label — no Date objects, no timezone shifts
  const selectedDateLabel = (() => {
    const [y, m, d] = activeSelectedDate.split("-").map(Number);
    const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const weekdays = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
    const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
    return `${weekdays[dow]} ${monthNames[m - 1]} ${d}`;
  })();

  function isPastHour(dateISO: string, hourIndex: number): boolean {
    const now = new Date();
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Los_Angeles",
      year: "numeric", month: "numeric", day: "numeric",
      hour: "numeric", hourCycle: "h23",
    }).formatToParts(now);
    const get = (type: string) => Number(parts.find(p => p.type === type)?.value ?? 0);

    const pstYear = get("year");
    const pstMonth = get("month");
    const pstDay = get("day");
    const pstHour = get("hour"); // guaranteed 0–23

    const [sy, sm, sd] = dateISO.split("-").map(Number);

    const nowValue  = pstYear * 1000000 + pstMonth * 10000 + pstDay * 100 + pstHour;
    const slotValue = sy      * 1000000 + sm       * 10000 + sd     * 100 + hourIndex;

    return slotValue < nowValue;
  }

  const clearWeeklyTemplate = useCallback(() => {
    if (!selectedCampaign) return;

    const emptyTemplate = createEmptyWeekTemplate();
    setWeekTemplate(selectedCampaign.id, activeWeekStart, emptyTemplate);

    SCHEDULER_DAYS.forEach((_: any, dayIndex: any) => {
      const dateISO = addDaysISO(weekStartDate, dayIndex);
      setDateOverride(
        selectedCampaign.id,
        activeWeekStart,
        dateISO,
        createZeroSchedule(),
      );
    });
  }, [
    selectedCampaign,
    activeWeekStart,
    weekStartDate,
    setWeekTemplate,
    setDateOverride,
  ]);

  const toggleWeeklyCell = useCallback(
    (dayIndex: number, hourIndex: number) => {
      if (!selectedCampaign) return;

      const day = SCHEDULER_DAYS[dayIndex];
      const currentDay = weekTemplate[day] ?? createZeroSchedule();
      const nextDay = [...currentDay];
      nextDay[hourIndex] = !nextDay[hourIndex];

      setWeekTemplate(selectedCampaign.id, activeWeekStart, {
        ...weekTemplate,
        [day]: nextDay,
      });

      const dateISO = addDaysISO(weekStartDate, dayIndex);
      if (Object.hasOwn(dateOverrides, dateISO)) {
        setDateOverride(
          selectedCampaign.id,
          activeWeekStart,
          dateISO,
          nextDay,
        );
      }
    },
    [
      selectedCampaign,
      weekTemplate,
      activeWeekStart,
      weekStartDate,
      dateOverrides,
      setWeekTemplate,
      setDateOverride,
    ],
  );

  const toggleFullDay = useCallback(
    (dayIndex: number) => {
      if (!selectedCampaign) return;

      const day = SCHEDULER_DAYS[dayIndex];
      const currentDay = weekTemplate[day] ?? createZeroSchedule();
      const dateISO = addDaysISO(weekStartDate, dayIndex);

      const enabledHours = Array.from(
        { length: 24 },
        (_, i) => !isPastHour(dateISO, i),
      );
      const isAllEnabledActive = enabledHours.every(
        (isEnabled, i) => !isEnabled || currentDay[i],
      );

      const nextDay = currentDay.map((isActive: any, i: any) =>
        enabledHours[i] ? !isAllEnabledActive : isActive,
      );

      setWeekTemplate(selectedCampaign.id, activeWeekStart, {
        ...weekTemplate,
        [day]: nextDay,
      });

      if (Object.hasOwn(dateOverrides, dateISO)) {
        setDateOverride(
          selectedCampaign.id,
          activeWeekStart,
          dateISO,
          nextDay,
        );
      }
    },
    [
      selectedCampaign,
      weekTemplate,
      activeWeekStart,
      weekStartDate,
      dateOverrides,
      isPastHour,
      setWeekTemplate,
      setDateOverride,
    ],
  );

  const toggleDateHour = useCallback(
    (hourIndex: number) => {
      if (!selectedCampaign) return;

      const nextSchedule = [...activeDateSchedule];
      nextSchedule[hourIndex] = !nextSchedule[hourIndex];

      setDateOverride(
        selectedCampaign.id,
        activeWeekStart,
        activeSelectedDate,
        nextSchedule,
      );
    },
    [
      selectedCampaign,
      activeDateSchedule,
      activeWeekStart,
      activeSelectedDate,
      setDateOverride,
    ],
  );

  return {
    weekTemplate,
    dateOverrides,
    selectedDateLabel,
    activeDateSchedule,
    weekAction,
    clearWeeklyTemplate,
    toggleWeeklyCell,
    toggleFullDay,
    toggleDateHour,
    isPastHour,
  };
}