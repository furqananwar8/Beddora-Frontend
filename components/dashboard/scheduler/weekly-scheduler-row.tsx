"use client";

import { cn } from "@/lib/utils";
import { DayKey } from "@/lib/context/dashboard-context";
import { formatDateISO } from "./scheduler-utils";

type WeeklySchedulerRowProps = {
  day: DayKey;
  dIndex: number;
  weekDate: string;
  hours: string[];
  isActiveHour: (day: DayKey, hIndex: number) => boolean;
  toggleFullDay: (dIndex: number) => void;
  toggleWeeklyCell: (dIndex: number, hIndex: number) => void;
  campaignId: string;
  isPastHour: (dateISO: string, hourIndex: number) => boolean;
  weekStartDate: string;
};

export function WeeklySchedulerRow({
  day,
  dIndex,
  weekDate,
  hours,
  isActiveHour,
  toggleFullDay,
  toggleWeeklyCell,
  campaignId,
  isPastHour,
  weekStartDate,
}: WeeklySchedulerRowProps) {
  // Pure string math — no Date objects, no timezone shifts
  const dateISO = addDaysISO(weekStartDate, dIndex);

  return (
    <div
      key={`${campaignId}-${day}`}
      className="grid grid-cols-[80px_repeat(24,1fr)] border-b last:border-0 dark:border-zinc-800"
    >
      <div className="flex flex-col items-center justify-center border-r p-4 text-xs font-black text-zinc-900 dark:text-zinc-100 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <div
            className="text-sm cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors font-bold"
            onClick={() => toggleFullDay(dIndex)}
          >
            {day}
          </div>
        </div>
        <div className="text-[11px] font-normal text-zinc-500 dark:text-zinc-400">
          {weekDate}
        </div>
      </div>
      {hours.map((_, hIndex) => {
        const isActive = isActiveHour(day, hIndex);
        const pastHour = isPastHour(dateISO, hIndex);

        return (
          <div
            key={`${campaignId}-${dIndex}-${hIndex}`}
            onClick={() => !pastHour && toggleWeeklyCell(dIndex, hIndex)}
           className={cn(
              "h-17 border-r last:border-0 dark:border-zinc-800",
              pastHour
                ? "bg-zinc-200 dark:bg-zinc-700 cursor-not-allowed opacity-50"
                : "cursor-pointer active:scale-95",
              !pastHour &&
                (isActive
                  ? "bg-indigo-600 hover:bg-indigo-700 shadow-inner"
                  : "bg-white hover:bg-zinc-50 dark:bg-zinc-900 dark:hover:bg-zinc-800"),
            )}
          />
        );
      })}
    </div>
  );
}

// Pure ISO string date math — no Date objects, no timezone issues
function addDaysISO(isoDate: string, days: number): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  date.setUTCDate(date.getUTCDate() + days);
  const yy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(date.getUTCDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}