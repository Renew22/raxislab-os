import { NextResponse } from 'next/server';
import { getGoogleAccessToken, googleNotConfigured } from '../../../lib/google-auth';

export async function POST(req: Request) {
  const { siteUrl, days = 28 } = await req.json();

  if (!siteUrl) {
    return NextResponse.json({ error: 'siteUrl requerido (ej: "https://raxislab.com/")' }, { status: 400 });
  }

  if (googleNotConfigured()) {
    return NextResponse.json({ error: 'Google no conectado', _notConnected: true }, { status: 401 });
  }

  try {
    const token = await getGoogleAccessToken();

    const end   = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);
    const fmt = (d: Date) => d.toISOString().split('T')[0];

    const BASE = `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`;
    const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
    const range   = { startDate: fmt(start), endDate: fmt(end) };

    const [totalsRes, keywordsRes] = await Promise.all([
      fetch(BASE, { method: 'POST', headers, body: JSON.stringify({ ...range }) }),
      fetch(BASE, { method: 'POST', headers, body: JSON.stringify({ ...range, dimensions: ['query'], rowLimit: 10 }) }),
    ]);

    const [totalsData, keywordsData] = await Promise.all([totalsRes.json(), keywordsRes.json()]);

    if (totalsData.error) {
      return NextResponse.json({ error: totalsData.error.message ?? 'Error Search Console' }, { status: 400 });
    }

    const t = totalsData.rows?.[0] ?? {};

    return NextResponse.json({
      clics:         Math.round(t.clicks ?? 0),
      impresiones:   Math.round(t.impressions ?? 0),
      ctr:           t.ctr      ? `${(t.ctr * 100).toFixed(1)}%` : '—',
      posicionMedia: t.position ? t.position.toFixed(1)          : '—',
      keywords: (keywordsData.rows ?? []).map((r: { keys: string[]; clicks: number; impressions: number; position: number }) => ({
        query:       r.keys[0],
        clics:       Math.round(r.clicks),
        impresiones: Math.round(r.impressions),
        posicion:    r.position.toFixed(1),
      })),
    });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error al obtener datos de Search Console' }, { status: 500 });
  }
}
