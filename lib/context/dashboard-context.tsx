"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import {
  BackendSchedule,
  updateCampaignSchedule,
} from "@/api/services/campaigns.api";
import { toast } from "sonner";

export type Campaign = {
  id: string;
  name: string;
  status: 'ACTIVE' | 'PAUSED';
  budget: string;
};

export type DayKey = 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN';
export type WeekTemplate = Record<DayKey, boolean[]>;
export type DateOverrides = Record<string, boolean[]>;

type CampaignSchedules = {
  weekTemplate: WeekTemplate;
  dateOverrides: DateOverrides;
};

export type PendingScheduleSave = {
  campaignId: number;
  campaignName: string;
  schedules: BackendSchedule[];
};

type DashboardContextType = {
  selectedCampaign: Campaign | null;
  setSelectedCampaign: (campaign: Campaign) => void;
  campaignSchedules: Record<string, CampaignSchedules>;
  setWeekTemplate: (campaignId: string, weekTemplate: WeekTemplate) => void;
  setDateOverride: (campaignId: string, date: string, schedule: boolean[]) => void;
  deleteDateOverride: (campaignId: string, date: string) => void;
  setPendingScheduleSave: (save: PendingScheduleSave | null) => void;
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
  weekTemplate: createEmptyWeekTemplate(),
  dateOverrides: {},
});

export function DashboardProvider({ children, initialCampaigns }: { children: ReactNode; initialCampaigns: Campaign[] }) {
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(
    initialCampaigns[1]?.id || initialCampaigns[0]?.id || null,
  );
  const [campaignSchedules, setCampaignSchedules] = useState<Record<string, CampaignSchedules>>({});
  const [pendingScheduleSave, setPendingScheduleSave] =
    useState<PendingScheduleSave | null>(null);

  const selectedCampaign =
    initialCampaigns.find((campaign) => campaign.id === selectedCampaignId) ||
    initialCampaigns[0] ||
    null;

  const updateLocalCampaignSchedule = (campaignId: string, updater: (schedule: CampaignSchedules) => CampaignSchedules) => {
    setCampaignSchedules((prev) => {
      const current = prev[campaignId] || createEmptyCampaignSchedule();
      return {
        ...prev,
        [campaignId]: updater(current),
      };
    });
  };

  const setWeekTemplate = (campaignId: string, weekTemplate: WeekTemplate) => {
    updateLocalCampaignSchedule(campaignId, (schedule) => ({
      ...schedule,
      weekTemplate,
    }));
  };

  const setDateOverride = (campaignId: string, date: string, schedule: boolean[]) => {
    updateLocalCampaignSchedule(campaignId, (current) => ({
      ...current,
      dateOverrides: {
        ...current.dateOverrides,
        [date]: schedule,
      },
    }));
  };

  const deleteDateOverride = (campaignId: string, date: string) => {
    updateLocalCampaignSchedule(campaignId, (current) => {
      const overrides = { ...current.dateOverrides };
      delete overrides[date];
      return {
        ...current,
        dateOverrides: overrides,
      };
    });
  };

  const handleSave = async () => {
    if (!selectedCampaign || !pendingScheduleSave) return;

    try {
      console.log("Saving Dayparting Schedule:", pendingScheduleSave);

      await updateCampaignSchedule(pendingScheduleSave.campaignId, {
        schedules: pendingScheduleSave.schedules,
      });

      toast.success(`Saved schedule for ${pendingScheduleSave.campaignName}!`);
    } catch (error) {
      console.error("Failed to save dayparting schedule:", error);
      toast.error(`Failed to save schedule for ${pendingScheduleSave.campaignName}.`);
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
        setPendingScheduleSave,
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
