import { NextResponse } from "next/server";

// GET /api/telegram/photos
// Fetches the 20 most recent photo messages sent to @RaxisM15_bot.
// Requires TELEGRAM_M15_BOT_TOKEN in Vercel environment vars.
// No webhook or Hetzner needed — uses Telegram getUpdates polling.
// Telegram keeps updates for 24h; photos older than that won't appear.

const TOKEN = process.env.TELEGRAM_M15_BOT_TOKEN;
const TG    = `https://api.telegram.org/bot${TOKEN}`;

interface TgPhotoSize { file_id: string; width: number; height: number; file_size?: number }
interface TgMessage   { message_id: number; date: number; caption?: string; photo?: TgPhotoSize[] }
interface TgUpdate    { update_id: number; message?: TgMessage }

export async function GET() {
  if (!TOKEN) {
    return NextResponse.json({ photos: [], _info: "TELEGRAM_M15_BOT_TOKEN no configurado en Vercel" });
  }

  try {
    const res = await fetch(`${TG}/getUpdates?limit=50&allowed_updates=["message"]`, {
      next: { revalidate: 30 },
    });
    if (!res.ok) {
      return NextResponse.json({ photos: [], _info: "Telegram API error" });
    }
    const data = await res.json();
    if (!data.ok) {
      return NextResponse.json({ photos: [], _info: data.description ?? "Telegram error" });
    }

    const updates: TgUpdate[] = data.result ?? [];
    const photos = updates
      .filter(u => u.message?.photo?.length)
      .map(u => {
        const msg = u.message!;
        // Use the largest photo size
        const best = msg.photo!.reduce((a, b) => (a.file_size ?? 0) > (b.file_size ?? 0) ? a : b);
        return {
          update_id: u.update_id,
          file_id:   best.file_id,
          // Served via proxy route — token never exposed to frontend
          url:       `/api/telegram/file?file_id=${encodeURIComponent(best.file_id)}`,
          caption:   msg.caption ?? "",
          date:      msg.date,
          date_str:  new Date(msg.date * 1000).toLocaleString("es-ES"),
        };
      })
      .reverse(); // newest first

    return NextResponse.json({ photos });
  } catch (e) {
    return NextResponse.json({ photos: [], _info: String(e) });
  }
}
