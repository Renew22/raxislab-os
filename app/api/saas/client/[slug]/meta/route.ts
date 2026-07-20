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

  // Obtener integración Meta del cliente
  const integration = await prisma.integration.findFirst({
    where: { client: { slug }, type: "META", active: true },
  });

  if (!integration?.accountId) {
    return NextResponse.json({ error: "Sin cuenta Meta configurada" }, { status: 404 });
  }

  // Token: DB → env por cliente (META_TOKEN_DESANCHO, META_TOKEN_IDENTITY…) → global
  const envKey = `META_TOKEN_${slug.toUpperCase()}`;
  const token =
    integration.accessToken ??
    process.env[envKey] ??
    process.env.META_ACCESS_TOKEN;

  if (!token) return NextResponse.json({ error: "Sin token Meta" }, { status: 500 });

  const since = new Date();
  since.setDate(since.getDate() - Number(days));
  const sinceStr = since.toISOString().split("T")[0];
  const untilStr = new Date().toISOString().split("T")[0];

  const fields = "spend,actions,clicks,impressions,ctr,cpc,cpp";
  const url = `https://graph.facebook.com/v21.0/${integration.accountId}/insights?fields=${fields}&time_range={"since":"${sinceStr}","until":"${untilStr}"}&level=account&access_token=${token}`;

  const res = await fetch(url);
  const json = await res.json();

  if (json.error) return NextResponse.json({ error: json.error.message }, { status: 400 });

  const d = json.data?.[0] ?? {};
  const leads = d.actions?.find((a: any) => a.action_type === "lead")?.value ?? 0;
  const spend = parseFloat(d.spend ?? "0");
  const cpl = leads > 0 ? (spend / leads).toFixed(2) : "—";

  return NextResponse.json({
    spend: `${spend.toFixed(0)}€`,
    leads: Number(leads),
    cpl: cpl !== "—" ? `${cpl}€` : "—",
    ctr: d.ctr ? `${parseFloat(d.ctr).toFixed(2)}%` : "—",
    clicks: Number(d.clicks ?? 0),
    impressions: Number(d.impressions ?? 0),
  });
}
