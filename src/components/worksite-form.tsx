"use client";

import { useState, useTransition } from "react";
import { saveWorksiteAction } from "@/app/actions/settings";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCoords } from "@/lib/geo";
import { actionError, tryAction } from "@/lib/safe";

export function WorksiteForm({
  siteName,
  latitude,
  longitude,
  radiusFeet,
}: {
  siteName: string;
  latitude: number | null;
  longitude: number | null;
  radiusFeet: number;
}) {
  const [name, setName] = useState(siteName);
  const [lat, setLat] = useState(latitude);
  const [lng, setLng] = useState(longitude);
  const [radius, setRadius] = useState(radiusFeet);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function useThisPhone() {
    setError(null);
    if (!navigator.geolocation) {
      setError("Location is not available on this device.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLat(position.coords.latitude);
        setLng(position.coords.longitude);
      },
      () => setError("Allow location to save this phone as the worksite."),
      { enableHighAccuracy: true, timeout: 12_000 },
    );
  }

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        setError(null);
        setMessage(null);
        startTransition(async () => {
          const result = await tryAction(
            () => saveWorksiteAction(formData),
            "Could not save the worksite. Try again.",
          );
          if (actionError(result)) {
            setError(result.error);
            return;
          }
          setMessage("Worksite saved. Employees will see distance from this pin.");
        });
      }}
    >
      <input type="hidden" name="latitude" value={lat ?? ""} />
      <input type="hidden" name="longitude" value={lng ?? ""} />
      <div className="space-y-2">
        <Label htmlFor="siteName">Location name</Label>
        <Input
          id="siteName"
          name="siteName"
          className="h-10"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Main shop"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="radiusFeet">Allowed radius (feet)</Label>
        <Input
          id="radiusFeet"
          name="radiusFeet"
          type="number"
          min={50}
          max={52800}
          className="h-10"
          value={radius}
          onChange={(event) => setRadius(Number(event.target.value))}
        />
        <p className="text-xs text-muted-foreground">
          Square-style geofence. 500 ft is a typical shop lot.
        </p>
      </div>
      <div className="rounded-lg border border-border px-3 py-3 text-sm">
        <p className="text-muted-foreground">Designated pin</p>
        <p className="mt-1 font-mono">
          {lat != null && lng != null ? formatCoords(lat, lng) : "Not set yet"}
        </p>
        <Button type="button" variant="outline" className="mt-3" onClick={useThisPhone}>
          Use this phone's location
        </Button>
      </div>
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      {message ? (
        <Alert>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      ) : null}
      <Button type="submit" className="h-10" disabled={pending || lat == null || lng == null}>
        {pending ? "Saving…" : "Save worksite"}
      </Button>
    </form>
  );
}
