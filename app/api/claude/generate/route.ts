import Anthropic from '@anthropic-ai/sdk';
import { NextResponse } from 'next/server';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: Request) {
  const { type, data } = await req.json();

  const prompts: Record<string, string> = {
    gbp_post: `Genera un post para Google Business Profile de ${data.cliente} que es ${data.sector}. 1.200 caracteres máximo. Incluye CTA a reservar cita. Tono profesional pero cercano.`,
    blog_article: `Write a 1.200 word SEO article in English about "${data.topic}" for local business owners. Include H2 headings, practical tips, and a conclusion with CTA. Target keyword: "${data.keyword}".`,
    review_response: `Genera una respuesta profesional para esta reseña de ${data.cliente}: "${data.review}". Máximo 150 palabras. Agradece, personaliza, invita a volver.`,
    video_script: `Genera un guión de video de 60 segundos sobre "${data.topic}" con esta fórmula: HOOK (0-3s) + DOLOR (3-15s) + CREDIBILIDAD (15-25s) + VALOR (25-55s) + CTA (55-60s). Target: dueños de negocio local.`,
    reel_script: `Genera un guión de reel de 30 segundos para ${data.cliente} (${data.sector}) sobre: "${data.topic}". Hook visual + Problema + Solución + CTA. Incluye sugerencia de música tendencia.`,
    email_lead: `Genera un email de prospección para ${data.empresa} del sector ${data.sector}. Observación específica de su negocio + propuesta de valor + CTA a auditoría gratuita. Máximo 120 palabras.`,
    tendencias: `Dame las 5 tendencias más relevantes esta semana en el sector ${data.sector} en España. Para cada una: título + por qué importa + idea de contenido.`,
    investor_analysis: `Analiza esta empresa para el perfil Raxis Investor: Ticker: ${data.ticker} | Tesis: ${data.tesis} | Entrada: ${data.entrada} | Stop: ${data.stop} | Target: ${data.target} | Decisión: ${data.decision}. Genera JSON con claves: post_x (280 chars), hilo_twitter (array 5 tweets), guion_youtube (estructura 10 min), articulo_blog (título EN + primer párrafo). Solo JSON, sin texto adicional.`
  };

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompts[type] || data.prompt }]
    });
    const content = message.content[0].type === 'text' ? message.content[0].text : '';
    return NextResponse.json({ content });
  } catch (error) {
    return NextResponse.json({ error: 'Error generando contenido' }, { status: 500 });
  }
}
