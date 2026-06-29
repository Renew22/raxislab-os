import { NextResponse } from 'next/server';

const CLIENT_ACCOUNTS: Record<string, string> = {
  'identity-peluqueros':    'META_ACCOUNT_IDENTITY_PELUQUEROS',
  'desancho-estilistas':    'META_ACCOUNT_DESANCHO',
  'malvarrosa-cf':          'META_ACCOUNT_CFMALVARROSA',
  'last-mile-distribution': 'META_ACCOUNT_LAST_MILE',
  'matias-benegas-tattoo':  'META_ACCOUNT_BENEGASTATTOOS',
};

const OBJECTIVE_MAP: Record<string, string> = {
  leads:       'OUTCOME_LEADS',
  conversions: 'OUTCOME_SALES',
  reach:       'OUTCOME_AWARENESS',
  traffic:     'OUTCOME_TRAFFIC',
};

const GOAL_MAP: Record<string, string> = {
  leads:       'LEAD_GENERATION',
  conversions: 'OFFSITE_CONVERSIONS',
  reach:       'REACH',
  traffic:     'LINK_CLICKS',
};

export async function POST(req: Request) {
  const {
    clientId,
    accountId: providedAccountId,
    objetivo,
    presupuesto,
    audiencia,
    textoAnuncio,
    publishStatus = 'PAUSED',
  } = await req.json();

  const token = process.env.META_ACCESS_TOKEN;
  if (!token) {
    return NextResponse.json({ error: 'Token de Meta no configurado.' }, { status: 500 });
  }

  // Resolve accountId: use provided, or look up from env via clientId
  const envKey = clientId ? CLIENT_ACCOUNTS[clientId] : undefined;
  const accountId = providedAccountId || (envKey ? process.env[envKey] : undefined);
  if (!accountId) {
    return NextResponse.json({ error: `No se encontró la cuenta de Meta para este cliente (clientId: ${clientId}).` }, { status: 400 });
  }

  const baseUrl = 'https://graph.facebook.com/v21.0';
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  const finalStatus = publishStatus === 'ACTIVE' ? 'ACTIVE' : 'PAUSED';
  const namePrefix  = finalStatus === 'ACTIVE' ? '[OS]' : '[Borrador OS]';
  const dateLabel   = new Date().toLocaleDateString('es-ES');

  try {
    // 1. Crear campaña
    const campaignRes = await fetch(`${baseUrl}/${accountId}/campaigns`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        name: `${namePrefix} ${objetivo} — ${dateLabel}`,
        objective: OBJECTIVE_MAP[objetivo] ?? 'OUTCOME_LEADS',
        status: finalStatus,
        special_ad_categories: [],
      }),
    });
    const campaign = await campaignRes.json();
    if (campaign.error) {
      return NextResponse.json({ error: campaign.error.message }, { status: 400 });
    }

    // 2. Crear ad set
    const dailyBudgetCents = Math.round(parseFloat(presupuesto) * 100);
    const adsetRes = await fetch(`${baseUrl}/${accountId}/adsets`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        name: `Ad Set — ${audiencia?.slice(0, 40) ?? 'General'}`,
        campaign_id: campaign.id,
        daily_budget: dailyBudgetCents,
        billing_event: 'IMPRESSIONS',
        optimization_goal: GOAL_MAP[objetivo] ?? 'LEAD_GENERATION',
        targeting: {
          geo_locations: { countries: ['ES'] },
          age_min: 18,
          age_max: 65,
        },
        status: finalStatus,
      }),
    });
    const adset = await adsetRes.json();
    if (adset.error) {
      return NextResponse.json({ error: adset.error.message }, { status: 400 });
    }

    // URLs de edición directa en Meta Ads Manager
    const actId = accountId.replace('act_', '');
    const editUrl = `https://business.facebook.com/adsmanager/manage/campaigns?act=${actId}`;
    const adsetUrl = `https://business.facebook.com/adsmanager/manage/adsets?act=${actId}&selected_adset_id=${adset.id}`;

    return NextResponse.json({
      success: true,
      campaignId: campaign.id,
      adsetId: adset.id,
      publishStatus: finalStatus,
      editUrl,
      adsetUrl,
      note: textoAnuncio
        ? `Texto guardado (úsalo al crear el anuncio en Meta): "${textoAnuncio}"`
        : null,
    });
  } catch {
    return NextResponse.json({ error: 'Error de red al contactar con Meta.' }, { status: 500 });
  }
}
