import { NextResponse } from 'next/server';

export async function GET() {
  const token = process.env.META_ACCESS_TOKEN;
  if (!token) {
    return NextResponse.json({ valid: false, error: 'META_ACCESS_TOKEN no configurada en Vercel.' });
  }

  // Verificar token con /me
  const meRes = await fetch(
    `https://graph.facebook.com/v21.0/me?fields=name,id&access_token=${token}`
  );
  const meData = await meRes.json();

  if (meData.error) {
    const expired = meData.error.code === 190;
    return NextResponse.json({
      valid: false,
      expired,
      error: meData.error.message,
      errorCode: meData.error.code,
    });
  }

  // debug_token — requiere META_APP_ID y META_APP_SECRET para expiry exacta
  const appId     = process.env.META_APP_ID;
  const appSecret = process.env.META_APP_SECRET;
  let expiresAt: number | null = null;
  let dataAccessExpiresAt: number | null = null;

  if (appId && appSecret) {
    const debugRes = await fetch(
      `https://graph.facebook.com/debug_token?input_token=${token}&access_token=${appId}|${appSecret}`
    );
    const debugData = await debugRes.json();
    if (!debugData.error && debugData.data) {
      expiresAt            = debugData.data.expires_at            ?? null;
      dataAccessExpiresAt  = debugData.data.data_access_expires_at ?? null;
    }
  }

  const now = Math.floor(Date.now() / 1000);
  const daysLeft = expiresAt ? Math.round((expiresAt - now) / 86400) : null;

  return NextResponse.json({
    valid:          true,
    userId:         meData.id,
    userName:       meData.name,
    expiresAt,
    dataAccessExpiresAt,
    daysLeft,
    hasDebugAccess: !!(appId && appSecret),
  });
}
