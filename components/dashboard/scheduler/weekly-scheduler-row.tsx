"use client";

import { DayKey } from "@/lib/context/dashboard-context";
import { cn } from "@/lib/utils";

type WeeklySchedulerRowProps = {
  day: DayKey;
  dIndex: number;
  hours: string[];
  isActiveHour: (day: DayKey, hIndex: number) => boolean;
  toggleFullDay: (dIndex: number) => void;
  toggleWeeklyCell: (dIndex: number, hIndex: number) => void;
  campaignId: string;
  disabled?: boolean;
};

export function WeeklySchedulerRow({
  day,
  dIndex,
  hours,
  isActiveHour,
  toggleFullDay,
  toggleWeeklyCell,
  campaignId,
}: WeeklySchedulerRowProps) {
  const allActive = hours.every((_, hIndex) => isActiveHour(day, hIndex));
  const someActive = hours.some((_, hIndex) => isActiveHour(day, hIndex));

  return (
    <div className="grid grid-cols-[80px_repeat(24,1fr)] border-b last:border-b-0 dark:border-zinc-800">
      <div className="flex items-center justify-center border-r p-2 dark:border-zinc-800">
        <button
          onClick={() => toggleFullDay(dIndex)}
          className={cn(
            "text-xs font-bold uppercase tracking-wider transition-colors",
            allActive
              ? "text-indigo-600"
              : someActive
                ? "text-indigo-400"
                : "text-zinc-400 hover:text-zinc-600",
          )}
        >
          {day}
        </button>
      </div>

      {hours.map((_, hIndex) => {
        const active = isActiveHour(day, hIndex);

        return (
          <button
            key={`${campaignId}-${day}-${hIndex}`}
            onClick={() => toggleWeeklyCell(dIndex, hIndex)}
            className={cn(
              "h-10 border-r last:border-r-0 transition-colors dark:border-zinc-800",
              active
                ? "bg-indigo-500 hover:bg-indigo-600"
                : "bg-transparent hover:bg-indigo-100 dark:hover:bg-indigo-900/20",
            )}
            title={`${day} ${hIndex}:00 - ${hIndex + 1}:00`}
          />
        );
      })}
    </div>
  );
}