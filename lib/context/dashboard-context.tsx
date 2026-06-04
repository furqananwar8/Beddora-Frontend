"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import {
  BackendSchedule,
  updateCampaignSchedule,
  getCampaigns,
} from "@/api/services/campaigns.api";
import { toast } from "sonner";
import { buildSchedulesFromState, backendDateToISO, formatDateISO, SCHEDULER_DAYS } from "@/components/dashboard/scheduler/scheduler-utils";

export type Campaign = {
  id: string;
  name: string;
  status: 'ENABLED' | 'PAUSED' | 'ARCHIVED';
  adProduct: 'SPONSORED_PRODUCTS' | 'SPONSORED_BRANDS' | 'SPONSORED_DISPLAY';
  marketplaces?: string[];
  creationDate?: string;
  countryCode?: string;
};

export type DayKey = 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN';
export type WeekTemplate = Record<DayKey, boolean[]>;
export type DateOverrides = Record<string, boolean[]>;

type WeeklyDraft = {
  weekTemplate: WeekTemplate;
  dateOverrides: DateOverrides;
};

type CampaignSchedules = {
  weeks: Record<string, WeeklyDraft>;
};

type DashboardContextType = {
  selectedCampaign: Campaign | null;
  setSelectedCampaign: (campaign: Campaign) => void;
  campaignSchedules: Record<string, CampaignSchedules>;
  setWeekTemplate: (
    campaignId: string,
    weekStart: string,
    weekTemplate: WeekTemplate,
  ) => void;
  setDateOverride: (
    campaignId: string,
    weekStart: string,
    date: string,
    schedule: boolean[],
  ) => void;
  deleteDateOverride: (
    campaignId: string,
    weekStart: string,
    date: string,
  ) => void;
  handleSave: () => void;
};

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

const days: DayKey[] = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

const createEmptyWeekTemplate = (): WeekTemplate => {
  const template = {} as WeekTemplate;
  days.forEach((day) => {
    template[day] = Array(24).fill(false);
  });
  return template;
};

const createEmptyCampaignSchedule = (): CampaignSchedules => ({
  weeks: {},
});

const createEmptyWeeklyDraft = (): WeeklyDraft => ({
  weekTemplate: createEmptyWeekTemplate(),
  dateOverrides: {},
});

export function DashboardProvider({ children, initialCampaigns }: { children: ReactNode; initialCampaigns: Campaign[] }) {
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(
    initialCampaigns[1]?.id || initialCampaigns[0]?.id || null,
  );
  const [campaignSchedules, setCampaignSchedules] = useState<Record<string, CampaignSchedules>>({});

  const selectedCampaign =
    initialCampaigns.find((campaign) => campaign.id === selectedCampaignId) ||
    initialCampaigns[0] ||
    null;

  const updateLocalCampaignSchedule = (
    campaignId: string,
    weekStart: string,
    updater: (draft: WeeklyDraft) => WeeklyDraft,
  ) => {
    setCampaignSchedules((prev) => {
      const current = prev[campaignId] || createEmptyCampaignSchedule();
      const currentWeekDraft = current.weeks[weekStart] || createEmptyWeeklyDraft();

      return {
        ...prev,
        [campaignId]: {
          ...current,
          weeks: {
            ...current.weeks,
            [weekStart]: updater(currentWeekDraft),
          },
        },
      };
    });
  };

  const setWeekTemplate = (
    campaignId: string,
    weekStart: string,
    weekTemplate: WeekTemplate,
  ) => {
    updateLocalCampaignSchedule(campaignId, weekStart, (draft) => ({
      ...draft,
      weekTemplate,
    }));
  };

  const setDateOverride = (
    campaignId: string,
    weekStart: string,
    date: string,
    schedule: boolean[],
  ) => {
    updateLocalCampaignSchedule(campaignId, weekStart, (draft) => ({
      ...draft,
      dateOverrides: {
        ...draft.dateOverrides,
        [date]: schedule,
      },
    }));
  };

  const deleteDateOverride = (
    campaignId: string,
    weekStart: string,
    date: string,
  ) => {
    updateLocalCampaignSchedule(campaignId, weekStart, (draft) => {
      const overrides = { ...draft.dateOverrides };
      delete overrides[date];
      return {
        ...draft,
        dateOverrides: overrides,
      };
    });
  };

  const handleSave = async () => {
    if (Object.keys(campaignSchedules).length === 0) return;

    const campaignEntries = Object.entries(campaignSchedules);
    const savePromises = campaignEntries.map(async ([campaignId, campaignSchedule]) => {
      const campaign = initialCampaigns.find((c) => c.id === campaignId);
      const campaignName = campaign?.name ?? campaignId;
      const campaignIdNum = Number(campaignId);

      // Fetch existing campaign schedules from API to preserve unaffected schedules
      let existingSchedules: BackendSchedule[] | undefined = undefined;
      try {
        const resp = await getCampaigns({ page: 1, limit: 200 });
        const found = resp.data.find((c) => c.campaignId === campaignIdNum);
        existingSchedules = found?.schedules ?? [];
      } catch (e) {
        // If fetch fails, fallback to undefined so we still send local drafts
        existingSchedules = undefined;
      }

      // Determine which backend dates our local drafts will replace
      const replacedDates = new Set<string>();
      Object.entries(campaignSchedule.weeks).forEach(([weekStart, draft]) => {
        // dateOverrides explicitly replace those dates
        Object.keys(draft.dateOverrides || {}).forEach((d) => replacedDates.add(d));

        // weekTemplate entries imply dates within the weekStart
        const baseDate = new Date(`${weekStart}T00:00:00`);
        SCHEDULER_DAYS.forEach((day, di) => {
          const daySchedule = (draft.weekTemplate || {})[day] || [];
          if (daySchedule.some(Boolean)) {
            const iso = formatDateISO(new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate() + di));
            replacedDates.add(iso);
          }
        });
      });

      // Filter existingSchedules to remove any schedules for dates we will replace
      const filteredExisting = existingSchedules
        ? existingSchedules.filter((s) => {
            const iso = backendDateToISO(s.scheduleDate ?? null);
            return !iso || !replacedDates.has(iso);
          })
        : undefined;

      const schedules = Object.entries(campaignSchedule.weeks).flatMap(([weekStart, draft]) =>
        buildSchedulesFromState(
          filteredExisting,
          draft.weekTemplate,
          draft.dateOverrides,
          campaignIdNum,
          weekStart,
        ),
      );

      if (schedules.length === 0) return null;

      await updateCampaignSchedule(campaignIdNum, { schedules });
      return { campaignId, campaignName };
    });

    try {
      const results = await Promise.all(savePromises);
      results.forEach((result) => {
        if (result) {
          toast.success(`Saved schedule for ${result.campaignName}!`);
        }
      });
    } catch (error) {
      toast.error("Failed to save one or more campaign schedules.");
    }
  };

  return (
      <DashboardContext.Provider
      value={{
        selectedCampaign,
        setSelectedCampaign: (campaign) => setSelectedCampaignId(campaign.id),
        campaignSchedules,
        setWeekTemplate,
        setDateOverride,
        deleteDateOverride,
        handleSave,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error("useDashboard must be used within a DashboardProvider");
  }
  return context;
}
