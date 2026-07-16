import { NextResponse } from 'next/server';
import { getGoogleAccessToken, googleNotConfigured } from '@/app/lib/google-auth';

export async function GET() {
  if (googleNotConfigured()) return NextResponse.json({ error: 'Google no configurado' });

  const developerToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN ?? process.env.GOOGLE_ADS_API_KEY ?? '';
  const MCC = '7179865639';

  try {
    const token = await getGoogleAccessToken();
    const tokenPreview = token.slice(0, 20) + '...';

    // List all accessible customers (no customer ID needed)
    const res = await fetch('https://googleads.googleapis.com/v17/customers:listAccessibleCustomers', {
      headers: {
        Authorization: `Bearer ${token}`,
        'developer-token': developerToken,
        'login-customer-id': MCC,
      },
      cache: 'no-store',
    });

    const text = await res.text();
    let data: unknown;
    try { data = JSON.parse(text); } catch { data = text.slice(0, 500); }

    return NextResponse.json({
      token_preview: tokenPreview,
      dev_token_prefix: developerToken.slice(0, 8),
      mcc: MCC,
      status: res.status,
      response: data,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) });
  }
}
