import { useQuery } from "@tanstack/react-query";

interface UseScheduledJobsParams {
  page?: number;
  limit?: number;
  status?: string;
  sortBy?: string;
  sortOrder?: string;
  campaignId?: string;  // optional filter
}

export function useScheduledJobs({ 
  page = 1, 
  limit = 20, 
  status, 
  sortBy, 
  sortOrder,
  campaignId 
}: UseScheduledJobsParams = {}) {
  return useQuery({
    queryKey: ["scheduled-jobs", page, limit, status, sortBy, sortOrder, campaignId],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });
      if (status) params.set("status", status);
      if (sortBy) params.set("sortBy", sortBy);
      if (sortOrder) params.set("sortOrder", sortOrder);
      if (campaignId) params.set("campaignId", campaignId);
      
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/campaigns/scheduled-jobs?${params}`,  { 
          credentials: "include",
          headers: { "Cache-Control": "no-cache" } 
        });
      if (!res.ok) throw new Error("Failed to fetch scheduled jobs");
      
      return res.json();
    },
  });
}