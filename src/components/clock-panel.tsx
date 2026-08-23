"use client";

import { useEffect, useState, useTransition } from "react";
import { unstable_rethrow, useRouter } from "next/navigation";
import { punchAction } from "@/app/actions/punch";
import { LocationTracker } from "@/components/location-tracker";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getDevicePosition } from "@/lib/device-location";
import { actionError } from "@/lib/safe";
import type { Worksite } from "@/lib/geo";
import {
  allowedPunches,
  isTravelPunch,
  punchLabel,
  statusLabel,
  type ClockStatus,
  type PunchType,
} from "@/lib/punch";
import { formatClock, formatDate, formatHours, formatShortTime } from "@/lib/time";

type RecentPunch = {
  id: string;
  type: string;
  occurredAt: string;
  note: string | null;
  travelTime: boolean;
  outsideSite: boolean;
};

type Props = {
  name: string;
  timezone: string;
  status: ClockStatus;
  hoursTodayMs: number;
  lunchTodayMs: number;
  travelTodayMs: number;
  worksite: Worksite | null;
  recent: RecentPunch[];
};

export function ClockPanel({
  name,
  timezone,
  status,
  hoursTodayMs,
  lunchTodayMs,
  travelTodayMs,
  worksite,
  recent,
}: Props) {
  const router = useRouter();
  const [now, setNow] = useState<Date | null>(null);
  const [offsetMs, setOffsetMs] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    void getDevicePosition().catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/time")
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((data: { epochMs?: number }) => {
        if (!cancelled && typeof data.epochMs === "number") {
          setOffsetMs(data.epochMs - Date.now());
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const tick = () => setNow(new Date(Date.now() + offsetMs));
    tick();
    const id = window.setInterval(tick, 250);
    return () => window.clearInterval(id);
  }, [offsetMs]);

  const actions = allowedPunches(status);
  const primary = actions[0];
  const secondary = actions.slice(1);

  function punch(type: PunchType) {
    setError(null);
    startTransition(async () => {
      try {
        const coords = await getDevicePosition();
        const result = await punchAction({
          type,
          note,
          clientReportedAt: new Date().toISOString(),
          latitude: coords.latitude,
          longitude: coords.longitude,
          accuracyMeters: coords.accuracy,
        });
        if (actionError(result)) {
          setError(result.error);
          return;
        }
        router.refresh();
      } catch (cause) {
        unstable_rethrow(cause);
        setError(
          cause instanceof Error
            ? cause.message
            : "Could not record that punch. Try again.",
        );
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          {now ? formatDate(now, timezone) : "\u00a0"}
        </p>
        <p className="mt-2 font-mono text-5xl font-semibold tracking-tight tabular-nums sm:text-6xl">
          {now ? formatClock(now, timezone) : "—"}
        </p>
        <p className="mt-2 text-xs uppercase tracking-wide text-muted-foreground">
          Official server time · {timezone.replaceAll("_", " ")}
        </p>
      </div>

      <Card>
        <CardContent className="space-y-5 pt-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Signed in as</p>
              <p className="font-medium">{name}</p>
            </div>
            <Badge variant={status === "off" || status === "lunch" ? "secondary" : "default"}>
              {statusLabel(status)}
            </Badge>
          </div>
          <p className="text-center text-sm text-muted-foreground">
            Paid today{" "}
            <span className="font-mono text-lg font-semibold text-foreground">
              {formatHours(hoursTodayMs)}
            </span>
            {travelTodayMs > 0 ? (
              <>
                {" "}
                · Travel{" "}
                <span className="font-mono text-foreground">{formatHours(travelTodayMs)}</span>
              </>
            ) : null}
            {lunchTodayMs > 0 ? (
              <>
                {" "}
                · Lunch{" "}
                <span className="font-mono text-foreground">{formatHours(lunchTodayMs)}</span>
              </>
            ) : null}
          </p>

          <LocationTracker
            active={status !== "off"}
            worksite={worksite}
            employeeName={name}
            status={status}
          />

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          {primary ? (
            <Button
              className="h-16 w-full text-xl"
              variant={primary === "out" ? "destructive" : "default"}
              disabled={pending}
              onClick={() => punch(primary)}
            >
              {pending ? "Recording…" : punchLabel(primary)}
            </Button>
          ) : null}

          {secondary.map((type) => (
            <Button
              key={type}
              className="h-14 w-full text-lg"
              variant={type === "out" ? "destructive" : "outline"}
              disabled={pending}
              onClick={() => punch(type)}
            >
              {pending ? "Recording…" : punchLabel(type)}
            </Button>
          ))}

          <details className="rounded-lg border border-border px-4 py-3">
            <summary className="cursor-pointer text-sm font-medium">Add a note</summary>
            <div className="mt-3 space-y-2">
              <Label htmlFor="punch-note" className="sr-only">
                Note
              </Label>
              <Textarea
                id="punch-note"
                value={note}
                onChange={(event) => setNote(event.target.value)}
                maxLength={280}
                placeholder="Job site or anything a supervisor should see"
                className="min-h-16"
              />
            </div>
          </details>
        </CardContent>
      </Card>

      <div>
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">Your punches</h2>
        <div className="space-y-2">
          {recent.length === 0 ? (
            <p className="text-sm text-muted-foreground">No punches yet.</p>
          ) : (
            recent.slice(0, 8).map((punchRow) => (
              <div
                key={punchRow.id}
                className="rounded-lg border border-border px-3 py-2 text-sm"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">{punchLabel(punchRow.type)}</span>
                  <span className="font-mono text-muted-foreground">
                    {formatShortTime(new Date(punchRow.occurredAt), timezone)}
                  </span>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  {punchRow.travelTime && !isTravelPunch(punchRow.type) ? (
                    <Badge variant="secondary">Travel</Badge>
                  ) : null}
                  {punchRow.outsideSite ? (
                    <Badge variant="destructive">Away</Badge>
                  ) : null}
                  {punchRow.note ? (
                    <p className="text-xs text-muted-foreground">{punchRow.note}</p>
                  ) : null}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
