import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { text, parseMode = 'HTML' } = await req.json();

  if (!text) {
    return NextResponse.json({ error: 'text requerido' }, { status: 400 });
  }

  const token  = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    return NextResponse.json({ error: 'TELEGRAM_BOT_TOKEN o TELEGRAM_CHAT_ID no configurados en Vercel' }, { status: 500 });
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: parseMode }),
    });

    const data = await res.json();
    if (!data.ok) {
      return NextResponse.json({ error: data.description ?? 'Error Telegram' }, { status: 400 });
    }

    return NextResponse.json({ success: true, messageId: data.result?.message_id });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error al enviar Telegram' }, { status: 500 });
  }
}
