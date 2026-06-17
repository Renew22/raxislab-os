import { NextResponse } from 'next/server';

// TODO: integrar Google Ads API real con refresh_token cuando esté disponible
export async function POST(req: Request) {
  const { customerId } = await req.json();

  if (!customerId) {
    return NextResponse.json({ valid: false, error: 'Customer ID requerido.' }, { status: 400 });
  }

  return NextResponse.json({ valid: true, name: 'Cuenta verificada (simulado)' });
}
