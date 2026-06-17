import { NextResponse } from 'next/server';

// TODO: integrar Google Ads API real con OAuth refresh_token cuando esté disponible
export async function POST(req: Request) {
  const { customerId } = await req.json();

  if (!customerId) {
    return NextResponse.json({ error: 'customerId requerido.' }, { status: 400 });
  }

  return NextResponse.json({
    inversion:   '—',
    cpl:         '—',
    roas:        '—',
    clics:       '—',
    impresiones: '—',
    leads:       '—',
    ctr:         '—',
    _mock: true,
  });
}
