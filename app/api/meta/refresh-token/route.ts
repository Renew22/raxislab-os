import { NextResponse } from 'next/server';

// Intercambia el token actual (corto o largo plazo) por uno de larga duración (60 días).
// Requiere META_APP_ID y META_APP_SECRET en Vercel.
export async function POST() {
  const token     = process.env.META_ACCESS_TOKEN;
  const appId     = process.env.META_APP_ID;
  const appSecret = process.env.META_APP_SECRET;

  if (!token)     return NextResponse.json({ error: 'META_ACCESS_TOKEN no configurada.' }, { status: 500 });
  if (!appId)     return NextResponse.json({ error: 'META_APP_ID no configurada en Vercel.' }, { status: 500 });
  if (!appSecret) return NextResponse.json({ error: 'META_APP_SECRET no configurada en Vercel.' }, { status: 500 });

  const url = `https://graph.facebook.com/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${token}`;
  const res = await fetch(url);
  const data = await res.json();

  if (data.error) {
    return NextResponse.json({ error: data.error.message }, { status: 400 });
  }

  // El nuevo token va en data.access_token — René debe copiarlo y actualizar META_ACCESS_TOKEN en Vercel
  const expiresIn = data.expires_in; // segundos
  const daysLeft  = expiresIn ? Math.round(expiresIn / 86400) : 60;

  return NextResponse.json({
    newToken:  data.access_token,
    tokenType: data.token_type,
    daysLeft,
    instructions: `Copia el newToken y actualiza META_ACCESS_TOKEN en Vercel → Settings → Environment Variables. Válido ${daysLeft} días.`,
  });
}
