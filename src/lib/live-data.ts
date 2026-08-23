import { desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { businesses, employees, locationPings, punches } from "@/db/schema";
import { personName } from "@/lib/company";
import { worksiteFromBusiness } from "@/lib/geo";
import type { LivePerson, LiveSnapshot } from "@/lib/live";
import { clockStatus } from "@/lib/punch";
import { lastPunch, pairShifts } from "@/lib/time";

export async function loadLiveSnapshot(businessId: string): Promise<LiveSnapshot> {
  const db = getDb();
  const [[business], team, punchRows, pingRows] = await Promise.all([
    db.select().from(businesses).where(eq(businesses.id, businessId)).limit(1),
    db.select().from(employees).where(eq(employees.businessId, businessId)),
    db
      .select()
      .from(punches)
      .where(eq(punches.businessId, businessId))
      .orderBy(desc(punches.occurredAt))
      .limit(200),
    db
      .select()
      .from(locationPings)
      .where(eq(locationPings.businessId, businessId))
      .orderBy(desc(locationPings.recordedAt))
      .limit(800),
  ]);

  const trails = new Map<string, LivePerson["trail"]>();
  const latestPing = new Map<string, (typeof pingRows)[number]>();
  for (const ping of pingRows) {
    const point = {
      latitude: ping.latitude,
      longitude: ping.longitude,
      recordedAt: ping.recordedAt.toISOString(),
    };
    const trail = trails.get(ping.employeeId) ?? [];
    if (trail.length < 50) trail.push(point);
    trails.set(ping.employeeId, trail);
    if (!latestPing.has(ping.employeeId)) latestPing.set(ping.employeeId, ping);
  }

  const now = new Date();
  const people: LivePerson[] = team
    .filter((person) => person.active)
    .map((person) => {
      const theirs = punchRows.filter((punch) => punch.employeeId === person.id);
      const latest = lastPunch(theirs);
      const status = clockStatus(latest?.type);
      const ping = latestPing.get(person.id) ?? null;
      const startedAt = currentShiftStart(theirs);
      const trail = (trails.get(person.id) ?? [])
        .slice()
        .reverse()
        .filter((point) =>
          startedAt ? new Date(point.recordedAt) >= startedAt : true,
        );
      return {
        id: person.id,
        name: personName(person.firstName, person.lastName),
        email: person.email,
        status,
        since: latest?.occurredAt.toISOString() ?? null,
        note: latest?.note ?? null,
        latitude: ping?.latitude ?? null,
        longitude: ping?.longitude ?? null,
        accuracyMeters: ping?.accuracyMeters ?? null,
        distanceMeters: ping?.distanceMeters ?? null,
        outsideSite: ping?.outsideSite ?? false,
        recordedAt: ping?.recordedAt.toISOString() ?? null,
        trail,
      };
    })
    .filter((person) => person.status !== "off");

  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const weekPunches = punchRows.filter((punch) => punch.occurredAt >= weekAgo);
  const weekHoursMs = team.reduce((sum, person) => {
    const theirs = weekPunches.filter((punch) => punch.employeeId === person.id);
    return sum + pairShifts(theirs, now).reduce((inner, shift) => inner + shift.durationMs, 0);
  }, 0);

  return {
    timezone: business?.timezone ?? "America/New_York",
    worksite: worksiteFromBusiness(business ?? null),
    people,
    onClock: people.length,
    activeStaff: team.filter((person) => person.active).length,
    weekHoursMs,
  };
}

function currentShiftStart(
  punchesDesc: { type: string; occurredAt: Date }[],
): Date | null {
  for (const punch of punchesDesc) {
    if (punch.type === "out") return null;
    if (punch.type === "in" || punch.type === "travel_start") {
      return punch.occurredAt;
    }
  }
  return null;
}
