import { NextResponse } from "next/server";

const NOTION_KEY     = process.env.NOTION_API_KEY;
const PARENT_PAGE_ID = process.env.NOTION_PROPOSALS_PAGE_ID;

export async function POST(req: Request) {
  if (!NOTION_KEY) {
    return NextResponse.json({ error: "NOTION_API_KEY no configurada." }, { status: 503 });
  }
  if (!PARENT_PAGE_ID) {
    return NextResponse.json({ error: "NOTION_PROPOSALS_PAGE_ID no configurada. Añádela en Vercel → Settings → Environment Variables." }, { status: 503 });
  }

  const body = await req.json() as {
    cliente:  string;
    sector:   string;
    tamano:   string;
    selected: string[];
    precio:   number;
    pago:     string;
    fecha:    string;
    validez:  string;
  };

  const { cliente, sector, tamano, selected, precio, pago, fecha, validez } = body;
  const title = `Propuesta — ${cliente || "Sin nombre"} — ${fecha}`;

  const payload = {
    parent: { page_id: PARENT_PAGE_ID },
    properties: {
      title: { title: [{ text: { content: title } }] },
    },
    children: [
      {
        object: "block", type: "callout",
        callout: {
          icon: { emoji: "📄" },
          color: "blue_background",
          rich_text: [{ text: { content: `${title} · Válida hasta: ${validez}` } }],
        },
      },
      {
        object: "block", type: "heading_2",
        heading_2: { rich_text: [{ text: { content: "Datos del cliente" } }] },
      },
      {
        object: "block", type: "bulleted_list_item",
        bulleted_list_item: { rich_text: [{ text: { content: `Cliente: ${cliente || "—"}` } }] },
      },
      {
        object: "block", type: "bulleted_list_item",
        bulleted_list_item: { rich_text: [{ text: { content: `Sector: ${sector} · Tamaño: ${tamano}` } }] },
      },
      {
        object: "block", type: "heading_2",
        heading_2: { rich_text: [{ text: { content: "Servicios contratados" } }] },
      },
      ...selected.map(s => ({
        object: "block", type: "bulleted_list_item" as const,
        bulleted_list_item: { rich_text: [{ text: { content: s } }] },
      })),
      {
        object: "block", type: "heading_2",
        heading_2: { rich_text: [{ text: { content: "Inversión" } }] },
      },
      {
        object: "block", type: "paragraph",
        paragraph: {
          rich_text: [
            { text: { content: "Precio mensual: " }, annotations: { bold: true } },
            { text: { content: `${Number(precio).toLocaleString("es-ES")}€/mes (sin IVA)` } },
          ],
        },
      },
      {
        object: "block", type: "paragraph",
        paragraph: {
          rich_text: [
            { text: { content: "Forma de pago: " }, annotations: { bold: true } },
            { text: { content: pago || "50% a la firma · 50% inicio del segundo mes" } },
          ],
        },
      },
    ],
  };

  try {
    const res = await fetch("https://api.notion.com/v1/pages", {
      method: "POST",
      headers: {
        Authorization:    `Bearer ${NOTION_KEY}`,
        "Notion-Version": "2022-06-28",
        "Content-Type":   "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({})) as { message?: string };
      return NextResponse.json({ error: err.message ?? "Error Notion API" }, { status: 500 });
    }

    const page = await res.json() as { url?: string };
    return NextResponse.json({ url: page.url });
  } catch {
    return NextResponse.json({ error: "Error de red al conectar con Notion." }, { status: 500 });
  }
}
