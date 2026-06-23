import { NextResponse } from 'next/server';
import { getGoogleAccessToken, googleNotConfigured } from '../../../lib/google-auth';

export async function POST(req: Request) {
  const { propertyId, days = 28 } = await req.json();

  if (!propertyId) {
    return NextResponse.json({ error: 'propertyId requerido (ID numérico de GA4, sin "properties/")' }, { status: 400 });
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

    const res = await fetch(
      `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dateRanges: [{ startDate: fmt(start), endDate: fmt(end) }],
          metrics: [
            { name: 'sessions' },
            { name: 'totalUsers' },
            { name: 'screenPageViews' },
            { name: 'bounceRate' },
            { name: 'averageSessionDuration' },
          ],
          dimensions: [{ name: 'sessionDefaultChannelGrouping' }],
          limit: 6,
        }),
      }
    );

    const data = await res.json();

    if (data.error) {
      return NextResponse.json({ error: data.error.message ?? 'Error GA4' }, { status: 400 });
    }

    const rows: { name: string; sessions: number; users: number }[] = (data.rows ?? []).map(
      (r: { dimensionValues: { value: string }[]; metricValues: { value: string }[] }) => ({
        name:     r.dimensionValues[0]?.value ?? '—',
        sessions: parseInt(r.metricValues[0]?.value ?? '0'),
        users:    parseInt(r.metricValues[1]?.value ?? '0'),
      })
    );

    const totals = data.totals?.[0]?.metricValues ?? [];
    const sessions  = parseInt(totals[0]?.value ?? '0');
    const users     = parseInt(totals[1]?.value ?? '0');
    const pageviews = parseInt(totals[2]?.value ?? '0');
    const bounce    = parseFloat(totals[3]?.value ?? '0');
    const duration  = parseFloat(totals[4]?.value ?? '0');
    const topChannel = rows[0]?.name ?? '—';

    return NextResponse.json({
      sesiones:         sessions,
      usuarios:         users,
      paginas_vistas:   pageviews,
      tasa_rebote:      `${(bounce * 100).toFixed(1)}%`,
      duracion_media:   `${Math.floor(duration / 60)}m ${Math.round(duration % 60)}s`,
      fuente_principal: topChannel,
      canales: rows,
    });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error al obtener datos de GA4' }, { status: 500 });
  }
}
