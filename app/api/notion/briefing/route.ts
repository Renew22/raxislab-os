import { NextResponse } from 'next/server'

const NOTION_TOKEN = process.env.NOTION_TOKEN || process.env.notion_token || ''
const NOTION_DB_ID = process.env.NOTION_BRIEFING_DB_ID || '9b54956601ff46e4a44b4c8ad1509f8e'

export interface BriefingEntry {
  id: string
  semana: string
  fecha: string
  metricasDestacadas: string
  tareasCriticas: string[]
  tareasImportantes: string[]
  tareasSiHayTiempo: string[]
  prioridadLunes: string
  clientesConActividad: string[]
  briefingCompleto: string
}

function extractText(prop: { rich_text?: { plain_text: string }[] } | undefined): string {
  return prop?.rich_text?.map(t => t.plain_text).join('') ?? ''
}

function extractTitle(prop: { title?: { plain_text: string }[] } | undefined): string {
  return prop?.title?.map(t => t.plain_text).join('') ?? ''
}

function extractDate(prop: { date?: { start: string } | null } | undefined): string {
  return prop?.date?.start ?? ''
}

function extractMultiSelect(prop: { multi_select?: { name: string }[] } | undefined): string[] {
  return prop?.multi_select?.map(o => o.name) ?? []
}

function splitLines(text: string): string[] {
  return text.split('\n').map(l => l.trim()).filter(Boolean)
}

export async function GET() {
  if (!NOTION_TOKEN) {
    return NextResponse.json({ error: 'NOTION_TOKEN no configurado' }, { status: 503 })
  }

  try {
    // Consultar el último briefing ordenado por Fecha descendente
    const res = await fetch(
      `https://api.notion.com/v1/databases/${NOTION_DB_ID}/query`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${NOTION_TOKEN}`,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sorts: [{ property: 'Fecha', direction: 'descending' }],
          page_size: 1,
        }),
        next: { revalidate: 300 }, // cache 5 min
      }
    )

    if (!res.ok) {
      const err = await res.json()
      return NextResponse.json({ error: err.message ?? 'Notion error' }, { status: res.status })
    }

    const data = await res.json()
    const results = data.results ?? []

    if (results.length === 0) {
      return NextResponse.json({ briefing: null, message: 'Sin briefings disponibles' })
    }

    const page = results[0]
    const props = page.properties

    const briefing: BriefingEntry = {
      id:                    page.id,
      semana:                extractTitle(props['Semana']),
      fecha:                 extractDate(props['Fecha']),
      metricasDestacadas:    extractText(props['Metricas Destacadas']),
      tareasCriticas:        splitLines(extractText(props['Tareas Criticas'])),
      tareasImportantes:     splitLines(extractText(props['Tareas Importantes'])),
      tareasSiHayTiempo:     splitLines(extractText(props['Tareas Si Hay Tiempo'])),
      prioridadLunes:        extractText(props['Prioridad Lunes']),
      clientesConActividad:  extractMultiSelect(props['Clientes Con Actividad']),
      briefingCompleto:      extractText(props['Briefing Completo']),
    }

    return NextResponse.json({ briefing })
  } catch (err) {
    console.error('[briefing/route] error:', err)
    return NextResponse.json({ error: 'Error interno', briefing: null }, { status: 500 })
  }
}
