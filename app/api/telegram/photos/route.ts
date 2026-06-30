import { NextResponse } from "next/server";

// GET /api/telegram/photos
// Proxies to Hetzner endpoint that stores trade screenshots sent by René to the Telegram bot.
// Required setup on Hetzner:
//   1. Create bot via @BotFather → store token in TELEGRAM_TRADE_BOT_TOKEN
//   2. Set webhook: POST https://api.telegram.org/bot{TOKEN}/setWebhook?url=http://167.233.72.200/webhook/telegram-trades
//   3. Hetzner endpoint stores photo URL + metadata in /opt/raxislab/telegram-trades.json
// Until configured, returns empty array so the UI shows the pending setup banner.

const HETZNER_KEY = process.env.HETZNER_DASH_KEY ?? "rxl_dash_k9m4p7q2x8";
const HETZNER_BASE = "http://167.233.72.200";

export async function GET() {
  try {
    const res = await fetch(`${HETZNER_BASE}/data/telegram-photos?key=${HETZNER_KEY}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) {
      return NextResponse.json({ photos: [], _pending: true, _info: "Endpoint de fotos no configurado en Hetzner" });
    }
    const data = await res.json();
    return NextResponse.json({ photos: data.photos ?? [] });
  } catch {
    return NextResponse.json({ photos: [], _pending: true, _info: "Hetzner no responde — webhook pendiente de configurar" });
  }
}
