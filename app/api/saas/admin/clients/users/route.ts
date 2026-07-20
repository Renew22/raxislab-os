import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, hashPassword } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET /api/saas/admin/clients/users — list all client users with email
export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") return NextResponse.json({ error: "Sin acceso" }, { status: 403 });

  const users = await prisma.user.findMany({
    where: { role: "CLIENT" },
    include: { client: { select: { name: true, slug: true, plan: true, status: true } } },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(users.map(u => ({
    id: u.id, email: u.email, name: u.name,
    client: u.client, createdAt: u.createdAt,
  })));
}

// PUT /api/saas/admin/clients/users — reset password for a client user
export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") return NextResponse.json({ error: "Sin acceso" }, { status: 403 });

  const { email, newPassword } = await req.json();
  if (!email || !newPassword) return NextResponse.json({ error: "Falta email o newPassword" }, { status: 400 });

  const hashed = await hashPassword(newPassword);
  const updated = await prisma.user.update({
    where: { email: email.toLowerCase() },
    data: { password: hashed },
    select: { id: true, email: true, name: true },
  });

  return NextResponse.json({ ok: true, user: updated });
}
