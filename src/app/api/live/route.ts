import { NextResponse } from "next/server";
import { findActiveEmployee } from "@/app/actions/auth";
import { loadLiveSnapshot } from "@/lib/live-data";
import { canViewTimesheets } from "@/lib/roles";
import { readSession } from "@/lib/session";

export async function GET() {
  try {
    const session = await readSession();
    if (!session || !canViewTimesheets(session.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const employee = await findActiveEmployee(session);
    if (!employee) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const snapshot = await loadLiveSnapshot(employee.businessId);
    return NextResponse.json(snapshot, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json({ error: "Could not load live floor." }, { status: 500 });
  }
}
