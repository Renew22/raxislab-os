import { NextResponse } from 'next/server';

const OBJECTIVE_MAP: Record<string, string> = {
  leads:       'OUTCOME_LEADS',
  conversions: 'OUTCOME_SALES',
  reach:       'OUTCOME_AWARENESS',
  traffic:     'OUTCOME_TRAFFIC',
};

const CTA_MAP: Record<string, string> = {
  'Reservar ahora':  'BOOK_TRAVEL',
  'Más información': 'LEARN_MORE',
  'Llamar ahora':    'CALL_NOW',
};

export async function POST(req: Request) {
  const { accountId, objetivo, presupuesto, audiencia, textoAnuncio, cta, publishStatus = 'PAUSED' } = await req.json();

  const token = process.env.META_ACCESS_TOKEN;
  if (!token) {
    return NextResponse.json({ error: 'Token de Meta no configurado.' }, { status: 500 });
  }

  const baseUrl = `https://graph.facebook.com/v21.0`;
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  const finalStatus = publishStatus === 'ACTIVE' ? 'ACTIVE' : 'PAUSED';
  const namePrefix  = finalStatus === 'ACTIVE' ? '[OS]' : '[Borrador OS]';

  try {
    // 1. Crear campaña
    const campaignRes = await fetch(`${baseUrl}/${accountId}/campaigns`, {
      method: 'POST', headers,
      body: JSON.stringify({
        name: `${namePrefix} ${objetivo} — ${new Date().toLocaleDateString('es-ES')}`,
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
    const adsetRes = await fetch(`${baseUrl}/${accountId}/adsets`, {
      method: 'POST', headers,
      body: JSON.stringify({
        name: `Ad Set — ${audiencia?.slice(0, 40) ?? 'General'}`,
        campaign_id: campaign.id,
        daily_budget: Math.round(parseFloat(presupuesto) * 100),
        billing_event: 'IMPRESSIONS',
        optimization_goal: 'LEAD_GENERATION',
        targeting: { geo_locations: { countries: ['ES'] } },
        status: finalStatus,
      }),
    });
    const adset = await adsetRes.json();
    if (adset.error) {
      return NextResponse.json({ error: adset.error.message }, { status: 400 });
    }

    // 3. Crear anuncio con creative
    const adRes = await fetch(`${baseUrl}/${accountId}/ads`, {
      method: 'POST', headers,
      body: JSON.stringify({
        name: `Anuncio — ${new Date().toLocaleDateString('es-ES')}`,
        adset_id: adset.id,
        creative: {
          creative_id: undefined,
          object_story_spec: {
            page_id: accountId.replace('act_', ''),
            link_data: {
              message: textoAnuncio,
              call_to_action: { type: CTA_MAP[cta] ?? 'LEARN_MORE' },
            },
          },
        },
        status: finalStatus,
      }),
    });
    const ad = await adRes.json();
    if (ad.error) {
      return NextResponse.json({ error: ad.error.message }, { status: 400 });
    }

    const editUrl = `https://business.facebook.com/adsmanager/manage/campaigns?act=${accountId.replace('act_', '')}`;
    return NextResponse.json({ success: true, campaignId: campaign.id, publishStatus: finalStatus, editUrl });
  } catch {
    return NextResponse.json({ error: 'Error de red al contactar con Meta.' }, { status: 500 });
  }
}
