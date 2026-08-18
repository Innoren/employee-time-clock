import { NextResponse } from "next/server";

export async function GET() {
  try {
    const now = new Date();
    return NextResponse.json({
      iso: now.toISOString(),
      epochMs: now.getTime(),
    });
  } catch {
    return NextResponse.json({ error: "Time unavailable." }, { status: 500 });
  }
}
