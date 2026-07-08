import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { to, subject, html } = await req.json();
  const key = process.env.BREVO_API_KEY;
  if (!key) return NextResponse.json({ error: 'BREVO_API_KEY no configurada' }, { status: 500 });

  try {
    const r = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'api-key': key, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sender: { name: 'Last Mile Distribution', email: 'ventas@lastmiledist.com' },
        to: [{ email: to }],
        subject,
        htmlContent: html,
      }),
    });
    if (!r.ok) {
      const txt = await r.text();
      return NextResponse.json({ error: txt }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
