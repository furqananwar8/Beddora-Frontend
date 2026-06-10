"use client";

import { useMemo } from "react";
import {
  buildSchedulesFromWeekTemplate,
  createEmptyWeekTemplate,
} from "@/components/dashboard/scheduler/scheduler-utils";

export function useScheduleSaveDraft(
  campaignIdNum: number,
  campaignSchedules: Record<string, any>,
  selectedCampaignId: string | undefined,
) {
  return useMemo(() => {
    if (!campaignIdNum || !selectedCampaignId) return [];

    const campaignDraft = campaignSchedules[selectedCampaignId];
    const weeks = campaignDraft?.weeks ?? {};

    const weekEntries = Object.entries(weeks);
    if (weekEntries.length === 0) return [];

    const [, latestDraft] = weekEntries[weekEntries.length - 1] as [string, any];

    return buildSchedulesFromWeekTemplate(
      latestDraft.weekTemplate ?? createEmptyWeekTemplate(),
      latestDraft.action ?? "ENABLED",
    );
  }, [campaignIdNum, campaignSchedules, selectedCampaignId]);
}