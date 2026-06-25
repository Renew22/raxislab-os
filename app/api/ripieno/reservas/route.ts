import { NextRequest, NextResponse } from 'next/server';

const RIPIENO_API = process.env.RIPIENO_API_URL || 'https://ripieno.raxislab.com';
const ADMIN_KEY   = process.env.RIPIENO_ADMIN_KEY || '';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const fecha  = searchParams.get('fecha')  || '';
  const estado = searchParams.get('estado') || '';

  const params = new URLSearchParams();
  if (fecha)  params.set('fecha', fecha);
  if (estado) params.set('estado', estado);

  try {
    const res = await fetch(`${RIPIENO_API}/api/reservas?${params.toString()}`, {
      headers: { 'x-admin-key': ADMIN_KEY },
      cache: 'no-store',
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: 'Error conectando con backend Ripieno.' }, { status: 502 });
  }
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const id   = body.id;
  const estado = body.estado;

  try {
    const res = await fetch(`${RIPIENO_API}/api/reservas/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-admin-key': ADMIN_KEY },
      body: JSON.stringify({ estado }),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: 'Error actualizando reserva.' }, { status: 502 });
  }
}
