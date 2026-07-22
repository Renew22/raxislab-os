import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const code  = req.nextUrl.searchParams.get("code");
  const error = req.nextUrl.searchParams.get("error");

  if (error) {
    return NextResponse.json({ error, mensaje: "Autorización rechazada" }, { status: 400 });
  }
  if (!code) {
    return NextResponse.json({ error: "Sin código de autorización" }, { status: 400 });
  }

  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } = process.env;
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    return NextResponse.json({ error: "Credenciales OAuth no configuradas" }, { status: 500 });
  }

  try {
    const r = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id:     GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri:  "https://raxislab-os-v2.vercel.app/api/google/gmb-callback",
        grant_type:    "authorization_code",
      }),
      cache: "no-store",
    });

    const tokens = await r.json();
    if (tokens.error) {
      return NextResponse.json({ error: tokens.error, detail: tokens.error_description }, { status: 400 });
    }

    const refreshToken = tokens.refresh_token;

    // HTML con instrucciones claras para copiar el token
    const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>GMB Token — RaxisLab</title>
  <style>
    body { font-family: system-ui, sans-serif; background: #0f0f0f; color: #e5e5e5; padding: 40px; max-width: 700px; margin: 0 auto; }
    h1 { color: #4ade80; margin-bottom: 8px; }
    .box { background: #1a1a1a; border: 1px solid #333; border-radius: 10px; padding: 20px; margin: 20px 0; }
    code { background: #000; color: #a78bfa; padding: 12px 16px; display: block; border-radius: 6px; word-break: break-all; font-size: 13px; margin: 10px 0; }
    .step { color: #a3a3a3; font-size: 14px; line-height: 1.8; }
    .label { font-size: 11px; color: #737373; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px; }
    button { background: #a78bfa; color: #000; border: none; padding: 8px 16px; border-radius: 6px; font-weight: 700; cursor: pointer; }
  </style>
</head>
<body>
  <h1>✅ Google Business Profile autorizado</h1>
  <p style="color:#a3a3a3">Copia el refresh token y añádelo en Vercel.</p>

  <div class="box">
    <div class="label">Refresh Token GBP (cópialo)</div>
    <code id="rt">${refreshToken || "— No se obtuvo refresh token (ya tenías uno previo) —"}</code>
    <button onclick="navigator.clipboard.writeText(document.getElementById('rt').innerText)">Copiar</button>
  </div>

  <div class="box">
    <div class="label">Pasos en Vercel</div>
    <div class="step">
      1. Ve a <strong>vercel.com → raxislab-os-v2 → Settings → Environment Variables</strong><br>
      2. Añade variable: <strong>GOOGLE_GBP_REFRESH_TOKEN</strong><br>
      3. Pega el token de arriba<br>
      4. Redeploy → la automatización GMB queda activa
    </div>
  </div>

  <div class="box">
    <div class="label">Access Token (temporal, expira en 1h)</div>
    <code>${tokens.access_token?.slice(0, 60)}...</code>
  </div>
</body>
</html>`;

    return new NextResponse(html, {
      headers: { "Content-Type": "text/html" },
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
