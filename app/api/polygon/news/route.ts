import { NextRequest, NextResponse } from "next/server";

const API_KEY = process.env.POLYGON_API_KEY ?? "";

export async function GET(req: NextRequest) {
  const ticker = req.nextUrl.searchParams.get("ticker")?.toUpperCase();
  const limit  = req.nextUrl.searchParams.get("limit") ?? "10";

  if (!API_KEY) return NextResponse.json({ error: "POLYGON_API_KEY no configurado" }, { status: 500 });

  try {
    const params = new URLSearchParams({
      apiKey: API_KEY,
      limit,
      order: "desc",
      ...(ticker ? { ticker } : {}),
    });

    const r = await fetch(
      `https://api.polygon.io/v2/reference/news?${params}`,
      { next: { revalidate: 900 } } // 15 min cache
    );

    if (!r.ok) {
      const body = await r.text();
      return NextResponse.json({ error: `Polygon HTTP ${r.status}`, detail: body.slice(0, 200) }, { status: r.status });
    }

    const j = await r.json();
    return NextResponse.json({
      results: (j.results ?? []).map((n: Record<string, unknown>) => ({
        id:           n.id,
        publisher:    (n.publisher as Record<string, string>)?.name ?? "",
        title:        n.title,
        published_utc: n.published_utc,
        article_url:  n.article_url,
        tickers:      n.tickers,
        description:  (n.description as string)?.slice(0, 200) ?? "",
      })),
      next_url: j.next_url ?? null,
      count: j.count ?? 0,
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
