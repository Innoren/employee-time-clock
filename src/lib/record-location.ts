import { desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { businesses, locationPings, punches } from "@/db/schema";
import { clockStatus } from "@/lib/punch";
import { lastPunch } from "@/lib/time";
import {
  distanceFromWorksite,
  isOutsideWorksite,
  worksiteFromBusiness,
} from "@/lib/geo";
import type { SessionUser } from "@/lib/session";

export type LocationPingInput = {
  latitude: number;
  longitude: number;
  accuracyMeters?: number;
};

export async function recordLocationPing(
  session: Pick<SessionUser, "employeeId" | "businessId">,
  input: LocationPingInput,
) {
  if (
    !Number.isFinite(input.latitude) ||
    !Number.isFinite(input.longitude) ||
    Math.abs(input.latitude) > 90 ||
    Math.abs(input.longitude) > 180
  ) {
    return { error: "Invalid location." };
  }

  const db = getDb();
  const [[business], recent] = await Promise.all([
    db
      .select()
      .from(businesses)
      .where(eq(businesses.id, session.businessId))
      .limit(1),
    db
      .select()
      .from(punches)
      .where(eq(punches.employeeId, session.employeeId))
      .orderBy(desc(punches.occurredAt))
      .limit(1),
  ]);

  if (clockStatus(lastPunch(recent)?.type) === "off") {
    return { stopped: true as const };
  }

  const site = worksiteFromBusiness(business ?? null);
  const distanceMeters = site
    ? distanceFromWorksite(
        { latitude: input.latitude, longitude: input.longitude },
        site,
      )
    : null;

  try {
    await db.insert(locationPings).values({
      employeeId: session.employeeId,
      businessId: session.businessId,
      latitude: input.latitude,
      longitude: input.longitude,
      accuracyMeters: input.accuracyMeters,
      distanceMeters,
      outsideSite:
        site && distanceMeters != null
          ? isOutsideWorksite(distanceMeters, site)
          : false,
      recordedAt: new Date(),
    });
  } catch {
    return { error: "Could not save location." };
  }

  return { ok: true as const };
}
