import { NextResponse } from 'next/server';
import { getGoogleAccessToken, googleNotConfigured } from '@/app/lib/google-auth';

const MCC_ID = '7179865639';

export async function POST(req: Request) {
  const { customerId, days = 30 } = await req.json();
  if (!customerId) return NextResponse.json({ error: 'customerId requerido' }, { status: 400 });

  const developerToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
  if (!developerToken || googleNotConfigured()) {
    return NextResponse.json({ error: 'GOOGLE_ADS_DEVELOPER_TOKEN no configurado en Vercel' }, { status: 500 });
  }

  try {
    const token = await getGoogleAccessToken();
    const end   = new Date();
    const start = new Date(Date.now() - days * 864e5);
    const fmt   = (d: Date) => d.toISOString().split('T')[0];

    const query = `
      SELECT
        campaign.id,
        campaign.name,
        campaign.status,
        campaign.advertising_channel_type,
        campaign.bidding_strategy_type,
        campaign.start_date,
        metrics.cost_micros,
        metrics.clicks,
        metrics.impressions,
        metrics.ctr,
        metrics.average_cpc,
        metrics.conversions,
        metrics.cost_per_conversion,
        metrics.all_conversions,
        metrics.all_conversions_value
      FROM campaign
      WHERE segments.date BETWEEN '${fmt(start)}' AND '${fmt(end)}'
      ORDER BY metrics.cost_micros DESC
    `;

    const res = await fetch(
      `https://googleads.googleapis.com/v17/customers/${customerId}/googleAds:search`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'developer-token': developerToken,
          'login-customer-id': MCC_ID,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
        cache: 'no-store',
      }
    );

    if (!res.ok) {
      const err = await res.json();
      return NextResponse.json({ error: err?.error?.message ?? `HTTP ${res.status}` }, { status: res.status });
    }

    const data = await res.json();
    type Row = { campaign: Record<string, unknown>; metrics: Record<string, number> };
    const rows: Row[] = data.results ?? [];

    const campaigns = rows.map(r => {
      const cost = (r.metrics.costMicros ?? 0) / 1_000_000;
      const conv = r.metrics.conversions ?? 0;
      const cpc  = (r.metrics.averageCpc ?? 0) / 1_000_000;
      return {
        id:       r.campaign.id,
        name:     r.campaign.name as string,
        status:   r.campaign.status as string,
        tipo:     r.campaign.advertisingChannelType as string,
        bid:      r.campaign.biddingStrategyType as string,
        gasto:    parseFloat(cost.toFixed(2)),
        clics:    Math.round(r.metrics.clicks ?? 0),
        impresiones: Math.round(r.metrics.impressions ?? 0),
        ctr:      parseFloat(((r.metrics.ctr ?? 0) * 100).toFixed(2)),
        cpc:      parseFloat(cpc.toFixed(3)),
        conversiones: parseFloat((conv).toFixed(1)),
        cpl:      conv > 0 ? parseFloat((cost / conv).toFixed(2)) : null,
        valor:    parseFloat((r.metrics.allConversionsValue ?? 0).toFixed(2)),
        roas:     cost > 0 ? parseFloat(((r.metrics.allConversionsValue ?? 0) / cost).toFixed(2)) : null,
      };
    });

    const totals = campaigns.reduce(
      (acc, c) => ({
        gasto:        acc.gasto + c.gasto,
        clics:        acc.clics + c.clics,
        impresiones:  acc.impresiones + c.impresiones,
        conversiones: acc.conversiones + c.conversiones,
      }),
      { gasto: 0, clics: 0, impresiones: 0, conversiones: 0 }
    );

    return NextResponse.json({
      periodo: `${fmt(start)} → ${fmt(end)}`,
      totales: {
        ...totals,
        ctr:  totals.impresiones > 0 ? parseFloat((totals.clics / totals.impresiones * 100).toFixed(2)) : 0,
        cpc:  totals.clics > 0 ? parseFloat((totals.gasto / totals.clics).toFixed(3)) : 0,
        cpl:  totals.conversiones > 0 ? parseFloat((totals.gasto / totals.conversiones).toFixed(2)) : null,
      },
      campanas: campaigns,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
