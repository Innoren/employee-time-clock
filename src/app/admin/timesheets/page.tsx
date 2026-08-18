import { and, desc, eq, gte } from "drizzle-orm";
import { requireTimesheets } from "@/app/actions/auth";
import { AppHeader } from "@/components/app-header";
import { renderPage } from "@/components/page-unavailable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getDb } from "@/db";
import { businesses, employees, punches } from "@/db/schema";
import { formatHours, formatDateTime, pairShifts } from "@/lib/time";
import { isTravelPunch, punchLabel } from "@/lib/punch";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "Timesheets" };

export default async function TimesheetsPage() {
  return renderPage(async () => {
  const session = await requireTimesheets();
  const db = getDb();
  const now = new Date();
  const from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [[business], team, punchRows] = await Promise.all([
    db.select().from(businesses).where(eq(businesses.id, session.businessId)).limit(1),
    db.select().from(employees).where(eq(employees.businessId, session.businessId)),
    db
      .select()
      .from(punches)
      .where(
        and(eq(punches.businessId, session.businessId), gte(punches.occurredAt, from)),
      )
      .orderBy(desc(punches.occurredAt)),
  ]);

  const timezone = business?.timezone ?? "America/New_York";
  const rows = team
    .map((person) => {
      const theirs = punchRows.filter((punch) => punch.employeeId === person.id);
      const shifts = pairShifts(theirs, now);
      const total = shifts.reduce((sum, shift) => sum + shift.durationMs, 0);
      return { person, total, shifts, punches: theirs.slice(0, 8) };
    })
    .sort((a, b) => b.total - a.total);

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6">
      <AppHeader title="Timesheets" subtitle="Last 7 days" role={session.role} />
      <div className="space-y-4">
        {rows.map((row) => (
          <Card key={row.person.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between gap-3">
                <span>
                  {row.person.firstName} {row.person.lastName}
                </span>
                <span className="font-mono text-base font-semibold">
                  {formatHours(row.total)}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>In</TableHead>
                    <TableHead>Out</TableHead>
                    <TableHead>Travel</TableHead>
                    <TableHead>Lunch</TableHead>
                    <TableHead className="text-right">Paid</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {row.shifts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-muted-foreground">
                        No shifts this week.
                      </TableCell>
                    </TableRow>
                  ) : (
                    row.shifts.slice(0, 10).map((shift) => (
                      <TableRow key={shift.clockIn.toISOString()}>
                        <TableCell className="font-mono">
                          {formatDateTime(shift.clockIn, timezone)}
                        </TableCell>
                        <TableCell className="font-mono">
                          {shift.clockOut
                            ? formatDateTime(shift.clockOut, timezone)
                            : "Open"}
                        </TableCell>
                        <TableCell className="font-mono">
                          {formatHours(shift.travelMs)}
                        </TableCell>
                        <TableCell className="font-mono">
                          {formatHours(shift.lunchMs)}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {formatHours(shift.durationMs)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              {row.punches.length > 0 ? (
                <div className="mt-4 space-y-2">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Punch notes
                  </p>
                  {row.punches.map((punch) => (
                    <div
                      key={punch.id}
                      className="flex flex-wrap items-baseline justify-between gap-2 text-xs"
                    >
                      <span>
                        {punchLabel(punch.type)} · {formatDateTime(punch.occurredAt, timezone)}
                        {punch.travelTime && !isTravelPunch(punch.type) ? (
                          <Badge variant="secondary" className="ml-2">
                            Travel
                          </Badge>
                        ) : null}
                      </span>
                      <span className="text-muted-foreground">
                        {punch.note || "No note"}
                      </span>
                    </div>
                  ))}
                </div>
              ) : null}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
  });
}
