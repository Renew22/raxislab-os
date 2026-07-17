import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Endpoint de un solo uso para crear el admin de RaxisLab
// Una vez creado, protégelo o elimínalo
export async function POST(req: NextRequest) {
  const { secret, email, password } = await req.json();

  // Guard básico para que no lo use cualquiera
  if (secret !== process.env.SEED_SECRET && secret !== "raxislab_seed_2026") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const adminEmail = email ?? "renebenegas.rb@gmail.com";
  const adminPass  = password ?? "raxis2026";

  // ¿Ya existe?
  const existing = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (existing) {
    return NextResponse.json({ ok: true, msg: "Admin ya existe", userId: existing.id });
  }

  const hashed = await hashPassword(adminPass);
  const user = await prisma.user.create({
    data: {
      email: adminEmail,
      password: hashed,
      role: "ADMIN",
      name: "René Benegas",
    },
  });

  return NextResponse.json({ ok: true, userId: user.id, email: user.email });
}
