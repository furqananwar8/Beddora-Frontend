import { useQuery } from "@tanstack/react-query";

interface UseCampaignsOptions {
  type: "SPONSORED_PRODUCTS" | "SPONSORED_BRANDS" | "SPONSORED_DISPLAY";
  cursor?: string | null;
  limit?: number;
  search?: string;
  state?: string;
}

export function useCampaigns(options: UseCampaignsOptions) {
  const { type, cursor, limit = 15, search, state } = options;
  console.log({options})
  return useQuery({
    queryKey: ["campaigns", type, cursor, limit, search, state],
    queryFn: async () => {
      const params = new URLSearchParams({
        type,
        limit: String(limit),
      });
      if (cursor) params.append("cursor", cursor);
      if (search) params.append("search", search);
      if (state) params.append("state", state);

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/campaigns?${params.toString()}`,
        { credentials: "include" }
      );

      if (!res.ok) throw new Error("Failed to fetch campaigns");
      return res.json();
    },
    staleTime: 30 * 1000,
  });
}