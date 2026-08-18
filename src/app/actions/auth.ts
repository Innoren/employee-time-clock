"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getDb } from "@/db";
import { employees } from "@/db/schema";
import { verifyPin } from "@/lib/pin";
import { clearSession, createSession, readSession } from "@/lib/session";
import { canManageTeam, canViewTimesheets, homePath, parseRole } from "@/lib/roles";
import { failAction } from "@/lib/safe";

export async function loginAction(formData: FormData) {
  try {
    const email = String(formData.get("email") || "")
      .trim()
      .toLowerCase();
    const pin = String(formData.get("pin") || "").trim();

    if (!email || !/^\d{4}$/.test(pin)) {
      return { error: "Enter your work email and 4-digit PIN." };
    }

    const db = getDb();
    const [employee] = await db
      .select()
      .from(employees)
      .where(eq(employees.email, email))
      .limit(1);

    if (!employee || !employee.active || !verifyPin(pin, employee.pinHash)) {
      return { error: "That email or PIN does not match an active account." };
    }

    const role = parseRole(employee.role);

    await createSession({
      employeeId: employee.id,
      businessId: employee.businessId,
      role,
      email: employee.email,
      name: `${employee.firstName} ${employee.lastName}`,
    });

    redirect(homePath(role));
  } catch (error) {
    return failAction(error, "Could not sign in. Try again.");
  }
}

export async function logoutAction() {
  try {
    await clearSession();
  } catch (error) {
    failAction(error);
  }
  redirect("/login");
}

export async function requireUser() {
  const session = await readSession();
  if (!session) redirect("/login");
  return session;
}

export async function findActiveEmployee(session: {
  employeeId: string;
  email: string;
}) {
  const db = getDb();
  const [byId] = await db
    .select()
    .from(employees)
    .where(eq(employees.id, session.employeeId))
    .limit(1);
  if (byId?.active) return byId;

  const [byEmail] = await db
    .select()
    .from(employees)
    .where(eq(employees.email, session.email))
    .limit(1);
  if (byEmail?.active) return byEmail;
  return null;
}

/** Use from server actions only — may refresh the session cookie. */
export async function requireActiveEmployee() {
  const session = await requireUser();
  const employee = await findActiveEmployee(session);
  if (!employee) {
    await clearSession();
    redirect("/login");
  }

  const live = {
    employeeId: employee.id,
    businessId: employee.businessId,
    role: parseRole(employee.role),
    email: employee.email,
    name: `${employee.firstName} ${employee.lastName}`,
  };

  if (
    live.employeeId !== session.employeeId ||
    live.businessId !== session.businessId ||
    live.role !== session.role ||
    live.email !== session.email ||
    live.name !== session.name
  ) {
    try {
      await createSession(live);
    } catch {
      // Still return the live employee so this request can proceed.
    }
  }

  return live;
}

export async function requireTimesheets() {
  const session = await requireActiveEmployee();
  if (!canViewTimesheets(session.role)) redirect("/clock");
  return session;
}

export async function requireAdmin() {
  const session = await requireActiveEmployee();
  if (!canManageTeam(session.role)) {
    redirect(canViewTimesheets(session.role) ? "/admin/timesheets" : "/clock");
  }
  return session;
}
