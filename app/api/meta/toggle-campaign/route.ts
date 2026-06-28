import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { campaignId, action } = await req.json();
  if (!campaignId || !['ACTIVE', 'PAUSED'].includes(action)) {
    return NextResponse.json({ error: 'campaignId y action (ACTIVE|PAUSED) requeridos.' }, { status: 400 });
  }
  const token = process.env.META_ACCESS_TOKEN;
  if (!token) return NextResponse.json({ error: 'META_ACCESS_TOKEN no configurado.' }, { status: 500 });

  const res = await fetch(`https://graph.facebook.com/v21.0/${campaignId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ status: action }),
  });
  const data = await res.json();
  if (data.error) return NextResponse.json({ error: data.error.message }, { status: 400 });
  return NextResponse.json({ ok: true, newStatus: action });
}
