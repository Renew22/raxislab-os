import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

// Flow 03 — Respuesta Reseñas
// Recibe reseñas de GBP (o texto manual) y genera respuesta personalizada con Claude
export async function POST(req: Request) {
  const { reviewText, reviewerName, rating, clientName, sector } = await req.json();

  if (!reviewText) {
    return NextResponse.json({ error: 'reviewText requerido' }, { status: 400 });
  }

  const client = new Anthropic();

  const stars = '⭐'.repeat(Math.min(rating ?? 5, 5));
  const tone  = (rating ?? 5) >= 4 ? 'agradecido y cálido' : 'empático, profesional y orientado a soluciones';

  try {
    const msg = await client.messages.create({
      model:      'claude-haiku-4-5-20251001',
      max_tokens: 300,
      messages: [{
        role: 'user',
        content: `Eres el community manager de "${clientName ?? 'el negocio'}" (sector: ${sector ?? 'belleza/estética'}).
Responde esta reseña de Google Business Profile de forma ${tone}. Máximo 3 frases. Sin emojis excesivos. En español.

Reseñador: ${reviewerName ?? 'Cliente'}
Valoración: ${stars} (${rating ?? 5}/5)
Reseña: "${reviewText}"

Responde directamente sin explicaciones adicionales:`,
      }],
    });

    const response = (msg.content[0] as { text: string }).text;

    return NextResponse.json({ response, reviewerName, rating, reviewText });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error al generar respuesta' }, { status: 500 });
  }
}
