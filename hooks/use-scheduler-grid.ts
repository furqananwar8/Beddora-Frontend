"use client";

import { useDashboard } from "@/lib/context/dashboard-context";
import { useCampaignSync } from "./use-campaign-sync";
import { useScheduleGridState } from "./use-schedule-grid-state";
import { useScheduleSaveDraft } from "./use-schedule-save-draft";
import { SCHEDULER_DAYS } from "@/components/dashboard/scheduler/scheduler-utils";

export function useSchedulerGrid() {
  const {
    selectedCampaign,
    campaignSchedules,
    setWeekTemplate,
  } = useDashboard();

  const campaignIdNum =
    selectedCampaign?.campaignId || Number(selectedCampaign?.id) || 0;

  const sync = useCampaignSync({ selectedCampaign });
  const grid = useScheduleGridState({
    selectedCampaign,
    campaignSchedules,
    setWeekTemplate,
  });
  const saveDraft = useScheduleSaveDraft(
    campaignIdNum,
    campaignSchedules,
    selectedCampaign?.id,
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

    weekTemplate: grid.weekTemplate,
    clearWeeklyTemplate: grid.clearWeeklyTemplate,
    toggleWeeklyCell: grid.toggleWeeklyCell,
    toggleFullDay: grid.toggleFullDay,

    setWeekTemplate,
    saveSchedules: saveDraft,
  };
}