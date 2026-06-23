import { NextResponse } from 'next/server';
import { getGoogleAccessToken, googleNotConfigured } from '../../../lib/google-auth';

export async function GET() {
  if (googleNotConfigured()) {
    return NextResponse.json({ error: 'Google no conectado', _notConnected: true }, { status: 401 });
  }

  try {
    const token = await getGoogleAccessToken();

    // Obtener cuentas GBP
    const accountsRes = await fetch(
      'https://mybusinessaccountmanagement.googleapis.com/v1/accounts',
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const accountsData = await accountsRes.json();

    if (accountsData.error) {
      return NextResponse.json({ error: accountsData.error.message ?? 'Error GBP accounts' }, { status: 400 });
    }

    const accounts = accountsData.accounts ?? [];
    if (accounts.length === 0) {
      return NextResponse.json({ accounts: [], locations: [] });
    }

    // Para la primera cuenta, obtener sus fichas
    const accountName = accounts[0].name;
    const locRes = await fetch(
      `https://mybusinessbusinessinformation.googleapis.com/v1/${accountName}/locations?readMask=name,title,phoneNumbers,categories,websiteUri,regularHours,photos,metadata`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const locData = await locRes.json();

    const locations = (locData.locations ?? []).map((l: Record<string, unknown>) => ({
      name:    l.name,
      title:   l.title ?? '—',
      phone:   (l.phoneNumbers as { primaryPhone?: string } | undefined)?.primaryPhone ?? '—',
      website: l.websiteUri ?? '—',
    }));

    return NextResponse.json({ accounts: accounts.map((a: { name: string; accountName: string }) => ({ name: a.name, displayName: a.accountName })), locations });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error GBP' }, { status: 500 });
  }
}

// POST: publicar post en GBP
export async function POST(req: Request) {
  const { locationName, summary, topicType = 'STANDARD' } = await req.json();

  if (!locationName || !summary) {
    return NextResponse.json({ error: 'locationName y summary requeridos' }, { status: 400 });
  }

  if (googleNotConfigured()) {
    return NextResponse.json({ error: 'Google no conectado', _notConnected: true }, { status: 401 });
  }

  try {
    const token = await getGoogleAccessToken();

    const res = await fetch(
      `https://mybusiness.googleapis.com/v4/${locationName}/localPosts`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ summary, topicType }),
      }
    );
    const data = await res.json();

    if (data.error) {
      return NextResponse.json({ error: data.error.message ?? 'Error al publicar post GBP' }, { status: 400 });
    }

    return NextResponse.json({ success: true, post: data });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error al publicar en GBP' }, { status: 500 });
  }
}
