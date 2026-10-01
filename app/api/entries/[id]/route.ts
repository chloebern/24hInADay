import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
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
  await db.updateEntry({
    id,
    date,
    start_time,
    end_time,
    category_id,
    note: note || null,
  });
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
