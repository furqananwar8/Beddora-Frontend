import { format, addDays, differenceInCalendarDays } from "date-fns";
import type { DayKey, DateOverrides, WeekTemplate } from "@/lib/context/dashboard-context";
import type { BackendSchedule, BackendTimeSlot } from "@/api/services/campaigns.api";
import type { SyncedCampaign } from "./synced-campaigns-list";

export const SCHEDULER_DAYS: DayKey[] = [
  "MON",
  "TUE",
  "WED",
  "THU",
  "FRI",
  "SAT",
  "SUN",
];

export const SCHEDULER_HOURS = Array.from({ length: 24 }, (_, i) =>
  i.toString().padStart(2, "0"),
);

const weekKeys = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"] as const;

type BackendTimeSlotLike = BackendTimeSlot & {
  start?: string;
  end?: string;
  start_time?: string;
  end_time?: string;
};

type BackendScheduleLike = BackendSchedule & {
  schedule_date?: string | null;
  time_slots?: BackendTimeSlot[];
  slots?: BackendTimeSlot[];
};

export function formatDateISO(date: Date) {
  return format(date, "yyyy-MM-dd");
}

export function backendDateToISO(dateString: string | null): string | null {
  if (!dateString) return null;

  if (/^\d{8}$/.test(dateString)) {
    return `${dateString.slice(0, 4)}-${dateString.slice(4, 6)}-${dateString.slice(6, 8)}`;
  }

  if (/^\d{4}-\d{2}-\d{2}/.test(dateString)) {
    return dateString.slice(0, 10);
  }

  return `${dateString.slice(0, 4)}-${dateString.slice(4, 6)}-${dateString.slice(6, 8)}`;
}

export function getWeekDayKey(dateString: string): DayKey {
  const date = new Date(`${dateString}T00:00:00`);
  const dayKey = weekKeys[date.getDay()];
  return dayKey as DayKey;
}

function normalizeTimeSlot(timeSlot: BackendTimeSlot): BackendTimeSlot {
  const slot = timeSlot as BackendTimeSlotLike;

  return {
    startTime: slot.startTime ?? slot.start_time ?? slot.start ?? "",
    endTime: slot.endTime ?? slot.end_time ?? slot.end ?? "",
  };
}

function parseTimeSlotHour(time: string | number | null | undefined) {
  if (typeof time === "number") {
    return time >= 0 && time <= 24 ? time : null;
  }

  if (!time) return null;

  const hour = Number.parseInt(String(time).slice(0, 2), 10);
  if (Number.isNaN(hour) || hour < 0 || hour > 24) return null;
  return hour;
}

export function getScheduleDate(schedule: BackendSchedule) {
  const normalized = schedule as BackendScheduleLike;
  return normalized.scheduleDate ?? normalized.schedule_date ?? null;
}

export function getScheduleTimeSlots(schedule: BackendSchedule) {
  const normalized = schedule as BackendScheduleLike;
  return (
    normalized.timeSlots ??
    normalized.time_slots ??
    normalized.slots ??
    []
  );
}

function timeSlotsToBooleanSchedule(timeSlots: BackendTimeSlot[]) {
  const schedule = Array(24).fill(false);

  timeSlots.forEach((timeSlot) => {
    const { startTime, endTime } = normalizeTimeSlot(timeSlot);
    const startHour = parseTimeSlotHour(startTime);
    const rawEndHour = parseTimeSlotHour(endTime);
    if (startHour === null || rawEndHour === null) return;

    const endHour =
      rawEndHour <= startHour && rawEndHour === 0 ? 24 : rawEndHour;

    for (let hour = startHour; hour < endHour; hour += 1) {
      const normalizedHour = hour % 24;
      if (normalizedHour >= 0) schedule[normalizedHour] = true;
    }
  });

  return schedule;
}

export function createEmptyWeekTemplate(): WeekTemplate {
  return SCHEDULER_DAYS.reduce((acc, day) => {
    acc[day] = Array(24).fill(false);
    return acc;
  }, {} as WeekTemplate);
}

export function createZeroSchedule() {
  return Array(24).fill(false);
}

function booleanScheduleToTimeSlots(schedule: boolean[]) {
  const slots: BackendTimeSlot[] = [];
  let start: number | null = null;
  for (let h = 0; h <= 24; h += 1) {
    const active = h < 24 ? Boolean(schedule[h]) : false;
    if (active && start === null) start = h;
    if (!active && start !== null) {
      const end = h;
      const startStr = String(start).padStart(2, "0") + ":00";
      const endStr = String(end).padStart(2, "0") + ":00";
      slots.push({ startTime: startStr, endTime: endStr });
      start = null;
    }
  }
  return slots;
}

function isoToBackendDate(iso: string) {
  return iso.replace(/-/g, "");
}

export function buildDateOverridesFromSchedules(
  schedules: BackendSchedule[],
): DateOverrides {
  return schedules.reduce((acc, schedule) => {
    const scheduleISO = backendDateToISO(getScheduleDate(schedule));
    if (!scheduleISO) return acc;
    const slotSchedule = timeSlotsToBooleanSchedule(
      getScheduleTimeSlots(schedule),
    );
    const current = acc[scheduleISO] ?? createZeroSchedule();
    acc[scheduleISO] = current.map(
      (active, hour) => active || slotSchedule[hour],
    );
    return acc;
  }, {} as DateOverrides);
}

export function buildWeeklyTemplateFromSchedules(
  schedules: BackendSchedule[],
  weekStartISO: string,
): WeekTemplate {
  const template = createEmptyWeekTemplate();
  const weekStartDate = new Date(`${weekStartISO}T00:00:00`);

  schedules.forEach((schedule) => {
    const scheduleDate = getScheduleDate(schedule);
    const slotSchedule = timeSlotsToBooleanSchedule(
      getScheduleTimeSlots(schedule),
    );

    if (scheduleDate) {
      const scheduleISO = backendDateToISO(scheduleDate);
      if (!scheduleISO) return;
      const scheduledDate = new Date(`${scheduleISO}T00:00:00`);
      const dayIndex = differenceInCalendarDays(scheduledDate, weekStartDate);
      if (dayIndex < 0 || dayIndex >= SCHEDULER_DAYS.length) return;
      const dayKey = SCHEDULER_DAYS[dayIndex];
      template[dayKey] = template[dayKey].map(
        (active, hour) => active || slotSchedule[hour],
      );
    } else {
      SCHEDULER_DAYS.forEach((day) => {
        template[day] = template[day].map(
          (active, hour) => active || slotSchedule[hour],
        );
      });
    }
  });

  return template;
}

export function buildSchedulesFromState(
  existingSchedules: BackendSchedule[] | undefined,
  weekTemplate: WeekTemplate,
  dateOverrides: DateOverrides,
  campaignIdNum: number,
  weekStartISO?: string,
) {
  const result: BackendSchedule[] = [];

  if (existingSchedules) {
    result.push(...existingSchedules.map((s) => ({ ...s })));
  }

  if (weekStartISO) {
    const base = new Date(`${weekStartISO}T00:00:00`);
    SCHEDULER_DAYS.forEach((d, di) => {
      const daySchedule = weekTemplate[d] ?? createZeroSchedule();
      if (!daySchedule.some(Boolean)) return;
      const iso = formatDateISO(addDays(base, di));
      if (Object.hasOwn(dateOverrides, iso)) return;
      result.push({
        id: -1,
        campaignId: campaignIdNum,
        scheduleDate: isoToBackendDate(iso),
        endDate: null,
        timeSlots: booleanScheduleToTimeSlots(daySchedule),
        timezone: "UTC",
        action: "PAUSE",
        bidAdjustment: null,
        status: "DRAFT",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    });
  } else {
    const unionSchedule = Array(24).fill(false);
    SCHEDULER_DAYS.forEach((d) => {
      (weekTemplate[d] || []).forEach((val, h) => {
        if (val) unionSchedule[h] = true;
      });
    });
    if (unionSchedule.some(Boolean)) {
      result.push({
        id: -1,
        campaignId: campaignIdNum,
        scheduleDate: null,
        endDate: null,
        timeSlots: booleanScheduleToTimeSlots(unionSchedule),
        timezone: "UTC",
        action: "PAUSE",
        bidAdjustment: null,
        status: "DRAFT",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
  }

  Object.keys(dateOverrides).forEach((iso) => {
    const bools = dateOverrides[iso];
    if (!bools || !bools.some(Boolean)) return;
    result.push({
      id: -Date.now(),
      campaignId: campaignIdNum,
      scheduleDate: isoToBackendDate(iso),
      endDate: null,
      timeSlots: booleanScheduleToTimeSlots(bools),
      timezone: "UTC",
      action: "PAUSE",
      bidAdjustment: null,
      status: "DRAFT",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  });

  return result;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readString(value: unknown) {
  return typeof value === "string" ? value : undefined;
}

function readCampaignId(value: unknown) {
  if (typeof value === "number" || typeof value === "string") {
    return String(value);
  }

  return undefined;
}

function toSyncedCampaign(value: unknown): SyncedCampaign | null {
  if (!isRecord(value)) return null;

  const id = readCampaignId(value.campaignId ?? value.id);
  if (!id) return null;

  const schedules = Array.isArray(value.schedules) ? value.schedules : null;

  return {
    id,
    name: readString(value.name) ?? `Campaign ${id}`,
    state: readString(value.state) ?? "unknown",
    scheduleCount: schedules ? schedules.length : null,
  };
}

export function extractCampaignsFromSseMessage(message: unknown) {
  if (!isRecord(message)) return [];

  const candidates = [
    message.campaigns,
    message.fetchedCampaigns,
    message.syncedCampaigns,
    message.campaign,
  ];

  if (isRecord(message.data)) {
    candidates.push(message.data.campaigns, message.data.campaign);
  } else {
    candidates.push(message.data);
  }

  return candidates.flatMap((candidate) => {
    if (Array.isArray(candidate)) {
      return candidate
        .map(toSyncedCampaign)
        .filter((campaign): campaign is SyncedCampaign => Boolean(campaign));
    }

    const campaign = toSyncedCampaign(candidate);
    return campaign ? [campaign] : [];
  });
}
