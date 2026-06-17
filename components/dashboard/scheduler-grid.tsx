"use client";

import { SchedulerGridHeader } from "./scheduler/scheduler-grid-header";
import { WeeklySchedulerRow } from "./scheduler/weekly-scheduler-row";
import { SyncCampaignsDialog } from "./scheduler/sync-campaigns-dialog";
import { SCHEDULER_HOURS } from "./scheduler/scheduler-utils";
import { useSchedulerGrid } from "@/hooks/use-scheduler-grid";
import { useDashboard } from "@/lib/context/dashboard-context";
import { Loader2 } from "lucide-react";
import { useState } from "react";

export function SchedulerGrid() {
  const [isClearing, setIsClearing] = useState(false);
  const { isSaving } = useDashboard();

  const {
    selectedCampaign,
    days,
    isSyncing,
    syncModalOpen,
    setSyncModalOpen,
    syncProgressItems,
    syncCompleted,
    weekTemplate,
    clearWeeklyTemplate,
    toggleWeeklyCell,
    toggleFullDay,
    setWeekTemplate,
  } = useSchedulerGrid();

  if (!selectedCampaign) return null;

  const handleClear = async () => {
    setIsClearing(true);
    try {
      await clearWeeklyTemplate();
    } finally {
      setIsClearing(false);
    }
  };

  const isLoading = isSaving || isClearing;

  return (
    <div className="space-y-6 relative">
      <SyncCampaignsDialog
        open={syncModalOpen}
        isSyncing={isSyncing}
        completed={syncCompleted}
        items={syncProgressItems}
        onOpenChange={setSyncModalOpen}
      />

      {/* Grid container with relative positioning and defined bounds */}
      <div className="relative overflow-x-auto rounded-xl border bg-white dark:border-zinc-800 dark:bg-zinc-900">
        {/* Loading Overlay - constrained to this container */}
        {isLoading && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/70 dark:bg-zinc-950/70 backdrop-blur-sm rounded-xl">
            <Loader2 className="h-10 w-10 animate-spin text-indigo-600 mb-3" />
            <span className="text-sm font-medium text-zinc-500">
              {isSaving ? "Saving schedule..." : "Clearing schedule..."}
            </span>
          </div>
        )}

        <div className={`min-w-[960px] ${isLoading ? 'pointer-events-none' : ''}`}>
          <SchedulerGridHeader
            clearWeeklyTemplate={handleClear}
            isClearing={isClearing}
            hours={SCHEDULER_HOURS}
            days={days}
            weekTemplate={weekTemplate}
            setWeekTemplate={setWeekTemplate}
            campaignId={selectedCampaign.id}
          />

          {days.map((day, dIndex) => (
            <WeeklySchedulerRow
              key={`${selectedCampaign.id}-${day}`}
              day={day}
              dIndex={dIndex}
              hours={SCHEDULER_HOURS}
              isActiveHour={(dayKey, hIndex) =>
                weekTemplate[dayKey]?.[hIndex] ?? false
              }
              toggleFullDay={toggleFullDay}
              toggleWeeklyCell={toggleWeeklyCell}
              campaignId={selectedCampaign.id}
              disabled={isLoading}
            />
          ))}
        </div>
      </div>
    </div>
  );
}