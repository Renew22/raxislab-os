import { NextRequest, NextResponse } from "next/server";

// GET /api/telegram/file?file_id=XXX
// Proxies a Telegram photo to the client without exposing the bot token.

const TOKEN = process.env.TELEGRAM_M15_BOT_TOKEN;
const TG    = `https://api.telegram.org/bot${TOKEN}`;

export async function GET(req: NextRequest) {
  if (!TOKEN) return new NextResponse("Token not configured", { status: 503 });

  const file_id = req.nextUrl.searchParams.get("file_id");
  if (!file_id) return new NextResponse("Missing file_id", { status: 400 });

  try {
    const meta = await fetch(`${TG}/getFile?file_id=${encodeURIComponent(file_id)}`).then(r => r.json());
    if (!meta.ok) return new NextResponse("Telegram error", { status: 502 });

    const file_path = meta.result.file_path as string;
    const imgRes = await fetch(`https://api.telegram.org/file/bot${TOKEN}/${file_path}`);
    if (!imgRes.ok) return new NextResponse("Photo fetch failed", { status: 502 });

    const buf = await imgRes.arrayBuffer();
    const ct  = imgRes.headers.get("content-type") ?? "image/jpeg";
    return new NextResponse(buf, {
      headers: {
        "Content-Type": ct,
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (e) {
    return new NextResponse(String(e), { status: 500 });
  }
}
