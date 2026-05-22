"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

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

type DashboardContextType = {
  selectedCampaign: Campaign | null;
  setSelectedCampaign: (campaign: Campaign) => void;
  campaignSchedules: Record<string, CampaignSchedules>;
  setWeekTemplate: (campaignId: string, weekTemplate: WeekTemplate) => void;
  setDateOverride: (campaignId: string, date: string, schedule: boolean[]) => void;
  deleteDateOverride: (campaignId: string, date: string) => void;
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

const createInitialWeekTemplate = (): WeekTemplate => {
  const template = createEmptyWeekTemplate();
  for (let d = 0; d < 5; d += 1) {
    for (let h = 8; h <= 20; h += 1) {
      template[days[d]][h] = true;
    }
  }
  return template;
};

const createEmptyCampaignSchedule = (): CampaignSchedules => ({
  weekTemplate: createEmptyWeekTemplate(),
  dateOverrides: {},
});

export function DashboardProvider({ children, initialCampaigns }: { children: ReactNode; initialCampaigns: Campaign[] }) {
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(initialCampaigns[1] || initialCampaigns[0] || null);
  const [campaignSchedules, setCampaignSchedules] = useState<Record<string, CampaignSchedules>>(() => {
    const initial: Record<string, CampaignSchedules> = {};
    if (selectedCampaign) {
      initial[selectedCampaign.id] = {
        weekTemplate: createInitialWeekTemplate(),
        dateOverrides: {},
      };
    }
    return initial;
  });

  const updateCampaignSchedule = (campaignId: string, updater: (schedule: CampaignSchedules) => CampaignSchedules) => {
    setCampaignSchedules((prev) => {
      const current = prev[campaignId] || createEmptyCampaignSchedule();
      return {
        ...prev,
        [campaignId]: updater(current),
      };
    });
  };

  const setWeekTemplate = (campaignId: string, weekTemplate: WeekTemplate) => {
    updateCampaignSchedule(campaignId, (schedule) => ({
      ...schedule,
      weekTemplate,
    }));
  };

  const setDateOverride = (campaignId: string, date: string, schedule: boolean[]) => {
    updateCampaignSchedule(campaignId, (current) => ({
      ...current,
      dateOverrides: {
        ...current.dateOverrides,
        [date]: schedule,
      },
    }));
  };

  const deleteDateOverride = (campaignId: string, date: string) => {
    updateCampaignSchedule(campaignId, (current) => {
      const overrides = { ...current.dateOverrides };
      delete overrides[date];
      return {
        ...current,
        dateOverrides: overrides,
      };
    });
  };

  const handleSave = () => {
    if (!selectedCampaign) return;

    const schedule = campaignSchedules[selectedCampaign.id] || createEmptyCampaignSchedule();

    console.log("Saving Dayparting Schedule:", {
      campaignName: selectedCampaign.name,
      campaignId: selectedCampaign.id,
      weekTemplate: schedule.weekTemplate,
      dateOverrides: schedule.dateOverrides,
    });

    alert(`Saved schedule for ${selectedCampaign.name}!\nCheck console for details.`);
  };

  return (
    <DashboardContext.Provider
      value={{
        selectedCampaign,
        setSelectedCampaign,
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
