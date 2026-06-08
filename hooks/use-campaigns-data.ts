// "use client";

// import { useMemo, useRef, useEffect } from "react";
// import { useCampaigns } from "@/hooks/useCampaigns";

// export function useCampaignData(selectedCampaign: any) {
//   const campaignsQuery = useCampaigns({ page: 1, limit: 20 });
//   const { refetch: refetchCampaigns } = campaignsQuery;
//   const campaignsDataRef = useRef<any>(null);

//   useEffect(() => {
//     campaignsDataRef.current = campaignsQuery.data?.data ?? null;
//     console.log(
//       "SchedulerGrid - updated campaigns ref:",
//       campaignsDataRef.current?.map((campaign: any) => ({
//         id: campaign.id,
//         campaignId: campaign.campaignId,
//         name: campaign.name,
//       })) ?? null,
//     );
//   }, [campaignsQuery.data?.data]);

//   const apiCampaignData = useMemo(() => {
//     if (!selectedCampaign) return undefined;
//     return campaignsQuery.data?.data?.find(
//       (c) => c.campaignId === Number(selectedCampaign.id),
//     );
//   }, [selectedCampaign, campaignsQuery.data?.data]);

//   const campaignIdNum = useMemo(
//     () => Number(selectedCampaign?.id ?? "") || apiCampaignData?.campaignId || 0,
//     [selectedCampaign?.id, apiCampaignData?.campaignId],
//   );

//   return {
//     campaignsQuery,
//     refetchCampaigns,
//     campaignsDataRef,
//     apiCampaignData,
//     campaignIdNum,
//   };
// }