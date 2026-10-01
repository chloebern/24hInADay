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
  const { date, start_time, end_time, category_id, note } = body;

  if (!date || !start_time || !end_time || !category_id) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }
  if (end_time <= start_time) {
    return NextResponse.json(
      { error: "End time must be after start time" },
      { status: 400 }
    );
  }

  const db = getDb();
  const id = crypto.randomUUID();
  await db.createEntry({
    id,
    date,
    start_time,
    end_time,
    category_id,
    note: note || null,
  });
  return NextResponse.json({ id });
}
