import { NextRequest, NextResponse } from "next/server";

// Finnhub Free plan: calendar/earnings IS available but limited to ~100 symbols/call
// Endpoint: GET /api/v1/calendar/earnings?from=YYYY-MM-DD&to=YYYY-MM-DD&symbol=AAPL&token=KEY
// Returns: { earningsCalendar: [{ date, epsActual, epsEstimate, hour, quarter, revenueActual, revenueEstimate, symbol, year }] }

export async function GET(req: NextRequest) {
  const key = process.env.NEXT_PUBLIC_FINNHUB_KEY;
  if (!key) return NextResponse.json({ error: "NEXT_PUBLIC_FINNHUB_KEY no configurado" }, { status: 500 });

  const { searchParams } = req.nextUrl;
  const symbol = searchParams.get("symbol"); // optional: filter by ticker
  const from   = searchParams.get("from")   ?? getDateOffset(0);
  const to     = searchParams.get("to")     ?? getDateOffset(7);

  try {
    const params = new URLSearchParams({ from, to, token: key });
    if (symbol) params.set("symbol", symbol.toUpperCase());

    const url = `https://finnhub.io/api/v1/calendar/earnings?${params}`;
    const res = await fetch(url, { next: { revalidate: 3600 } });

    if (!res.ok) {
      const body = await res.text();
      // 403 = no permissions on free plan (unlikely for earnings)
      // 429 = rate limited
      if (res.status === 403) {
        return NextResponse.json({
          error: "Sin permisos para earnings calendar. Verifica el plan de Finnhub.",
          _permissionError: true,
          status: 403,
        }, { status: 403 });
      }
      if (res.status === 429) {
        return NextResponse.json({ error: "Rate limit Finnhub — espera 1 minuto" }, { status: 429 });
      }
      return NextResponse.json({ error: `Finnhub error ${res.status}: ${body}` }, { status: res.status });
    }

    const data = await res.json();
    const calendar = data?.earningsCalendar ?? [];

    // Enrich with timing label
    const enriched = calendar.map((e: Record<string, unknown>) => ({
      symbol:          e.symbol,
      date:            e.date,
      hour:            e.hour,          // "bmo" = before market open, "amc" = after market close, "dmh" = during market hours
      horario:         e.hour === "bmo" ? "Pre-mercado" : e.hour === "amc" ? "After-Hours" : "Durante sesión",
      epsEstimate:     e.epsEstimate,
      epsActual:       e.epsActual,
      revenueEstimate: e.revenueEstimate,
      revenueActual:   e.revenueActual,
      quarter:         e.quarter,
      year:            e.year,
    }));

    return NextResponse.json({
      from, to,
      count:    enriched.length,
      calendar: enriched,
      _debug: {
        rawCount: calendar.length,
        endpoint: url.replace(key, "***"),
        note: calendar.length === 0
          ? "Array vacío — posibles causas: (1) rango de fechas sin earnings, (2) símbolo no reconocido, (3) plan no tiene acceso. Prueba con un rango más amplio."
          : "OK",
      },
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

function getDateOffset(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}
