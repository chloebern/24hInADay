import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { getDb } from "@/lib/db";

export async function GET() {
  const db = getDb();
  const groups = await db.getGroups();
  return NextResponse.json(groups);
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const name = String(body.name || "").trim();
  const color = String(body.color || "#2a78d6");

  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const db = getDb();
  const existing = await db.getGroups();
  const position = existing.length;
  const id = crypto.randomUUID();
  await db.createGroup({ id, name, color, position });
  return NextResponse.json({ id, name, color, position });
}
