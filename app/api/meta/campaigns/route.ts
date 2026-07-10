import { NextResponse } from 'next/server';

const CLIENT_TOKENS: Record<string, string> = {
  'identity-peluqueros':   'META_TOKEN_IDENTITY',
  'desancho-estilistas':   'META_TOKEN_DESANCHO',
  'matias-benegas-tattoo': 'META_TOKEN_MATIAS',
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const accountId = searchParams.get('accountId');
  const clientId  = searchParams.get('clientId') ?? '';

  if (!accountId) {
    return NextResponse.json({ error: 'accountId requerido.' }, { status: 400 });
  }

  const tokenEnvKey = CLIENT_TOKENS[clientId];
  const token = (tokenEnvKey && process.env[tokenEnvKey]) || process.env.META_ACCESS_TOKEN;
  if (!token) {
    return NextResponse.json({ error: 'Token de Meta no configurado.' }, { status: 500 });
  }

  try {
    const url = `https://graph.facebook.com/v21.0/${accountId}/campaigns?fields=name,status,daily_budget,budget_remaining`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();

    if (data.error) {
      if (data.error.code === 190) {
        return NextResponse.json({ error: 'Token de Meta expirado.' }, { status: 401 });
      }
      return NextResponse.json({ error: data.error.message }, { status: 400 });
    }

    return NextResponse.json({ campaigns: data.data ?? [] });
  } catch {
    return NextResponse.json({ error: 'Error de red al contactar con Meta.' }, { status: 500 });
  }
}
