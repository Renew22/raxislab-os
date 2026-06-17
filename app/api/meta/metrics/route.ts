import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { accountId, dateRange = 'last_7d' } = await req.json();

  if (!accountId) {
    return NextResponse.json({ error: 'accountId requerido.' }, { status: 400 });
  }

  const token = process.env.META_ACCESS_TOKEN;
  if (!token) {
    return NextResponse.json({ error: 'Token de Meta no configurado.' }, { status: 500 });
  }

  try {
    const url = `https://graph.facebook.com/v21.0/${accountId}/insights?fields=spend,impressions,clicks,cpc,ctr,actions,cost_per_action_type&date_preset=${dateRange}`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();

    if (data.error) {
      if (data.error.code === 190) {
        return NextResponse.json({ error: 'Token de Meta expirado. Renuévalo en Business Manager.' }, { status: 401 });
      }
      return NextResponse.json({ error: data.error.message || 'Error al obtener métricas.' }, { status: 400 });
    }

    const row = data.data?.[0] ?? {};
    const leads = row.actions?.find((a: { action_type: string }) => a.action_type === 'lead')?.value ?? '—';
    const costPerLead = row.cost_per_action_type?.find((a: { action_type: string }) => a.action_type === 'lead')?.value;

    return NextResponse.json({
      inversion:    row.spend     ? `${parseFloat(row.spend).toFixed(2)}€`       : '—',
      cpl:          costPerLead   ? `${parseFloat(costPerLead).toFixed(2)}€`     : '—',
      roas:         '—',
      clics:        row.clicks    ?? '—',
      impresiones:  row.impressions ?? '—',
      leads:        leads !== '—' ? `${leads}/periodo` : '—',
      ctr:          row.ctr       ? `${parseFloat(row.ctr).toFixed(2)}%`         : '—',
    });
  } catch {
    return NextResponse.json({ error: 'Error de red al contactar con Meta.' }, { status: 500 });
  }
}
