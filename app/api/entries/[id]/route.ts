import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
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
  await db.updateEntry(
    { id, date, start_time, end_time, note: note || null },
    tag_ids
  );
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = getDb();
  await db.deleteEntry(id);
  return NextResponse.json({ ok: true });
}
