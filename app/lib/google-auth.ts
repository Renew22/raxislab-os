import { createSign } from 'crypto';

interface ServiceAccount {
  client_email: string;
  private_key: string;
  token_uri: string;
}

function b64url(str: string): string {
  return Buffer.from(str).toString('base64url');
}

function signJwt(sa: ServiceAccount, scope: string): string {
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const payload = b64url(JSON.stringify({
    iss: sa.client_email,
    sub: sa.client_email,
    scope,
    aud: sa.token_uri,
    iat: now,
    exp: now + 3600,
  }));
  const unsigned = `${header}.${payload}`;
  const sign = createSign('RSA-SHA256');
  sign.update(unsigned);
  const sig = sign.sign(sa.private_key, 'base64url');
  return `${unsigned}.${sig}`;
}

const SCOPES = [
  'https://www.googleapis.com/auth/adwords',
  'https://www.googleapis.com/auth/webmasters.readonly',
  'https://www.googleapis.com/auth/analytics.readonly',
  'https://www.googleapis.com/auth/tagmanager.readonly',
].join(' ');

// Simple in-memory cache (per serverless instance)
let cachedToken: { token: string; exp: number } | null = null;

export async function getGoogleAccessToken(): Promise<string> {
  const now = Date.now() / 1000;

  // Return cached token if still valid (5 min margin)
  if (cachedToken && cachedToken.exp - now > 300) return cachedToken.token;

  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (raw) {
    // Service Account path (preferred)
    const sa: ServiceAccount = JSON.parse(raw);
    const jwt = signJwt(sa, SCOPES);
    const res = await fetch(sa.token_uri, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwt,
      }),
      cache: 'no-store',
    });
    const data = await res.json();
    if (!data.access_token) throw new Error(data.error_description ?? 'Service Account token error');
    cachedToken = { token: data.access_token, exp: now + (data.expires_in ?? 3600) };
    return cachedToken.token;
  }

  // Fallback: OAuth2 refresh token (legacy)
  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN } = process.env;
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REFRESH_TOKEN) {
    throw new Error('Google no configurado: falta GOOGLE_SERVICE_ACCOUNT_JSON o credenciales OAuth2.');
  }
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      refresh_token: GOOGLE_REFRESH_TOKEN,
      grant_type: 'refresh_token',
    }),
    cache: 'no-store',
  });
  const data = await res.json();
  if (!data.access_token) throw new Error(data.error_description ?? 'OAuth2 token error');
  return data.access_token as string;
}

export function googleNotConfigured() {
  return !process.env.GOOGLE_SERVICE_ACCOUNT_JSON && !process.env.GOOGLE_REFRESH_TOKEN;
}
