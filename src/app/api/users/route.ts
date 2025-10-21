import { NextRequest, NextResponse } from "next/server";
import { getUsersCollection, ObjectId } from "@/lib/mongo";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  if (!name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  const users = await getUsersCollection();
  const { insertedId } = await users.insertOne({ _id: new ObjectId(), name });
  return NextResponse.json({ id: insertedId.toHexString(), name });
}


