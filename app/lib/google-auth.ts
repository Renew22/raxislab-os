const TOKEN_URL = 'https://oauth2.googleapis.com/token';

export async function getGoogleAccessToken(): Promise<string> {
  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN } = process.env;

  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REFRESH_TOKEN) {
    throw new Error('Google no conectado. Ve a /api/auth/google para autorizar.');
  }

  const res = await fetch(TOKEN_URL, {
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
  if (!data.access_token) {
    throw new Error(data.error_description ?? 'Error al refrescar token de Google');
  }
  return data.access_token as string;
}

export function googleNotConfigured() {
  return !process.env.GOOGLE_REFRESH_TOKEN;
}
