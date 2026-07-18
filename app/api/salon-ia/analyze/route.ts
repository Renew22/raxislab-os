import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const HETZNER = "http://167.233.72.200:8891/api/salon-ia/analyze";
const SALON_KEY = process.env.SALON_IA_KEY || "rxl_salon_k9m4";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const resp = await fetch(HETZNER, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Salon-Key": SALON_KEY,
      },
      body: JSON.stringify(body),
    });

    const data = await resp.json();
    return NextResponse.json(data, { status: resp.status });
  } catch (err) {
    console.error("[salon-ia proxy]", err);
    return NextResponse.json({ error: "Error al conectar con el servidor IA" }, { status: 502 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
