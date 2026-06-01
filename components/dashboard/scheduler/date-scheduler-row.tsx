"use client";

import { cn } from "@/lib/utils";

type DateSchedulerRowProps = {
  selectedDateLabel: string;
  hours: string[];
  activeDateSchedule: boolean[];
  toggleDateHour: (hIndex: number) => void;
  campaignId: string;
  isPastHour: (dateISO: string, hourIndex: number) => boolean;
  activeSelectedDate: string;
};

export function DateSchedulerRow({
  selectedDateLabel,
  hours,
  activeDateSchedule,
  toggleDateHour,
  campaignId,
  isPastHour,
  activeSelectedDate,
}: DateSchedulerRowProps) {
  return (
    <div className="grid grid-cols-[80px_repeat(24,1fr)] border-b last:border-0 dark:border-zinc-800">
      <div className="flex items-center justify-center border-r p-4 text-xs font-black text-zinc-900 dark:text-zinc-100 dark:border-zinc-800">
        {selectedDateLabel}
      </div>
      {hours.map((_, hIndex) => {
        const pastHour = isPastHour(activeSelectedDate, hIndex);

        return (
          <div
            key={`${campaignId}-date-${hIndex}`}
            onClick={() => !pastHour && toggleDateHour(hIndex)}
            className={cn(
              "h-12 border-r last:border-0 dark:border-zinc-800 transition-all duration-75",
              pastHour
                ? "bg-zinc-200 dark:bg-zinc-700 cursor-not-allowed opacity-50"
                : "cursor-pointer active:scale-95",
              !pastHour &&
                (activeDateSchedule[hIndex]
                  ? "bg-indigo-600 hover:bg-indigo-700 shadow-inner"
                  : "bg-white hover:bg-zinc-50 dark:bg-zinc-900 dark:hover:bg-zinc-800"),
            )}
          />
        );
      })}
    </div>
  );
}
