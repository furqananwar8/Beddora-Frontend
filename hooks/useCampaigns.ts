import { useQuery } from "@tanstack/react-query";
import getCampaigns, { CampaignListParams, CampaignListResponse } from "@/api/services/campaigns.api";

export function useCampaigns(params: CampaignListParams = { page: 1, limit: 20, state: "paused" }) {
  const { page = 1, limit = 20, state } = params;

  return useQuery<CampaignListResponse>({
    queryKey: ["campaigns", { page, limit, state }],
    queryFn: () => getCampaigns({ page, limit, state }),
    staleTime: 1000 * 60 * 2,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}

export default useCampaigns;
