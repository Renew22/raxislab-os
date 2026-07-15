import { NextResponse } from 'next/server';
import { getGoogleAccessToken, googleNotConfigured } from '../../../lib/google-auth';

type Dim = { dimensionValues: { value: string }[] };
type Met = { metricValues: { value: string }[] };
type Row = Dim & Met;

export async function POST(req: Request) {
  const { propertyId, days = 90 } = await req.json();
  if (!propertyId) return NextResponse.json({ error: 'propertyId requerido (ID numérico GA4)' }, { status: 400 });
  if (googleNotConfigured()) return NextResponse.json({ error: 'Google no configurado' }, { status: 500 });

  try {
    const token = await getGoogleAccessToken();
    const end   = new Date();
    const start = new Date(Date.now() - days * 864e5);
    const fmt   = (d: Date) => d.toISOString().split('T')[0];
    const dateRanges = [{ startDate: fmt(start), endDate: fmt(end) }];

    const post = (body: object) =>
      fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        cache: 'no-store',
      });

    const [chanRes, convRes, pagesRes] = await Promise.all([
      post({
        dateRanges,
        metrics: [
          { name: 'sessions' }, { name: 'totalUsers' }, { name: 'screenPageViews' },
          { name: 'bounceRate' }, { name: 'averageSessionDuration' },
        ],
        dimensions: [{ name: 'sessionDefaultChannelGrouping' }],
        limit: 8,
      }),
      post({
        dateRanges,
        metrics: [{ name: 'eventCount' }, { name: 'conversions' }],
        dimensions: [{ name: 'eventName' }],
        dimensionFilter: {
          filter: { fieldName: 'isConversionEvent', stringFilter: { value: 'true' } },
        },
        limit: 20,
      }),
      post({
        dateRanges,
        metrics: [{ name: 'sessions' }, { name: 'conversions' }],
        dimensions: [{ name: 'pagePath' }],
        orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
        limit: 50,
      }),
    ]);

    if (!chanRes.ok) {
      const err = await chanRes.json();
      return NextResponse.json({ error: err?.error?.message ?? `HTTP ${chanRes.status}` }, { status: chanRes.status });
    }

    const [chanData, convData, pagesData] = await Promise.all([
      chanRes.json(), convRes.json(), pagesRes.json(),
    ]);

    const totals = chanData.totals?.[0]?.metricValues ?? [];
    const canales = (chanData.rows ?? []).map((r: Row) => ({
      canal:    r.dimensionValues[0]?.value ?? '—',
      sessions: parseInt(r.metricValues[0]?.value ?? '0'),
      users:    parseInt(r.metricValues[1]?.value ?? '0'),
    }));

    const conversiones = (convData.rows ?? []).map((r: Row) => ({
      evento:      r.dimensionValues[0]?.value,
      ocurrencias: parseInt(r.metricValues[0]?.value ?? '0'),
      conversiones: parseInt(r.metricValues[1]?.value ?? '0'),
    }));

    const paginas_sin_conversion = (pagesData.rows ?? [])
      .map((r: Row) => ({
        url:         r.dimensionValues[0]?.value,
        sessions:    parseInt(r.metricValues[0]?.value ?? '0'),
        conversiones: parseInt(r.metricValues[1]?.value ?? '0'),
      }))
      .filter((p: { sessions: number; conversiones: number }) => p.sessions > 10 && p.conversiones === 0)
      .slice(0, 10);

    return NextResponse.json({
      periodo: `${fmt(start)} → ${fmt(end)}`,
      totales: {
        sesiones:       parseInt(totals[0]?.value ?? '0'),
        usuarios:       parseInt(totals[1]?.value ?? '0'),
        paginas_vistas: parseInt(totals[2]?.value ?? '0'),
        tasa_rebote:    `${(parseFloat(totals[3]?.value ?? '0') * 100).toFixed(1)}%`,
        duracion_media: (() => { const s = parseFloat(totals[4]?.value ?? '0'); return `${Math.floor(s / 60)}m ${Math.round(s % 60)}s`; })(),
        fuente_principal: canales[0]?.canal ?? '—',
      },
      canales,
      conversiones,
      paginas_sin_conversion,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
