"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import { businesses, employees } from "@/db/schema";
import { requireAdmin } from "@/app/actions/auth";
import { emailFromName, hashPin, INITIAL_PIN } from "@/lib/pin";
import { personName } from "@/lib/company";
import { parseRole } from "@/lib/roles";
import { tryAction } from "@/lib/safe";

export async function createEmployeeAction(formData: FormData) {
  return tryAction(async () => {
    const session = await requireAdmin();
    const firstName = String(formData.get("firstName") || "").trim();
    const lastName = String(formData.get("lastName") || "").trim();
    const role = parseRole(formData.get("role"));

    if (!firstName || !lastName) {
      return { error: "First and last name are required." };
    }

    const db = getDb();
    const [business] = await db
      .select()
      .from(businesses)
      .where(eq(businesses.id, session.businessId))
      .limit(1);

    if (!business) return { error: "Business not found." };

    const baseEmail = emailFromName(firstName, lastName, business.domain);
    const [localPart, domainPart] = baseEmail.split("@");
    let email = baseEmail;
    let attempt = 2;
    while (true) {
      const [existing] = await db
        .select({ id: employees.id })
        .from(employees)
        .where(eq(employees.email, email))
        .limit(1);
      if (!existing) break;
      email = `${localPart}${attempt}@${domainPart}`;
      attempt += 1;
      if (attempt > 50) return { error: "Could not generate a unique email." };
    }

    const [created] = await db
      .insert(employees)
      .values({
        businessId: business.id,
        email,
        firstName,
        lastName,
        role,
        pinHash: hashPin(INITIAL_PIN),
        mustChangePin: true,
      })
      .returning();

    if (!created) return { error: "Could not create that account. Try again." };

    revalidatePath("/admin");
    revalidatePath("/admin/team");
    return {
      ok: true as const,
      email: created.email,
      pin: INITIAL_PIN,
      name: personName(created.firstName, created.lastName),
    };
  }, "Could not create that account. Try again.");
}

export async function setEmployeeActiveAction(employeeId: string, active: boolean) {
  return tryAction(async () => {
    const session = await requireAdmin();
    if (!employeeId || employeeId === session.employeeId) {
      return { error: "You cannot deactivate your own account." };
    }
    const db = getDb();
    const updated = await db
      .update(employees)
      .set({ active })
      .where(
        and(eq(employees.id, employeeId), eq(employees.businessId, session.businessId)),
      )
      .returning({ id: employees.id });
    if (updated.length === 0) {
      return { error: "That person is not on this roster." };
    }
    revalidatePath("/admin/team");
    return { ok: true as const };
  }, "Could not update that account. Try again.");
}
