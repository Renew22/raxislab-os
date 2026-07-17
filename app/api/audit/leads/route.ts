import { NextResponse } from "next/server";

const BASE = (process.env.HETZNER_URL || "http://167.233.72.200") + ":8880";

export async function GET() {
  try {
    const res = await fetch(`${BASE}/api/leads`, { signal: AbortSignal.timeout(10000) });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (e: unknown) {
    return NextResponse.json({ error: "Error obteniendo leads", detail: String(e) }, { status: 500 });
  }
}
