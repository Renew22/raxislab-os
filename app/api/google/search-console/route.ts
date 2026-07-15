import { NextResponse } from 'next/server';
import { getGoogleAccessToken, googleNotConfigured } from '../../../lib/google-auth';

export async function POST(req: Request) {
  const { siteUrl, days = 90 } = await req.json();
  if (!siteUrl) return NextResponse.json({ error: 'siteUrl requerido (ej: "https://desancho.com/")' }, { status: 400 });
  if (googleNotConfigured()) return NextResponse.json({ error: 'Google no configurado' }, { status: 500 });

  try {
    const token = await getGoogleAccessToken();
    const end   = new Date();
    const start = new Date(Date.now() - days * 864e5);
    const fmt   = (d: Date) => d.toISOString().split('T')[0];

    const BASE = `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`;
    const H    = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
    const range = { startDate: fmt(start), endDate: fmt(end) };

    const [totRes, kwRes, pgRes] = await Promise.all([
      fetch(BASE, { method: 'POST', headers: H, body: JSON.stringify({ ...range }), cache: 'no-store' }),
      fetch(BASE, { method: 'POST', headers: H, body: JSON.stringify({ ...range, dimensions: ['query'], rowLimit: 100, dataState: 'all' }), cache: 'no-store' }),
      fetch(BASE, { method: 'POST', headers: H, body: JSON.stringify({ ...range, dimensions: ['page'], rowLimit: 20 }), cache: 'no-store' }),
    ]);

    if (!totRes.ok) {
      const err = await totRes.json();
      return NextResponse.json({ error: err?.error?.message ?? `HTTP ${totRes.status}` }, { status: totRes.status });
    }

    const [totData, kwData, pgData] = await Promise.all([totRes.json(), kwRes.json(), pgRes.json()]);

    const t = totData.rows?.[0] ?? {};

    type KwRow = { keys: string[]; clicks: number; impressions: number; ctr: number; position: number };
    const allKw = (kwData.rows ?? []) as KwRow[];

    const mapKw = (r: KwRow) => ({
      keyword:     r.keys[0],
      clics:       Math.round(r.clicks),
      impresiones: Math.round(r.impressions),
      ctr:         `${(r.ctr * 100).toFixed(1)}%`,
      posicion:    r.position.toFixed(1),
    });

    return NextResponse.json({
      periodo: `${fmt(start)} → ${fmt(end)}`,
      totales: {
        clics:        Math.round(t.clicks ?? 0),
        impresiones:  Math.round(t.impressions ?? 0),
        ctr:          t.ctr      ? `${(t.ctr * 100).toFixed(1)}%` : '—',
        posicion_media: t.position ? (t.position as number).toFixed(1) : '—',
      },
      keywords_top3:        allKw.filter(r => r.position <= 3).slice(0, 15).map(mapKw),
      keywords_oportunidad: allKw.filter(r => r.position > 3 && r.position <= 10).slice(0, 15).map(mapKw),
      keywords_ctr_bajo:    allKw.filter(r => r.ctr < 0.02 && r.impressions > 100).slice(0, 10).map(mapKw),
      paginas_top: ((pgData.rows ?? []) as KwRow[]).slice(0, 15).map(r => ({
        url:         r.keys[0],
        clics:       Math.round(r.clicks),
        impresiones: Math.round(r.impressions),
        posicion:    r.position.toFixed(1),
      })),
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
