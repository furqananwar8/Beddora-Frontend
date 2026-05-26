"use client";

import { cn } from "@/lib/utils";

type DateSchedulerRowProps = {
  selectedDateLabel: string;
  hours: string[];
  activeDateSchedule: boolean[];
  toggleDateHour: (hIndex: number) => void;
  campaignId: string;
};

export function DateSchedulerRow({
  selectedDateLabel,
  hours,
  activeDateSchedule,
  toggleDateHour,
  campaignId,
}: DateSchedulerRowProps) {
  return (
    <div className="grid grid-cols-[80px_repeat(24,1fr)] border-b last:border-0 dark:border-zinc-800">
      <div className="flex items-center justify-center border-r p-4 text-xs font-black text-zinc-900 dark:text-zinc-100 dark:border-zinc-800">
        {selectedDateLabel}
      </div>
      {hours.map((_, hIndex) => (
        <div
          key={`${campaignId}-date-${hIndex}`}
          onClick={() => toggleDateHour(hIndex)}
          className={cn(
            "h-12 border-r last:border-0 dark:border-zinc-800 cursor-pointer transition-all duration-75 active:scale-95",
            activeDateSchedule[hIndex]
              ? "bg-indigo-600 hover:bg-indigo-700 shadow-inner"
              : "bg-white hover:bg-zinc-50 dark:bg-zinc-900 dark:hover:bg-zinc-800",
          )}
        />
      ))}
    </div>
  );
}
