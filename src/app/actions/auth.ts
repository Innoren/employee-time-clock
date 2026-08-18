"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getDb } from "@/db";
import { employees } from "@/db/schema";
import { INITIAL_PIN, isPin, hashPin, verifyPin } from "@/lib/pin";
import { clearSession, createSession, readSession } from "@/lib/session";
import { personName } from "@/lib/company";
import { canManageTeam, canViewTimesheets, homePath, parseRole } from "@/lib/roles";
import { failAction } from "@/lib/safe";

export async function loginAction(formData: FormData) {
  try {
    const email = String(formData.get("email") || "")
      .trim()
      .toLowerCase();
    const pin = String(formData.get("pin") || "").trim();

    if (!email || !isPin(pin)) {
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
      name: personName(employee.firstName, employee.lastName),
      mustChangePin: employee.mustChangePin,
    });

    redirect(employee.mustChangePin ? "/pin" : homePath(role));
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

export async function changePinAction(formData: FormData) {
  try {
    const pin = String(formData.get("pin") || "").trim();
    const confirm = String(formData.get("confirm") || "").trim();
    if (!isPin(pin) || !isPin(confirm)) {
      return { error: "Enter a 4-digit PIN twice." };
    }
    if (pin !== confirm) {
      return { error: "Those PINs do not match." };
    }
    if (pin === INITIAL_PIN) {
      return { error: `Choose a PIN other than ${INITIAL_PIN}.` };
    }

    const session = await requireUser();
    const employee = await findActiveEmployee(session);
    if (!employee) {
      await clearSession();
      redirect("/login");
    }
    if (verifyPin(pin, employee.pinHash)) {
      return { error: "Choose a different PIN than the one you just used." };
    }

    const db = getDb();
    await db
      .update(employees)
      .set({
        pinHash: hashPin(pin),
        mustChangePin: false,
      })
      .where(eq(employees.id, employee.id));

    const role = parseRole(employee.role);
    await createSession({
      employeeId: employee.id,
      businessId: employee.businessId,
      role,
      email: employee.email,
      name: personName(employee.firstName, employee.lastName),
      mustChangePin: false,
    });

    redirect(homePath(role));
  } catch (error) {
    return failAction(error, "Could not update your PIN. Try again.");
  }
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
    name: personName(employee.firstName, employee.lastName),
    mustChangePin: employee.mustChangePin,
  };

  if (
    live.employeeId !== session.employeeId ||
    live.businessId !== session.businessId ||
    live.role !== session.role ||
    live.email !== session.email ||
    live.name !== session.name ||
    live.mustChangePin !== session.mustChangePin
  ) {
    try {
      await createSession(live);
    } catch {
      // Still return the live employee so this request can proceed.
    }
  }

  if (employee.mustChangePin) {
    redirect("/pin");
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
