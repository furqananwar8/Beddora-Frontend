"use client";

import { SchedulerHeader } from "./scheduler/scheduler-header";
import { SchedulerGridHeader } from "./scheduler/scheduler-grid-header";
import { WeeklySchedulerRow } from "./scheduler/weekly-scheduler-row";
import { DateSchedulerRow } from "./scheduler/date-scheduler-row";
import { SchedulerPagination } from "./scheduler/scheduler-pagination";
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

    mode,
    setMode,
    weekRangeLabel,
    activeWeekStart,
    defaultDate,
    setWeekStart,
    activeSelectedDate,
    setSelectedDate,
    weekDates,
    weekStartDate,

    weekTemplate,
    dateOverrides,
    selectedDateLabel,
    activeDateSchedule,
    allScheduledDates,
    clearWeeklyTemplate,
    toggleWeeklyCell,
    toggleFullDay,
    toggleDateHour,
    setWeekTemplate,
    setDateOverride,
    isPastHour,

    previousScheduledWeekStart,
    nextScheduledWeekStart,
    previousScheduledDate,
    nextScheduledDate,
    navigateToPreviousScheduledWeek,
    navigateToNextScheduledWeek,
    navigateToPreviousScheduledDate,
    navigateToNextScheduledDate,
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

      <div className="grid gap-6 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <SchedulerHeader
          mode={mode}
          setMode={setMode}
          weekRangeLabel={weekRangeLabel}
          activeWeekStart={activeWeekStart}
          defaultDate={defaultDate}
          setWeekStart={setWeekStart}
          activeSelectedDate={activeSelectedDate}
          setSelectedDate={setSelectedDate}
        />
      </div>

      {/* <SyncedCampaignsList campaigns={syncedCampaigns} /> */}

      <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 overflow-x-auto rounded-xl border bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="min-w-200">
          <SchedulerGridHeader
            mode={mode}
            clearWeeklyTemplate={clearWeeklyTemplate}
            hours={SCHEDULER_HOURS}
            days={days}
            weekTemplate={weekTemplate}
            setWeekTemplate={setWeekTemplate}
            dateOverrides={dateOverrides}
            setDateOverride={setDateOverride}
            campaignId={selectedCampaign.id}
            weekStartDate={weekStartDate}
            isPastHour={isPastHour}
          />

          {mode === "WEEK" ? (
            <>
              {days.map((day, dIndex) => (
                <WeeklySchedulerRow
                  key={`${selectedCampaign.id}-${day}`}
                  day={day}
                  dIndex={dIndex}
                  weekDate={weekDates[dIndex]}
                  hours={SCHEDULER_HOURS}
                  isActiveHour={(dayKey, hIndex) =>
                    weekTemplate[dayKey]?.[hIndex] ?? false
                  }
                  toggleFullDay={toggleFullDay}
                  toggleWeeklyCell={toggleWeeklyCell}
                  campaignId={selectedCampaign.id}
                  isPastHour={isPastHour}
                  weekStartDate={weekStartDate}
                />
              ))}
            </>
          ) : (
            <DateSchedulerRow
              selectedDateLabel={selectedDateLabel}
              hours={SCHEDULER_HOURS}
              activeDateSchedule={activeDateSchedule}
              toggleDateHour={toggleDateHour}
              campaignId={selectedCampaign.id}
              isPastHour={isPastHour}
              activeSelectedDate={activeSelectedDate}
            />
          )}
        </div>
      </div>

      <SchedulerPagination
        mode={mode}
        weekStartDate={weekStartDate}
        activeSelectedDate={activeSelectedDate}
        allScheduledDatesCount={allScheduledDates.length}
        previousScheduledWeekStart={previousScheduledWeekStart}
        nextScheduledWeekStart={nextScheduledWeekStart}
        previousScheduledDate={previousScheduledDate}
        nextScheduledDate={nextScheduledDate}
        navigateToPreviousScheduledWeek={navigateToPreviousScheduledWeek}
        navigateToNextScheduledWeek={navigateToNextScheduledWeek}
        navigateToPreviousScheduledDate={navigateToPreviousScheduledDate}
        navigateToNextScheduledDate={navigateToNextScheduledDate}
      />
    </div>
  );
}