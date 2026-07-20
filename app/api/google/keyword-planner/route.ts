import { NextRequest, NextResponse } from 'next/server';
import { getGoogleAccessToken, googleNotConfigured } from '@/app/lib/google-auth';

const ADS_BASE = 'https://googleads.googleapis.com/v21';
const MCC_ID   = '7179865639';

async function adsSearch(token: string, devToken: string, customerId: string, query: string) {
  const res = await fetch(`${ADS_BASE}/customers/${customerId}/googleAds:search`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'developer-token': devToken,
      'login-customer-id': MCC_ID,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query }),
    cache: 'no-store',
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? `HTTP ${res.status}`);
  return data;
}

// POST /api/google/keyword-planner
// { customerId, days?: number }
// Returns real search terms from search_term_view with monthly seasonality breakdown
export async function POST(req: NextRequest) {
  if (googleNotConfigured()) return NextResponse.json({ error: 'Google no configurado' });
  const devToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN ?? '';

  try {
    const token = await getGoogleAccessToken();
    const { customerId, days = 365 } = await req.json();

    if (!customerId) return NextResponse.json({ error: 'customerId requerido' }, { status: 400 });

    const end   = new Date();
    const start = new Date(Date.now() - days * 864e5);
    const fmt   = (d: Date) => d.toISOString().split('T')[0];

    // Get search terms with monthly breakdown for seasonality
    const queryMonthly = `
      SELECT
        search_term_view.search_term,
        segments.month,
        metrics.impressions,
        metrics.clicks,
        metrics.cost_micros,
        metrics.conversions,
        search_term_view.status
      FROM search_term_view
      WHERE segments.date BETWEEN '${fmt(start)}' AND '${fmt(end)}'
        AND metrics.impressions > 5
        AND campaign.status = 'ENABLED'
      ORDER BY metrics.impressions DESC
      LIMIT 1000
    `;

    const data = await adsSearch(token, devToken, customerId, queryMonthly);

    type STRow = {
      searchTermView: { searchTerm: string; status: string };
      segments: { month: string };
      metrics: { impressions: number; clicks: number; costMicros: number; conversions: number };
    };

    // Aggregate by term across months
    const termMap = new Map<string, {
      impressions: number; clicks: number; cost: number; conversions: number;
      monthly: Map<string, { impressions: number; clicks: number }>;
      status: string;
    }>();

    for (const row of (data.results ?? []) as STRow[]) {
      const term   = row.searchTermView.searchTerm;
      const month  = row.segments.month?.slice(0, 7) ?? 'unknown';
      const imp    = parseInt(String(row.metrics.impressions ?? 0));
      const clicks = parseInt(String(row.metrics.clicks ?? 0));
      const cost   = parseInt(String(row.metrics.costMicros ?? 0)) / 1e6;
      const conv   = parseFloat(String(row.metrics.conversions ?? 0));

      if (!termMap.has(term)) {
        termMap.set(term, { impressions: 0, clicks: 0, cost: 0, conversions: 0, monthly: new Map(), status: row.searchTermView.status });
      }
      const t = termMap.get(term)!;
      t.impressions  += imp;
      t.clicks       += clicks;
      t.cost         += cost;
      t.conversions  += conv;
      const m = t.monthly.get(month) ?? { impressions: 0, clicks: 0 };
      m.impressions += imp;
      m.clicks      += clicks;
      t.monthly.set(month, m);
    }

    // Build results sorted by impressions
    const results = Array.from(termMap.entries())
      .map(([term, d]) => {
        const monthly = Array.from(d.monthly.entries())
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([month, v]) => ({ month, ...v }));
        const peak = monthly.reduce((mx, v) => v.impressions > mx.impressions ? v : mx, { month: '', impressions: 0, clicks: 0 });
        const low  = monthly.filter(v => v.impressions > 0).reduce((mn, v) => v.impressions < mn.impressions ? v : mn, { month: '', impressions: 999999, clicks: 0 });
        return {
          term,
          status: d.status,
          total_impressions: d.impressions,
          total_clicks: d.clicks,
          ctr: d.impressions > 0 ? parseFloat((d.clicks / d.impressions * 100).toFixed(1)) : 0,
          total_cost: parseFloat(d.cost.toFixed(2)),
          cpc: d.clicks > 0 ? parseFloat((d.cost / d.clicks).toFixed(2)) : 0,
          total_conversions: parseFloat(d.conversions.toFixed(1)),
          peak_month: peak.month,
          peak_impressions: peak.impressions,
          low_month: low.month === '' ? null : low.month,
          low_impressions: low.impressions === 999999 ? 0 : low.impressions,
          seasonality_ratio: low.impressions > 0 && low.impressions < 999999 ? parseFloat((peak.impressions / low.impressions).toFixed(1)) : null,
          monthly,
        };
      })
      .sort((a, b) => b.total_impressions - a.total_impressions);

    // Group by intent category (simple heuristic)
    const categories: Record<string, typeof results> = {
      balayage: [],
      alisado: [],
      corte: [],
      color_mechas: [],
      extensiones: [],
      airtouch_babylights: [],
      peluqueria_general: [],
      otros: [],
    };

    for (const r of results) {
      const t = r.term.toLowerCase();
      if (t.includes('balayage') || t.includes('mechas balayage')) categories.balayage.push(r);
      else if (t.includes('alisado') || t.includes('keratina') || t.includes('lissage')) categories.alisado.push(r);
      else if (t.includes('corte') || t.includes('peinado') || t.includes('pelo corto')) categories.corte.push(r);
      else if (t.includes('color') || t.includes('tinte') || t.includes('mechas') || t.includes('babylights')) categories.color_mechas.push(r);
      else if (t.includes('extensi')) categories.extensiones.push(r);
      else if (t.includes('airtouch') || t.includes('babylight')) categories.airtouch_babylights.push(r);
      else if (t.includes('peluquer') || t.includes('salon') || t.includes('estilista') || t.includes('barberia')) categories.peluqueria_general.push(r);
      else categories.otros.push(r);
    }

    return NextResponse.json({
      customerId,
      period: `${fmt(start)} → ${fmt(end)}`,
      total_terms: results.length,
      top_50: results.slice(0, 50),
      by_category: Object.fromEntries(
        Object.entries(categories).map(([k, v]) => [k, {
          count: v.length,
          total_impressions: v.reduce((s, r) => s + r.total_impressions, 0),
          top_10: v.slice(0, 10),
        }])
      ),
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

