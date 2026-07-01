import { NextRequest, NextResponse } from "next/server";

const NOTION_TOKEN = process.env.NOTION_TOKEN ?? "";
const DB_ID = process.env.NOTION_TASKS_DB_ID ?? "fe068a2e-57cb-4936-b762-4cb2b5774414";

export interface NotionTask {
  id: string;
  title: string;
  proyecto: string;
  estado: string;
  prioridad: string;
  fecha: string | null;
  soloYo: boolean;
}

export async function GET(req: NextRequest) {
  if (!NOTION_TOKEN) return NextResponse.json({ error: "NOTION_TOKEN no configurado" }, { status: 500 });

  const from = req.nextUrl.searchParams.get("from");
  const to   = req.nextUrl.searchParams.get("to");

  const filterBlock =
    from && to
      ? {
          and: [
            { property: "Fecha", date: { on_or_after: from } },
            { property: "Fecha", date: { on_or_before: to } },
          ],
        }
      : undefined;

  try {
    const res = await fetch(
      `https://api.notion.com/v1/databases/${DB_ID}/query`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${NOTION_TOKEN}`,
          "Notion-Version": "2022-06-28",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...(filterBlock ? { filter: filterBlock } : {}),
          sorts: [{ property: "Fecha", direction: "ascending" }],
          page_size: 100,
        }),
        next: { revalidate: 300 },
      }
    );

    if (!res.ok) {
      const detail = await res.text();
      return NextResponse.json({ error: `Notion ${res.status}`, detail: detail.slice(0, 300) }, { status: res.status });
    }

    const data = await res.json();

    const tasks: NotionTask[] = (data.results ?? []).map(
      (page: Record<string, unknown>) => {
        const props = page.properties as Record<string, unknown>;

        const titleArr =
          (props["Tarea"] as { title?: { plain_text: string }[] })?.title ?? [];
        const title = titleArr.map((t) => t.plain_text).join("") || "Sin título";

        const proyecto =
          (props["Proyecto"] as { select?: { name: string } })?.select?.name ?? "";
        const estado =
          (props["Estado"] as { select?: { name: string } })?.select?.name ?? "";
        const prioridad =
          (props["Prioridad"] as { select?: { name: string } })?.select?.name ?? "";
        const fecha =
          (props["Fecha"] as { date?: { start: string } })?.date?.start ?? null;
        const soloYo =
          (props["Solo yo puedo"] as { checkbox?: boolean })?.checkbox ?? false;

        return {
          id: page.id as string,
          title,
          proyecto,
          estado,
          prioridad,
          fecha,
          soloYo,
        };
      }
    );

    return NextResponse.json({ tasks, total: tasks.length });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
