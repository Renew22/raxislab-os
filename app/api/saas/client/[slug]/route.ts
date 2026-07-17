import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { slug } = await params;

  // Clientes solo pueden ver su propio slug
  if (session.role === "CLIENT" && session.clientSlug !== slug) {
    return NextResponse.json({ error: "Sin acceso" }, { status: 403 });
  }

  const client = await prisma.client.findUnique({
    where: { slug },
    include: {
      integrations: { select: { type: true, accountId: true, active: true, ga4Id: true, siteUrl: true } },
    },
  });

  if (!client) return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });

  return NextResponse.json({
    id: client.id,
    name: client.name,
    slug: client.slug,
    sector: client.sector,
    logo: client.logo,
    website: client.website,
    plan: client.plan,
    status: client.status,
    city: client.city,
    integrations: client.integrations,
  });
}
