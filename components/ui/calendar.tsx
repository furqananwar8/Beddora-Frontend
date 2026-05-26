"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function formatIsoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function getMonthLabel(date: Date) {
  return new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(date);
}

function buildMonthGrid(currentMonth: Date) {
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1);
  const startDay = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const grid: Array<Date | null> = [];
  const firstDateIndex = (startDay + 6) % 7; // shift so Monday is first

  for (let i = 0; i < firstDateIndex; i += 1) {
    grid.push(null);
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    grid.push(new Date(year, month, day));
  }

  while (grid.length % 7 !== 0) {
    grid.push(null);
  }

  return grid;
}

interface CalendarProps {
  value: string;
  min?: string;
  onChange: (value: string) => void;
  className?: string;
}

export function Calendar({ value, min, onChange, className }: CalendarProps) {
  const [currentMonth, setCurrentMonth] = React.useState(() => {
    if (value) {
      const parsed = new Date(value + "T00:00:00");
      if (!Number.isNaN(parsed.getTime())) {
        return new Date(parsed.getFullYear(), parsed.getMonth(), 1);
      }
    }
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });

  React.useEffect(() => {
    if (!value) return;
    const selected = new Date(value + "T00:00:00");
    if (!Number.isNaN(selected.getTime())) {
      setCurrentMonth(new Date(selected.getFullYear(), selected.getMonth(), 1));
    }
  }, [value]);

  const minDate = min ? new Date(min + "T00:00:00") : null;
  const today = new Date();
  const grid = React.useMemo(() => buildMonthGrid(currentMonth), [currentMonth]);

  const handleSelect = (date: Date) => {
    const iso = formatIsoDate(date);
    if (minDate && date < minDate) return;
    onChange(iso);
  };

  const isSelectable = (date: Date) => {
    if (minDate && date < minDate) return false;
    return true;
  };

  return (
    <div className={cn("space-y-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950", className)}>
      <div className="flex items-center justify-between">
        <Button variant="outline" size="icon" onClick={() => setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{getMonthLabel(currentMonth)}</div>
        <Button variant="outline" size="icon" onClick={() => setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      <div className="grid grid-cols-7 gap-2 text-[10px] uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((label) => (
          <div key={label} className="text-center font-semibold">
            {label}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-2">
        {grid.map((date, index) => {
          if (!date) {
            return <div key={index} className="h-10 rounded-lg bg-zinc-100 dark:bg-zinc-900" />;
          }

          const dateIso = formatIsoDate(date);
          const isSelected = dateIso === value;
          const isToday = formatIsoDate(today) === dateIso;
          const selectable = isSelectable(date);

          return (
            <button
              key={dateIso}
              type="button"
              onClick={() => handleSelect(date)}
              disabled={!selectable}
              className={cn(
                "h-10 rounded-lg text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50",
                !selectable && "cursor-not-allowed bg-zinc-100 text-zinc-400 dark:bg-zinc-900 dark:text-zinc-600",
                selectable && "bg-zinc-50 text-zinc-900 hover:bg-indigo-50 hover:text-indigo-600 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800",
                isSelected && "bg-indigo-600 text-white shadow-sm",
                !isSelected && isToday && "ring-1 ring-indigo-500/40"
              )}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}
