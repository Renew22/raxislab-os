import { NextResponse } from "next/server";

const HETZNER = process.env.HETZNER_URL || "http://167.233.72.200";
const KEY     = process.env.HETZNER_DATA_KEY || "";

// GET /api/server/scorecard — devuelve el último JSON del scorecard histórico
export async function GET() {
  try {
    const r = await fetch(`${HETZNER}/data/scorecard?key=${KEY}`, {
      next: { revalidate: 3600 },
    });
    if (!r.ok) return NextResponse.json({ error: "unavailable" }, { status: 502 });
    return NextResponse.json(await r.json());
  } catch {
    return NextResponse.json({ error: "unreachable" }, { status: 502 });
  }
}
