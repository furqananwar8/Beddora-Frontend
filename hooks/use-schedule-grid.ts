"use client";

import { useState, useCallback } from "react";
import { useDashboard } from "@/lib/context/dashboard-context";
import { useCampaignSync } from "./use-campaign-sync";
import { useScheduleDates } from "./use-schedule-dates";
import { useScheduleGridState } from "./use-schedule-grid-state";
import { useScheduleSaveDraft } from "./use-schedule-save-draft";
import { SCHEDULER_DAYS } from "@/components/dashboard/scheduler/scheduler-utils";

export function useSchedulerGrid() {
  const {
    selectedCampaign,
    campaignSchedules,
    setWeekTemplate,
    setDateOverride,
    setWeekAction,
  } = useDashboard();

  const campaignIdNum =
    selectedCampaign?.campaignId || Number(selectedCampaign?.id) || 0;

  const [scheduleAction, setScheduleActionState] = useState<"ENABLED" | "PAUSED">(
    "ENABLED",
  );

  const setScheduleAction = useCallback(
    (action: "ENABLED" | "PAUSED") => {
      setScheduleActionState(action);
      if (selectedCampaign) {
        const draft = campaignSchedules[selectedCampaign.id];
        const weeks = Object.keys(draft?.weeks || {});
        weeks.forEach((weekStart) => {
          setWeekAction(selectedCampaign.id, weekStart, action);
        });
      }
    },
    [selectedCampaign, campaignSchedules, setWeekAction],
  );

  const sync = useCampaignSync({ selectedCampaign });
  const dates = useScheduleDates({ selectedCampaign });
  const grid = useScheduleGridState({
    selectedCampaign,
    activeWeekStart: dates.activeWeekStart,
    activeSelectedDate: dates.activeSelectedDate,
    campaignSchedules,
    setWeekTemplate,
    setDateOverride,
    setWeekAction,
    weekStartDate: dates.weekStartDate,
  });
  
  const saveDraft = useScheduleSaveDraft(
    campaignIdNum,
    campaignSchedules,
    selectedCampaign?.id,
    selectedCampaign?.countryCode || "US",
  );

  return {
    selectedCampaign,
    days: SCHEDULER_DAYS,

    isSyncing: sync.isSyncing,
    syncedCampaigns: sync.syncedCampaigns,
    syncModalOpen: sync.syncModalOpen,
    setSyncModalOpen: sync.setSyncModalOpen,
    syncProgressItems: sync.syncProgressItems,
    syncCompleted: sync.syncCompleted,
    handleSyncNow: sync.handleSyncNow,

    mode: dates.mode,
    setMode: dates.setMode,
    defaultDate: dates.defaultDate,
    activeWeekStart: dates.activeWeekStart,
    activeSelectedDate: dates.activeSelectedDate,
    setWeekStart: dates.setWeekStart,
    setSelectedDate: dates.setSelectedDate,
    weekRangeLabel: dates.weekRangeLabel,
    weekStartDate: dates.weekStartDate,
    weekDates: dates.weekDates,
    allScheduledDates: dates.allScheduledDates,
    previousScheduledWeekStart: dates.previousScheduledWeekStart,
    nextScheduledWeekStart: dates.nextScheduledWeekStart,
    previousScheduledDate: dates.previousScheduledDate,
    nextScheduledDate: dates.nextScheduledDate,
    navigateToPreviousScheduledWeek: dates.navigateToPreviousScheduledWeek,
    navigateToNextScheduledWeek: dates.navigateToNextScheduledWeek,
    navigateToPreviousScheduledDate: dates.navigateToPreviousScheduledDate,
    navigateToNextScheduledDate: dates.navigateToNextScheduledDate,

    weekTemplate: grid.weekTemplate,
    dateOverrides: grid.dateOverrides,
    selectedDateLabel: grid.selectedDateLabel,
    activeDateSchedule: grid.activeDateSchedule,
    weekAction: grid.weekAction,
    clearWeeklyTemplate: grid.clearWeeklyTemplate,
    toggleWeeklyCell: grid.toggleWeeklyCell,
    toggleFullDay: grid.toggleFullDay,
    toggleDateHour: grid.toggleDateHour,
    isPastHour: grid.isPastHour,

    scheduleAction,
    setScheduleAction,

    setWeekTemplate,
    setDateOverride,
    saveSchedules: saveDraft,
  };
}