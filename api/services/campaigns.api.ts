import apiClient from "../client";

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
    adjustments: Array<{
      predicate: string;
      percentage: number;
    }>;
  };
  profileId: number;
  lastSyncedAt: string;
  schedules: BackendSchedule[];
};

export type CampaignListMeta = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type CampaignListResponse = {
  data: BackendCampaign[];
  meta: CampaignListMeta;
};

export type CampaignListParams = {
  page?: number;
  limit?: number;
  state?: string;
};

export const getCampaigns = async ({ page = 1, limit = 20, state }: CampaignListParams): Promise<CampaignListResponse> => {
  const response = await apiClient.get("/campaigns", {
    params: {
      page,
      limit,
      state,
    },
  });
  return response.data;
};

export default getCampaigns;
