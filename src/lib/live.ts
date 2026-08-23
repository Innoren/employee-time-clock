import type { Worksite } from "@/lib/geo";
import type { ClockStatus } from "@/lib/punch";

export type LiveTrailPoint = {
  latitude: number;
  longitude: number;
  recordedAt: string;
};

export type LivePerson = {
  id: string;
  name: string;
  email: string;
  status: ClockStatus;
  since: string | null;
  note: string | null;
  latitude: number | null;
  longitude: number | null;
  accuracyMeters: number | null;
  distanceMeters: number | null;
  outsideSite: boolean;
  recordedAt: string | null;
  trail: LiveTrailPoint[];
};

export type LiveSnapshot = {
  timezone: string;
  worksite: Worksite | null;
  people: LivePerson[];
  onClock: number;
  activeStaff: number;
  weekHoursMs: number;
};
