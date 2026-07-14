import { NextResponse } from 'next/server';
import { getGoogleAccessToken, googleNotConfigured } from '@/app/lib/google-auth';

const MCC_ID = '7179865639';

export async function POST(req: Request) {
  const { customerId } = await req.json();
  if (!customerId) return NextResponse.json({ valid: false, error: 'Customer ID requerido.' }, { status: 400 });

  const developerToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
  if (!developerToken || googleNotConfigured()) {
    return NextResponse.json({ valid: false, error: 'Google Ads no configurado (GOOGLE_ADS_DEVELOPER_TOKEN o refresh token faltante).' }, { status: 500 });
  }

  try {
    const accessToken = await getGoogleAccessToken();
    const res = await fetch(
      `https://googleads.googleapis.com/v17/customers/${customerId}/googleAds:search`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'developer-token': developerToken,
          'login-customer-id': MCC_ID,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: 'SELECT customer.descriptive_name, customer.id FROM customer LIMIT 1' }),
        cache: 'no-store',
      }
    );
    if (!res.ok) {
      const err = await res.json();
      return NextResponse.json({ valid: false, error: err?.error?.message ?? `HTTP ${res.status}` });
    }
    const data = await res.json();
    const name = data.results?.[0]?.customer?.descriptiveName ?? `Cuenta ${customerId}`;
    return NextResponse.json({ valid: true, name });
  } catch (e) {
    return NextResponse.json({ valid: false, error: String(e) }, { status: 500 });
  }
}
