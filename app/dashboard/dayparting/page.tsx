"use client";

import { SchedulerGrid } from "@/components/dashboard/scheduler-grid";
import { InviteUserModal } from "@/components/dashboard/invite-user-modal";
import { useDashboard } from "@/lib/context/dashboard-context";

export default function DaypartingPage() {
  const { selectedCampaign } = useDashboard();

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Title & Actions */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              Dayparting Schedule
            </h1>
            {selectedCampaign && (
              <div className="flex items-center space-x-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/30 ml-4 translate-y-1">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400" />
                <span>{selectedCampaign.name}</span>
              </div>
            )}
          </div>
          <p className="text-zinc-500 dark:text-zinc-400 max-w-2xl text-lg font-medium">
            Select the specific hours of the day you want your campaign to run.
          </p>
        </div>
        {/* <InviteUserModal /> */}
      </div>

      {/* Grid */}
      <SchedulerGrid />
    </div>
  );
}
