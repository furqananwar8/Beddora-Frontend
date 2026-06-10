"use client";

import { SchedulerGridHeader } from "./scheduler/scheduler-grid-header";
import { WeeklySchedulerRow } from "./scheduler/weekly-scheduler-row";
import { SyncCampaignsDialog } from "./scheduler/sync-campaigns-dialog";
import { SCHEDULER_HOURS } from "./scheduler/scheduler-utils";
import { useSchedulerGrid } from "@/hooks/use-scheduler-grid";

export function SchedulerGrid() {
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

  return (
    <div className="space-y-6">
      <SyncCampaignsDialog
        open={syncModalOpen}
        isSyncing={isSyncing}
        completed={syncCompleted}
        items={syncProgressItems}
        onOpenChange={setSyncModalOpen}
      />

      <div className="overflow-x-auto rounded-xl border bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="min-w-[960px]">
          <SchedulerGridHeader
            clearWeeklyTemplate={clearWeeklyTemplate}
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
            />
          ))}
        </div>
      </div>
    </div>
  );
}