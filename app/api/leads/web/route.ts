import { NextRequest, NextResponse } from "next/server";

// Endpoint público para el formulario de contacto de raxislab.com.
// Mapea los campos del formulario web al esquema del leads-api de Hetzner
// y reenvía con la API key oculta en servidor (nunca en el navegador).

const HETZNER = "http://167.233.72.200:8082";
const API_KEY = process.env.LEADS_API_KEY ?? "rxl_leads_k8j3m9n2p5";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function POST(req: NextRequest) {
  let body: Record<string, string> = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400, headers: CORS });
  }

  const name     = (body.name ?? "").trim();
  const email    = (body.email ?? "").trim();
  const business = (body.business ?? "").trim();
  const phone    = (body.phone ?? "").trim();
  const service  = (body.service ?? "").trim();
  const budget   = (body.budget ?? "").trim();
  const message  = (body.message ?? "").trim();

  // Validación mínima
  if (!name || !email) {
    return NextResponse.json({ error: "Nombre y email obligatorios" }, { status: 400, headers: CORS });
  }

  const contacto = [name, email, phone].filter(Boolean).join(" · ");
  const necesita = [service, budget ? `Presupuesto: ${budget}` : ""].filter(Boolean).join(" · ");

  const lead = {
    negocio:    business || name,
    sector:     "",
    ciudad:     "",
    contacto,
    como_llego: "Web raxislab.com",
    necesita,
    notas:      message,
  };

  try {
    const r = await fetch(`${HETZNER}/leads`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-API-Key": API_KEY },
      body: JSON.stringify(lead),
    });
    const data = await r.json();
    return NextResponse.json({ ok: r.ok, ...data }, { status: r.status, headers: CORS });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 502, headers: CORS });
  }
}
