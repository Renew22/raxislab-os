import { NextRequest, NextResponse } from 'next/server';

const HTML = (body: string) =>
  new NextResponse(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>RaxisLab OS · Google OAuth</title>
  <style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:'Space Mono',monospace,sans-serif;background:#0a0a0a;color:#fff;padding:48px 24px;min-height:100vh}
  .wrap{max-width:680px;margin:0 auto}.card{background:#111;border:1px solid #222;border-radius:10px;padding:24px;margin:16px 0}
  code{color:#00C8FF;word-break:break-all;font-size:13px;line-height:1.6}
  .btn{display:inline-block;padding:10px 22px;background:#00C8FF;color:#000;border-radius:6px;text-decoration:none;font-weight:700;margin-top:24px}
  h2{font-size:20px;margin-bottom:12px}p{color:#9AA3AD;font-size:13px;line-height:1.7;margin-bottom:8px}
  ol{color:#9AA3AD;font-size:13px;line-height:2;padding-left:20px}.err{color:#FF5252}</style></head>
  <body><div class="wrap">${body}</div></body></html>`,
  { headers: { 'Content-Type': 'text/html' } });

export async function GET(req: NextRequest) {
  const code  = req.nextUrl.searchParams.get('code');
  const error = req.nextUrl.searchParams.get('error');

  if (error || !code) {
    return HTML(`<h2 class="err">Error en la autorización</h2><p>${error ?? 'No se recibió código de autorización.'}</p>
    <a href="/" class="btn">Volver al dashboard</a>`);
  }

  const base = process.env.NEXT_PUBLIC_URL ?? 'https://raxislab-os.vercel.app';
  const redirectUri = `${base}/api/auth/google/callback`;

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id:     process.env.GOOGLE_CLIENT_ID ?? '',
      client_secret: process.env.GOOGLE_CLIENT_SECRET ?? '',
      redirect_uri:  redirectUri,
      grant_type:    'authorization_code',
    }),
  });

  const data = await res.json();

  if (!data.refresh_token) {
    return HTML(`<h2 class="err">No se obtuvo refresh_token</h2>
    <p>Google no devolvió un refresh_token. Esto ocurre si ya autorizaste antes sin revocar.</p>
    <p><strong>Solución:</strong> Ve a <a href="https://myaccount.google.com/permissions" style="color:#00C8FF">myaccount.google.com/permissions</a>,
    revoca el acceso a "RaxisLab OS Web" y repite el flujo OAuth.</p>
    <div class="card"><p>Respuesta de Google:</p><code>${JSON.stringify(data, null, 2)}</code></div>
    <a href="/api/auth/google" class="btn">Reintentar OAuth</a>`);
  }

  return HTML(`<h2 style="color:#00E676">✅ Google conectado</h2>
  <p>Copia el <strong>refresh_token</strong> y añádelo en <strong>Vercel → Settings → Environment Variables</strong> como <code>GOOGLE_REFRESH_TOKEN</code>.</p>
  <div class="card"><p style="color:#5A6470;font-size:11px;margin-bottom:10px">GOOGLE_REFRESH_TOKEN — copia este valor completo:</p>
  <code>${data.refresh_token}</code></div>
  <div class="card" style="border-color:rgba(0,200,255,0.2);background:rgba(0,200,255,0.04)">
    <p style="color:#00C8FF;font-weight:700;margin-bottom:8px">Pasos siguientes:</p>
    <ol>
      <li>Copia el refresh_token de arriba</li>
      <li>Abre Vercel → tu proyecto → Settings → Environment Variables</li>
      <li>Añade: <code>GOOGLE_REFRESH_TOKEN</code> = [valor copiado]</li>
      <li>Redeploy el proyecto (o espera el siguiente deploy automático)</li>
      <li>¡Google APIs listas para usarse!</li>
    </ol>
  </div>
  <a href="/" class="btn">Volver al dashboard</a>`);
}
