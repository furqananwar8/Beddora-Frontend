"use client";

import { useMemo } from "react";
import {
  buildSchedulesFromState,
  createEmptyWeekTemplate,
} from "@/components/dashboard/scheduler/scheduler-utils";

export function useScheduleSaveDraft(
  campaignIdNum: number,
  campaignSchedules: Record<string, any>,
  selectedCampaignId: string | undefined,
  countryCode: string = "US", // <-- add this
) {
  return useMemo(() => {
    if (!campaignIdNum || !selectedCampaignId) return [];

    const campaignDraft = campaignSchedules[selectedCampaignId];
    const weeks = campaignDraft?.weeks ?? {};

    return Object.entries(weeks).flatMap(
      ([weekStart, draft]: [string, any]) =>
        buildSchedulesFromState(
          undefined,
          draft.weekTemplate ?? createEmptyWeekTemplate(),
          draft.dateOverrides ?? {},
          campaignIdNum,
          weekStart,
          draft.action ?? "ENABLED",
          countryCode, // <-- pass it
        ),
    );
  }, [campaignIdNum, campaignSchedules, selectedCampaignId, countryCode]);
}