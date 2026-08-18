"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import { businesses } from "@/db/schema";
import { requireAdmin } from "@/app/actions/auth";
import { tryAction } from "@/lib/safe";

export async function saveWorksiteAction(formData: FormData) {
  return tryAction(async () => {
    const session = await requireAdmin();
    const siteName = String(formData.get("siteName") || "").trim();
    const latitude = Number(formData.get("latitude"));
    const longitude = Number(formData.get("longitude"));
    const radiusFeet = Number(formData.get("radiusFeet"));

    if (!siteName) return { error: "Give the worksite a name." };
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return { error: "Set the worksite location first." };
    }
    if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) {
      return { error: "Those coordinates are not valid." };
    }

    const radiusMeters = Math.round(
      (Number.isFinite(radiusFeet) && radiusFeet > 0 ? radiusFeet : 500) / 3.28084,
    );

    const db = getDb();
    const updated = await db
      .update(businesses)
      .set({
        siteName,
        siteLatitude: latitude,
        siteLongitude: longitude,
        siteRadiusMeters: Math.min(Math.max(radiusMeters, 15), 16000),
      })
      .where(eq(businesses.id, session.businessId))
      .returning({ id: businesses.id });

    if (updated.length === 0) return { error: "Business not found." };

    revalidatePath("/admin");
    revalidatePath("/admin/worksite");
    revalidatePath("/clock");
    return { ok: true as const };
  }, "Could not save the worksite. Try again.");
}
