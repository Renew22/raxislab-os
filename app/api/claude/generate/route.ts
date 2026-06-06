import Anthropic from '@anthropic-ai/sdk';
import { NextResponse } from 'next/server';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: Request) {
  const { type, data } = await req.json();

  const prompts: Record<string, string> = {
    gbp_post: `Genera un post para Google Business Profile de ${data.cliente} que es ${data.sector}. 1.200 caracteres máximo. Incluye CTA a reservar cita. Tono profesional pero cercano. Incluye una keyword local.`,
    blog_article: `Write a 1.200 word SEO article in English about "${data.topic}" for local business owners. Include H2 headings, practical tips, and a conclusion with CTA. Target keyword: "${data.keyword}".`,
    review_response: `Genera una respuesta profesional y empática para esta reseña de ${data.cliente}: "${data.review}". Máximo 150 palabras. Agradece, personaliza, invita a volver.`,
    video_script: `Genera un guión de video de 60 segundos sobre "${data.topic}" usando esta fórmula: HOOK (0-3s que para el scroll) + DOLOR (3-15s ampliar el problema) + CREDIBILIDAD (15-25s un dato real) + VALOR (25-55s la solución concreta) + CTA (55-60s acción clara). Target: dueños de negocio local.`,
    reel_script: `Genera un guión de reel de 30 segundos para ${data.cliente} (${data.sector}) sobre: "${data.topic}". Formato: Hook visual + Problema + Solución + CTA. Incluye sugerencia de música tendencia.`,
    email_lead: `Genera un email de prospección personalizado para ${data.empresa} del sector ${data.sector}. Observación específica de su negocio + propuesta de valor en 2 líneas + CTA a auditoría gratuita. Máximo 120 palabras. Tono directo, no genérico.`,
    tendencias: `Busca las 5 tendencias más relevantes esta semana en el sector ${data.sector} en España. Para cada tendencia: título + por qué importa para el negocio + idea de contenido (post/reel/video). Formato estructurado.`
  };

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompts[type] || data.prompt }]
  });

  return NextResponse.json({
    content: message.content[0].type === 'text' ? message.content[0].text : ''
  });
}
