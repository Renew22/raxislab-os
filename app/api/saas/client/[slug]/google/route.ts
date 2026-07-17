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
  if (session.role === "CLIENT" && session.clientSlug !== slug) {
    return NextResponse.json({ error: "Sin acceso" }, { status: 403 });
  }

  const days = req.nextUrl.searchParams.get("days") ?? "30";

  const [adsInteg, scInteg] = await Promise.all([
    prisma.integration.findFirst({ where: { client: { slug }, type: "GOOGLE_ADS", active: true } }),
    prisma.integration.findFirst({ where: { client: { slug }, type: "SEARCH_CONSOLE", active: true } }),
  ]);

  if (!adsInteg?.accountId && !scInteg?.siteUrl) {
    return NextResponse.json({ error: "Sin integraciones Google configuradas" }, { status: 404 });
  }

  // Reutilizar el motor de auditoría existente
  const auditRes = await fetch(`${process.env.NEXT_PUBLIC_URL ?? "http://localhost:3000"}/api/google/audit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      customerId: adsInteg?.accountId?.replace(/-/g, "") ?? "",
      siteUrl: scInteg?.siteUrl ?? "",
      ga4PropertyId: scInteg?.ga4Id ?? "",
      days: Number(days),
    }),
  });

  if (!auditRes.ok) {
    const err = await auditRes.json();
    return NextResponse.json({ error: err.error ?? "Error auditoría Google" }, { status: 500 });
  }

  return NextResponse.json(await auditRes.json());
}
