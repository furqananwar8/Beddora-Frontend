"use client";
import { EventSourcePolyfill } from "event-source-polyfill";

import { ReactNode, useEffect, useState } from "react";
import {
  Calendar,
  Loader2,
  Settings,
  Zap,
  HelpCircle,
  Bell,
  Save,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DashboardProvider,
  useDashboard,
  Campaign,
} from "@/lib/context/dashboard-context";
import { useCampaigns } from "@/hooks/useCampaigns";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

const navigation = [
  // { name: 'Dashboard', icon: LayoutDashboard, href: '#', current: false },
  // { name: 'Campaigns', icon: BarChart3, href: '#', current: false },
  {
    name: "Dayparting",
    icon: Calendar,
    href: "/dashboard/dayparting",
    current: true,
  },
  // { name: 'Rules', icon: Zap, href: '#', current: false },
  // { name: 'Audience', icon: Users, href: '#', current: false },
];

function DashboardLayoutContent({
  children,
  campaigns,
  isLoading,
  isError,
}: {
  children: ReactNode;
  campaigns: Campaign[];
  isLoading: boolean;
  isError: boolean;
}) {
  const { selectedCampaign, setSelectedCampaign, handleSave } = useDashboard();
  const [operatingCampaignId, setOperatingCampaignId] = useState<string | null>(
    null,
  );
  const selectedCampaignId = selectedCampaign?.id ?? null;

  useEffect(() => {
    if (!selectedCampaignId) return;

    const es = new EventSource(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/campaign-schedules/events`,
      { withCredentials: true } // only if you need cookies
    );

    es.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        const eventCampaignId =
          msg.campaignId === undefined ? null : String(msg.campaignId);

        if (eventCampaignId !== selectedCampaignId) return;

        switch (msg.type) {
          case "SCHEDULE_EXECUTING":
            setOperatingCampaignId(eventCampaignId);
            toast(`Campaign ${msg.campaignId} schedule is operating...`);
            break;
          case "SCHEDULE_COMPLETED":
            setOperatingCampaignId(null);
            toast.success(`Campaign ${msg.campaignId} schedule completed.`);
            break;
          case "SCHEDULE_FAILED":
            setOperatingCampaignId(null);
            toast.error(`Campaign ${msg.campaignId} failed: ${msg.error}`);
            break;
        }
      } catch (error) {
        console.error("Invalid SSE payload", error);
      }
    };

    es.onerror = () => {
      // Browser auto-reconnects every ~3s
    };

    return () => es.close();
  }, [selectedCampaignId]);

  return (
    <div className="flex h-screen bg-[#F8FAFC] dark:bg-zinc-950">
      {/* Primary Sidebar (Navigation) */}
      <div className="flex w-16 flex-col items-center border-r bg-white dark:bg-zinc-900 py-4 dark:border-zinc-800">
        <div className="mb-8 flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600">
          <Zap className="h-6 w-6 text-white" />
        </div>
        <nav className="flex flex-1 flex-col items-center space-y-4">
          {navigation.map((item) => (
            <a
              key={item.name}
              href={item.href}
              className={cn(
                "group relative flex h-10 w-10 items-center justify-center rounded-lg transition-colors",
                item.current
                  ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400"
                  : "text-zinc-400 hover:bg-zinc-50 hover:text-zinc-600 dark:hover:bg-zinc-800",
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="absolute left-14 hidden rounded-md bg-zinc-900 px-2 py-1 text-xs text-white group-hover:block">
                {item.name}
              </span>
            </a>
          ))}
        </nav>
        <div className="mt-auto flex flex-col items-center space-y-4">
          <button className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200">
            <Settings className="h-5 w-5" />
          </button>
          <div className="h-8 w-8 rounded-full bg-zinc-200 dark:bg-zinc-800" />
        </div>
      </div>

      {/* Secondary Sidebar (Campaigns) */}
      <div className="flex w-72 flex-col border-r bg-white dark:bg-zinc-900 dark:border-zinc-800">
        <div className="flex items-center justify-between border-b px-4 py-4 dark:border-zinc-800">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Campaigns
          </h2>
        </div>
        <ScrollArea className="flex-1">
          <div className="space-y-1 p-2">
            {isLoading && (
              <div className="px-3 py-4 text-sm text-zinc-500 dark:text-zinc-400">
                Loading campaigns...
              </div>
            )}
            {isError && (
              <div className="px-3 py-4 text-sm text-red-600 dark:text-red-400">
                Unable to load campaigns.
              </div>
            )}
            {!isLoading && !isError && campaigns.length === 0 && (
              <div className="px-3 py-4 text-sm text-zinc-500 dark:text-zinc-400">
                No campaigns found.
              </div>
            )}
            {campaigns.map((campaign) => (
              <div
                key={campaign.id}
                onClick={() => setSelectedCampaign(campaign)}
                className={cn(
                  "group relative flex flex-col space-y-2 rounded-xl p-4 transition-all cursor-pointer border-2",
                  selectedCampaign?.id === campaign.id
                    ? "bg-indigo-50/50 border-indigo-100 dark:bg-indigo-900/10 dark:border-indigo-900/30"
                    : "hover:bg-zinc-50 border-transparent dark:hover:bg-zinc-800",
                )}
              >
                <div className="flex items-center justify-between">
                  {operatingCampaignId === campaign.id && (
                    <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Operating
                    </div>
                  )}
                  {/* <div className={cn(
                    "text-[10px] font-bold tracking-wider",
                    campaign.status === 'ACTIVE' ? "text-emerald-600" : "text-zinc-400"
                  )}>
                    {campaign.status}
                  </div> */}
                  {/* <Switch 
                    checked={campaign.status === 'ACTIVE'} 
                    className="scale-75 data-[state=checked]:bg-emerald-500"
                  /> */}
                </div>
                <div>
                  <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100 leading-tight">
                    {campaign.name}
                  </div>
                  <div className="mt-1 flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">
                    <span>ID: {campaign.id}</span>
                    <span className="text-zinc-900 dark:text-zinc-100 font-bold">
                      {campaign.budget}
                    </span>
                  </div>
                </div>
                {selectedCampaign?.id === campaign.id && (
                  <div className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-tighter">
                    Selected
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 flex-col">
        {/* Header */}
        <header className="flex h-16 items-center justify-between border-b bg-white px-8 dark:bg-zinc-900 dark:border-zinc-800">
          {/* <div className="relative w-96">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <Input 
              placeholder="Search campaign rules..." 
              className="pl-10 h-10 bg-zinc-50 border-zinc-200 dark:bg-zinc-800 dark:border-zinc-700"
            />
          </div> */}
          <div className="flex items-center space-x-4">
            <button className="rounded-full p-2 text-zinc-400 hover:bg-zinc-50 hover:text-zinc-600 dark:hover:bg-zinc-800">
              <Bell className="h-5 w-5" />
            </button>
            <button className="rounded-full p-2 text-zinc-400 hover:bg-zinc-50 hover:text-zinc-600 dark:hover:bg-zinc-800">
              <HelpCircle className="h-5 w-5" />
            </button>
            <button className="rounded-full p-2 text-zinc-400 hover:bg-zinc-50 hover:text-zinc-600 dark:hover:bg-zinc-800">
              <Settings className="h-5 w-5" />
            </button>
          </div>
        </header>

        {/* View Content */}
        <main className="flex-1 overflow-auto bg-[#F8FAFC] dark:bg-zinc-950 p-8">
          {children}
        </main>
      </div>

      {/* Floating Action Button (Save) */}
      <div className="fixed bottom-8 right-8">
        <Button className="bg-indigo-600 text-white" onClick={handleSave}>
          <Save />
          Save
        </Button>
      </div>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  // Fetch campaigns at the layout level
  const campaignsQuery = useCampaigns({ page: 1, limit: 20 });

  // Build campaigns list only from API data.
  const initialCampaigns: Campaign[] =
    campaignsQuery.data?.data?.map((campaign) => ({
      id: campaign.campaignId.toString(),
      name: campaign.name,
      status: campaign.state.toUpperCase() as "ACTIVE" | "PAUSED",
      budget: `$${campaign.dailyBudget.toFixed(2)}/d`,
    })) || [];

  return (
    <DashboardProvider initialCampaigns={initialCampaigns}>
      <DashboardLayoutContent
        campaigns={initialCampaigns}
        isLoading={campaignsQuery.isLoading}
        isError={campaignsQuery.isError}
      >
        {children}
      </DashboardLayoutContent>
    </DashboardProvider>
  );
}
