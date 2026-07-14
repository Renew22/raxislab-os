import { NextResponse } from 'next/server';

export const revalidate = 60;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const market = (searchParams.get('market') ?? 'BTCUSDT').toUpperCase();
  const period = searchParams.get('period') ?? 'min15';
  const limit  = searchParams.get('limit')  ?? '150';

  try {
    const res = await fetch(
      `https://api.coinex.com/v2/futures/kline?market=${market}&period=${period}&limit=${limit}`,
      { signal: AbortSignal.timeout(8000) }
    );
    const json = await res.json();
    // CoinEx v2: { data: { data: [[ts_seconds, open, close, high, low, vol, qvol], ...] } }
    const raw: string[][] = json?.data?.data ?? [];
    const candles = raw.map(c => ({
      t: Number(c[0]),
      o: parseFloat(c[1]),
      c: parseFloat(c[2]),
      h: parseFloat(c[3]),
      l: parseFloat(c[4]),
    }));
    return NextResponse.json({ candles });
  } catch (e) {
    return NextResponse.json({ error: String(e), candles: [] }, { status: 502 });
  }
}
