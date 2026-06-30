import { NextRequest, NextResponse } from "next/server";

const API_KEY = process.env.POLYGON_API_KEY ?? "";
const BASE    = "https://api.polygon.io";

async function indicator(endpoint: string, ticker: string, params: Record<string, string>) {
  const q = new URLSearchParams({ ...params, order: "desc", limit: "1", apiKey: API_KEY });
  const r = await fetch(`${BASE}/v1/indicators/${endpoint}/${ticker}?${q}`, { next: { revalidate: 300 } });
  if (!r.ok) return null;
  const j = await r.json();
  return j?.results?.values?.[0]?.value ?? null;
}

async function prevClose(ticker: string) {
  const r = await fetch(`${BASE}/v2/aggs/ticker/${ticker}/prev?adjusted=true&apiKey=${API_KEY}`, { next: { revalidate: 300 } });
  if (!r.ok) return null;
  const j = await r.json();
  return j?.results?.[0] ?? null;
}

export async function GET(req: NextRequest) {
  const ticker = req.nextUrl.searchParams.get("ticker")?.toUpperCase();
  if (!ticker) return NextResponse.json({ error: "ticker requerido" }, { status: 400 });
  if (!API_KEY) return NextResponse.json({ error: "POLYGON_API_KEY no configurado" }, { status: 500 });

  try {
    const [sma20, sma50, sma200, ema20, ema50, rsi14, prev] = await Promise.all([
      indicator("sma",  ticker, { timespan:"day", window:"20",  series_type:"close" }),
      indicator("sma",  ticker, { timespan:"day", window:"50",  series_type:"close" }),
      indicator("sma",  ticker, { timespan:"day", window:"200", series_type:"close" }),
      indicator("ema",  ticker, { timespan:"day", window:"20",  series_type:"close" }),
      indicator("ema",  ticker, { timespan:"day", window:"50",  series_type:"close" }),
      indicator("rsi",  ticker, { timespan:"day", window:"14",  series_type:"close" }),
      prevClose(ticker),
    ]);

    const price   = prev?.c ?? null;
    const volume  = prev?.v ?? null;
    const vwap    = prev?.vw ?? null;

    let trend = "NEUTRO";
    if (price && sma20 && sma50 && sma200) {
      const aboveSma20  = price > sma20;
      const aboveSma50  = price > sma50;
      const aboveSma200 = price > sma200;
      const bullCount   = [aboveSma20, aboveSma50, aboveSma200].filter(Boolean).length;
      if (bullCount === 3) trend = "ALCISTA FUERTE";
      else if (bullCount === 2) trend = "ALCISTA";
      else if (bullCount === 1) trend = "BAJISTA";
      else trend = "BAJISTA FUERTE";
    }

    let rsiSignal = "";
    if (rsi14 !== null) {
      if (rsi14 >= 70) rsiSignal = "SOBRECOMPRADO";
      else if (rsi14 <= 30) rsiSignal = "SOBREVENDIDO";
      else if (rsi14 >= 55) rsiSignal = "FUERTE";
      else if (rsi14 <= 45) rsiSignal = "DÉBIL";
      else rsiSignal = "NEUTRO";
    }

    return NextResponse.json({
      ticker,
      price,
      volume,
      vwap,
      sma20,  sma50,  sma200,
      ema20,  ema50,
      rsi14,
      trend,
      rsiSignal,
      priceVsSma20:  price && sma20  ? ((price - sma20)  / sma20  * 100).toFixed(2) : null,
      priceVsSma50:  price && sma50  ? ((price - sma50)  / sma50  * 100).toFixed(2) : null,
      priceVsSma200: price && sma200 ? ((price - sma200) / sma200 * 100).toFixed(2) : null,
    });
  } catch {
    return NextResponse.json({ error: "Error consultando Polygon" }, { status: 500 });
  }
}
