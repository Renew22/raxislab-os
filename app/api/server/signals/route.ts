import { NextResponse } from "next/server";

const HETZNER = process.env.HETZNER_URL || "http://167.233.72.200";
const KEY     = process.env.HETZNER_DATA_KEY || "";

export async function GET() {
  try {
    const r = await fetch(`${HETZNER}:8893/signals?key=${KEY}`, {
      next: { revalidate: 60 },
    });
    if (!r.ok) return NextResponse.json({ error: "hetzner error" }, { status: 502 });
    const data = await r.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "unreachable" }, { status: 502 });
  }
}

// Webhook de TradingView → guarda señal en la DB de Hetzner
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const r = await fetch(`${HETZNER}:8893/webhook`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(body),
    });
    return NextResponse.json({ ok: r.ok });
  } catch {
    return NextResponse.json({ error: "unreachable" }, { status: 502 });
  }
}
