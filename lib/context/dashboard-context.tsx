"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import {
  BackendSchedule,
  updateCampaignSchedule,
  getCampaigns,
} from "@/api/services/campaigns.api";
import { toast } from "sonner";
import {
  buildSchedulesFromState,
  backendDateToISO,
  formatDateISO,
  SCHEDULER_DAYS,
} from "@/components/dashboard/scheduler/scheduler-utils";

export type Campaign = {
  id: string;
  name: string;
  status: "ENABLED" | "PAUSED" | "ARCHIVED";
  adProduct: "SPONSORED_PRODUCTS" | "SPONSORED_BRANDS" | "SPONSORED_DISPLAY";
  marketplaces?: string[];
  creationDate?: string;
  countryCode?: string;
  schedules?: any[];
  timezone: string;
  campaignId?: number;
};

export type DayKey = "MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT" | "SUN";
export type WeekTemplate = Record<DayKey, boolean[]>;
export type DateOverrides = Record<string, boolean[]>;

type WeeklyDraft = {
  weekTemplate: WeekTemplate;
  dateOverrides: DateOverrides;
  action: "ENABLED" | "PAUSED";
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
  setWeekAction: (
    campaignId: string,
    weekStart: string,
    action: "ENABLED" | "PAUSED",
  ) => void;
  deleteDateOverride: (
    campaignId: string,
    weekStart: string,
    date: string,
  ) => void;
  handleSave: () => void;
};

const DashboardContext = createContext<DashboardContextType | undefined>(
  undefined,
);

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
  action: "ENABLED",
});

export function DashboardProvider({
  children,
  initialCampaigns,
}: {
  children: ReactNode;
  initialCampaigns: Campaign[];
}) {
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(
    initialCampaigns[1] || initialCampaigns[0] || null,
  );
  const [campaignSchedules, setCampaignSchedules] = useState<
    Record<string, CampaignSchedules>
  >({});

  const updateLocalCampaignSchedule = (
    campaignId: string,
    weekStart: string,
    updater: (draft: WeeklyDraft) => WeeklyDraft,
  ) => {
    setCampaignSchedules((prev) => {
      const current = prev[campaignId] || createEmptyCampaignSchedule();
      const currentWeekDraft =
        current.weeks[weekStart] || createEmptyWeeklyDraft();

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

  const setWeekAction = (
    campaignId: string,
    weekStart: string,
    action: "ENABLED" | "PAUSED",
  ) => {
    updateLocalCampaignSchedule(campaignId, weekStart, (draft) => ({
      ...draft,
      action,
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
    const savePromises = campaignEntries.map(
      async ([campaignId, campaignSchedule]) => {
        const campaign =
          initialCampaigns.find((c) => c.id === campaignId) ||
          (selectedCampaign?.id === campaignId ? selectedCampaign : undefined);

        const campaignName = campaign?.name ?? campaignId;
        const campaignIdNum = Number(campaignId);

        let existingSchedules: BackendSchedule[] | undefined = undefined;
        try {
          const resp = await getCampaigns({ page: 1, limit: 200 });
          const found = resp.data.find(
            (c) => c.campaignId === campaignIdNum,
          );
          existingSchedules = found?.schedules ?? [];
        } catch (e) {
          existingSchedules = undefined;
        }

        const replacedDates = new Set<string>();
        Object.entries(campaignSchedule.weeks).forEach(
          ([weekStart, draft]) => {
            Object.keys(draft.dateOverrides || {}).forEach((d) =>
              replacedDates.add(d),
            );

            const baseDate = new Date(`${weekStart}T00:00:00`);
            SCHEDULER_DAYS.forEach((day: any, di: any) => {
              const daySchedule = (draft.weekTemplate as any || {})[day] || [];
              if (daySchedule.some(Boolean)) {
                const iso = formatDateISO(
                  new Date(
                    baseDate.getFullYear(),
                    baseDate.getMonth(),
                    baseDate.getDate() + di,
                  ),
                );
                replacedDates.add(iso);
              }
            });
          },
        );

        const filteredExisting = existingSchedules
          ? existingSchedules.filter((s) => {
              const iso = backendDateToISO(s.scheduleDate ?? null);
              return !iso || !replacedDates.has(iso);
            })
          : undefined;

        const schedules = Object.entries(campaignSchedule.weeks).flatMap(
          ([weekStart, draft]) =>
            buildSchedulesFromState(
              filteredExisting,
              draft.weekTemplate,
              draft.dateOverrides,
              campaignIdNum,
              weekStart,
              draft.action,
              campaign?.countryCode || "US",
            ),
        );

        if (schedules.length === 0) return null;

        console.log("Scheduled data", {schedules})
        // will call later first confirm accurate payload
        await updateCampaignSchedule(campaignIdNum, { schedules });
        return { campaignId, campaignName };
      },
    );

    try {
      const results = await Promise.all(savePromises);
      results.forEach((result) => {
        if (result) {
          toast.success(`Saved schedule for ${result.campaignName}!`);
        }
      });
    } catch (error) {
      console.error("handleSave error:", error);
      toast.error("Failed to save one or more campaign schedules.");
    }
  };

  return (
    <DashboardContext.Provider
      value={{
        selectedCampaign,
        setSelectedCampaign,
        campaignSchedules,
        setWeekTemplate,
        setDateOverride,
        setWeekAction,
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