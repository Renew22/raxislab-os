import { NextRequest, NextResponse } from "next/server";

const SCANNER = "http://167.233.72.200:8880";

export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action");

  const path = action === "demo" ? "/api/generate-demo" : "/api/audit-scan";
  const body = await req.text();

  try {
    const res = await fetch(`${SCANNER}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      signal: AbortSignal.timeout(120000),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const res = await fetch(`${SCANNER}/api/leads`, {
      signal: AbortSignal.timeout(10000),
    });
    const data = await res.json();
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
