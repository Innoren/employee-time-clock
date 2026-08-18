import { desc, eq } from "drizzle-orm";
import { requireTimesheets } from "@/app/actions/auth";
import { AppHeader } from "@/components/app-header";
import { renderPage } from "@/components/page-unavailable";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getDb } from "@/db";
import { businesses, employees, locationPings, punches } from "@/db/schema";
import { formatDistance, mapsUrl } from "@/lib/geo";
import { formatHours, formatShortTime, lastPunch, pairShifts } from "@/lib/time";
import { clockStatus, statusLabel } from "@/lib/punch";

export const metadata = { title: "Live floor" };

export default async function AdminPage() {
  return renderPage(async () => {
    const session = await requireTimesheets();
    const db = getDb();
    const [[business], team, punchRows, pingRows] = await Promise.all([
      db.select().from(businesses).where(eq(businesses.id, session.businessId)).limit(1),
      db.select().from(employees).where(eq(employees.businessId, session.businessId)),
      db
        .select()
        .from(punches)
        .where(eq(punches.businessId, session.businessId))
        .orderBy(desc(punches.occurredAt))
        .limit(200),
      db
        .select()
        .from(locationPings)
        .where(eq(locationPings.businessId, session.businessId))
        .orderBy(desc(locationPings.recordedAt))
        .limit(400),
    ]);

    const latestPing = new Map<string, (typeof pingRows)[number]>();
    for (const ping of pingRows) {
      if (!latestPing.has(ping.employeeId)) latestPing.set(ping.employeeId, ping);
    }

    const timezone = business?.timezone ?? "America/New_York";
    const now = new Date();
    const onClock = team
      .filter((person) => person.active)
      .map((person) => {
        const theirs = punchRows.filter((punch) => punch.employeeId === person.id);
        const latest = lastPunch(theirs);
        const status = clockStatus(latest?.type);
        const ping = latestPing.get(person.id) ?? null;
        return {
          person,
          status,
          since: latest?.occurredAt ?? null,
          note: latest?.note ?? null,
          ping,
        };
      })
      .filter((row) => row.status !== "off");

    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const weekPunches = punchRows.filter((punch) => punch.occurredAt >= weekAgo);
    const weekHours = team.reduce((sum, person) => {
      const theirs = weekPunches.filter((punch) => punch.employeeId === person.id);
      return sum + pairShifts(theirs, now).reduce((inner, shift) => inner + shift.durationMs, 0);
    }, 0);

    return (
      <div className="mx-auto w-full max-w-5xl px-4 py-6">
        <AppHeader title="Live floor" subtitle={business?.name} role={session.role} />
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>On the clock</CardTitle>
            </CardHeader>
            <CardContent className="text-3xl font-semibold font-mono">
              {onClock.length}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Active staff</CardTitle>
            </CardHeader>
            <CardContent className="text-3xl font-semibold font-mono">
              {team.filter((person) => person.active).length}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Hours this week</CardTitle>
            </CardHeader>
            <CardContent className="text-3xl font-semibold font-mono">
              {formatHours(weekHours)}
            </CardContent>
          </Card>
        </div>

        <h2 className="mt-8 mb-3 text-sm font-medium text-muted-foreground">Who is working</h2>
        <div className="space-y-2">
          {onClock.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nobody is clocked in right now.</p>
          ) : (
            onClock.map((row) => (
              <div
                key={row.person.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-3"
              >
                <div>
                  <p className="font-medium">
                    {row.person.firstName} {row.person.lastName}
                  </p>
                  <p className="font-mono text-xs text-muted-foreground">{row.person.email}</p>
                  {row.ping ? (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {row.ping.distanceMeters != null
                        ? `${formatDistance(row.ping.distanceMeters)} from worksite`
                        : "GPS on"}
                      {" · "}
                      {formatShortTime(row.ping.recordedAt, timezone)}
                      {" · "}
                      <a
                        href={mapsUrl(row.ping.latitude, row.ping.longitude)}
                        target="_blank"
                        rel="noreferrer"
                        className="underline"
                      >
                        Map
                      </a>
                    </p>
                  ) : (
                    <p className="mt-1 text-xs text-muted-foreground">Waiting for GPS</p>
                  )}
                  {row.note ? (
                    <p className="mt-1 max-w-48 text-xs text-muted-foreground">{row.note}</p>
                  ) : null}
                </div>
                <div className="shrink-0 text-right">
                  <Badge variant={row.status === "lunch" ? "secondary" : "default"}>
                    {statusLabel(row.status)}
                  </Badge>
                  {row.ping ? (
                    <Badge
                      className="mt-2 block"
                      variant={row.ping.outsideSite ? "destructive" : "secondary"}
                    >
                      {row.ping.outsideSite ? "Away" : "Inside"}
                    </Badge>
                  ) : null}
                  {row.since ? (
                    <p className="mt-1 font-mono text-xs text-muted-foreground">
                      since {formatShortTime(row.since, timezone)}
                    </p>
                  ) : null}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  });
}
