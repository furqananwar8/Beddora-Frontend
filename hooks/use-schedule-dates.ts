"use client";

import { useState, useMemo } from "react";
import {
  formatDateISO,
  backendDateToISO,
  getScheduleDate,
} from "@/components/dashboard/scheduler/scheduler-utils";

export type ScheduleMode = "WEEK" | "DATE";

interface UseScheduleDatesOptions {
  selectedCampaign?: any;
}

// ── Pure string-based date helpers (no Date objects, no timezone issues) ──

function parseISO(iso: string): { y: number; m: number; d: number } {
  const [y, m, d] = iso.split("-").map(Number);
  return { y, m: m - 1, d };
}

function toISO(y: number, m: number, d: number): string {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function addDaysISO(isoDate: string, days: number): string {
  // Guard: if someone passes a Date object or non-ISO string, catch it early
  if (!isoDate || !/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) {
    console.error("addDaysISO received non-ISO value:", isoDate);
    return "";
  }
  const [y, m, d] = isoDate.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  date.setUTCDate(date.getUTCDate() + days);
  const yy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(date.getUTCDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

function dayOfWeekISO(iso: string): number {
  const { y, m, d } = parseISO(iso);
  return new Date(Date.UTC(y, m, d)).getUTCDay();
}

function startOfWeekISO(iso: string, weekStartsOn: 0 | 1 = 1): string {
  const dow = dayOfWeekISO(iso);
  const diff = (dow - weekStartsOn + 7) % 7;
  return addDaysISO(iso, -diff);
}

function endOfWeekISO(iso: string, weekStartsOn: 0 | 1 = 1): string {
  return addDaysISO(startOfWeekISO(iso, weekStartsOn), 6);
}

export function formatDateISOFromParts(y: number, m: number, d: number): string {
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

export function formatMonthDay(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${monthNames[m - 1]} ${d}`;
}

function compareISO(a: string, b: string): number {
  return a.localeCompare(b);
}

function isBeforeISO(a: string, b: string): boolean {
  return compareISO(a, b) < 0;
}

function isAfterISO(a: string, b: string): boolean {
  return compareISO(a, b) > 0;
}

// ────────────────────────────────────────────────────────────────────────────

export function useScheduleDates({ selectedCampaign }: UseScheduleDatesOptions) {
  
  const [mode, setMode] = useState<ScheduleMode>("WEEK");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [weekStart, setWeekStart] = useState<string | null>(null);

  /** Returns the current date as ISO string in PST/PDT wall-clock time */
  function getPSTDateISO(): string {
    const now = new Date();
    const y = Number(now.toLocaleString("en-US", { timeZone: "America/Los_Angeles", year: "numeric" }));
    const m = Number(now.toLocaleString("en-US", { timeZone: "America/Los_Angeles", month: "numeric" }));
    const d = Number(now.toLocaleString("en-US", { timeZone: "America/Los_Angeles", day: "numeric" }));
    return toISO(y, m - 1, d);
  }

  const today = useMemo((): string => {
    return getPSTDateISO();
  }, []);

  const tomorrow = useMemo((): string => {
    return addDaysISO(getPSTDateISO(), 1);
  }, []);

  const defaultDate = tomorrow;

  const defaultWeekStart = useMemo(
    (): string => startOfWeekISO(today, 1),
    [today],
  );

  const firstBackendScheduleDate = useMemo((): string | null => {
    const schedules: any[] = selectedCampaign?.schedules;
    if (!schedules || schedules.length === 0) return null;

    for (const schedule of schedules) {
      const date = backendDateToISO(getScheduleDate(schedule));
      if (date) return date;
    }
    return null;
  }, [selectedCampaign?.schedules]);

  const firstBackendWeekStart = firstBackendScheduleDate
    ? startOfWeekISO(firstBackendScheduleDate, 1)
    : null;

  const activeWeekStart: string =
    weekStart ?? firstBackendWeekStart ?? defaultWeekStart;
  const activeSelectedDate: string =
    selectedDate ?? firstBackendScheduleDate ?? defaultDate;

  const weekStartISO = activeWeekStart;
  const weekEndISO = useMemo(
    (): string => endOfWeekISO(weekStartISO, 1),
    [weekStartISO],
  );
  const weekRangeLabel = useMemo(
    (): string => `${formatMonthDay(weekStartISO)} - ${formatMonthDay(weekEndISO)}`,
    [weekStartISO, weekEndISO],
  );

  const allScheduledDates = useMemo((): string[] => {
    const schedules: any[] = selectedCampaign?.schedules;
    if (!schedules) return [];

    const dates: string[] = [];
    for (const s of schedules) {
      const date = backendDateToISO(getScheduleDate(s));
      if (date) dates.push(date);
    }

    return Array.from(new Set(dates)).sort();
  }, [selectedCampaign?.schedules]);

  const previousScheduledWeekStart = useMemo((): string | null => {
    if (allScheduledDates.length === 0) return null;

    for (let i = allScheduledDates.length - 1; i >= 0; i--) {
      const dStr = allScheduledDates[i];
      if (isBeforeISO(dStr, weekStartISO)) {
        return startOfWeekISO(dStr, 1);
      }
    }
    return null;
  }, [allScheduledDates, weekStartISO]);

  const nextScheduledWeekStart = useMemo((): string | null => {
    if (allScheduledDates.length === 0) return null;

    for (const dStr of allScheduledDates) {
      if (isAfterISO(dStr, weekEndISO)) {
        return startOfWeekISO(dStr, 1);
      }
    }
    return null;
  }, [allScheduledDates, weekEndISO]);

  const previousScheduledDate = useMemo((): string | null => {
    if (allScheduledDates.length === 0) return null;

    for (let i = allScheduledDates.length - 1; i >= 0; i--) {
      const dStr = allScheduledDates[i];
      if (isBeforeISO(dStr, activeSelectedDate)) {
        return dStr;
      }
    }
    return null;
  }, [allScheduledDates, activeSelectedDate]);

  const nextScheduledDate = useMemo((): string | null => {
    if (allScheduledDates.length === 0) return null;

    for (const dStr of allScheduledDates) {
      if (isAfterISO(dStr, activeSelectedDate)) {
        return dStr;
      }
    }
    return null;
  }, [allScheduledDates, activeSelectedDate]);

  const weekDates = useMemo((): string[] => {
    return Array.from({ length: 7 }, (_, i) =>
      formatMonthDay(addDaysISO(activeWeekStart, i)),
    );
  }, [activeWeekStart]);

  const navigateToPreviousScheduledWeek = () => {
    if (previousScheduledWeekStart) setWeekStart(previousScheduledWeekStart);
  };

  const navigateToNextScheduledWeek = () => {
    if (nextScheduledWeekStart) setWeekStart(nextScheduledWeekStart);
  };

  const navigateToPreviousScheduledDate = () => {
    if (previousScheduledDate) setSelectedDate(previousScheduledDate);
  };

  const navigateToNextScheduledDate = () => {
    if (nextScheduledDate) setSelectedDate(nextScheduledDate);
  };
  console.log({
  today: getPSTDateISO(),
  tomorrow: addDaysISO(getPSTDateISO(), 1),
  selectedDate,
  activeSelectedDate,
  defaultDate,
});

  return {
    mode,
    setMode,
    defaultDate,
    activeWeekStart,
    activeSelectedDate,
    setWeekStart,
    setSelectedDate,
    weekRangeLabel,
    weekStartDate: weekStartISO,
    weekDates,
    allScheduledDates,
    previousScheduledWeekStart,
    nextScheduledWeekStart,
    previousScheduledDate,
    nextScheduledDate,
    navigateToPreviousScheduledWeek,
    navigateToNextScheduledWeek,
    navigateToPreviousScheduledDate,
    navigateToNextScheduledDate,
  };
}