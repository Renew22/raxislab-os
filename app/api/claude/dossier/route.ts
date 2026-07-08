import Anthropic from '@anthropic-ai/sdk';
import { NextResponse } from 'next/server';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM = `Eres el director comercial de Last Mile Distribution, hub B2B que importa vinos españoles D.O. y aceites AOVE para Paraguay y Latinoamérica.

EMPRESA: Last Mile Distribution
WEB: lastmiledist.com
EMAIL: ventas@lastmiledist.com
WHATSAPP: +34 654835593
RESPALDO: DISXUQUER +20 años experiencia en distribución agroalimentaria

PRODUCTOS Y PRECIOS (FOB Paraguay, tipo cambio 7.800 Gs/€):

VINOS:
- D.O. Rioja Ivanto Joven 75cl: A=6,75€ / B=6,30€ / C=5,85€
- D.O. Rioja Ivanto Crianza 75cl: A=7,50€ / B=7,00€ / C=6,50€
- D.O. Ribera Torremorón Joven: A=9,75€ / B=9,10€ / C=8,45€
- D.O. Ribera Torremorón Crianza: A=13,50€ / B=12,75€ / C=11,05€
- D.O. Rueda Sietesiete Verdejo Blanco: A=6,15€ / B=5,74€ / C=5,33€
- D.O. Navarra Pleno Rosado: A=6,15€ / B=5,74€ / C=5,33€

ACEITES URZANTE:
- AOVE Premium PET 1L: A=14,92€ / B=12,57€ / C=10,73€
- AOVE Gran Selección Cristal 500ml: A=7,69€ / B=6,72€ / C=5,76€
- AOVE Gran Selección Cristal 250ml: A=8,61€ / B=7,53€ / C=6,65€
- AOVE Extra Virgen 1L: A=4,40€ / B=3,85€ / C=3,30€
- Alto Oleico Freidora 1L: A=5,44€ / B=4,78€ / C=4,08€
- Aceite de Orujo de Oliva 1L: A=7,69€ / B=6,72€ / C=5,76€

Tramos: A=hasta 1 pallet | B=1 a 6 pallets | C=contenedor completo`;

export async function POST(req: Request) {
  try {
    const { cliente, pais, tipo, web, productos, notas } = await req.json();

    const userPrompt = `Genera un dossier comercial profesional para:
Cliente: ${cliente}
País/Ciudad: ${pais}
Tipo de cliente: ${tipo}
Web: ${web || 'No indicada'}
Productos de interés: ${productos || 'Todos los productos'}
Notas adicionales: ${notas || 'Ninguna'}

Genera el dossier con estas secciones exactas, usando formato markdown:

# DOSSIER COMERCIAL — ${cliente.toUpperCase()}

## Estimado/a equipo de ${cliente}

[Saludo personalizado según tipo de cliente y mercado]

## ¿Por qué Last Mile Distribution?

[3-4 razones específicas adaptadas al perfil del cliente: ${tipo} en ${pais}]

## Productos Recomendados para su perfil

[Selección de productos más relevantes para ${tipo}, con tabla de precios A/B/C en € y en Gs (multiplicar por 7.800)]

| Producto | D.O. | Tramo A | Tramo B | Tramo C | Tramo A (Gs) | Tramo B (Gs) | Tramo C (Gs) |
|---|---|---|---|---|---|---|---|
[tabla con productos más relevantes]

## Diferenciación vs Competencia

[2-3 puntos concretos sobre por qué nuestros productos vs competencia en ${pais}. Mencionar: D.O., stock en Paraguay, respaldo DISXUQUER]

## Propuesta de Próximos Pasos

[4 pasos concretos numerados: contacto inicial, degustación, pedido prueba, acuerdo]

---
**Last Mile Distribution** | ventas@lastmiledist.com | +34 654835593 | lastmiledist.com
*Documento válido 30 días desde la fecha de emisión*

Tono: profesional y cercano. Máximo 2 páginas A4. Incluir referencias a Paraguay siempre.`;

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      system: SYSTEM,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const content = message.content[0].type === 'text' ? message.content[0].text : '';
    return NextResponse.json({ content });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
