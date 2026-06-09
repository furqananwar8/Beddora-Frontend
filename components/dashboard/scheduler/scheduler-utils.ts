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

// ─────────────────────────────────────────────
// ALL SCHEDULER TIMES ARE PACIFIC TIME (PST/PDT)
// No conversion. Grid = PST. Backend = PST.
// ─────────────────────────────────────────────

export function formatDateISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function formatYmd(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}${m}${d}`;
}

export function formatTime(date: Date): string {
  const h = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");
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

// ── Helpers: pure date-string arithmetic (no timezone traps) ──

function addDays(ymd: string, days: number): string {
  const [y, m, d] = ymd.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  date.setUTCDate(date.getUTCDate() + days);
  const yy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(date.getUTCDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

function dayDiff(date1: string, date2: string): number {
  const [y1, m1, d1] = date1.split("-").map(Number);
  const [y2, m2, d2] = date2.split("-").map(Number);
  const dt1 = Date.UTC(y1, m1 - 1, d1);
  const dt2 = Date.UTC(y2, m2 - 1, d2);
  return Math.floor((dt1 - dt2) / (1000 * 60 * 60 * 24));
}

// ── Build grid from backend schedules ──

export function buildWeeklyTemplateFromSchedules(
  schedules: any[],
  activeWeekStart: string,
): WeekTemplate {
  const template = createEmptyWeekTemplate();

  schedules.forEach((schedule) => {
    const dateISO = backendDateToISO(getScheduleDate(schedule));
    if (!dateISO) return;

    const diffDays = dayDiff(dateISO, activeWeekStart);
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

// ── Build backend payload from grid state ──

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

  const getTimeSlots = (hours: boolean[]) => {
    const slots: { startTime: string; endTime: string }[] = [];
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
    return slots;
  };

  // Week template → schedules (PST, no conversion)
  SCHEDULER_DAYS.forEach((day, index) => {
    const hours = weekTemplate[day] || [];
    const slots = getTimeSlots(hours);
    if (slots.length > 0) {
      const dateISO = addDays(weekStart, index);
      const ymd = dateISO.replace(/-/g, "");

      schedules.push({
        scheduleDate: ymd,
        timeSlots: slots,
        action,
      });
    }
  });

  // Date overrides → replace or add
  Object.entries(dateOverrides).forEach(([dateISO, hours]) => {
    const slots = getTimeSlots(hours);
    const ymd = dateISO.replace(/-/g, "");
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