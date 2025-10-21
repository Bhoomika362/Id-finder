import Link from "next/link";

type SearchParams = { searchParams: { name?: string } };

async function fetchMatch(name: string) {
  const url = new URL(`${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/users/search`);
  url.searchParams.set("name", name);
  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) return null;
  return (await res.json()) as { id: string; name: string } | null;
}

export default async function UsersResult({ searchParams }: SearchParams) {
  const name = (searchParams.name || "").trim();
  if (!name) {
    return (
      <div className="center"><div className="container"><div className="card"><div className="title">Enter a name</div><Link className="link" href="/">← Back</Link></div></div></div>
    );
  }

  const match = await fetchMatch(name);
  if (!match) {
    return (
      <div className="center"><div className="container"><div className="card"><div className="title">Oppsie User not present</div><div className="spacer" /><Link className="link" href="/">← Back</Link></div></div></div>
    );
  }

  return (
    <div className="center">
      <div className="container">
        <div className="card">
          <h1 className="title">User found</h1>
          <p className="subtitle">We found a user matching your search.</p>
          <div className="muted">id</div>
          <div>{match.id}</div>
          <div className="spacer" />
          <div className="muted">name</div>
          <div>{match.name}</div>
          <div className="spacer" />
          <Link className="link" href="/">← Back</Link>
        </div>
      </div>
    </div>
  );
}


