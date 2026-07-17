import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { comparePassword, signToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  if (!email || !password) {
    return NextResponse.json({ error: "Faltan credenciales" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    include: { client: { select: { slug: true, name: true } } },
  });

  if (!user || !(await comparePassword(password, user.password))) {
    return NextResponse.json({ error: "Email o contraseña incorrectos" }, { status: 401 });
  }

  const token = await signToken({
    userId: user.id,
    email: user.email,
    role: user.role,
    clientId: user.clientId ?? undefined,
    clientSlug: user.client?.slug ?? undefined,
  });

  const res = NextResponse.json({
    ok: true,
    role: user.role,
    clientSlug: user.client?.slug,
    name: user.name ?? user.client?.name,
  });

  res.cookies.set("raxislab_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });

  return res;
}
