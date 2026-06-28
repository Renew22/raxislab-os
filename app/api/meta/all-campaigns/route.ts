import { NextResponse } from 'next/server';

const ACCOUNTS: { clientId: string; clientName: string; envKey: string }[] = [
  { clientId: 'identity-peluqueros', clientName: 'Identity Peluqueros', envKey: 'META_ACCOUNT_IDENTITY_PELUQUEROS' },
  { clientId: 'desancho-estilistas', clientName: 'Desancho Estilistas',  envKey: 'META_ACCOUNT_DESANCHO'           },
  { clientId: 'malvarrosa-cf',       clientName: 'Malvarrosa CF',        envKey: 'META_ACCOUNT_CFMALVARROSA'       },
  { clientId: 'last-mile',           clientName: 'Last Mile',            envKey: 'META_ACCOUNT_LAST_MILE'          },
  { clientId: 'matias-benegas-tattoo', clientName: 'Matías Benegas Tattoo', envKey: 'META_ACCOUNT_BENEGASTATTOOS' },
];

const BASE = 'https://graph.facebook.com/v21.0';

async function fetchCampaigns(accountId: string, token: string, datePreset: string) {
  // campaigns + basic info
  const campUrl = `${BASE}/${accountId}/campaigns?fields=id,name,status,daily_budget,budget_remaining,created_time,objective&limit=50`;
  const campRes = await fetch(campUrl, { headers: { Authorization: `Bearer ${token}` } });
  const campData = await campRes.json();
  if (campData.error) throw new Error(campData.error.message);
  const campaigns: Record<string, unknown>[] = campData.data ?? [];

  // insights per campaign
  const insightsUrl = `${BASE}/${accountId}/insights?fields=campaign_id,spend,impressions,clicks,ctr,cpc,actions,cost_per_action_type&date_preset=${datePreset}&level=campaign&limit=50`;
  const insRes = await fetch(insightsUrl, { headers: { Authorization: `Bearer ${token}` } });
  const insData = await insRes.json();
  const insightsMap: Record<string, Record<string, unknown>> = {};
  for (const row of (insData.data ?? [])) {
    insightsMap[row.campaign_id as string] = row;
  }

  return campaigns.map(c => {
    const ins = insightsMap[c.id as string] ?? {};
    const leads = (ins.actions as { action_type: string; value: string }[] | undefined)
      ?.find(a => a.action_type === 'lead')?.value ?? null;
    const cpl = (ins.cost_per_action_type as { action_type: string; value: string }[] | undefined)
      ?.find(a => a.action_type === 'lead')?.value ?? null;
    return {
      id:              c.id,
      name:            c.name,
      status:          c.status,
      objective:       c.objective,
      daily_budget:    c.daily_budget ? (Number(c.daily_budget) / 100).toFixed(2) : null,
      budget_remaining: c.budget_remaining ? (Number(c.budget_remaining) / 100).toFixed(2) : null,
      created_time:    c.created_time,
      spend:           ins.spend    ? Number(ins.spend).toFixed(2)    : null,
      impressions:     ins.impressions  ?? null,
      clicks:          ins.clicks       ?? null,
      ctr:             ins.ctr     ? Number(ins.ctr).toFixed(2)        : null,
      cpc:             ins.cpc     ? Number(ins.cpc).toFixed(2)        : null,
      leads,
      cpl:             cpl ? Number(cpl).toFixed(2) : null,
    };
  });
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const datePreset = searchParams.get('datePreset') ?? 'last_7d';
  const token = process.env.META_ACCESS_TOKEN;
  if (!token) return NextResponse.json({ error: 'META_ACCESS_TOKEN no configurado.' }, { status: 500 });

  const results = await Promise.allSettled(
    ACCOUNTS.map(async acc => {
      const accountId = process.env[acc.envKey];
      if (!accountId) return { ...acc, campaigns: [], error: 'Sin cuenta configurada' };
      try {
        const campaigns = await fetchCampaigns(accountId, token, datePreset);
        return { ...acc, accountId, campaigns, error: null };
      } catch (e) {
        return { ...acc, accountId, campaigns: [], error: String(e) };
      }
    })
  );

  const data = results.map(r => (r.status === 'fulfilled' ? r.value : { error: 'Error inesperado', campaigns: [] }));
  return NextResponse.json({ data, datePreset });
}
