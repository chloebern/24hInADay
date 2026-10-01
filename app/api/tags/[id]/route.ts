import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const name = String(body.name || "").trim();
  const color = String(body.color || "");
  const groupIds = Array.isArray(body.group_ids) ? body.group_ids.map(String) : [];

  if (!name || !color) {
    return NextResponse.json({ error: "Name and color are required" }, { status: 400 });
  }

  const db = getDb();
  await db.updateTag(id, name, color, groupIds);
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = getDb();
  await db.deleteTag(id);
  return NextResponse.json({ ok: true });
}
