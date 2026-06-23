import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

// Flow 06 — Guiones YouTube
// Genera guión estructurado para vídeo de YouTube sobre marketing digital
export async function POST(req: Request) {
  const { topic, duracion = '8-10 minutos', sector } = await req.json();

  const client = new Anthropic();

  const resolvedTopic = topic ?? `Cómo conseguir más clientes para tu ${sector ?? 'negocio local'} con publicidad en Meta`;

  try {
    const msg = await client.messages.create({
      model:      'claude-haiku-4-5-20251001',
      max_tokens: 1500,
      messages: [{
        role: 'user',
        content: `Eres el guionista de un canal de YouTube sobre marketing digital para negocios locales en España.
Crea un guión estructurado para un vídeo de ${duracion}.

Tema: "${resolvedTopic}"

Estructura requerida:
1. GANCHO (primeros 15 segundos) — frase de apertura potente
2. PRESENTACIÓN (30 seg) — quién habla y qué van a aprender
3. PROBLEMA (1-2 min) — el dolor que tienen los dueños de negocio
4. CONTENIDO PRINCIPAL (3 bloques con título de pantalla, duración estimada y puntos clave)
5. DEMO/CASO REAL (si aplica) — ejemplo concreto
6. CTA FINAL — suscribirse, comentar, link en bio

Incluye notas de dirección entre [corchetes] para cámara/edición.
En español. Directo. Sin relleno.

Escribe el guión completo:`,
      }],
    });

    const content = (msg.content[0] as { text: string }).text;
    return NextResponse.json({ content, topic: resolvedTopic, duracion });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error al generar guión' }, { status: 500 });
  }
}
