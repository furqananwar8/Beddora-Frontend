"use client";

import { useState, useMemo } from "react";

export type ScheduleMode = "WEEK";

export function useScheduleDates() {
  const [mode, setMode] = useState<ScheduleMode>("WEEK");

  const today = useMemo(() => {
    const now = new Date();
    const pst = new Date(now.toLocaleString("en-US", { timeZone: "America/Los_Angeles" }));
    return pst;
  }, []);

  const weekDates = useMemo(() => {
    const days = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
    return days;
  }, []);

  return {
    mode,
    setMode,
    weekDates,
    today,
  };
}