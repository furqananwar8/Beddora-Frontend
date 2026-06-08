"use client";

import { useMemo, useCallback } from "react";
import { addDays } from "date-fns";
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
  weekStartDate: Date;
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

  const selectedDateLabel = new Date(
    `${activeSelectedDate}T00:00:00`,
  ).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  const isPastHour = useCallback((dateISO: string, hourIndex: number) => {
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
  }, []);

  const clearWeeklyTemplate = useCallback(() => {
    if (!selectedCampaign) return;

    const emptyTemplate = createEmptyWeekTemplate();
    setWeekTemplate(selectedCampaign.id, activeWeekStart, emptyTemplate);

    SCHEDULER_DAYS.forEach((_: any, dayIndex: any) => {
      const dateISO = formatDateISO(addDays(weekStartDate, dayIndex));
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

      const dateISO = formatDateISO(addDays(weekStartDate, dayIndex));
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
      const dateISO = formatDateISO(addDays(weekStartDate, dayIndex));

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