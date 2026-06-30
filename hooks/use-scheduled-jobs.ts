import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

// Simple reusable debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

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
  search,
}: UseScheduledJobsParams = {}) {
  const debouncedSearch = useDebounce(search, 400);

  return useQuery({
    queryKey: ["scheduled-jobs", page, limit, status, sortBy, sortOrder, campaignId, debouncedSearch],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });
      if (status) params.set("status", status);
      if (sortBy) params.set("sortBy", sortBy);
      if (sortOrder) params.set("sortOrder", sortOrder);
      if (campaignId) params.set("campaignId", campaignId);
      if (debouncedSearch) params.set("search", debouncedSearch);
      
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/campaigns/scheduled-jobs?${params}`, { 
        credentials: "include",
        headers: { "Cache-Control": "no-cache" } 
      });
      if (!res.ok) throw new Error("Failed to fetch scheduled jobs");
      
      return res.json();
    },
  });
}