import { desc, eq } from "drizzle-orm";
import { findActiveEmployee, logoutAction, requireUser } from "@/app/actions/auth";
import { ClockPanel } from "@/components/clock-panel";
import { PageUnavailable, renderPage } from "@/components/page-unavailable";
import { Button } from "@/components/ui/button";
import { getDb } from "@/db";
import { businesses, punches } from "@/db/schema";
import { lastPunch, pairShifts, formatDate } from "@/lib/time";
import { clockStatus } from "@/lib/punch";
import { canViewTimesheets, parseRole } from "@/lib/roles";
import { worksiteFromBusiness } from "@/lib/geo";
import Link from "next/link";

export const metadata = { title: "Clock" };

export default async function ClockPage() {
  return renderPage(async () => {
    const session = await requireUser();
    const employee = await findActiveEmployee(session);
    if (!employee) {
      return (
        <div className="mx-auto flex min-h-full w-full max-w-md flex-col items-center justify-center gap-4 px-4 py-16 text-center">
          <p className="text-sm text-muted-foreground">
            Your account was reset. Sign in again to keep punching.
          </p>
          <form action={logoutAction}>
            <Button type="submit">Sign in</Button>
          </form>
        </div>
      );
    }

    const live = {
      employeeId: employee.id,
      businessId: employee.businessId,
      name: `${employee.firstName} ${employee.lastName}`,
      role: parseRole(employee.role),
    };
    const db = getDb();
    const [[business], punchRows] = await Promise.all([
      db.select().from(businesses).where(eq(businesses.id, live.businessId)).limit(1),
      db
        .select()
        .from(punches)
        .where(eq(punches.employeeId, live.employeeId))
        .orderBy(desc(punches.occurredAt))
        .limit(50),
    ]);

    if (!business) {
      return (
        <PageUnavailable
          title="This business is no longer available"
          detail="Sign in again. If this keeps happening, ask a manager to restore the account."
        />
      );
    }

    const timezone = business.timezone || "America/New_York";
    const now = new Date();
    const todayLabel = formatDate(now, timezone);
    const todayPunches = punchRows.filter(
      (punch) =>
        !Number.isNaN(punch.occurredAt.getTime()) &&
        formatDate(punch.occurredAt, timezone) === todayLabel,
    );
    const todayShifts = pairShifts(todayPunches, now);
    const hoursTodayMs = todayShifts.reduce((sum, shift) => sum + shift.durationMs, 0);
    const lunchTodayMs = todayShifts.reduce((sum, shift) => sum + shift.lunchMs, 0);
    const travelTodayMs = todayShifts.reduce((sum, shift) => sum + shift.travelMs, 0);
    const status = clockStatus(lastPunch(punchRows)?.type);
    const recent = punchRows
      .filter((punch) => !Number.isNaN(punch.occurredAt.getTime()))
      .map((punch) => ({
        id: punch.id,
        type: punch.type,
        occurredAt: punch.occurredAt.toISOString(),
        note: punch.note,
        travelTime: punch.travelTime,
        outsideSite: punch.outsideSite,
      }));

    return (
      <div className="mx-auto flex min-h-full w-full max-w-md flex-col px-4 py-6">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Time Clock</p>
            <p className="text-sm font-medium">{business.name}</p>
          </div>
          <div className="flex items-center gap-2">
            {canViewTimesheets(live.role) ? (
              <Button asChild variant="outline" size="sm">
                <Link href="/admin/timesheets">Timesheets</Link>
              </Button>
            ) : null}
            <form action={logoutAction}>
              <Button type="submit" variant="ghost" size="sm">
                Sign out
              </Button>
            </form>
          </div>
        </header>
        <ClockPanel
          name={live.name}
          timezone={timezone}
          status={status}
          hoursTodayMs={hoursTodayMs}
          lunchTodayMs={lunchTodayMs}
          travelTodayMs={travelTodayMs}
          worksite={worksiteFromBusiness(business)}
          recent={recent}
        />
      </div>
    );
  });
}
