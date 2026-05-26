// Static campaign data for fallback when API is unavailable
export type BackendTimeSlot = {
  startTime: string;
  endTime: string;
};

export type BackendSchedule = {
  id: number;
  campaignId: number;
  scheduleDate: string | null;
  endDate: string | null;
  timeSlots: BackendTimeSlot[];
  timezone: string;
  action: string;
  bidAdjustment: number | null;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export type BackendCampaign = {
  campaignId: number;
  name: string;
  campaignType: string;
  targetingType: string;
  state: string;
  dailyBudget: number;
  startDate: string;
  endDate: string | null;
  premiumBidAdjustment: boolean;
  bidding: {
    strategy: string;
    adjustments: unknown[];
  };
  profileId: number;
  lastSyncedAt: string;
  schedules: BackendSchedule[];
};

export const staticCampaignData: Record<string, BackendCampaign> = {
  "100000181": {
    campaignId: 100000181,
    name: "SP Campaign 181 — auto",
    campaignType: "sponsoredProducts",
    targetingType: "auto",
    state: "paused",
    dailyBudget: 94.35,
    startDate: "20260526",
    endDate: null,
    premiumBidAdjustment: false,
    bidding: {
      strategy: "autoForSales",
      adjustments: [],
    },
    profileId: 123456789,
    lastSyncedAt: "2026-05-25T18:50:04.789Z",
    schedules: [
      {
        id: 271,
        campaignId: 100000181,
        scheduleDate: "20260607",
        endDate: null,
        timeSlots: [
          { startTime: "14:00", endTime: "15:00" },
          { startTime: "16:00", endTime: "20:00" },
        ],
        timezone: "UTC",
        action: "PAUSE",
        bidAdjustment: null,
        status: "QUEUED",
        createdAt: "2026-05-25T18:50:04.789Z",
        updatedAt: "2026-05-25T18:50:04.789Z",
      },
    ],
  },
  "88294410": {
    campaignId: 88294410,
    name: "US-PROMO-Q4-NIKE-REACT",
    campaignType: "sponsoredProducts",
    targetingType: "auto",
    state: "ACTIVE",
    dailyBudget: 2450.0,
    startDate: "20260526",
    endDate: null,
    premiumBidAdjustment: false,
    bidding: {
      strategy: "autoForSales",
      adjustments: [],
    },
    profileId: 111111111,
    lastSyncedAt: "2026-05-25T18:50:04.789Z",
    schedules: [
      {
        id: 302,
        campaignId: 88294410,
        scheduleDate: "20260607",
        endDate: null,
        timeSlots: [
          { startTime: "08:00", endTime: "11:00" },
          { startTime: "17:00", endTime: "20:00" },
        ],
        timezone: "UTC",
        action: "PAUSE",
        bidAdjustment: null,
        status: "QUEUED",
        createdAt: "2026-05-25T18:50:04.789Z",
        updatedAt: "2026-05-25T18:50:04.789Z",
      },
    ],
  },
  "88294411": {
    campaignId: 88294411,
    name: "EU-SNEAKER-FLASHSALE",
    campaignType: "sponsoredProducts",
    targetingType: "auto",
    state: "ACTIVE",
    dailyBudget: 1800.0,
    startDate: "20260526",
    endDate: null,
    premiumBidAdjustment: false,
    bidding: {
      strategy: "autoForSales",
      adjustments: [],
    },
    profileId: 222222222,
    lastSyncedAt: "2026-05-25T18:50:04.789Z",
    schedules: [
      {
        id: 303,
        campaignId: 88294411,
        scheduleDate: "20260607",
        endDate: null,
        timeSlots: [
          { startTime: "09:00", endTime: "12:00" },
          { startTime: "18:00", endTime: "21:00" },
        ],
        timezone: "UTC",
        action: "PAUSE",
        bidAdjustment: null,
        status: "QUEUED",
        createdAt: "2026-05-25T18:50:04.789Z",
        updatedAt: "2026-05-25T18:50:04.789Z",
      },
    ],
  },
};
