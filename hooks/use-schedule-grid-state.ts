"use client";

import { useCallback } from "react";
import type { WeekTemplate } from "@/lib/context/dashboard-context";
import {
  SCHEDULER_DAYS,
  createEmptyWeekTemplate,
  createZeroSchedule,
  buildWeeklyTemplateFromSchedules,
} from "@/components/dashboard/scheduler/scheduler-utils";
import { clearCampaignWeeklySchedule } from "@/api/services/campaigns.api";

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

  // Build template fresh every time — selectedCampaign now always has latest schedules
  const getCurrentTemplate = (): WeekTemplate => {
    if (!selectedCampaignKey) return createEmptyWeekTemplate();

    // Always use fresh schedules from selectedCampaign (derived from campaigns array in context)
    const backend = selectedCampaign?.schedules
      ? buildWeeklyTemplateFromSchedules(selectedCampaign.schedules)
      : createEmptyWeekTemplate();

    const draft = campaignSchedules?.[selectedCampaignKey]?.weeks?.["default"];
    if (!draft?.weekTemplate) return backend;

    const merged: WeekTemplate = { ...backend };
    SCHEDULER_DAYS.forEach((day) => {
      if (draft.weekTemplate[day]) {
        merged[day] = [...draft.weekTemplate[day]];
      }
    });
    return merged;
  };

  // Get template for rendering
  const weekTemplate = getCurrentTemplate();

  const clearWeeklyTemplate = useCallback(async () => {
    if (!selectedCampaign) return;

    // Clear local draft immediately
    setWeekTemplate(selectedCampaign.id, "default", createEmptyWeekTemplate());

    // Wipe backend schedules
    const campaignIdNum = selectedCampaign.campaignId || Number(selectedCampaign.id);
    try {
      await clearCampaignWeeklySchedule(campaignIdNum);
      console.log('[Clear] Backend schedules wiped');
    } catch (e) {
      console.error('[Clear] Failed to wipe backend:', e);
    }
  }, [selectedCampaign, setWeekTemplate]);

  const toggleWeeklyCell = useCallback(
    (dayIndex: number, hourIndex: number) => {
      if (!selectedCampaign) return;

      const day = SCHEDULER_DAYS[dayIndex];
      // Call getCurrentTemplate fresh to get latest state
      const currentTemplate = getCurrentTemplate();
      const currentDay = currentTemplate[day] ?? createZeroSchedule();
      const nextDay = [...currentDay];
      nextDay[hourIndex] = !nextDay[hourIndex];

      setWeekTemplate(selectedCampaign.id, "default", {
        ...currentTemplate,
        [day]: nextDay,
      });
    },
    [selectedCampaign, setWeekTemplate], // getCurrentTemplate uses selectedCampaign which is always fresh
  );

  const toggleFullDay = useCallback(
    (dayIndex: number) => {
      if (!selectedCampaign) return;

      const day = SCHEDULER_DAYS[dayIndex];
      // Call getCurrentTemplate fresh to get latest state
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