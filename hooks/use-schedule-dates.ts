"use client";

import { useState, useMemo } from "react";
import { format, startOfWeek, endOfWeek, addDays } from "date-fns";
import {
  formatDateISO,
  backendDateToISO,
  getScheduleDate,
} from "@/components/dashboard/scheduler/scheduler-utils";

export type ScheduleMode = "WEEK" | "DATE";

interface UseScheduleDatesOptions {
  selectedCampaign?: any;
}

export function useScheduleDates({ selectedCampaign }: UseScheduleDatesOptions) {
  const [mode, setMode] = useState<ScheduleMode>("WEEK");

  const tomorrow = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() + 1);
    return date;
  }, []);
  const defaultDate = formatDateISO(tomorrow);

  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const today = useMemo(() => new Date(), []);
  const defaultWeekStart = useMemo(
    () => formatDateISO(startOfWeek(today, { weekStartsOn: 1 })),
    [today],
  );
  const [weekStart, setWeekStart] = useState<string | null>(null);

  const firstBackendScheduleDate = useMemo(() => {
    return (
      selectedCampaign?.schedules
        ?.map((schedule: any) => backendDateToISO(getScheduleDate(schedule)))
        .find((date: any): date is string => Boolean(date)) ?? null
    );
  }, [selectedCampaign?.schedules]);

  const firstBackendWeekStart = firstBackendScheduleDate
    ? formatDateISO(
        startOfWeek(new Date(`${firstBackendScheduleDate}T00:00:00`), {
          weekStartsOn: 1,
        }),
      )
    : null;

  const activeWeekStart =
    weekStart ?? firstBackendWeekStart ?? defaultWeekStart;
  const activeSelectedDate =
    selectedDate ?? firstBackendScheduleDate ?? defaultDate;

  const weekStartDate = useMemo(
    () => new Date(`${activeWeekStart}T00:00:00`),
    [activeWeekStart],
  );
  const weekEndDate = useMemo(
    () => endOfWeek(weekStartDate, { weekStartsOn: 1 }),
    [weekStartDate],
  );
  const weekRangeLabel = useMemo(
    () =>
      `${format(weekStartDate, "MMM d")} - ${format(weekEndDate, "MMM d")}`,
    [weekStartDate, weekEndDate],
  );

  const allScheduledDates = useMemo(() => {
    const schedules = selectedCampaign?.schedules;
    if (!schedules) return [];

    const dates = schedules
      .map((s: any) => backendDateToISO(getScheduleDate(s)))
      .filter((date: any): date is string => Boolean(date));

    return Array.from(new Set(dates)).sort();
  }, [selectedCampaign?.schedules]);

  const previousScheduledWeekStart = useMemo(() => {
    if (allScheduledDates.length === 0) return null;

    const targetDateStr = allScheduledDates
      .slice()
      .reverse()
      .find((dStr) => {
        const d = new Date(`${dStr}T00:00:00`);
        return d < weekStartDate;
      });

    if (!targetDateStr) return null;

    return formatDateISO(
      startOfWeek(new Date(`${targetDateStr}T00:00:00`), { weekStartsOn: 1 }),
    );
  }, [allScheduledDates, weekStartDate]);

  const nextScheduledWeekStart = useMemo(() => {
    if (allScheduledDates.length === 0) return null;

    const targetDateStr = allScheduledDates.find((dStr) => {
      const d = new Date(`${dStr}T00:00:00`);
      return d > weekEndDate;
    });

    if (!targetDateStr) return null;

    return formatDateISO(
      startOfWeek(new Date(`${targetDateStr}T00:00:00`), { weekStartsOn: 1 }),
    );
  }, [allScheduledDates, weekEndDate]);

  const previousScheduledDate = useMemo((): any | null => {
    if (allScheduledDates.length === 0) return null;

    const currentD = new Date(`${activeSelectedDate}T00:00:00`);

    const found = allScheduledDates
      .slice()
      .reverse()
      .find((dStr) => {
        const d = new Date(`${dStr}T00:00:00`);
        return d < currentD;
      });

    return found ?? null;
  }, [allScheduledDates, activeSelectedDate]);

  const nextScheduledDate = useMemo((): any | null => {
    if (allScheduledDates.length === 0) return null;

    const currentD = new Date(`${activeSelectedDate}T00:00:00`);

    const found = allScheduledDates.find((dStr) => {
      const d = new Date(`${dStr}T00:00:00`);
      return d > currentD;
    });

    return found ?? null;
  }, [allScheduledDates, activeSelectedDate]);



  const weekDates = useMemo(() => {
    const base = new Date(`${activeWeekStart}T00:00:00`);
    return Array.from({ length: 7 }, (_, i) => format(addDays(base, i), "MMM d"));
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

  return {
    mode,
    setMode,
    defaultDate,
    activeWeekStart,
    activeSelectedDate,
    setWeekStart,
    setSelectedDate,
    weekRangeLabel,
    weekStartDate,
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