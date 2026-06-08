import { DateOverrides, WeekTemplate } from "@/lib/context/dashboard-context";

export type DayKey = "MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT" | "SUN";

export const SCHEDULER_DAYS: DayKey[] = [
  "MON",
  "TUE",
  "WED",
  "THU",
  "FRI",
  "SAT",
  "SUN",
];

export const SCHEDULER_HOURS: string[] = Array.from({ length: 24 }, (_, i) =>
  String(i),
);

// Country code → IANA timezone
const COUNTRY_TIMEZONES: Record<string, string> = {
  US: "America/New_York",
  CA: "America/Toronto",
  MX: "America/Mexico_City",
};

export function getTimezoneFromCountry(countryCode: string): string {
  return COUNTRY_TIMEZONES[countryCode] || "UTC";
}

export function formatDateISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function formatYmd(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}${m}${d}`;
}

export function formatTime(date: Date): string {
  const h = String(date.getUTCHours()).padStart(2, "0");
  const min = String(date.getUTCMinutes()).padStart(2, "0");
  return `${h}:${min}`;
}

export function backendDateToISO(scheduleDate: string | null): string | null {
  if (!scheduleDate || scheduleDate.length !== 8) return null;
  const y = scheduleDate.slice(0, 4);
  const m = scheduleDate.slice(4, 6);
  const d = scheduleDate.slice(6, 8);
  return `${y}-${m}-${d}`;
}

export function getScheduleDate(schedule: any): string | null {
  return schedule?.scheduleDate ?? null;
}

export function getWeekDayKey(dateISO: string): DayKey {
  const date = new Date(`${dateISO}T00:00:00`);
  const dayIndex = date.getDay();
  const map: DayKey[] = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
  return map[dayIndex];
}

export function createEmptyWeekTemplate(): WeekTemplate {
  const template = {} as WeekTemplate;
  SCHEDULER_DAYS.forEach((day) => {
    template[day] = Array(24).fill(false);
  });
  return template;
}

export function createZeroSchedule(): boolean[] {
  return Array(24).fill(false);
}

export function buildWeeklyTemplateFromSchedules(
  schedules: any[],
  activeWeekStart: string,
): WeekTemplate {
  const template = createEmptyWeekTemplate();
  const weekBase = new Date(`${activeWeekStart}T00:00:00`);

  schedules.forEach((schedule) => {
    const dateISO = backendDateToISO(getScheduleDate(schedule));
    if (!dateISO) return;

    const scheduleDate = new Date(`${dateISO}T00:00:00`);
    const diffDays = Math.floor(
      (scheduleDate.getTime() - weekBase.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (diffDays < 0 || diffDays >= 7) return;

    const dayKey = SCHEDULER_DAYS[diffDays];
    if (!dayKey) return;

    schedule.timeSlots?.forEach((slot: any) => {
      const startHour = parseInt(slot.startTime?.split(":")[0] ?? "0", 10);
      const endHour = parseInt(slot.endTime?.split(":")[0] ?? "0", 10);

      for (let h = startHour; h < endHour; h++) {
        if (h >= 0 && h < 24) {
          template[dayKey][h] = true;
        }
      }
    });
  });

  return template;
}

export function buildDateOverridesFromSchedules(
  schedules: any[],
): DateOverrides {
  const overrides: DateOverrides = {};

  schedules.forEach((schedule) => {
    const dateISO = backendDateToISO(getScheduleDate(schedule));
    if (!dateISO) return;

    const hours = Array(24).fill(false);
    schedule.timeSlots?.forEach((slot: any) => {
      const startHour = parseInt(slot.startTime?.split(":")[0] ?? "0", 10);
      const endHour = parseInt(slot.endTime?.split(":")[0] ?? "0", 10);

      for (let h = startHour; h < endHour; h++) {
        if (h >= 0 && h < 24) {
          hours[h] = true;
        }
      }
    });

    overrides[dateISO] = hours;
  });

  return overrides;
}

/**
 * Convert local time to UTC using country code
 */
function convertToUtc(
  dateStr: string, // "2026-06-10"
  timeStr: string,  // "14:00"
  countryCode: string,
): { scheduleDate: string; startTime: string } {
  const timezone = getTimezoneFromCountry(countryCode);
  
  // Parse local date/time
  const [year, month, day] = dateStr.split("-").map(Number);
  const [hour, minute] = timeStr.split(":").map(Number);
  
  // Create date string for the specific timezone
  const localDateTime = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00`;
  
  // Convert to UTC
  const utcDate = new Date(
    new Date(localDateTime).toLocaleString("en-US", { timeZone: timezone })
  );
  
  // Adjust for timezone offset
  const localDate = new Date(localDateTime);
  const offsetMs = localDate.getTime() - utcDate.getTime();
  const actualUtc = new Date(localDate.getTime() - offsetMs);

  return {
    scheduleDate: formatYmd(actualUtc),
    startTime: formatTime(actualUtc),
  };
}

export function buildSchedulesFromState(
  existingSchedules: any[] | undefined,
  weekTemplate: WeekTemplate,
  dateOverrides: DateOverrides,
  campaignId: number,
  weekStart: string,
  action: "ENABLED" | "PAUSED" = "ENABLED",
  countryCode: string = "US",
) {
  const schedules: any[] = [];
  const baseDate = new Date(`${weekStart}T00:00:00`);

  const getTimeSlots = (hours: boolean[], dateStr: string) => {
    const slots: { startTime: string; endTime: string }[] = [];
    let start: number | null = null;

    for (let i = 0; i <= 24; i++) {
      if (i < 24 && hours[i]) {
        if (start === null) start = i;
      } else {
        if (start !== null) {
          const startUtc = convertToUtc(dateStr, `${String(start).padStart(2, "0")}:00`, countryCode);
          const endUtc = convertToUtc(dateStr, `${String(i).padStart(2, "0")}:00`, countryCode);
          
          slots.push({
            startTime: startUtc.startTime,
            endTime: endUtc.startTime,
          });
          start = null;
        }
      }
    }
    return slots;
  };

  // Week template → schedules
  SCHEDULER_DAYS.forEach((day, index) => {
    const hours = weekTemplate[day] || [];
    const date = new Date(baseDate);
    date.setDate(date.getDate() + index);
    const dateStr = formatDateISO(date);
    const slots = getTimeSlots(hours, dateStr);
    
    if (slots.length > 0) {
      schedules.push({
        scheduleDate: convertToUtc(dateStr, "00:00", countryCode).scheduleDate,
        timeSlots: slots,
        action,
      });
    }
  });

  // Date overrides → replace week template for that date
  Object.entries(dateOverrides).forEach(([dateISO, hours]) => {
    const slots = getTimeSlots(hours, dateISO);
    const ymd = convertToUtc(dateISO, "00:00", countryCode).scheduleDate;
    const existingIndex = schedules.findIndex((s) => s.scheduleDate === ymd);

    if (existingIndex >= 0) {
      if (slots.length === 0) {
        schedules.splice(existingIndex, 1);
      } else {
        schedules[existingIndex] = {
          scheduleDate: ymd,
          timeSlots: slots,
          action,
        };
      }
    } else if (slots.length > 0) {
      schedules.push({ scheduleDate: ymd, timeSlots: slots, action });
    }
  });

  // Merge existing schedules that weren't replaced
  if (existingSchedules) {
    existingSchedules.forEach((existing) => {
      const dateISO = backendDateToISO(existing.scheduleDate ?? null);
      if (!dateISO) return;
      const ymd = dateISO.replace(/-/g, "");
      if (!schedules.some((s) => s.scheduleDate === ymd)) {
        schedules.push(existing);
      }
    });
  }

  return schedules;
}

export function extractCampaignsFromSseMessage(msg: any): any[] {
  if (msg?.campaigns && Array.isArray(msg.campaigns)) {
    return msg.campaigns;
  }
  if (msg?.data?.campaigns && Array.isArray(msg.data.campaigns)) {
    return msg.data.campaigns;
  }
  return [];
}