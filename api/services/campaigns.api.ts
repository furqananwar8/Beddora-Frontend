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

export type UpdateCampaignSchedulePayload = {
  schedules: BackendSchedule[];
};

export interface TimeSlot {
  startTime: string;
  endTime: string;
}

export interface WeeklySchedulePayload {
  dayOfWeek: number; // 0=Sun, 1=Mon, ..., 6=Sat
  timeSlots: TimeSlot[];
  action: "ENABLED" | "PAUSED";
}

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

export async function updateCampaignWeeklySchedule(
  campaignId: number,
  body: { schedules: WeeklySchedulePayload[] },
) {
  const response = await apiClient.post(
    `/campaigns/${campaignId}/weekly-schedule`,
    body,
  );
  return response.data;
}

export const updateCampaignSchedule = async (
  campaignId: number,
  payload: UpdateCampaignSchedulePayload,
) => {
  const response = await apiClient.post(
    `/campaigns/${campaignId}/schedule`,
    payload,
  );
  return response.data;
};

export const syncCampaignSchedulesNow = async () => {
  const response = await apiClient.post("/campaign-schedules/sync-now");
  return response.data;
};

export default getCampaigns;
