"use client";

import { Capacitor, CapacitorHttp } from "@capacitor/core";
import { useEffect, useState } from "react";

export type DeviceCoords = {
  latitude: number;
  longitude: number;
  accuracy: number;
};

export function isNativeApp() {
  return Capacitor.isNativePlatform();
}

export function useNativeApp() {
  const [native, setNative] = useState<boolean | null>(null);
  useEffect(() => {
    setNative(Capacitor.isNativePlatform());
  }, []);
  return native;
}

function coordsFromPosition(position: {
  coords: { latitude: number; longitude: number; accuracy: number | null };
}): DeviceCoords {
  return {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
    accuracy: position.coords.accuracy ?? 0,
  };
}

function geoErrorMessage(error: { code?: number; message?: string }) {
  if (error.code === 1) {
    return "Allow location access to clock in. Check the browser location permission and Location Services.";
  }
  if (error.code === 3) {
    return "Location timed out. Keep the page open, move near a window, and try again.";
  }
  return "Could not read your location. Turn on Location Services and try again.";
}

function assertLocationOrigin() {
  if (typeof window === "undefined") return;
  if (window.isSecureContext) return;
  throw new Error(
    "This device is blocking GPS because the page is not HTTPS. Open http://localhost:3000 on this computer, or use the iPhone/Android app.",
  );
}

function readBrowserPositionOnce(options: PositionOptions) {
  return new Promise<DeviceCoords>((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) => resolve(coordsFromPosition(position)),
      reject,
      options,
    );
  });
}

function watchBrowserPositionOnce(timeoutMs: number) {
  return new Promise<DeviceCoords>((resolve, reject) => {
    let settled = false;
    const timer = window.setTimeout(() => {
      if (settled) return;
      settled = true;
      navigator.geolocation.clearWatch(watchId);
      reject({ code: 3, message: "Timeout expired" });
    }, timeoutMs);
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        if (settled) return;
        settled = true;
        window.clearTimeout(timer);
        navigator.geolocation.clearWatch(watchId);
        resolve(coordsFromPosition(position));
      },
      (error) => {
        if (settled) return;
        settled = true;
        window.clearTimeout(timer);
        navigator.geolocation.clearWatch(watchId);
        reject(error);
      },
      { enableHighAccuracy: false, timeout: timeoutMs, maximumAge: 120_000 },
    );
  });
}

async function readBrowserPosition(): Promise<DeviceCoords> {
  if (!navigator.geolocation) {
    throw new Error("Location is not available on this device.");
  }
  assertLocationOrigin();

  const attempts: PositionOptions[] = [
    { enableHighAccuracy: true, timeout: 20_000, maximumAge: 60_000 },
    { enableHighAccuracy: false, timeout: 20_000, maximumAge: 120_000 },
  ];

  let lastError: { code?: number; message?: string } | undefined;
  for (const options of attempts) {
    try {
      return await readBrowserPositionOnce(options);
    } catch (error) {
      const geoError = error as { code?: number; message?: string };
      if (geoError.code === 1) {
        throw new Error(geoErrorMessage(geoError));
      }
      lastError = geoError;
    }
  }

  try {
    return await watchBrowserPositionOnce(20_000);
  } catch (error) {
    const geoError = (error as { code?: number; message?: string }) ?? lastError;
    throw new Error(geoErrorMessage(geoError ?? {}));
  }
}

export async function getDevicePosition(): Promise<DeviceCoords> {
  if (!isNativeApp()) {
    return readBrowserPosition();
  }

  const { Geolocation } = await import("@capacitor/geolocation");
  const permission = await Geolocation.requestPermissions();
  if (permission.location === "denied") {
    throw new Error("Allow location access to clock in.");
  }

  try {
    return coordsFromPosition(
      await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 20_000,
        maximumAge: 60_000,
      }),
    );
  } catch {
    try {
      return coordsFromPosition(
        await Geolocation.getCurrentPosition({
          enableHighAccuracy: false,
          timeout: 20_000,
          maximumAge: 120_000,
        }),
      );
    } catch (error) {
      const geoError = error as { code?: number; message?: string };
      throw new Error(geoErrorMessage(geoError));
    }
  }
}

export async function startShiftTracking(
  onLocation: (coords: DeviceCoords) => void,
  onError: (message?: string) => void,
): Promise<() => void> {
  if (!isNativeApp()) {
    if (!navigator.geolocation) {
      onError("Location is not available on this device.");
      return () => {};
    }
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        onLocation(coordsFromPosition(position));
      },
      (error) => onError(geoErrorMessage(error)),
      { enableHighAccuracy: true, maximumAge: 60_000, timeout: 30_000 },
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }

  const { BackgroundGeolocation } = await import(
    "@capgo/background-geolocation"
  );
  await BackgroundGeolocation.start(
    {
      backgroundMessage:
        "Time Clock is tracking this shift until you clock out.",
      backgroundTitle: "On the clock",
      requestPermissions: true,
      stale: false,
      distanceFilter: 20,
    },
    (location, error) => {
      if (error) {
        onError(
          error.code === "NOT_AUTHORIZED"
            ? "Allow Always location so GPS can stay on after you lock the phone."
            : error.message,
        );
        return;
      }
      if (!location) return;
      onLocation({
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy,
      });
    },
  );

  return () => {
    void BackgroundGeolocation.stop();
  };
}

export async function postNativeLocation(
  token: string,
  coords: DeviceCoords,
): Promise<{ ok?: true; stopped?: true; error?: string }> {
  const url = new URL("/api/location", window.location.origin).toString();
  const response = await CapacitorHttp.post({
    url,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    data: {
      latitude: coords.latitude,
      longitude: coords.longitude,
      accuracyMeters: coords.accuracy,
    },
  });
  const body = response.data as
    | { ok?: true; stopped?: true; error?: string }
    | string;
  if (typeof body === "string") {
    try {
      return JSON.parse(body) as { ok?: true; stopped?: true; error?: string };
    } catch {
      return { error: "Could not save location." };
    }
  }
  return body ?? { ok: true };
}

export async function openNativeLocationSettings() {
  if (!isNativeApp()) return;
  const { BackgroundGeolocation } = await import(
    "@capgo/background-geolocation"
  );
  await BackgroundGeolocation.openSettings();
}
