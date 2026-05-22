"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDashboard, DayKey, WeekTemplate } from "@/lib/context/dashboard-context";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

const days: DayKey[] = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, "0"));
const weekKeys = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"] as const;

function formatDateISO(date: Date) {
  return date.toISOString().slice(0, 10);
}

function getWeekDayKey(dateString: string): DayKey {
  const date = new Date(`${dateString}T00:00:00`);
  const dayKey = weekKeys[date.getDay()];
  return dayKey as DayKey;
}

function createEmptyWeekTemplate(): WeekTemplate {
  return days.reduce((acc, day) => {
    acc[day] = Array(24).fill(false);
    return acc;
  }, {} as WeekTemplate);
}

function createZeroSchedule() {
  return Array(24).fill(false);
}

export function SchedulerGrid() {
  const { selectedCampaign, campaignSchedules, setWeekTemplate, setDateOverride, deleteDateOverride } = useDashboard();
  const [mode, setMode] = useState<"WEEK" | "DATE">("WEEK");

  const tomorrow = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() + 1);
    return date;
  }, []);
  const defaultDate = formatDateISO(tomorrow);
  const [selectedDate, setSelectedDate] = useState<string>(defaultDate);

  if (!selectedCampaign) return null;

  const campaignSchedule = campaignSchedules[selectedCampaign.id] || {
    weekTemplate: createEmptyWeekTemplate(),
    dateOverrides: {},
  };

  const weekTemplate = campaignSchedule.weekTemplate;
  const dateOverrides = campaignSchedule.dateOverrides || {};
  const selectedOverride = dateOverrides[selectedDate];
  const selectedWeekKey = getWeekDayKey(selectedDate);
  const inheritedSchedule = weekTemplate[selectedWeekKey] ?? createZeroSchedule();
  const activeDateSchedule = selectedOverride ?? inheritedSchedule;
  const isOverrideActive = Boolean(selectedOverride);
  const selectedDateLabel = new Date(`${selectedDate}T00:00:00`).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  const clearWeeklyTemplate = () => {
    setWeekTemplate(selectedCampaign.id, createEmptyWeekTemplate());
  };

  const toggleWeeklyCell = (dayIndex: number, hourIndex: number) => {
    const day = days[dayIndex];
    const currentDay = weekTemplate[day] ?? createZeroSchedule();
    const nextDay = [...currentDay];
    nextDay[hourIndex] = !nextDay[hourIndex];
    setWeekTemplate(selectedCampaign.id, {
      ...weekTemplate,
      [day]: nextDay,
    });
  };

  const toggleDateHour = (hourIndex: number) => {
    const nextSchedule = [...activeDateSchedule];
    nextSchedule[hourIndex] = !nextSchedule[hourIndex];
    setDateOverride(selectedCampaign.id, selectedDate, nextSchedule);
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <Tabs value={mode} onValueChange={(value) => setMode(value as "WEEK" | "DATE")} className="w-full md:w-auto">
            <TabsList className="bg-zinc-100 p-1 dark:bg-zinc-900">
              <TabsTrigger value="WEEK">Week Mode</TabsTrigger>
              <TabsTrigger value="DATE">Date Mode</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Schedule mode</p>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {mode === "WEEK"
                  ? "Edit the weekly template used for all future dates."
                  : "Choose a future date and override its hours individually."
                }
              </p>
            </div>
            {mode === "DATE" && (
              <div className="w-full max-w-sm">
                <Calendar value={selectedDate} min={defaultDate} onChange={setSelectedDate} />
              </div>
            )}
          </div>
        </div>

        {mode === "DATE" && (
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold text-zinc-900 dark:text-zinc-100">Selected date: {selectedDateLabel}</p>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  {isOverrideActive
                    ? "Showing a custom override for this date."
                    : `Showing weekly template for ${selectedWeekKey}. Any change creates a date override.`
                  }
                </p>
              </div>
              {isOverrideActive && (
                <Button variant="outline" size="sm" onClick={() => deleteDateOverride(selectedCampaign.id, selectedDate)}>
                  Reset to Weekly Template
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="overflow-x-auto rounded-xl border bg-white dark:bg-zinc-900 dark:border-zinc-800 animate-in fade-in slide-in-from-bottom-2 duration-500">
        <div className="min-w-200">
          <div className="grid grid-cols-[80px_repeat(24,1fr)] border-b dark:border-zinc-800">
            <div className="flex items-center justify-center border-r p-3 text-[10px] font-bold text-zinc-400 dark:border-zinc-800 uppercase tracking-widest">
              Day
            </div>
            <div className="col-span-24 relative flex items-center justify-center p-2 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
              <span>Hours (00 - 23)</span>
              {mode === "WEEK" ? (
                <button
                  onClick={clearWeeklyTemplate}
                  className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center space-x-1 text-[10px] font-bold text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 transition-colors uppercase tracking-wider"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Clear All</span>
                </button>
              ) : null}
            </div>
          </div>

          <div className="grid grid-cols-[80px_repeat(24,1fr)] border-b dark:border-zinc-800">
            <div className="border-r dark:border-zinc-800" />
            {hours.map((h) => (
              <div key={h} className="flex items-center justify-center p-2 text-[10px] font-bold text-zinc-400">
                {h}
              </div>
            ))}
          </div>

          {mode === "WEEK" ? (
            <> 
              <div className="grid grid-cols-[80px_repeat(24,1fr)] border-b dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/20">
                <div className="flex items-center justify-center border-r p-2 text-[10px] font-black text-zinc-400 dark:border-zinc-800 uppercase tracking-wider">
                  All Week
                </div>
                {hours.map((_, hIndex) => {
                  const isAllWeekActive = days.every((_, dIndex) => weekTemplate[days[dIndex]]?.[hIndex]);

                  const handleToggleAllWeek = () => {
                    const updated = { ...weekTemplate };
                    days.forEach((day) => {
                      const row = [...(updated[day] ?? createZeroSchedule())];
                      row[hIndex] = !isAllWeekActive;
                      updated[day] = row;
                    });
                    setWeekTemplate(selectedCampaign.id, updated);
                  };

                  return (
                    <div key={`switch-${hIndex}`} className="flex items-center justify-center p-2 border-r last:border-0 dark:border-zinc-800">
                      <Switch size="sm" checked={isAllWeekActive} onCheckedChange={handleToggleAllWeek} className="scale-90" />
                    </div>
                  );
                })}
              </div>

              {days.map((day, dIndex) => (
                <div key={`${selectedCampaign.id}-${day}`} className="grid grid-cols-[80px_repeat(24,1fr)] border-b last:border-0 dark:border-zinc-800">
                  <div className="flex items-center justify-center border-r p-4 text-xs font-black text-zinc-900 dark:text-zinc-100 dark:border-zinc-800">
                    {day}
                  </div>
                  {hours.map((_, hIndex) => {
                    const isActive = weekTemplate[day]?.[hIndex] ?? false;
                    return (
                      <div
                        key={`${selectedCampaign.id}-${dIndex}-${hIndex}`}
                        onClick={() => toggleWeeklyCell(dIndex, hIndex)}
                        className={cn(
                          "h-12 border-r last:border-0 dark:border-zinc-800 cursor-pointer transition-all duration-75 active:scale-95",
                          isActive
                            ? "bg-indigo-600 hover:bg-indigo-700 shadow-inner"
                            : "bg-white hover:bg-zinc-50 dark:bg-zinc-900 dark:hover:bg-zinc-800"
                        )}
                      />
                    );
                  })}
                </div>
              ))}
            </>
          ) : (
            <div className="grid grid-cols-[80px_repeat(24,1fr)] border-b last:border-0 dark:border-zinc-800">
              <div className="flex items-center justify-center border-r p-4 text-xs font-black text-zinc-900 dark:text-zinc-100 dark:border-zinc-800">
                {selectedDateLabel}
              </div>
              {hours.map((_, hIndex) => (
                <div
                  key={`${selectedCampaign.id}-date-${hIndex}`}
                  onClick={() => toggleDateHour(hIndex)}
                  className={cn(
                    "h-12 border-r last:border-0 dark:border-zinc-800 cursor-pointer transition-all duration-75 active:scale-95",
                    activeDateSchedule[hIndex]
                      ? "bg-indigo-600 hover:bg-indigo-700 shadow-inner"
                      : "bg-white hover:bg-zinc-50 dark:bg-zinc-900 dark:hover:bg-zinc-800"
                  )}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
