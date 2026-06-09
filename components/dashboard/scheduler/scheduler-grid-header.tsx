"use client";

import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { DayKey, WeekTemplate, DateOverrides } from "@/lib/context/dashboard-context";

type SchedulerGridHeaderProps = {
  mode: "WEEK" | "DATE";
  clearWeeklyTemplate: () => void;
  hours: string[];
  days: DayKey[];
  weekTemplate: WeekTemplate;
  setWeekTemplate: (
    campaignId: string,
    weekStart: string,
    weekTemplate: WeekTemplate,
  ) => void;
  dateOverrides: DateOverrides;
  setDateOverride: (
    campaignId: string,
    weekStart: string,
    date: string,
    schedule: boolean[],
  ) => void;
  campaignId: string;
  weekStartDate: Date;
  isPastHour: (dateISO: string, hourIndex: number) => boolean;
};

export function SchedulerGridHeader({
  mode,
  clearWeeklyTemplate,
  hours,
  days,
  weekTemplate,
  setWeekTemplate,
  dateOverrides,
  setDateOverride,
  campaignId,
  weekStartDate,
  isPastHour,
}: SchedulerGridHeaderProps) {
  const createZeroSchedule = () => Array(24).fill(false);
  const formatDateISO = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };
  const addDays = (date: Date, daysCount: number) => {
    const result = new Date(date);
    result.setDate(result.getDate() + daysCount);
    return result;
  };

  return (
    <>
      <div className="grid grid-cols-[80px_repeat(24,1fr)] border-b dark:border-zinc-800">
        <div className="flex items-center justify-center border-r p-3 text-[10px] font-bold text-zinc-400 dark:border-zinc-800 uppercase tracking-widest">
          Day
        </div>
        <div className="col-span-24 relative flex items-center justify-between p-2 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
          <span>Hours (00 - 23)</span>
          {mode === "WEEK" ? (
            <Button variant="destructive" onClick={clearWeeklyTemplate}>
              <X />
              Clear All
            </Button>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-[80px_repeat(24,1fr)] border-b dark:border-zinc-800">
        <div className="border-r dark:border-zinc-800" />
        {hours.map((h) => (
          <div
            key={h}
            className="flex items-center justify-center p-2 text-[10px] font-bold text-zinc-400"
          >
            {h}
          </div>
        ))}
      </div>

    
      {mode === "WEEK" && (
        <div className="grid grid-cols-[80px_repeat(24,1fr)] border-b dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/20">
          <div className="flex items-center justify-center border-r p-2 text-[10px] font-black text-zinc-400 dark:border-zinc-800 uppercase tracking-wider">
            All Week
          </div>

          {hours.map((_, hIndex) => {
            const isAllWeekActive = days.every(
              (_, dIndex) => weekTemplate[days[dIndex]]?.[hIndex]
            );

            const handleToggleAllWeek = () => {
              try {
                const updated = { ...weekTemplate };

                // Update week template - only toggle enabled hours
                days.forEach((day, dIndex) => {
                  const dateISO = formatDateISO(addDays(weekStartDate, dIndex));
                  const isHourDisabled = isPastHour(dateISO, hIndex);

                  if (!isHourDisabled) {
                    const row = [...(updated[day] ?? createZeroSchedule())];
                    row[hIndex] = !isAllWeekActive;
                    updated[day] = row;
                  }
                });

                const weekStart = formatDateISO(weekStartDate);
                setWeekTemplate(campaignId, weekStart, updated);

                // Update only overridden dates
                const affectedDates = days.map((day, di) => {
                  const dateISO = formatDateISO(addDays(weekStartDate, di));
                  const isHourDisabled = isPastHour(dateISO, hIndex);

                  if (Object.hasOwn(dateOverrides, dateISO) && !isHourDisabled) {
                    const row = [
                      ...(dateOverrides[dateISO] ??
                        updated[day] ??
                        createZeroSchedule()),
                    ];

                    row[hIndex] = !isAllWeekActive;
                    setDateOverride(campaignId, weekStart, dateISO, row);
                  }

                  return dateISO;
                });

                console.log("All week toggled", {
                  newActive: !isAllWeekActive,
                  affectedDates,
                  actionEnabled: !isAllWeekActive,
                });
              } catch (e) {
                console.log("SchedulerGrid - toggle all-week error", e);
              }
            };

            return (
              <div
                key={`switch-${hIndex}`}
                className="flex items-center justify-center p-2 border-r last:border-0 dark:border-zinc-800"
              >
                <Switch
                  size="sm"
                  checked={isAllWeekActive}
                  onCheckedChange={handleToggleAllWeek}
                  className="scale-90 cursor-pointer"
                />
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
