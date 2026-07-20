import { NextRequest, NextResponse } from 'next/server';
import { getGoogleAccessToken, googleNotConfigured } from '@/app/lib/google-auth';

const ADS_BASE = 'https://googleads.googleapis.com/v21';
const MCC = '7179865639';

export async function POST(req: NextRequest) {
  if (googleNotConfigured()) return NextResponse.json({ error: 'Google no configurado' });
  const devToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN ?? '';
  const body = await req.json();
  const token = await getGoogleAccessToken();

  const ADS_H = { Authorization: `Bearer ${token}`, 'developer-token': devToken, 'login-customer-id': MCC, 'Content-Type': 'application/json' };

  // Arbitrary GAQL query
  if (body.action === 'gaql') {
    const { customerId, query } = body;
    const res = await fetch(`${ADS_BASE}/customers/${customerId}/googleAds:search`, {
      method: 'POST', headers: ADS_H, body: JSON.stringify({ query }), cache: 'no-store',
    });
    return NextResponse.json(await res.json());
  }

  // Campaign status update (remove / pause / enable)
  if (body.action === 'update_campaign_status') {
    const { customerId, campaignIds, status } = body;
    const ops = campaignIds.map((id: string) => (
      status === 'REMOVED'
        ? { remove: `customers/${customerId}/campaigns/${id}` }
        : { update: { resourceName: `customers/${customerId}/campaigns/${id}`, status }, updateMask: 'status' }
    ));
    const res = await fetch(`${ADS_BASE}/customers/${customerId}/campaigns:mutate`, {
      method: 'POST', headers: ADS_H, body: JSON.stringify({ operations: ops }), cache: 'no-store',
    });
    return NextResponse.json(await res.json());
  }

  // Ad group status update
  if (body.action === 'update_adgroup_status') {
    const { customerId, adGroupIds, status } = body;
    const ops = adGroupIds.map((id: string) => ({
      update: { resourceName: `customers/${customerId}/adGroups/${id}`, status }, updateMask: 'status'
    }));
    const res = await fetch(`${ADS_BASE}/customers/${customerId}/adGroups:mutate`, {
      method: 'POST', headers: ADS_H, body: JSON.stringify({ operations: ops }), cache: 'no-store',
    });
    return NextResponse.json(await res.json());
  }

  // Keyword criterion status update
  if (body.action === 'update_keyword_status') {
    const { customerId, adGroupId, criterionIds, status } = body;
    const ops = criterionIds.map((cid: string) => ({
      update: { resourceName: `customers/${customerId}/adGroupCriteria/${adGroupId}~${cid}`, status }, updateMask: 'status'
    }));
    const res = await fetch(`${ADS_BASE}/customers/${customerId}/adGroupCriteria:mutate`, {
      method: 'POST', headers: ADS_H, body: JSON.stringify({ operations: ops }), cache: 'no-store',
    });
    return NextResponse.json(await res.json());
  }

  // Campaign budget update
  if (body.action === 'update_budget') {
    const { customerId, budgetResourceName, amountMicros } = body;
    const res = await fetch(`${ADS_BASE}/customers/${customerId}/campaignBudgets:mutate`, {
      method: 'POST', headers: ADS_H,
      body: JSON.stringify({ operations: [{ update: { resourceName: budgetResourceName, amountMicros }, updateMask: 'amountMicros' }] }),
      cache: 'no-store',
    });
    return NextResponse.json(await res.json());
  }

  // Default: field metadata lookup
  const fieldName = body.field ?? 'campaign.contains_eu_political_advertising';
  const res = await fetch(`${ADS_BASE}/googleAdsFields/${fieldName}`, {
    headers: { Authorization: `Bearer ${token}`, 'developer-token': devToken, 'login-customer-id': MCC },
    cache: 'no-store',
  });
  return NextResponse.json(await res.json());
}

export async function GET() {
  if (googleNotConfigured()) return NextResponse.json({ error: 'Google no configurado' });

  const developerToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN ?? '';

  try {
    const token = await getGoogleAccessToken();

    // Step 1: list accessible customers (no login-customer-id needed)
    const listRes = await fetch(`${ADS_BASE}/customers:listAccessibleCustomers`, {
      headers: { Authorization: `Bearer ${token}`, 'developer-token': developerToken },
      cache: 'no-store',
    });
    const listData = await listRes.json();
    const customers: string[] = listData.resourceNames ?? [];

    // Step 2: for each non-MCC customer, fetch basic info
    const details: object[] = [];
    for (const cust of customers.slice(0, 5)) {
      const custId = cust.replace('customers/', '');
      try {
        const infoRes = await fetch(`${ADS_BASE}/customers/${custId}/googleAds:search`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'developer-token': developerToken,
            'login-customer-id': MCC,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ query: 'SELECT customer.descriptive_name, customer.id, customer.currency_code FROM customer LIMIT 1' }),
          cache: 'no-store',
        });
        const infoData = await infoRes.json();
        const c = infoData.results?.[0]?.customer;
        details.push({ id: custId, name: c?.descriptiveName ?? '?', currency: c?.currencyCode ?? '?' });
      } catch (e) {
        details.push({ id: custId, error: String(e) });
      }
    }

    return NextResponse.json({
      version: 'v21',
      token_preview: token.slice(0, 20) + '...',
      dev_token_prefix: developerToken.slice(0, 8),
      accessible_customers: customers,
      details,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) });
  }
}
