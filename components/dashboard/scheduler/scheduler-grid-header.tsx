"use client";

import { useRef } from "react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { DayKey, WeekTemplate } from "@/lib/context/dashboard-context";

type SchedulerGridHeaderProps = {
  clearWeeklyTemplate: () => void;
  hours: string[];
  days: DayKey[];
  weekTemplate: WeekTemplate;
  setWeekTemplate: (campaignId: string, weekStart: string, template: WeekTemplate) => void;
  campaignId: string;
};

export function SchedulerGridHeader({
  clearWeeklyTemplate,
  hours,
  days,
  weekTemplate,
  setWeekTemplate,
  campaignId,
}: SchedulerGridHeaderProps) {
  const templateRef = useRef(weekTemplate);
  templateRef.current = weekTemplate;

  const createZeroSchedule = () => Array(24).fill(false);

  return (
    <>
      <div className="grid grid-cols-[80px_repeat(24,1fr)] border-b dark:border-zinc-800">
        <div className="flex items-center justify-center border-r p-3 text-[10px] font-bold text-zinc-400 dark:border-zinc-800 uppercase tracking-widest">
          Day
        </div>
        <div className="col-span-24 relative flex items-center justify-between p-2 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
          <span>Hours (00 - 23)</span>
          <Button variant="destructive" size="sm" onClick={clearWeeklyTemplate}>
            <X className="h-4 w-4 mr-1" />
            Clear All
          </Button>
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

      <div className="grid grid-cols-[80px_repeat(24,1fr)] border-b dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/20">
        <div className="flex items-center justify-center border-r p-2 text-[10px] font-black text-zinc-400 dark:border-zinc-800 uppercase tracking-wider">
          All Week
        </div>

        {hours.map((_, hIndex) => {
          const isAllWeekActive = days.every(
            (day) => templateRef.current[day]?.[hIndex] ?? false
          );

          const handleToggleAllWeek = () => {
            const current = templateRef.current;
            const updated: WeekTemplate = { ...current };

            days.forEach((day) => {
              const row = [...(updated[day] ?? createZeroSchedule())];
              row[hIndex] = !isAllWeekActive;
              updated[day] = row;
            });

            setWeekTemplate(campaignId, "default", updated);
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
    </>
  );
}