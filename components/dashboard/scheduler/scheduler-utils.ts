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

// Map DayKey to dayOfWeek number (0=Sun, 1=Mon, ..., 6=Sat)
export const DAY_KEY_TO_NUMBER: Record<DayKey, number> = {
  SUN: 0,
  MON: 1,
  TUE: 2,
  WED: 3,
  THU: 4,
  FRI: 5,
  SAT: 6,
};

export const NUMBER_TO_DAY_KEY: Record<number, DayKey> = {
  0: "SUN",
  1: "MON",
  2: "TUE",
  3: "WED",
  4: "THU",
  5: "FRI",
  6: "SAT",
};

export const SCHEDULER_HOURS: string[] = Array.from({ length: 24 }, (_, i) =>
  String(i),
);

// ─────────────────────────────────────────────
// ALL SCHEDULER TIMES ARE PACIFIC TIME (PST/PDT)
// No conversion. Grid = PST. Backend = PST.
// ─────────────────────────────────────────────

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

// ── API Payload Types ──

export interface TimeSlot {
  startTime: string;
  endTime: string;
}

export interface WeeklySchedulePayload {
  dayOfWeek: number; // 0=Sun, 1=Mon, ..., 6=Sat
  timeSlots: TimeSlot[];
  action: "ENABLED" | "PAUSED";
}

// ── Build API payload from week template ──

export function buildSchedulesFromWeekTemplate(
  weekTemplate: WeekTemplate,
  action: "ENABLED" | "PAUSED" = "ENABLED",
): WeeklySchedulePayload[] {
  const schedules: WeeklySchedulePayload[] = [];

  for (const day of SCHEDULER_DAYS) {
    const hours = weekTemplate[day];
    if (!hours || !hours.some(Boolean)) continue;

    const slots: TimeSlot[] = [];
    let start: number | null = null;

    for (let i = 0; i <= 24; i++) {
      if (i < 24 && hours[i]) {
        if (start === null) start = i;
      } else {
        if (start !== null) {
          slots.push({
            startTime: `${String(start).padStart(2, "0")}:00`,
            endTime: `${String(i).padStart(2, "0")}:00`,
          });
          start = null;
        }
      }
    }

    if (slots.length > 0) {
      schedules.push({
        dayOfWeek: DAY_KEY_TO_NUMBER[day],
        timeSlots: slots,
        action,
      });
    }
  }

  return schedules;
}

// ── Build week template from backend schedules ──

export interface BackendSchedule {
  dayOfWeek: number;
  timeSlots: TimeSlot[];
  action: "ENABLED" | "PAUSED";
}

export function buildWeeklyTemplateFromSchedules(
  schedules: BackendSchedule[],
): WeekTemplate {
  const template = createEmptyWeekTemplate();

  for (const schedule of schedules) {
    const dayKey = NUMBER_TO_DAY_KEY[schedule.dayOfWeek];
    if (!dayKey) continue;

    for (const slot of schedule.timeSlots) {
      const startHour = parseInt(slot.startTime.split(":")[0], 10);
      const endHour = parseInt(slot.endTime.split(":")[0], 10);

      for (let h = startHour; h < endHour; h++) {
        if (h >= 0 && h < 24) {
          template[dayKey][h] = true;
        }
      }
    }
  }

  return template;
}

// ── Legacy helpers (keep for compatibility if needed) ──

export function formatDateISO(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function formatYmd(date: Date): string {
  return date.toISOString().slice(0, 10).replace(/-/g, "");
}

export function formatTime(date: Date): string {
  const h = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");
  return `${h}:${min}`;
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