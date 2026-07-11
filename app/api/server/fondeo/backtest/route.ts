import { NextResponse } from "next/server";

export async function GET() {
  const base = (process.env.HETZNER_URL ?? "http://167.233.72.200").trim();
  const key  = process.env.HETZNER_DATA_KEY ?? "";
  if (!key) return NextResponse.json({ error: "HETZNER_DATA_KEY no configurada" }, { status: 500 });
  try {
    const res = await fetch(`${base}/data/fondeo/backtest?key=${encodeURIComponent(key)}`, {
      signal: AbortSignal.timeout(8000),
    });
    return NextResponse.json(await res.json());
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 502 });
  }
}
