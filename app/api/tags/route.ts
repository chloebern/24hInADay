import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { getDb } from "@/lib/db";

export async function GET() {
  const db = getDb();
  const tags = await db.getTags();
  return NextResponse.json(tags);
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const name = String(body.name || "").trim();
  const color = String(body.color || "#2a78d6");
  const groupIds = Array.isArray(body.group_ids) ? body.group_ids.map(String) : [];

  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const db = getDb();
  const id = crypto.randomUUID();
  await db.createTag({ id, name, color }, groupIds);
  return NextResponse.json({ id, name, color, group_ids: groupIds });
}
