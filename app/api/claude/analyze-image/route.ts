import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: Request) {
  const { imageBase64, mediaType, prompt } = await req.json();
  if (!imageBase64 || !prompt) {
    return NextResponse.json({ error: "Faltan imageBase64 o prompt" }, { status: 400 });
  }

  try {
    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mediaType ?? "image/png",
                data: imageBase64,
              },
            },
            { type: "text", text: prompt },
          ],
        },
      ],
    });
    const content = message.content[0].type === "text" ? message.content[0].text : "";
    return NextResponse.json({ content });
  } catch {
    return NextResponse.json({ error: "Error analizando imagen" }, { status: 500 });
  }
}
