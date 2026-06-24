"use client";

import { useState, useCallback, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CampaignCard } from "@/components/campaign-card/campaign-card";
import { useCampaigns } from "@/hooks/useCampaigns";
import { useDashboard } from "@/lib/context/dashboard-context";
import { cn } from "@/lib/utils";
import { Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { SearchCampaigns } from "@/components/search-campaign/search-campaign";
import { Button } from "@/components/ui/button";
import { getTimezoneFromCountry } from "@/utils/getTimeZoneFromCountry";

import { usePathname, useRouter } from "next/navigation";

type CampaignType = "SPONSORED_PRODUCTS" | "SPONSORED_BRANDS" | "SPONSORED_DISPLAY";

const TABS: { key: CampaignType; label: string }[] = [
  { key: "SPONSORED_PRODUCTS", label: "Sponsored Products" },
  { key: "SPONSORED_BRANDS", label: "Sponsored Brands" },
  { key: "SPONSORED_DISPLAY", label: "Sponsored Display" },
];

export function CampaignSidebar() {
  const [activeTab, setActiveTab] = useState<CampaignType>("SPONSORED_PRODUCTS");
  const [search, setSearch] = useState("");
  
  // Cursor history: [null, cursorA, cursorB, ...]
  // index 0 = first page (no cursor)
  const [cursorHistory, setCursorHistory] = useState<(string | null)[]>([null]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const { selectedCampaign, setSelectedCampaign, setCampaigns } = useDashboard();

  const currentCursor = cursorHistory[currentIndex];
  const pathname = usePathname();
  const router = useRouter();

  const isScheduledPage = pathname === "/dashboard/scheduled" || pathname.startsWith("/dashboard/scheduled");

  const campaignsQuery = useCampaigns({
    type: activeTab,
    cursor: currentCursor,
    limit: 15,
    search: search || undefined,
  });

  const campaigns = campaignsQuery.data?.data || [];
  const meta = campaignsQuery.data?.meta;
  const isLoading = campaignsQuery.isLoading;
  const isError = campaignsQuery.isError;

  useEffect(() => {
    if (campaignsQuery.data?.data) {
      const mapped = campaignsQuery.data.data.map((c: any) => ({
        id: c.campaignId.toString(),
        name: c.name,
        status: c.state.toUpperCase(),
        adProduct: c.adProduct,
        countryCode: c.countryCode,
        creationDate: c.creationDate,
        schedules: c.schedules,
        campaignId: c.campaignId,
        timezone: getTimezoneFromCountry(c.countryCode),
      }));
      setCampaigns(mapped);
    }
  }, [campaignsQuery.data, setCampaigns]);

  const handleTabChange = useCallback((tab: CampaignType) => {
    setActiveTab(tab);
    setSearch("");
    // Reset cursor history
    setCursorHistory([null]);
    setCurrentIndex(0);
  }, []);

  const handleSearch = useCallback((term: string) => {
    setSearch(term);
    setCursorHistory([null]);
    setCurrentIndex(0);
  }, []);

  const handleNext = useCallback(() => {
    if (!meta?.nextCursor) return;
    
    // If we're at the end of history, append the new cursor
    if (currentIndex === cursorHistory.length - 1) {
      setCursorHistory((prev) => [...prev, meta.nextCursor]);
    }
    setCurrentIndex((i) => i + 1);
  }, [meta?.nextCursor, currentIndex, cursorHistory.length]);

  const handlePrevious = useCallback(() => {
    if (currentIndex <= 0) return;
    setCurrentIndex((i) => i - 1);
  }, [currentIndex]);

  const activeTabLabel = TABS.find((t) => t.key === activeTab)?.label ?? "Campaigns";

  return (
    <div className="flex w-80 flex-col border-r bg-white dark:bg-zinc-900 dark:border-zinc-800 h-full">
      {/* Header */}
      <div className="border-b px-4 py-4 dark:border-zinc-800 shrink-0">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
          Campaigns
        </h2>
        <SearchCampaigns
          value={search}
          onSearch={handleSearch}
          placeholder={`Search ${activeTabLabel.toLowerCase()}...`}
          debounceMs={400}
        />
      </div>

      {/* Tabs */}
      <div className="flex border-b dark:border-zinc-800 shrink-0">
       {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => handleTabChange(tab.key)}
            className={cn(
              "cursor-pointer flex-1 px-2 py-2.5 text-xs font-medium transition-colors border-b-2 whitespace-normal break-words",
              activeTab === tab.key
                ? "border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400"
                : "border-transparent text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
            )}
            title={tab.label}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Campaign List */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="space-y-1 p-2">
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
            </div>
          )}
          {isError && (
            <div className="px-3 py-4 text-sm text-red-600 dark:text-red-400">
              Unable to load campaigns.
            </div>
          )}
          {!isLoading && !isError && campaigns.length === 0 && (
            <div className="px-3 py-8 text-sm text-zinc-500 dark:text-zinc-400 text-center">
              {search
                ? `No ${activeTabLabel.toLowerCase()} match "${search}"`
                : `No ${activeTabLabel.toLowerCase()} found.`}
            </div>
          )}
          {campaigns.map((campaign: any) => (
            <CampaignCard
              key={`${campaign.profileId}-${campaign.campaignId}`}
              campaign={{
                id: campaign.campaignId.toString(),
                name: campaign.name,
                status: campaign.state.toUpperCase(),
                adProduct: campaign.adProduct,
                countryCode: campaign.countryCode,
                creationDate: campaign.creationDate,
                timezone: getTimezoneFromCountry(campaign.countryCode) 
              }}
              isSelected={selectedCampaign?.id === campaign.campaignId.toString()}
              isOperating={false}
              onClick={() => {
                setSelectedCampaign({
                  id: campaign.campaignId.toString(),
                  name: campaign.name,
                  status: campaign.state.toUpperCase(),
                  adProduct: campaign.adProduct,
                  countryCode: campaign.countryCode,
                  marketplaces: campaign.marketplaces,
                  creationDate: campaign.creationDate,
                  schedules: campaign.schedules,
                  campaignId: campaign.campaignId,
                  timezone: getTimezoneFromCountry(campaign.countryCode),
                })
        
                if (isScheduledPage) {
                  router.push("/dashboard/dayparting");
                }

              }
              }
            />
          ))}
        </div>
      </ScrollArea>

      {/* Cursor Pagination */}
      <div className="border-t px-3 py-3 dark:border-zinc-800 shrink-0 bg-zinc-50 dark:bg-zinc-900/50">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePrevious}
            disabled={currentIndex === 0 || isLoading}
            className="h-8 px-2"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </Button>

          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            {campaigns.length} results
          </span>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleNext}
            disabled={!meta?.hasNextPage || isLoading}
            className="h-8 px-2"
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}