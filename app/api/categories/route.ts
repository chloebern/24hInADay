import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { getDb } from "@/lib/db";

export async function GET() {
  const db = getDb();
  const categories = await db.getCategories();
  return NextResponse.json(categories);
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const name = String(body.name || "").trim();
  const color = String(body.color || "#2a78d6");

  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const db = getDb();
  const id = crypto.randomUUID();
  await db.createCategory({ id, name, color });
  return NextResponse.json({ id, name, color });
}
