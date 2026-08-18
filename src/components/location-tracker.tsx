"use client";

import { useEffect, useRef, useState } from "react";
import {
  getLocationTokenAction,
  reportLocationAction,
} from "@/app/actions/location";
import { Badge } from "@/components/ui/badge";
import {
  formatDistance,
  isOutsideWorksite,
  metersBetween,
  type Worksite,
} from "@/lib/geo";
import {
  openNativeLocationSettings,
  postNativeLocation,
  startShiftTracking,
  useNativeApp,
  type DeviceCoords,
} from "@/lib/device-location";

const MIN_INTERVAL_MS = 15_000;
const MIN_MOVE_METERS = 20;

type Props = {
  active: boolean;
  worksite: Worksite | null;
};

export function LocationTracker({ active, worksite }: Props) {
  const native = useNativeApp();
  const [state, setState] = useState<"off" | "requesting" | "tracking" | "denied">(
    "off",
  );
  const [backgrounded, setBackgrounded] = useState(false);
  const [last, setLast] = useState<{
    latitude: number;
    longitude: number;
    at: Date;
  } | null>(null);
  const lastSent = useRef<{ latitude: number; longitude: number; at: number } | null>(
    null,
  );
  const tokenRef = useRef<string | null>(null);

  useEffect(() => {
    if (!active || native == null) {
      if (!active) {
        setState("off");
        setLast(null);
        lastSent.current = null;
        tokenRef.current = null;
      }
      return;
    }

    setState("requesting");
    let cancelled = false;
    let stopTracking: (() => void) | undefined;
    let wakeLock: WakeLockSentinel | null = null;

    async function keepAwake() {
      if (native) return;
      try {
        if ("wakeLock" in navigator) {
          wakeLock = await navigator.wakeLock.request("screen");
        }
      } catch {
        wakeLock = null;
      }
    }

    function send(coords: DeviceCoords) {
      const now = Date.now();
      const point = { latitude: coords.latitude, longitude: coords.longitude };
      const previous = lastSent.current;
      const elapsed = previous ? now - previous.at : Infinity;
      const moved = previous ? metersBetween(previous, point) : Infinity;
      if (elapsed < MIN_INTERVAL_MS && moved < MIN_MOVE_METERS) return;
      lastSent.current = { ...point, at: now };

      const payload = {
        latitude: coords.latitude,
        longitude: coords.longitude,
        accuracyMeters: coords.accuracy,
      };

      const finish = (result?: { stopped?: true; error?: string } | null) => {
        if (result && "stopped" in result && result.stopped) {
          setState("off");
        }
      };

      if (native && tokenRef.current) {
        void postNativeLocation(tokenRef.current, coords)
          .then(finish)
          .catch(() => {});
        return;
      }
      void reportLocationAction(payload)
        .then(finish)
        .catch(() => {});
    }

    async function start() {
      try {
        if (native) {
          const tokenResult = await getLocationTokenAction();
          if (cancelled) return;
          if ("token" in tokenResult) tokenRef.current = tokenResult.token;
        }
        await keepAwake();
        if (cancelled) return;
        stopTracking = await startShiftTracking(
          (coords) => {
            if (cancelled) return;
            setState("tracking");
            setLast({
              latitude: coords.latitude,
              longitude: coords.longitude,
              at: new Date(),
            });
            send(coords);
          },
          () => {
            if (!cancelled) setState("denied");
          },
        );
        if (cancelled) {
          stopTracking();
          stopTracking = undefined;
        }
      } catch {
        if (!cancelled) setState("denied");
      }
    }

    void start();

    function onVisibility() {
      const hidden = document.visibilityState === "hidden";
      setBackgrounded(hidden);
      if (!hidden) void keepAwake();
    }
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisibility);
      stopTracking?.();
      void wakeLock?.release();
    };
  }, [active, native]);

  const distance =
    last && worksite ? metersBetween(last, worksite) : null;
  const away =
    distance != null && worksite ? isOutsideWorksite(distance, worksite) : false;

  if (!active) {
    return (
      <p className="text-xs text-muted-foreground">
        Clock in to turn on GPS. Tracking stays on until you clock out.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {native ? (
        <p className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
          This app collects location while you are on the clock, including when
          the phone is locked, so your employer can confirm you are at the
          worksite. Tracking stops when you clock out. Choose{" "}
          <span className="font-medium text-foreground">Always Allow</span> if
          iPhone asks.
        </p>
      ) : null}
      <div className="rounded-xl border border-border px-4 py-4 text-center">
        {worksite && distance != null ? (
          <>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              {away ? "Away from" : "At"} {worksite.name}
            </p>
            <p className="mt-1 font-mono text-3xl font-semibold tracking-tight">
              {away ? formatDistance(distance) : "On site"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {away
                ? `from the designated location`
                : `within ${formatDistance(worksite.radiusMeters)}`}
            </p>
            <Badge className="mt-3" variant={away ? "destructive" : "secondary"}>
              {away ? "Outside worksite" : "Inside worksite"}
            </Badge>
          </>
        ) : (
          <>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Live location
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {state === "tracking"
                ? "GPS is on for this shift"
                : state === "requesting"
                  ? "Turning GPS on…"
                  : "Allow location to measure distance from the worksite"}
            </p>
          </>
        )}
      </div>
      {state === "denied" ? (
        <p className="text-xs text-destructive">
          Location is off.{" "}
          {native ? (
            <button
              type="button"
              className="underline"
              onClick={() => void openNativeLocationSettings()}
            >
              Open location settings
            </button>
          ) : (
            "Allow location and try again."
          )}
        </p>
      ) : native ? (
        <p className="text-xs text-muted-foreground">
          GPS stays on for this shift, including when the phone is locked.
          Choose Always Allow if iOS asks.
        </p>
      ) : backgrounded ? (
        <p className="text-xs text-destructive">
          Browser GPS pauses in the background. Use the iPhone or Android app
          to keep tracking after you lock the phone.
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">
          In a browser, leave Time Clock on screen. The iPhone and Android apps
          keep GPS on after you lock the phone.
        </p>
      )}
    </div>
  );
}
