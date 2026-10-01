import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { getDb } from "@/lib/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const start = searchParams.get("start");
  const end = searchParams.get("end") || start;

  if (!start || !end) {
    return NextResponse.json({ error: "start is required" }, { status: 400 });
  }

  const db = getDb();
  const entries = await db.getEntries(start, end);
  return NextResponse.json(entries);
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const { date, start_time, end_time, note } = body;
  const tag_ids: string[] = Array.isArray(body.tag_ids) ? body.tag_ids.map(String) : [];

  if (!date || !start_time || !end_time || tag_ids.length === 0) {
    return NextResponse.json(
      { error: "Missing required fields (need at least one tag)" },
      { status: 400 }
    );
  }
  if (end_time <= start_time) {
    return NextResponse.json(
      { error: "End time must be after start time" },
      { status: 400 }
    );
  }

  const db = getDb();
  const id = crypto.randomUUID();
  await db.createEntry(
    { id, date, start_time, end_time, note: note || null },
    tag_ids
  );
  return NextResponse.json({ id });
}
