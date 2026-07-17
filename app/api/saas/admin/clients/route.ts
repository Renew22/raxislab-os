import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, hashPassword } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Sin acceso" }, { status: 403 });
  }

  const clients = await prisma.client.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { users: true } } },
  });

  return NextResponse.json(clients);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Sin acceso" }, { status: 403 });
  }

  const body = await req.json();
  const { name, slug, email, password, sector, plan, mrr, website, city,
          metaAccountId, googleAdsId, ga4Id, siteUrl } = body;

  if (!name || !slug || !email || !password) {
    return NextResponse.json({ error: "Faltan campos obligatorios: nombre, slug, email, contraseña" }, { status: 400 });
  }

  // Verificar slug único
  const existing = await prisma.client.findUnique({ where: { slug } });
  if (existing) return NextResponse.json({ error: "Ese slug ya existe" }, { status: 409 });

  const hashedPassword = await hashPassword(password);

  const client = await prisma.client.create({
    data: {
      name, slug, sector: sector ?? "OTROS",
      plan: plan ?? "BASICO",
      mrr: mrr ? parseFloat(mrr) : 0,
      website: website || null,
      city: city || null,
      status: "TRIAL",
      users: {
        create: {
          email: email.toLowerCase(),
          password: hashedPassword,
          role: "CLIENT",
          name,
        },
      },
      integrations: {
        create: [
          ...(metaAccountId ? [{ type: "META" as const, accountId: metaAccountId }] : []),
          ...(googleAdsId ? [{ type: "GOOGLE_ADS" as const, accountId: googleAdsId.replace(/-/g, "") }] : []),
          ...(ga4Id || siteUrl ? [{ type: "SEARCH_CONSOLE" as const, siteUrl: siteUrl || null, ga4Id: ga4Id || null }] : []),
        ],
      },
    },
    include: { users: { select: { id: true, email: true } } },
  });

  return NextResponse.json({ ok: true, clientId: client.id, slug: client.slug });
}
