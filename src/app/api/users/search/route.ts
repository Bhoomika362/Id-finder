import { NextRequest, NextResponse } from "next/server";
import { getUsersCollection } from "@/lib/mongo";
import { Document } from "mongodb";
import { Agent, Runner } from "@openai/agents";

export const runtime = "nodejs";

type SearchBody = {
  query?: string;
  q?: string;
  name?: string;
  limit?: number;
};

// Simple Levenshtein distance to prevent overfitting
function levenshtein(a: string, b: string): number {
  const dp = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i++) dp[i][0] = i;
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  return dp[a.length][b.length];
}

async function runAgentSearch(query: string, limit: number) {
  const users = await getUsersCollection();
  const docs = (await users
    .find({}, { projection: { _id: 1, name: 1 } })
    .limit(limit)
    .toArray()) as Document[];

  const candidates = docs.map((d) => ({
    id: d._id.toString(),
    name: d.name as string,
  }));

  if (!candidates.length) return null;

  // Basic numeric filter before calling AI
  const closestDistance = Math.min(
    ...candidates.map((c) => levenshtein(query.toLowerCase(), c.name.toLowerCase()))
  );

  // Skip AI if everything is too far (distance > 3)
  if (closestDistance > 3) return null;

  const agent = new Agent({
    model: "gpt-5-mini",
    name: "User Fuzzy Search Agent",
    instructions: `
You are a strict fuzzy name matcher.
- Find the user whose name *closely resembles* the given query by spelling or sound.
- If the query is clearly unrelated (too different in letters or sound), return {"id": null, "name": null}.
- Example: query="karban" → match "karbon".
- Example: query="mansi" → return {"id": null, "name": null}.
Return only strict JSON.`,
    tools: [],
  });

  const runner = new Runner();
  const result = await runner.run(agent, [
    {
      role: "user",
      content: [
        {
          type: "input_text",
          text: `Query: ${query}\nCandidates:\n${candidates
            .map((c) => `${c.name} | id=${c.id}`)
            .join("\n")}`,
        },
      ],
    },
  ]);

  const output = result.finalOutput?.trim() || "";
  try {
    const parsed = JSON.parse(output);
    if (parsed?.id && parsed?.name) return parsed;
  } catch {
    return null;
  }

  return null;
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as SearchBody;
  const raw = (body.query ?? body.q ?? body.name ?? "").trim();
  const limit = Math.max(1, Math.min(500, Number(body.limit ?? 200)));

  if (!raw) return NextResponse.json({ error: "query is required" }, { status: 400 });

  const match = await runAgentSearch(raw, limit);
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

  const match = await runAgentSearch(raw, limit);
  if (!match) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(match);
}
