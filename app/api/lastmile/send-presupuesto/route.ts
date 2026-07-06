import { NextResponse } from 'next/server';

const BREVO_KEY = process.env.BREVO_LMD_KEY ?? process.env.BREVO_API_KEY ?? '';

export async function POST(req: Request) {
  const { to, clientName, subject, htmlContent } = await req.json();

  if (!to || !htmlContent) {
    return NextResponse.json({ error: 'to y htmlContent requeridos' }, { status: 400 });
  }

  try {
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': BREVO_KEY,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender: { name: 'Last Mile Distribution', email: 'ventas@lastmiledist.com' },
        to: [{ email: to, name: clientName || to }],
        subject: subject || `Presupuesto Last Mile Distribution - ${clientName}`,
        htmlContent,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: err }, { status: res.status });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: 'Error enviando email' }, { status: 500 });
  }
}
