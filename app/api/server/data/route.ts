import { NextResponse } from 'next/server';

export const revalidate = 60; // cache 60s en Vercel

export async function GET() {
  const base = (process.env.HETZNER_URL ?? 'http://167.233.72.200').trim();
  const key  = process.env.HETZNER_DATA_KEY ?? '';

  if (!key) {
    return NextResponse.json({ error: 'HETZNER_DATA_KEY no configurada en Vercel.' }, { status: 500 });
  }

  try {
    const res = await fetch(`${base}/data/dashboard?key=${encodeURIComponent(key)}`, {
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) {
      return NextResponse.json({ error: `Servidor respondió ${res.status}` }, { status: 502 });
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 502 });
  }
}
