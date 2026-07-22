import { NextResponse } from "next/server";

// Genera la URL de autorización OAuth para Google Business Profile
// René visita esta URL una vez → autoriza → callback guarda el token
export async function GET() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json({ error: "GOOGLE_CLIENT_ID no configurado" }, { status: 500 });
  }

  const params = new URLSearchParams({
    client_id:    clientId,
    redirect_uri: "https://raxislab-os-v2.vercel.app/api/google/gmb-callback",
    response_type: "code",
    scope: [
      "https://www.googleapis.com/auth/business.manage",
      "https://www.googleapis.com/auth/plus.business.manage",
    ].join(" "),
    access_type:    "offline",
    prompt:         "consent",   // fuerza obtener refresh_token
  });

  const url = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;

  return NextResponse.json({
    auth_url: url,
    instrucciones: [
      "1. Visita auth_url en tu navegador (como renebenegas.rb@gmail.com)",
      "2. Autoriza el acceso a Google Business Profile",
      "3. Te redirigirá a /api/google/gmb-callback con el token",
      "4. Copia el refresh_token y añádelo en Vercel como GOOGLE_GBP_REFRESH_TOKEN",
    ],
  });
}
