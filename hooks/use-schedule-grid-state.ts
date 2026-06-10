"use client";

import { useCallback, useRef } from "react";
import type { WeekTemplate } from "@/lib/context/dashboard-context";
import {
  SCHEDULER_DAYS,
  createEmptyWeekTemplate,
  createZeroSchedule,
  buildWeeklyTemplateFromSchedules,
} from "@/components/dashboard/scheduler/scheduler-utils";

interface UseScheduleGridStateOptions {
  selectedCampaign: any;
  campaignSchedules: Record<string, any>;
  setWeekTemplate: (
    campaignId: string,
    weekStart: string,
    template: WeekTemplate,
  ) => void;
}

export function useScheduleGridState({
  selectedCampaign,
  campaignSchedules,
  setWeekTemplate,
}: UseScheduleGridStateOptions) {
  const selectedCampaignKey = selectedCampaign?.id ?? "";

  // Render-phase ref: always holds the latest campaignSchedules
  const schedulesRef = useRef(campaignSchedules);
  schedulesRef.current = campaignSchedules;

  // Compute template fresh every time (no memo — context updates must reflect immediately)
  const getCurrentTemplate = (): WeekTemplate => {
    if (!selectedCampaignKey) return createEmptyWeekTemplate();

    const backend = selectedCampaign?.schedules
      ? buildWeeklyTemplateFromSchedules(selectedCampaign.schedules)
      : createEmptyWeekTemplate();

    const draft = schedulesRef.current?.[selectedCampaignKey]?.weeks?.["default"];
    if (!draft?.weekTemplate) return backend;

    const merged: WeekTemplate = { ...backend };
    SCHEDULER_DAYS.forEach((day) => {
      if (draft.weekTemplate[day]) {
        merged[day] = [...draft.weekTemplate[day]];
      }
    });
    return merged;
  };

  // Call once per render to get fresh template for display
  const weekTemplate = getCurrentTemplate();

  const clearWeeklyTemplate = useCallback(() => {
    if (!selectedCampaign) return;
    setWeekTemplate(selectedCampaign.id, "default", createEmptyWeekTemplate());
  }, [selectedCampaign, setWeekTemplate]);

  const toggleWeeklyCell = useCallback(
    (dayIndex: number, hourIndex: number) => {
      if (!selectedCampaign) return;

      const day = SCHEDULER_DAYS[dayIndex];
      const currentTemplate = getCurrentTemplate();
      const currentDay = currentTemplate[day] ?? createZeroSchedule();
      const nextDay = [...currentDay];
      nextDay[hourIndex] = !nextDay[hourIndex];

      setWeekTemplate(selectedCampaign.id, "default", {
        ...currentTemplate,
        [day]: nextDay,
      });
    },
    [selectedCampaign, setWeekTemplate],
  );

  const toggleFullDay = useCallback(
    (dayIndex: number) => {
      if (!selectedCampaign) return;

      const day = SCHEDULER_DAYS[dayIndex];
      const currentTemplate = getCurrentTemplate();
      const currentDay = currentTemplate[day] ?? createZeroSchedule();
      const isAllActive = currentDay.every(Boolean);

      const nextDay = currentDay.map(() => !isAllActive);

      setWeekTemplate(selectedCampaign.id, "default", {
        ...currentTemplate,
        [day]: nextDay,
      });
    },
    [selectedCampaign, setWeekTemplate],
  );

  return {
    weekTemplate,
    clearWeeklyTemplate,
    toggleWeeklyCell,
    toggleFullDay,
  };
}