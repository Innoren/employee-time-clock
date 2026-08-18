import { NextResponse } from "next/server";
import { readSession } from "@/lib/session";
import { verifyLocationToken } from "@/lib/location-token";
import { recordLocationPing } from "@/lib/record-location";

export async function POST(request: Request) {
  try {
    const session = await readSession();
    const auth = request.headers.get("authorization");
    const tokenUser =
      !session && auth?.startsWith("Bearer ")
        ? await verifyLocationToken(auth.slice(7))
        : null;
    const user = session ?? tokenUser;
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: {
      latitude?: number;
      longitude?: number;
      accuracyMeters?: number;
    };
    try {
      body = (await request.json()) as typeof body;
    } catch {
      return NextResponse.json({ error: "Invalid location." }, { status: 400 });
    }

    const result = await recordLocationPing(user, {
      latitude: Number(body.latitude),
      longitude: Number(body.longitude),
      accuracyMeters:
        body.accuracyMeters == null ? undefined : Number(body.accuracyMeters),
    });

    const status = "error" in result ? 400 : 200;
    return NextResponse.json(result, { status });
  } catch {
    return NextResponse.json({ error: "Could not save location." }, { status: 500 });
  }
}
