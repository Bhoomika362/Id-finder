import { NextRequest, NextResponse } from "next/server";
import openai from "@/lib/agent";
import { getUsersCollection } from "@/lib/mongo";
import { Document } from "mongodb";

export const runtime = "nodejs";

type SearchBody = {
  query?: string;
  q?: string;
  name?: string;
  limit?: number;
};

async function runSearch(query: string, limit: number) {
  const users = await getUsersCollection();

  // Always pull top 200 users to let AI fuzzy match
  const allUsers = (await users
    .find({}, { projection: { _id: 1, name: 1 } })
    .limit(limit)
    .toArray()) as Document[];

  const candidates = allUsers.map((u) => ({
    id: u._id.toString(),
    name: u.name as string,
  }));

  if (!candidates.length) return null;

  const systemPrompt = `
You are a fuzzy name matcher.
Given a user query and a list of names, choose the one that is *closest in spelling or sound* (e.g., karban ≈ karbon).
Return only JSON: {"id":"...","name":"..."}.
`;

  const userPrompt = `
Query: ${query}
Candidates:
${candidates.map((c, i) => `${i + 1}. ${c.name} | id=${c.id}`).join("\n")}
`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
    });

    const content = completion.choices?.[0]?.message?.content ?? "";
    const parsed = JSON.parse(content);

    if (parsed?.id && parsed?.name) {
      return { id: String(parsed.id), name: String(parsed.name) };
    }
  } catch (err) {
    console.error("OpenAI fallback failed:", err);
  }

  return null;
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as SearchBody;
  const raw = (body.query ?? body.q ?? body.name ?? "").trim();
  const limit = Math.max(1, Math.min(500, Number(body.limit ?? 200)));

  if (!raw) return NextResponse.json({ error: "query is required" }, { status: 400 });

  const query = raw.normalize("NFKC");
  const match = await runSearch(query, limit);
  if (!match) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(match);
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const raw =
    (url.searchParams.get("query") ??
      url.searchParams.get("q") ??
      url.searchParams.get("name") ??
      "").trim();
  const limit = Math.max(
    1,
    Math.min(500, Number(url.searchParams.get("limit") ?? 200))
  );

  if (!raw) return NextResponse.json({ error: "query is required" }, { status: 400 });

  const query = raw.normalize("NFKC");
  const match = await runSearch(query, limit);
  if (!match) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(match);
}
