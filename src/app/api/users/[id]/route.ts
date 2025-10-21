import { NextResponse } from "next/server";
import { getUsersCollection, ObjectId } from "@/lib/mongo";

type Params = { params: { id: string } };

export const runtime = "nodejs";

export async function GET(_: Request, { params }: Params) {
  const id = params.id;
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  let objectId: ObjectId;
  try {
    objectId = new ObjectId(id);
  } catch {
    return NextResponse.json({ error: "invalid id" }, { status: 400 });
  }

  const users = await getUsersCollection();
  const user = await users.findOne({ _id: objectId });
  if (!user) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ id: user._id.toHexString(), name: user.name });
}


