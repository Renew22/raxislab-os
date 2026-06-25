import { NextResponse } from 'next/server';

const RIPIENO_API = process.env.RIPIENO_API_URL || 'https://ripieno.raxislab.com';
const ADMIN_KEY   = process.env.RIPIENO_ADMIN_KEY || '';

export async function GET() {
  try {
    const res  = await fetch(`${RIPIENO_API}/api/stats`, {
      headers: { 'x-admin-key': ADMIN_KEY },
      cache: 'no-store',
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: 'Error conectando con backend Ripieno.' }, { status: 502 });
  }
}
