import { NextRequest, NextResponse } from 'next/server';

const CLIENT_ID     = process.env.GOOGLE_CLIENT_ID ?? '';
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET ?? '';
const REDIRECT_URI  = 'https://raxislab-os.vercel.app/api/auth/google-ads/callback';

export async function GET(req: NextRequest) {
  const code  = req.nextUrl.searchParams.get('code');
  const error = req.nextUrl.searchParams.get('error');

  if (error) {
    return new NextResponse(`<html><body style="font-family:monospace;padding:2rem">
      <h2 style="color:red">Error: ${error}</h2>
      <p>El usuario canceló o hubo un error en la autorización.</p>
    </body></html>`, { headers: { 'Content-Type': 'text/html' } });
  }

  if (!code) {
    return new NextResponse('<html><body>Sin código de autorización.</body></html>', {
      headers: { 'Content-Type': 'text/html' },
    });
  }

  // Exchange code for tokens
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id:     CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri:  REDIRECT_URI,
      grant_type:    'authorization_code',
    }),
  });

  const tokenData = await tokenRes.json();

  if (!tokenRes.ok) {
    return new NextResponse(`<html><body style="font-family:monospace;padding:2rem">
      <h2 style="color:red">Error al intercambiar código</h2>
      <pre>${JSON.stringify(tokenData, null, 2)}</pre>
    </body></html>`, { headers: { 'Content-Type': 'text/html' } });
  }

  const { refresh_token, access_token, scope } = tokenData;

  return new NextResponse(`<html>
<head><title>Google Ads OAuth — Refresh Token</title></head>
<body style="font-family:monospace;background:#0f172a;color:#e2e8f0;padding:2rem;max-width:700px">
  <h1 style="color:#22d3ee">✅ Token generado</h1>
  <p style="color:#94a3b8">Copia el <strong>refresh_token</strong> y actualízalo en Vercel como <code>GOOGLE_REFRESH_TOKEN</code></p>

  <h3 style="color:#fbbf24;margin-top:1.5rem">REFRESH TOKEN (guardar en Vercel):</h3>
  <textarea style="width:100%;height:80px;background:#1e293b;color:#4ade80;border:1px solid #4ade80;padding:.5rem;font-size:13px;font-family:monospace">${refresh_token ?? '(no refresh_token — ya tenías uno válido y Google no regeneró)'}</textarea>

  <h3 style="color:#a78bfa;margin-top:1rem">Scopes autorizados:</h3>
  <pre style="background:#1e293b;padding:1rem;overflow:auto;font-size:12px">${scope}</pre>

  <h3 style="color:#f87171;margin-top:1rem">Pasos:</h3>
  <ol style="line-height:2">
    <li>Copia el refresh_token de arriba</li>
    <li>Ve a Vercel → raxislab-os → Settings → Environment Variables</li>
    <li>Actualiza <code>GOOGLE_REFRESH_TOKEN</code> con el nuevo valor</li>
    <li>Redespliega: <code>npx vercel --prod</code></li>
  </ol>
</body>
</html>`, { headers: { 'Content-Type': 'text/html' } });
}
