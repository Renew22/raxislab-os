import { NextResponse } from 'next/server';
import { getGoogleAccessToken, googleNotConfigured } from '@/app/lib/google-auth';

export async function POST(req: Request) {
  const { customerId, days = 30 } = await req.json();

  if (!customerId) {
    return NextResponse.json({ error: 'customerId requerido.' }, { status: 400 });
  }

  if (googleNotConfigured()) {
    return NextResponse.json(
      { error: 'Google no conectado. Ve a /api/auth/google para autorizar.' },
      { status: 401 }
    );
  }

  // Google Ads API requires a Developer Token approved by Google.
  // While that approval is pending, return a clear placeholder.
  // Once the Developer Token is available, add GOOGLE_ADS_DEVELOPER_TOKEN env var
  // and implement the REST API call to googleads.googleapis.com.
  const developerToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
  if (!developerToken) {
    return NextResponse.json({
      inversion:   '—',
      cpl:         '—',
      roas:        '—',
      clics:       '—',
      impresiones: '—',
      leads:       '—',
      ctr:         '—',
      _pending: true,
      _info: 'Developer Token pendiente. Solicítalo en Google Ads → Centro de API.',
    });
  }

  try {
    const accessToken = await getGoogleAccessToken();
    const end   = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);
    const fmt = (d: Date) => d.toISOString().split('T')[0];

    const query = `
      SELECT
        metrics.cost_micros,
        metrics.clicks,
        metrics.impressions,
        metrics.ctr,
        metrics.conversions,
        metrics.cost_per_conversion,
        metrics.all_conversions_value
      FROM campaign
      WHERE segments.date BETWEEN '${fmt(start)}' AND '${fmt(end)}'
        AND campaign.status = 'ENABLED'
    `;

    const res = await fetch(
      `https://googleads.googleapis.com/v17/customers/${customerId}/googleAds:search`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'developer-token': developerToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
        cache: 'no-store',
      }
    );

    if (!res.ok) {
      const err = await res.json();
      return NextResponse.json(
        { error: err?.error?.message ?? 'Error Google Ads API' },
        { status: res.status }
      );
    }

    const data = await res.json();
    const rows: Array<Record<string, Record<string, number>>> = data.results ?? [];

    let totalCost = 0, totalClicks = 0, totalImpressions = 0, totalConversions = 0, totalValue = 0;
    for (const row of rows) {
      totalCost        += row.metrics?.costMicros       ?? 0;
      totalClicks      += row.metrics?.clicks           ?? 0;
      totalImpressions += row.metrics?.impressions      ?? 0;
      totalConversions += row.metrics?.conversions      ?? 0;
      totalValue       += row.metrics?.allConversionsValue ?? 0;
    }

    const costEur = totalCost / 1_000_000;
    const cpl     = totalConversions > 0 ? costEur / totalConversions : 0;
    const roas    = costEur > 0 ? totalValue / costEur : 0;
    const ctr     = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;

    return NextResponse.json({
      inversion:   `${costEur.toFixed(2)}€`,
      cpl:         cpl   > 0 ? `${cpl.toFixed(2)}€`  : '—',
      roas:        roas  > 0 ? `${roas.toFixed(2)}x` : '—',
      clics:       totalClicks,
      impresiones: totalImpressions,
      leads:       totalConversions > 0 ? `${totalConversions}/mes` : '—',
      ctr:         `${ctr.toFixed(2)}%`,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error desconocido';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
