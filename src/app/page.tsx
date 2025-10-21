"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const [name, setName] = useState("");
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const search = new URLSearchParams({ name }).toString();
    router.push(`/users?${search}`);
  }

  return (
    <div className="center">
      <div className="container">
        <div className="card">
          <h1 className="title">Find user</h1>
          <p className="subtitle">Enter a name to check if the user exists.</p>
          <form onSubmit={handleSubmit}>
            <div className="row">
              <input
                className="input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter name"
                name="name"
                aria-label="name"
                required
              />
              <button className="button" type="submit">Search</button>
            </div>
          </form>
          <div className="spacer" />
          <div className="muted">We only store the id and the name.</div>
        </div>
      </div>
    </div>
  );
}
