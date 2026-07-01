import { NextRequest, NextResponse } from "next/server";

const HETZNER = "http://167.233.72.200:8082";
const API_KEY = process.env.LEADS_API_KEY ?? "rxl_leads_k8j3m9n2p5";

const headers = () => ({
  "Content-Type": "application/json",
  "X-API-Key": API_KEY,
});

export async function GET(req: NextRequest) {
  const columna = req.nextUrl.searchParams.get("columna");
  const url = `${HETZNER}/leads${columna ? `?columna=${columna}` : ""}`;
  try {
    const r = await fetch(url, { headers: headers(), cache: "no-store" });
    const data = await r.json();
    return NextResponse.json(data, { status: r.status });
  } catch (err) {
    return NextResponse.json({ error: String(err), leads: [] }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  try {
    const r = await fetch(`${HETZNER}/leads`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify(body),
    });
    const data = await r.json();
    return NextResponse.json(data, { status: r.status });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const id   = req.nextUrl.searchParams.get("id");
  const body = await req.json();
  if (!id) return NextResponse.json({ error: "id requerido" }, { status: 400 });
  try {
    const r = await fetch(`${HETZNER}/leads/${id}`, {
      method: "PATCH",
      headers: headers(),
      body: JSON.stringify(body),
    });
    const data = await r.json();
    return NextResponse.json(data, { status: r.status });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id requerido" }, { status: 400 });
  try {
    const r = await fetch(`${HETZNER}/leads/${id}`, {
      method: "DELETE",
      headers: headers(),
    });
    const data = await r.json();
    return NextResponse.json(data, { status: r.status });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
