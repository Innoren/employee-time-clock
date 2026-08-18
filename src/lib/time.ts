import type { Punch } from "@/db/schema";

function formatInZone(
  date: Date,
  timeZone: string,
  options: Intl.DateTimeFormatOptions,
) {
  try {
    if (Number.isNaN(date.getTime())) return "—";
    return new Intl.DateTimeFormat("en-US", { timeZone, ...options }).format(date);
  } catch {
    try {
      return new Intl.DateTimeFormat("en-US", options).format(date);
    } catch {
      return "—";
    }
  }
}

export function formatClock(date: Date, timeZone: string) {
  return formatInZone(date, timeZone, {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
}

export function formatDate(date: Date, timeZone: string) {
  return formatInZone(date, timeZone, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export function formatShortTime(date: Date, timeZone: string) {
  return formatInZone(date, timeZone, {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function formatHours(ms: number) {
  if (!Number.isFinite(ms)) return "0m";
  const totalMinutes = Math.max(0, Math.round(ms / 60000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

export type Shift = {
  clockIn: Date;
  clockOut: Date | null;
  durationMs: number;
  lunchMs: number;
  travelMs: number;
  open: boolean;
};

function isValidDate(value: Date | null | undefined): value is Date {
  return value instanceof Date && !Number.isNaN(value.getTime());
}

export function pairShifts(punches: Punch[], now = new Date()): Shift[] {
  const ordered = punches
    .filter((punch) => isValidDate(punch.occurredAt))
    .sort((a, b) => a.occurredAt.getTime() - b.occurredAt.getTime());
  const shifts: Shift[] = [];
  let shiftStart: Date | null = null;
  let paidStart: Date | null = null;
  let lunchStart: Date | null = null;
  let travelStart: Date | null = null;
  let paidMs = 0;
  let lunchMs = 0;
  let travelMs = 0;

  function closePaid(at: Date) {
    if (paidStart) {
      paidMs += at.getTime() - paidStart.getTime();
      paidStart = null;
    }
  }

  function closeLunch(at: Date) {
    if (lunchStart) {
      lunchMs += at.getTime() - lunchStart.getTime();
      lunchStart = null;
    }
  }

  function closeTravel(at: Date) {
    if (travelStart) {
      travelMs += at.getTime() - travelStart.getTime();
      travelStart = null;
    }
  }

  function openShift(at: Date, traveling: boolean) {
    shiftStart = at;
    paidStart = at;
    if (traveling) travelStart = at;
  }

  function flushShift(clockOut: Date | null, open: boolean) {
    if (!shiftStart) return;
    shifts.push({
      clockIn: shiftStart,
      clockOut,
      durationMs: paidMs,
      lunchMs,
      travelMs,
      open,
    });
    shiftStart = null;
    paidStart = null;
    lunchStart = null;
    travelStart = null;
    paidMs = 0;
    lunchMs = 0;
    travelMs = 0;
  }

  for (const punch of ordered) {
    if (punch.type === "in") {
      if (shiftStart) {
        closePaid(punch.occurredAt);
        closeLunch(punch.occurredAt);
        closeTravel(punch.occurredAt);
        flushShift(punch.occurredAt, false);
      }
      openShift(punch.occurredAt, punch.travelTime);
    } else if (punch.type === "travel_start") {
      if (!shiftStart) {
        openShift(punch.occurredAt, true);
      } else if (!travelStart) {
        travelStart = punch.occurredAt;
      }
    } else if (punch.type === "travel_end" && shiftStart) {
      closeTravel(punch.occurredAt);
    } else if (punch.type === "lunch_out" && shiftStart) {
      closePaid(punch.occurredAt);
      closeTravel(punch.occurredAt);
      lunchStart = punch.occurredAt;
    } else if (punch.type === "lunch_in" && shiftStart) {
      closeLunch(punch.occurredAt);
      paidStart = punch.occurredAt;
    } else if (punch.type === "out" && shiftStart) {
      closePaid(punch.occurredAt);
      closeLunch(punch.occurredAt);
      closeTravel(punch.occurredAt);
      flushShift(punch.occurredAt, false);
    }
  }

  if (shiftStart) {
    closePaid(now);
    closeLunch(now);
    closeTravel(now);
    flushShift(null, true);
  }

  return shifts;
}

export function lastPunch(punches: Punch[]) {
  return punches
    .filter((punch) => isValidDate(punch.occurredAt))
    .sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime())[0];
}

export function formatDateTime(date: Date, timeZone: string) {
  return formatInZone(date, timeZone, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
