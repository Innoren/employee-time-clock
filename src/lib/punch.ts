export const PUNCH_TYPES = [
  "in",
  "out",
  "lunch_out",
  "lunch_in",
  "travel_start",
  "travel_end",
] as const;
export type PunchType = (typeof PUNCH_TYPES)[number];
export type ClockStatus = "off" | "working" | "lunch" | "travel";

export function isPunchType(value: string): value is PunchType {
  return (PUNCH_TYPES as readonly string[]).includes(value);
}

export function isTravelPunch(type: string) {
  return type === "travel_start" || type === "travel_end";
}

export function clockStatus(lastType?: string | null): ClockStatus {
  if (lastType === "lunch_out") return "lunch";
  if (lastType === "travel_start") return "travel";
  if (lastType === "in" || lastType === "lunch_in" || lastType === "travel_end") {
    return "working";
  }
  return "off";
}

export function punchLabel(type: string) {
  switch (type) {
    case "in":
      return "Clock in";
    case "out":
      return "Clock out";
    case "lunch_out":
      return "Lunch out";
    case "lunch_in":
      return "Lunch in";
    case "travel_start":
      return "Start travel";
    case "travel_end":
      return "End travel";
    default:
      return type;
  }
}

export function statusLabel(status: ClockStatus) {
  switch (status) {
    case "working":
      return "On the clock";
    case "lunch":
      return "On lunch";
    case "travel":
      return "Traveling";
    default:
      return "Clocked out";
  }
}

export function allowedPunches(status: ClockStatus): PunchType[] {
  switch (status) {
    case "off":
      return ["in", "travel_start"];
    case "working":
      return ["travel_start", "lunch_out", "out"];
    case "travel":
      return ["travel_end", "out"];
    case "lunch":
      return ["lunch_in", "out"];
  }
}
