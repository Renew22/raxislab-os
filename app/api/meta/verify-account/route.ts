import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { accountId } = await req.json();

  if (!accountId) {
    return NextResponse.json({ valid: false, error: 'Account ID requerido.' }, { status: 400 });
  }

  const token = process.env.META_ACCESS_TOKEN;
  if (!token) {
    return NextResponse.json({ valid: false, error: 'Token de Meta no configurado en el servidor.' }, { status: 500 });
  }

  try {
    const res = await fetch(
      `https://graph.facebook.com/v21.0/${accountId}?fields=name,account_status`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const data = await res.json();

    if (data.error) {
      if (data.error.code === 190) {
        return NextResponse.json({ valid: false, error: 'Token de Meta expirado. Renuévalo en Business Manager.' });
      }
      return NextResponse.json({ valid: false, error: data.error.message || 'Error al verificar la cuenta.' });
    }

    return NextResponse.json({ valid: true, name: data.name || accountId });
  } catch {
    return NextResponse.json({ valid: false, error: 'Error de red al contactar con Meta.' }, { status: 500 });
  }
}
