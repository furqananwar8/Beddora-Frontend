import { useQuery, keepPreviousData } from "@tanstack/react-query";

interface UseScheduledJobsParams {
  page?: number;
  limit?: number;
  status?: string;
  sortBy?: string;
  sortOrder?: string;
  campaignId?: string;
  search?: string;
}

export function useScheduledJobs({
  page = 1,
  limit = 20,
  status,
  sortBy,
  sortOrder,
  campaignId,
  search = "",
}: UseScheduledJobsParams = {}) {
  return useQuery({
    queryKey: ["scheduled-jobs", page, limit, status, sortBy, sortOrder, campaignId, search],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });
      if (status) params.set("status", status);
      if (sortBy) params.set("sortBy", sortBy);
      if (sortOrder) params.set("sortOrder", sortOrder);
      if (campaignId) params.set("campaignId", campaignId);
      if (search) params.set("search", search);

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/campaigns/scheduled-jobs?${params}`, {
        credentials: "include",
        headers: { "Cache-Control": "no-cache" },
      });
      if (!res.ok) throw new Error("Failed to fetch scheduled jobs");

      return res.json();
    },
    // CRITICAL: without this, every queryKey change (page/status/search)
    // resets `data` to undefined and `status` to 'pending', which flips
    // `isLoading` back to true and unmounts the whole table/pagination UI.
    // This keeps the last successful page's data on screen while the
    // new page fetches in the background, exposed via `isPlaceholderData`.
    placeholderData: keepPreviousData,
  });
}