"use client";

import { useCallback, useMemo } from "react";
import { useDashboard } from "@/lib/context/dashboard-context";
import { useCampaignSync } from "./use-campaign-sync";
import { useScheduleGridState } from "./use-schedule-grid-state";
import { useScheduleSaveDraft } from "./use-schedule-save-draft";
import { SCHEDULER_DAYS } from "@/components/dashboard/scheduler/scheduler-utils";

export function useSchedulerGrid() {
  const {
    selectedCampaign, // IGNORE THIS — it's stale
    campaignSchedules,
    setWeekTemplate,
    campaigns,
    clearSelectedCampaign,
    clearCampaignDraft
  } = useDashboard();

  const campaignIdNum =
    selectedCampaign?.campaignId || Number(selectedCampaign?.id) || 0;

  const freshCampaign = useMemo(() => {
    if (!Array.isArray(campaigns) || !campaignIdNum) return null;
    return campaigns.find(
      (c) => c.campaignId === campaignIdNum || Number(c.id) === campaignIdNum
    );
  }, [campaigns, campaignIdNum]);

  // NEVER use selectedCampaign for data. Always use freshCampaign.
  const activeCampaign = freshCampaign; // NO fallback to selectedCampaign

  // If freshCampaign is null (briefly during load), we have no data to show
  const isLoadingFresh = !freshCampaign && !!selectedCampaign;

  const sync = useCampaignSync({ selectedCampaign: activeCampaign });
  const grid = useScheduleGridState({
    selectedCampaign: activeCampaign, // ← fresh object from campaigns array
    campaignSchedules,
    setWeekTemplate,
  });
  const saveDraft = useScheduleSaveDraft(
    campaignIdNum,
    campaignSchedules,
    selectedCampaign?.id,
  );

  // After clear, deselect to force unmount
  const clearAndDeselect = useCallback(async () => {
    await grid.clearWeeklyTemplate();
    clearSelectedCampaign();
  }, [grid.clearWeeklyTemplate, clearSelectedCampaign]);

  return {
    selectedCampaign: activeCampaign,
    days: SCHEDULER_DAYS,
    isLoadingFresh,
    isGridReady: !!activeCampaign,

    isSyncing: sync.isSyncing,
    syncedCampaigns: sync.syncedCampaigns,
    syncModalOpen: sync.syncModalOpen,
    setSyncModalOpen: sync.setSyncModalOpen,
    syncProgressItems: sync.syncProgressItems,
    syncCompleted: sync.syncCompleted,
    handleSyncNow: sync.handleSyncNow,

    weekTemplate: grid.weekTemplate,
    clearWeeklyTemplate: clearAndDeselect,
    toggleWeeklyCell: grid.toggleWeeklyCell,
    toggleFullDay: grid.toggleFullDay,

    setWeekTemplate,
    saveSchedules: saveDraft,
  };
}