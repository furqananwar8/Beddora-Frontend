"use client";

import { ReactNode, useState } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CampaignCard } from "@/components/campaign-card/campaign-card";
import { CampaignSidebar } from "@/components/campaign-sidebar/campaign-sidebar";

const navigation = [
  {
    name: "Dayparting",
    icon: Calendar,
    href: "/dashboard/dayparting",
    current: true,
  },
];

function DashboardLayoutContent({ children }: { children: ReactNode }) {
  const { selectedCampaign, handleSave } = useDashboard();
  const [executingModalOpen, setExecutingModalOpen] = useState(false);

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
                  : "text-zinc-400 hover:bg-zinc-50 hover:text-zinc-600 dark:hover:bg-zinc-800"
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

      {/* Campaign Sidebar — Extracted Component */}
      <CampaignSidebar />

      {/* Main Content */}
      <div className="flex flex-1 flex-col">
        {/* Header */}
        <header className="flex h-16 items-center justify-between border-b bg-white px-8 dark:bg-zinc-900 dark:border-zinc-800">
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
          <Save className="h-4 w-4 mr-2" />
          Save
        </Button>
      </div>

      <Dialog open={executingModalOpen} onOpenChange={setExecutingModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Campaign Executing on Amazon</DialogTitle>
            <DialogDescription>
              A scheduled campaign is currently executing on Amazon.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setExecutingModalOpen(false)}>Okay</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  // Fetch initial campaigns for context (optional — sidebar fetches its own)
  const campaignsQuery = useCampaigns({
    type: "SPONSORED_PRODUCTS",
    page: 1,
    limit: 15,
  });

  const initialCampaigns: Campaign[] =
    campaignsQuery.data?.data?.map((campaign: any) => ({
      id: campaign.campaignId.toString(),
      name: campaign.name,
      status: campaign.state.toUpperCase() as Campaign["status"],
      adProduct: campaign.adProduct,
      marketplaces: campaign.marketplaces,
      creationDateTime: campaign.creationDateTime,
    })) || [];

  return (
    <DashboardProvider initialCampaigns={initialCampaigns}>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </DashboardProvider>
  );
}