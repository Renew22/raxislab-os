import { NextRequest, NextResponse } from "next/server";
import { getGMBToken, gmbConfigured } from "../../../lib/google-auth";
import Anthropic from "@anthropic-ai/sdk";

// GET /api/google/gmb-reviews?location=accounts/X/locations/Y
// Devuelve reseñas recientes con borrador de respuesta Claude
export async function GET(req: NextRequest) {
  if (!gmbConfigured()) {
    return NextResponse.json({
      error: "GMB no autorizado",
      setup_url: "https://raxislab-os-v2.vercel.app/api/google/gmb-setup",
    }, { status: 401 });
  }

  const locationName = req.nextUrl.searchParams.get("location") || "";
  if (!locationName) {
    return NextResponse.json({ error: "Param ?location=accounts/.../locations/... requerido" }, { status: 400 });
  }

  try {
    const token = await getGMBToken();

    const r = await fetch(
      `https://mybusiness.googleapis.com/v4/${locationName}/reviews?orderBy=updateTime desc&pageSize=10`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const data = await r.json();
    if (data.error) {
      return NextResponse.json({ error: data.error.message }, { status: 400 });
    }

    const reviews = data.reviews ?? [];

    // Para reseñas sin respuesta, generar borrador con Claude
    const client = new Anthropic();
    const enriched = await Promise.all(reviews.map(async (rev: Record<string, unknown>) => {
      const hasReply = !!(rev.reviewReply as { comment?: string } | undefined)?.comment;
      let draft = null;

      if (!hasReply && rev.comment) {
        try {
          const msg = await client.messages.create({
            model: "claude-haiku-4-5-20251001",
            max_tokens: 150,
            messages: [{
              role: "user",
              content: `Eres el community manager de una peluquería profesional. Redacta una respuesta breve, cálida y natural a esta reseña de Google (máx 3 frases, en español, sin emojis excesivos):\n\n"${rev.comment}"`,
            }],
          });
          draft = (msg.content[0] as { text: string }).text.trim();
        } catch {
          draft = null;
        }
      }

      return { ...rev, _draft: draft, _hasReply: hasReply };
    }));

    const pending = enriched.filter(r => !r._hasReply).length;
    return NextResponse.json({ reviews: enriched, pending_replies: pending });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

// POST /api/google/gmb-reviews — responder a una reseña
export async function POST(req: NextRequest) {
  if (!gmbConfigured()) {
    return NextResponse.json({ error: "GMB no autorizado" }, { status: 401 });
  }

  const { reviewName, comment } = await req.json();
  if (!reviewName || !comment) {
    return NextResponse.json({ error: "reviewName y comment requeridos" }, { status: 400 });
  }

  try {
    const token = await getGMBToken();
    const r = await fetch(
      `https://mybusiness.googleapis.com/v4/${reviewName}/reply`,
      {
        method:  "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body:    JSON.stringify({ comment }),
      }
    );
    const data = await r.json();
    if (data.error) return NextResponse.json({ error: data.error.message }, { status: 400 });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
