import { NextResponse } from 'next/server';

const TICKER     = 'HOOD';
const ENTRY      = 107.70;
const QTY        = 30;
const POLYGON_KEY = process.env.POLYGON_API_KEY ?? '';

export async function GET() {
  if (!POLYGON_KEY) {
    return NextResponse.json({ error: 'POLYGON_API_KEY no configurada en Vercel env vars.' }, { status: 500 });
  }

  try {
    const today = new Date().toISOString().slice(0, 10);
    const from  = new Date(Date.now() - 30 * 86400_000).toISOString().slice(0, 10);

    const [prevRes, barsRes, earningsRes] = await Promise.all([
      fetch(`https://api.polygon.io/v2/aggs/ticker/${TICKER}/prev?adjusted=true&apiKey=${POLYGON_KEY}`),
      fetch(`https://api.polygon.io/v2/aggs/ticker/${TICKER}/range/1/day/${from}/${today}?adjusted=true&limit=30&apiKey=${POLYGON_KEY}`),
      fetch(`https://finnhub.io/api/v1/calendar/earnings?symbol=${TICKER}&from=${today}&to=${new Date(Date.now() + 120 * 86400_000).toISOString().slice(0, 10)}&token=${process.env.NEXT_PUBLIC_FINNHUB_KEY ?? ''}`),
    ]);

    const prevData = prevRes.ok     ? await prevRes.json()     : {};
    const barsData = barsRes.ok     ? await barsRes.json()     : {};
    const earnData = earningsRes.ok ? await earningsRes.json() : {};

    const prev = prevData?.results?.[0] ?? null;
    const bars: { t: number; c: number; h: number; l: number; v: number }[] = barsData?.results ?? [];

    const price       = prev?.c ?? null;
    const open        = prev?.o ?? null;
    const high52w     = bars.length ? Math.max(...bars.map((b) => b.h)) : null;
    const low52w      = bars.length ? Math.min(...bars.map((b) => b.l)) : null;
    const vol         = prev?.v ?? null;
    const volAvg20    = bars.length >= 20
      ? bars.slice(-20).reduce((s, b) => s + b.v, 0) / 20
      : null;

    const pnl         = price !== null ? +(((price - ENTRY) * QTY).toFixed(2)) : null;
    const pnlPct      = price !== null ? +(((price - ENTRY) / ENTRY * 100).toFixed(2)) : null;
    const valor       = price !== null ? +(price * QTY).toFixed(2) : null;

    const earnings    = earnData?.earningsCalendar?.[0] ?? null;
    const daysToEarnings = earnings?.date
      ? Math.ceil((new Date(earnings.date).getTime() - Date.now()) / 86400_000)
      : null;

    return NextResponse.json({
      ticker:        TICKER,
      price,
      open,
      high52w,
      low52w,
      vol,
      volAvg20:      volAvg20 !== null ? +volAvg20.toFixed(0) : null,
      volRatio:      vol && volAvg20 ? +(vol / volAvg20).toFixed(2) : null,
      entry:         ENTRY,
      qty:           QTY,
      pnl,
      pnlPct,
      valor,
      earnings:      earnings ? {
        date:           earnings.date,
        hour:           earnings.hour,
        epsEstimate:    earnings.epsEstimate,
        daysLeft:       daysToEarnings,
      } : null,
      sparkline:     bars.slice(-7).map((b) => ({ t: b.t, c: b.c })),
      updatedAt:     new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
