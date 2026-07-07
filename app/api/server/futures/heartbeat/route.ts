import { NextResponse } from "next/server";

export async function GET() {
  const base = process.env.HETZNER_URL ?? "http://167.233.72.200";
  const key  = process.env.HETZNER_DATA_KEY ?? "";
  if (!key) return NextResponse.json({ error: "HETZNER_DATA_KEY no configurada" }, { status: 500 });
  try {
    const res = await fetch(`${base}/data/futures/heartbeat?key=${encodeURIComponent(key)}`, {
      signal: AbortSignal.timeout(5000),
    });
    return NextResponse.json(await res.json());
  } catch (e) {
    return NextResponse.json({ error: String(e), alive: false }, { status: 502 });
  }
}
