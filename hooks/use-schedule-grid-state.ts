"use client";

import { useCallback, useRef } from "react";
import type { WeekTemplate } from "@/lib/context/dashboard-context";
import {
  SCHEDULER_DAYS,
  createEmptyWeekTemplate,
  createZeroSchedule,
  buildWeeklyTemplateFromSchedules,
} from "@/components/dashboard/scheduler/scheduler-utils";
import { clearCampaignWeeklySchedule } from "@/api/services/campaigns.api"; // ← your API client

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
  const schedulesRef = useRef(campaignSchedules);
  schedulesRef.current = campaignSchedules;

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

  const weekTemplate = getCurrentTemplate();

  const clearWeeklyTemplate = useCallback(async () => {
    if (!selectedCampaign) return;

    // 1. Clear local draft immediately
    setWeekTemplate(selectedCampaign.id, "default", createEmptyWeekTemplate());

    // 2. Wipe backend schedules
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