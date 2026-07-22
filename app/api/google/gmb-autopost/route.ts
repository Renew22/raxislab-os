import { NextRequest, NextResponse } from "next/server";
import { getGMBToken, gmbConfigured } from "../../../lib/google-auth";

// POST: crea un GMB post a partir de un blog post de WordPress
// Body: { locationName, title, excerpt, url, imageUrl? }
// También lo llama el cron de Hetzner cuando detecta blog nuevo
export async function POST(req: NextRequest) {
  if (!gmbConfigured()) {
    return NextResponse.json({
      error: "GMB no autorizado — completa setup en /api/google/gmb-setup",
    }, { status: 401 });
  }

  const { locationName, title, excerpt, url, imageUrl, salon } = await req.json();
  if (!locationName || !title || !url) {
    return NextResponse.json({ error: "locationName, title y url requeridos" }, { status: 400 });
  }

  // Texto del post GMB (máx 1500 chars)
  const salonName = salon === "desancho" ? "DeSancho Estilistas" : "Identity Peluqueros";
  const summary = `${title}\n\n${excerpt ? excerpt.slice(0, 400) : ""}\n\n📍 ${salonName} — ¡Reserva tu cita!`;

  try {
    const token = await getGMBToken();

    const body: Record<string, unknown> = {
      summary:    summary.trim().slice(0, 1500),
      topicType:  "STANDARD",
      callToAction: {
        actionType: "LEARN_MORE",
        url,
      },
    };

    // Si hay imagen, añadirla al post
    if (imageUrl) {
      body.media = [{
        mediaFormat: "PHOTO",
        sourceUrl:   imageUrl,
      }];
    }

    const r = await fetch(
      `https://mybusiness.googleapis.com/v4/${locationName}/localPosts`,
      {
        method:  "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body:    JSON.stringify(body),
      }
    );
    const data = await r.json();
    if (data.error) return NextResponse.json({ error: data.error.message }, { status: 400 });
    return NextResponse.json({ success: true, post: data });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

// GET: lista posts GMB existentes
export async function GET(req: NextRequest) {
  if (!gmbConfigured()) {
    return NextResponse.json({ error: "GMB no autorizado" }, { status: 401 });
  }

  const locationName = req.nextUrl.searchParams.get("location") || "";
  if (!locationName) {
    return NextResponse.json({ error: "?location= requerido" }, { status: 400 });
  }

  try {
    const token = await getGMBToken();
    const r = await fetch(
      `https://mybusiness.googleapis.com/v4/${locationName}/localPosts?pageSize=10`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const data = await r.json();
    if (data.error) return NextResponse.json({ error: data.error.message }, { status: 400 });
    return NextResponse.json({ posts: data.localPosts ?? [] });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
