"use client";

import { useCallback, useMemo } from "react";
import { useDashboard } from "@/lib/context/dashboard-context";
import { useCampaignSync } from "./use-campaign-sync";
import { useScheduleGridState } from "./use-schedule-grid-state";
import { useScheduleSaveDraft } from "./use-schedule-save-draft";
import { SCHEDULER_DAYS, createEmptyWeekTemplate } from "@/components/dashboard/scheduler/scheduler-utils";
import { clearCampaignWeeklySchedule } from "@/api/services/campaigns.api";

export function useSchedulerGrid() {
  const {
    selectedCampaign,
    campaignSchedules,
    setWeekTemplate,
    campaigns,
    setCampaigns,           // ADD
    clearSelectedCampaign,
    clearCampaignDraft,     // ADD
  } = useDashboard();

  const campaignIdNum =
    selectedCampaign?.campaignId || Number(selectedCampaign?.id) || 0;

  const freshCampaign = useMemo(() => {
    if (!Array.isArray(campaigns) || !campaignIdNum) return null;
    return campaigns.find(
      (c) => c.campaignId === campaignIdNum || Number(c.id) === campaignIdNum
    );
  }, [campaigns, campaignIdNum]);

  const activeCampaign = freshCampaign;

  const sync = useCampaignSync({ selectedCampaign: activeCampaign });
  const grid = useScheduleGridState({
    selectedCampaign: activeCampaign,
    campaignSchedules,
    setWeekTemplate,
  });
  const saveDraft = useScheduleSaveDraft(
    campaignIdNum,
    campaignSchedules,
    selectedCampaign?.id,
  );

  // REPLACE the old clearAndDeselect
  const clearWeeklyTemplate = useCallback(async () => {
    if (!activeCampaign) return;

    // 1. Clear local draft
    setWeekTemplate(activeCampaign.id, "default", createEmptyWeekTemplate());

    // 2. Wipe backend
    const id = activeCampaign.campaignId || Number(activeCampaign.id);
    await clearCampaignWeeklySchedule(id);

    // 3. UPDATE CONTEXT CAMPAIGNS ARRAY — this was missing
    setCampaigns((prev) =>
      prev.map((c) =>
        c.id === activeCampaign.id ? { ...c, schedules: [] } : c
      )
    );

    // 4. WIPE DRAFT ENTRY entirely so getCurrentTemplate() can't merge stale data
    clearCampaignDraft(activeCampaign.id);

    // 5. Deselect to force unmount
    clearSelectedCampaign();
  }, [activeCampaign, setWeekTemplate, setCampaigns, clearCampaignDraft, clearSelectedCampaign]);

  return {
    selectedCampaign: activeCampaign,
    days: SCHEDULER_DAYS,

    isSyncing: sync.isSyncing,
    syncedCampaigns: sync.syncedCampaigns,
    syncModalOpen: sync.syncModalOpen,
    setSyncModalOpen: sync.setSyncModalOpen,
    syncProgressItems: sync.syncProgressItems,
    syncCompleted: sync.syncCompleted,
    handleSyncNow: sync.handleSyncNow,

    weekTemplate: grid.weekTemplate,
    clearWeeklyTemplate,        // ← your wrapper, not grid.clearWeeklyTemplate
    toggleWeeklyCell: grid.toggleWeeklyCell,
    toggleFullDay: grid.toggleFullDay,

    setWeekTemplate,
    saveSchedules: saveDraft,
  };
}