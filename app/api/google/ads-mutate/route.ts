import { NextRequest, NextResponse } from 'next/server';
import { getGoogleAccessToken, googleNotConfigured } from '@/app/lib/google-auth';

const ADS_BASE = 'https://googleads.googleapis.com/v21';
const MCC_ID   = '7179865639';

async function adsPost(token: string, devToken: string, customerId: string, body: object) {
  const res = await fetch(`${ADS_BASE}/customers/${customerId}/googleAds:search`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'developer-token': devToken,
      'login-customer-id': MCC_ID,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    cache: 'no-store',
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message ?? `HTTP ${res.status}`);
  return data;
}

async function adsMutate(token: string, devToken: string, customerId: string, operations: object[]) {
  const res = await fetch(`${ADS_BASE}/customers/${customerId}/adGroupCriteria:mutate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'developer-token': devToken,
      'login-customer-id': MCC_ID,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ operations }),
    cache: 'no-store',
  });
  const data = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(data?.error ?? data).slice(0, 400));
  return data;
}

// GET /api/google/ads-mutate?customerId=7395427320 → list all keywords with criterion IDs
// POST /api/google/ads-mutate → { action: 'pause_keyword'|'enable_keyword', customerId, criterionResourceName }
export async function GET(req: NextRequest) {
  if (googleNotConfigured()) return NextResponse.json({ error: 'Google no configurado' });
  const devToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN ?? '';
  const { searchParams } = new URL(req.url);
  const customerId = searchParams.get('customerId');
  if (!customerId) return NextResponse.json({ error: 'customerId requerido' }, { status: 400 });

  try {
    const token = await getGoogleAccessToken();
    const query = `
      SELECT
        ad_group_criterion.resource_name,
        ad_group_criterion.criterion_id,
        ad_group_criterion.keyword.text,
        ad_group_criterion.keyword.match_type,
        ad_group_criterion.status,
        ad_group_criterion.quality_info.quality_score,
        ad_group.id,
        ad_group.name,
        campaign.id,
        campaign.name,
        campaign.status,
        metrics.cost_micros,
        metrics.clicks,
        metrics.impressions,
        metrics.conversions
      FROM keyword_view
      WHERE campaign.status = 'ENABLED'
        AND ad_group.status = 'ENABLED'
      ORDER BY metrics.cost_micros DESC
      LIMIT 100
    `;
    const data = await adsPost(token, devToken, customerId, { query });
    type KWRow = {
      adGroupCriterion: {
        resourceName: string;
        criterionId: string;
        keyword: { text: string; matchType: string };
        status: string;
        qualityInfo?: { qualityScore?: number };
      };
      adGroup: { id: string; name: string };
      campaign: { id: string; name: string; status: string };
      metrics: { costMicros: number; clicks: number; impressions: number; conversions: number };
    };
    const keywords = (data.results ?? []).map((r: KWRow) => ({
      resource_name: r.adGroupCriterion.resourceName,
      criterion_id:  r.adGroupCriterion.criterionId,
      text:          r.adGroupCriterion.keyword.text,
      match_type:    r.adGroupCriterion.keyword.matchType,
      status:        r.adGroupCriterion.status,
      qs:            r.adGroupCriterion.qualityInfo?.qualityScore ?? null,
      campaign:      r.campaign.name,
      ad_group:      r.adGroup.name,
      cost:          parseFloat(((r.metrics.costMicros ?? 0) / 1e6).toFixed(2)),
      clicks:        r.metrics.clicks ?? 0,
      impressions:   r.metrics.impressions ?? 0,
      conversions:   r.metrics.conversions ?? 0,
    }));
    return NextResponse.json({ customerId, total: keywords.length, keywords });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (googleNotConfigured()) return NextResponse.json({ error: 'Google no configurado' });
  const devToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN ?? '';

  try {
    const token = await getGoogleAccessToken();
    const body = await req.json();
    const { action, customerId, criterionResourceName } = body;

    if (!customerId || !criterionResourceName) {
      return NextResponse.json({ error: 'customerId y criterionResourceName requeridos' }, { status: 400 });
    }

    const newStatus = action === 'pause_keyword' ? 'PAUSED' : action === 'enable_keyword' ? 'ENABLED' : null;
    if (!newStatus) return NextResponse.json({ error: 'action debe ser pause_keyword o enable_keyword' }, { status: 400 });

    const operations = [{
      update: { resourceName: criterionResourceName, status: newStatus },
      updateMask: 'status',
    }];

    const result = await adsMutate(token, devToken, customerId, operations);
    return NextResponse.json({ ok: true, action, criterionResourceName, result });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
