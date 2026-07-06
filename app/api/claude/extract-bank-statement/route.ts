import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const PROMPT = `Analiza este extracto/captura y extrae TODOS los movimientos visibles.
Puede ser de PayPal, banco, tarjeta, cualquier plataforma.

Devuelve SOLO este JSON, sin texto extra:
{
  "moneda": "EUR",
  "movimientos": [
    { "fecha": "2026-07-01", "concepto": "descripción", "importe": -45.50, "saldo": 1234.56 }
  ]
}

Reglas:
- importe negativo = gasto/salida, positivo = ingreso/entrada
- fecha en YYYY-MM-DD (si no hay año usa 2026)
- saldo: solo si aparece, si no omite el campo
- Extrae TODOS los movimientos, ninguno omitido
- No incluyas filas de cabecera ni saldos finales como movimientos`;

export async function POST(req: Request) {
  const { fileBase64, mimeType } = await req.json();
  if (!fileBase64) {
    return NextResponse.json({ error: "Falta fileBase64" }, { status: 400 });
  }

  const mime = mimeType || "application/pdf";
  const isImage = mime.startsWith("image/");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let contentBlock: any;
  if (isImage) {
    const validMimes = ["image/png", "image/jpeg", "image/webp", "image/gif"];
    const imgMime = validMimes.includes(mime) ? mime : "image/png";
    contentBlock = { type: "image", source: { type: "base64", media_type: imgMime, data: fileBase64 } };
  } else {
    contentBlock = { type: "document", source: { type: "base64", media_type: "application/pdf", data: fileBase64 } };
  }

  try {
    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      messages: [{ role: "user", content: [contentBlock, { type: "text", text: PROMPT }] }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return NextResponse.json({ error: "No se pudo extraer movimientos" }, { status: 422 });
    const parsed = JSON.parse(jsonMatch[0]);
    return NextResponse.json({ data: parsed.movimientos, moneda: parsed.moneda ?? "EUR" });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error procesando el extracto";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
