"use client";

import { useEffect, useState } from "react";
import { LiveMap } from "@/components/live-map";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDistance } from "@/lib/geo";
import type { LivePerson, LiveSnapshot } from "@/lib/live";
import { statusLabel } from "@/lib/punch";
import { formatHours, formatShortTime } from "@/lib/time";

export function LiveFloor({ initial }: { initial: LiveSnapshot }) {
  const [snapshot, setSnapshot] = useState(initial);
  const [selectedId, setSelectedId] = useState<string | null>(
    initial.people[0]?.id ?? null,
  );
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    let cancelled = false;
    async function refresh() {
      try {
        const response = await fetch("/api/live", { cache: "no-store" });
        if (!response.ok) return;
        const next = (await response.json()) as LiveSnapshot;
        if (cancelled) return;
        setSnapshot(next);
        setSelectedId((current) =>
          current && next.people.some((person) => person.id === current)
            ? current
            : (next.people[0]?.id ?? null),
        );
      } catch {
        // Keep the last snapshot if the poll fails.
      }
    }
    void refresh();
    const poll = window.setInterval(() => {
      void refresh();
    }, 2000);
    const age = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => {
      cancelled = true;
      window.clearInterval(poll);
      window.clearInterval(age);
    };
  }, []);

  const selected = snapshot.people.find((person) => person.id === selectedId) ?? null;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>On the clock</CardTitle>
          </CardHeader>
          <CardContent className="font-mono text-3xl font-semibold">
            {snapshot.onClock}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Active staff</CardTitle>
          </CardHeader>
          <CardContent className="font-mono text-3xl font-semibold">
            {snapshot.activeStaff}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Hours this week</CardTitle>
          </CardHeader>
          <CardContent className="font-mono text-3xl font-semibold">
            {formatHours(snapshot.weekHoursMs)}
          </CardContent>
        </Card>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-sm font-medium text-muted-foreground">Live GPS</h2>
          <p className="text-xs text-muted-foreground">
            Live · tap a person to follow
          </p>
        </div>
        <LiveMap
          worksite={snapshot.worksite}
          people={snapshot.people}
          selectedId={selectedId}
          onSelect={setSelectedId}
          className="h-[28rem] w-full overflow-hidden rounded-xl border border-border"
        />
        {selected ? (
          <p className="mt-2 text-xs text-muted-foreground">
            Tracking {selected.name}
            {selected.recordedAt
              ? ` · ${ageLabel(selected.recordedAt, nowMs)} · ${selected.trail.length} points this shift`
              : " · waiting for first GPS ping"}
          </p>
        ) : null}
      </div>

      <div>
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">Who is working</h2>
        {snapshot.people.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nobody is clocked in right now.</p>
        ) : (
          <div className="space-y-2">
            {snapshot.people.map((person) => (
              <PersonRow
                key={person.id}
                person={person}
                timezone={snapshot.timezone}
                selected={person.id === selectedId}
                nowMs={nowMs}
                onSelect={() => setSelectedId(person.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PersonRow({
  person,
  timezone,
  selected,
  nowMs,
  onSelect,
}: {
  person: LivePerson;
  timezone: string;
  selected: boolean;
  nowMs: number;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex w-full items-center justify-between gap-3 rounded-lg border px-3 py-3 text-left ${
        selected ? "border-foreground/40 bg-muted/40" : "border-border"
      }`}
    >
      <div>
        <p className="font-medium">{person.name}</p>
        <p className="font-mono text-xs text-muted-foreground">{person.email}</p>
        {person.latitude != null && person.longitude != null ? (
          <p className="mt-1 text-xs text-muted-foreground">
            {person.distanceMeters != null
              ? `${formatDistance(person.distanceMeters)} from worksite`
              : "GPS on"}
            {" · "}
            {ageLabel(person.recordedAt, nowMs)}
            {person.since ? ` · since ${formatShortTime(new Date(person.since), timezone)}` : ""}
          </p>
        ) : (
          <p className="mt-1 text-xs text-muted-foreground">Waiting for GPS</p>
        )}
        {person.note ? (
          <p className="mt-1 max-w-64 text-xs text-muted-foreground">{person.note}</p>
        ) : null}
      </div>
      <div className="shrink-0 text-right">
        <Badge variant={person.status === "lunch" ? "secondary" : "default"}>
          {statusLabel(person.status)}
        </Badge>
        {person.latitude != null ? (
          <Badge
            className="mt-2 block"
            variant={person.outsideSite ? "destructive" : "secondary"}
          >
            {person.outsideSite ? "Away" : "Inside"}
          </Badge>
        ) : null}
      </div>
    </button>
  );
}

function ageLabel(iso: string | null, nowMs = Date.now()) {
  if (!iso) return "No GPS";
  const ms = nowMs - new Date(iso).getTime();
  if (ms < 2500) return "Live";
  if (ms < 60_000) return `${Math.max(1, Math.round(ms / 1000))}s ago`;
  return `${Math.max(1, Math.round(ms / 60_000))}m ago`;
}
