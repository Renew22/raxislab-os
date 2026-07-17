import { NextRequest, NextResponse } from "next/server";

const BASE = (process.env.HETZNER_URL || "http://167.233.72.200") + ":8880";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const res = await fetch(`${BASE}/api/generate-demo`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(120000),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (e: unknown) {
    return NextResponse.json({ error: "Error generando demo", detail: String(e) }, { status: 500 });
  }
}
