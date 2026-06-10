"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";

type SchedulerPaginationProps = {
  mode: "WEEK" | "DATE";
  weekStartDate: string;
  activeSelectedDate: string;
  allScheduledDatesCount: number;
  previousScheduledWeekStart: string | null;
  nextScheduledWeekStart: string | null;
  previousScheduledDate: string | null;
  nextScheduledDate: string | null;
  navigateToPreviousScheduledWeek: () => void;
  navigateToNextScheduledWeek: () => void;
  navigateToPreviousScheduledDate: () => void;
  navigateToNextScheduledDate: () => void;
};

export function SchedulerPagination({
  mode,
  weekStartDate,
  activeSelectedDate,
  allScheduledDatesCount,
  previousScheduledWeekStart,
  nextScheduledWeekStart,
  previousScheduledDate,
  nextScheduledDate,
  navigateToPreviousScheduledWeek,
  navigateToNextScheduledWeek,
  navigateToPreviousScheduledDate,
  navigateToNextScheduledDate,
}: SchedulerPaginationProps) {
  return (
    <div className="flex flex-col items-center justify-between gap-4 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm sm:flex-row dark:border-zinc-800 dark:bg-zinc-950">
      <div className="text-center sm:text-left">
        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 font-bold">
          {mode === "WEEK" ? "Week Navigation" : "Date Navigation"}
        </p>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          {mode === "WEEK"
            ? `Showing week of ${format(weekStartDate, "MMM d, yyyy")}. ${
                allScheduledDatesCount
              } scheduled date(s) found in backend.`
            : `Showing date ${format(new Date(`${activeSelectedDate}T00:00:00`), "MMM d, yyyy")}. ${
                allScheduledDatesCount
              } scheduled date(s) found in backend.`}
        </p>
      </div>

      <div className="flex items-center gap-2">
        {mode === "WEEK" ? (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={navigateToPreviousScheduledWeek}
              disabled={!previousScheduledWeekStart}
              className="cursor-pointer gap-1 text-xs font-semibold disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4" />
              Prev Scheduled Week
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={navigateToNextScheduledWeek}
              disabled={!nextScheduledWeekStart}
              className="cursor-pointer gap-1 text-xs font-semibold disabled:cursor-not-allowed"
            >
              Next Scheduled Week
              <ChevronRight className="h-4 w-4" />
            </Button>
          </>
        ) : (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={navigateToPreviousScheduledDate}
              disabled={!previousScheduledDate}
              className="cursor-pointer gap-1 text-xs font-semibold disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4" />
              Prev Scheduled Date
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={navigateToNextScheduledDate}
              disabled={!nextScheduledDate}
              className="cursor-pointer gap-1 text-xs font-semibold disabled:cursor-not-allowed"
            >
              Next Scheduled Date
              <ChevronRight className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
