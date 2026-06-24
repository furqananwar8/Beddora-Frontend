"use client";

import { ReactNode, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Calendar,
  Loader2,
  Settings,
  Zap,
  Save,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
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
import { CampaignSidebar } from "@/components/campaign-sidebar/campaign-sidebar";

const navigation = [
  {
    name: "Dayparting",
    icon: Calendar,
    href: "/dashboard/dayparting",
    current: false,
  },
  {
    name: "Scheduled Campaigns",
    icon: Clock,
    href: "/dashboard/scheduled",
    current: false,
  },
];

function DashboardLayoutContent({ children }: { children: ReactNode }) {
  const { selectedCampaign, handleSave, isSaving, setIsSaving  } = useDashboard();
  const [executingModalOpen, setExecutingModalOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const isScheduledPage = pathname === "/dashboard/scheduled" || pathname.startsWith("/dashboard/scheduled");

  const onSave = async () => {
    setIsSaving(true);
    try {
      await handleSave();
    } catch (err) {
      toast.error("Failed to save schedule. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#F8FAFC] dark:bg-zinc-950">
      {/* Primary Sidebar (Navigation) */}
      <div className="flex w-16 flex-col items-center border-r bg-white dark:bg-zinc-900 py-4 dark:border-zinc-800">
        <div className="mb-8 flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600">
          <Zap className="h-6 w-6 text-white" />
        </div>
        <nav className="flex flex-1 flex-col items-center space-y-4">
          {navigation.map((item) => (
             <Link
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
            </Link>
          ))}
        </nav>
        <div className="mt-auto flex flex-col items-center space-y-4">
          <button className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200">
            <Settings className="h-5 w-5" />
          </button>
          <div className="h-8 w-8 rounded-full bg-zinc-200 dark:bg-zinc-800" />
        </div>
      </div>

      {/* Campaign Sidebar */}
      <CampaignSidebar />

      {/* Main Content */}
      <div className="flex flex-1 flex-col relative">
        {/* View Content */}
        <main className={`flex-1 overflow-auto bg-[#F8FAFC] dark:bg-zinc-950 p-8 ${isSaving ? 'pointer-events-none' : ''}`}>
          {children}
        </main>
      </div>

      {/* Floating Action Button (Save) */}
       {!isScheduledPage && (
        <div className="fixed bottom-8 right-8 z-50">
          <Button 
            className="bg-indigo-600 text-white disabled:opacity-70 disabled:cursor-not-allowed" 
            onClick={onSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </div>
      )}

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
  const campaignsQuery = useCampaigns({
    type: "SPONSORED_PRODUCTS",
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