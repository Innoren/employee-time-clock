"use server";

import { requireActiveEmployee } from "@/app/actions/auth";
import { signLocationToken } from "@/lib/location-token";
import { recordLocationPing } from "@/lib/record-location";
import { tryAction } from "@/lib/safe";

export async function reportLocationAction(input: {
  latitude: number;
  longitude: number;
  accuracyMeters?: number;
}) {
  return tryAction(async () => {
    const session = await requireActiveEmployee();
    return recordLocationPing(session, input);
  }, "Could not save location.");
}

export async function getLocationTokenAction() {
  return tryAction(async () => {
    const session = await requireActiveEmployee();
    return { token: await signLocationToken(session) };
  }, "Could not start location tracking.");
}
