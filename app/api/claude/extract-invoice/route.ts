import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: Request) {
  const { fileBase64, mediaType } = await req.json();
  if (!fileBase64 || !mediaType) {
    return NextResponse.json({ error: "Faltan fileBase64 o mediaType" }, { status: 400 });
  }

  const prompt = `Analiza esta factura y extrae los datos en JSON estricto con este formato exacto:
{
  "proveedor": "nombre del proveedor o empresa emisora",
  "concepto": "descripción del servicio o producto",
  "importe": 123.45,
  "iva": 21,
  "fecha": "YYYY-MM-DD",
  "numero_factura": "FAC-001 o similar",
  "tipo": "recibida"
}
Solo responde con el JSON, sin texto adicional. Si no puedes extraer un campo, usa null.`;

  try {
    const isDocument = mediaType === "application/pdf";
    const content = isDocument
      ? [
          { type: "document" as const, source: { type: "base64" as const, media_type: mediaType as "application/pdf", data: fileBase64 } },
          { type: "text" as const, text: prompt },
        ]
      : [
          { type: "image" as const, source: { type: "base64" as const, media_type: mediaType as "image/jpeg" | "image/png" | "image/webp", data: fileBase64 } },
          { type: "text" as const, text: prompt },
        ];

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 512,
      messages: [{ role: "user", content }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return NextResponse.json({ error: "No se pudo extraer JSON" }, { status: 422 });
    const data = JSON.parse(jsonMatch[0]);
    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ error: "Error extrayendo factura" }, { status: 500 });
  }
}
