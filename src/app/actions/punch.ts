"use server";

import { desc, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { getDb } from "@/db";
import { businesses, punches } from "@/db/schema";
import { requireActiveEmployee } from "@/app/actions/auth";
import { allowedPunches, clockStatus, isPunchType, type PunchType } from "@/lib/punch";
import { lastPunch } from "@/lib/time";
import { tryAction } from "@/lib/safe";
import {
  distanceFromWorksite,
  isOutsideWorksite,
  worksiteFromBusiness,
} from "@/lib/geo";

export type PunchInput = {
  type: PunchType;
  note?: string;
  clientReportedAt?: string;
  latitude?: number;
  longitude?: number;
  accuracyMeters?: number;
};

export async function punchAction(input: PunchInput) {
  return tryAction(async () => {
    const session = await requireActiveEmployee();
    const type = input.type;
    if (!isPunchType(type)) {
      return { error: "Invalid punch type." };
    }

    const latitude = Number(input.latitude);
    const longitude = Number(input.longitude);
    if (
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude) ||
      Math.abs(latitude) > 90 ||
      Math.abs(longitude) > 180
    ) {
      return { error: "Location is required. Allow location access and try again." };
    }

    const accuracyMeters = Number(input.accuracyMeters);
    const note = String(input.note || "").trim().slice(0, 280);
    const travelTime = type === "travel_start";

    const db = getDb();
    const [[business], recent] = await Promise.all([
      db.select().from(businesses).where(eq(businesses.id, session.businessId)).limit(1),
      db
        .select()
        .from(punches)
        .where(eq(punches.employeeId, session.employeeId))
        .orderBy(desc(punches.occurredAt))
        .limit(1),
    ]);

    const previous = lastPunch(recent);
    const status = clockStatus(previous?.type);
    if (!allowedPunches(status).includes(type)) {
      if (type === "lunch_out") return { error: "Clock in before starting lunch." };
      if (type === "lunch_in") return { error: "You are not on lunch." };
      if (type === "travel_start") {
        return {
          error:
            status === "lunch"
              ? "End lunch before starting travel."
              : "You are already traveling.",
        };
      }
      if (type === "travel_end") return { error: "You are not traveling." };
      if (type === "in") return { error: "You are already on the clock." };
      return { error: "You are not clocked in." };
    }

    const site = worksiteFromBusiness(business ?? null);
    const distanceMeters = site
      ? distanceFromWorksite({ latitude, longitude }, site)
      : null;
    const outsideSite =
      site && distanceMeters != null ? isOutsideWorksite(distanceMeters, site) : false;

    const occurredAt = new Date();
    const headerStore = await headers();
    const clientReportedAt = input.clientReportedAt
      ? new Date(input.clientReportedAt)
      : null;

    await db.insert(punches).values({
      employeeId: session.employeeId,
      businessId: session.businessId,
      type,
      note: note || null,
      travelTime,
      outsideSite,
      occurredAt,
      clientReportedAt:
        clientReportedAt && !Number.isNaN(clientReportedAt.getTime())
          ? clientReportedAt
          : null,
      latitude,
      longitude,
      accuracyMeters: Number.isFinite(accuracyMeters) ? accuracyMeters : null,
      userAgent: headerStore.get("user-agent"),
    });

    return {
      ok: true as const,
      occurredAt: occurredAt.toISOString(),
      type,
      outsideSite,
    };
  }, "Could not record that punch. Sign out and sign in, then try again.");
}
