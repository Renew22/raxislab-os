import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

// Flow 05 — Blog EN
// Genera artículo de blog en inglés sobre marketing digital / sector agencia
export async function POST(req: Request) {
  const { topic, keyword, sector } = await req.json();

  const client = new Anthropic();

  const resolvedTopic = topic ?? `How to grow a ${sector ?? 'local business'} with digital marketing`;
  const resolvedKeyword = keyword ?? sector ?? 'digital marketing';

  try {
    const msg = await client.messages.create({
      model:      'claude-haiku-4-5-20251001',
      max_tokens: 1200,
      messages: [{
        role: 'user',
        content: `Write a professional blog article in English for a digital marketing agency blog.

Topic: "${resolvedTopic}"
Target keyword: "${resolvedKeyword}"

Structure:
- Engaging title (H1)
- Intro paragraph (2-3 sentences)
- 3 sections with H2 headers and 2-3 paragraphs each
- Conclusion with a subtle CTA to contact the agency

Tone: expert but approachable. No fluff. Real, actionable insights. Max 600 words.

Write the full article directly:`,
      }],
    });

    const content = (msg.content[0] as { text: string }).text;
    return NextResponse.json({ content, topic: resolvedTopic, keyword: resolvedKeyword });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error al generar artículo' }, { status: 500 });
  }
}
