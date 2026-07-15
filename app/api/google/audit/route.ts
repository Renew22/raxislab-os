import { NextResponse } from 'next/server';
import { getGoogleAccessToken, googleNotConfigured } from '@/app/lib/google-auth';

// Full audit for one client: fetch Ads + SC + GA4 and return structured recommendations
export async function POST(req: Request) {
  const { customerId, siteUrl, ga4PropertyId, days = 30 } = await req.json();
  if (googleNotConfigured()) return NextResponse.json({ error: 'Google no configurado' }, { status: 500 });

  const developerToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN ?? process.env.GOOGLE_ADS_API_KEY;
  const MCC_ID = '7179865639';
  const token  = await getGoogleAccessToken();
  const H      = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  const adsH   = { ...H, 'developer-token': developerToken ?? '', 'login-customer-id': MCC_ID };

  const end   = new Date();
  const start = new Date(Date.now() - days * 864e5);
  const fmt   = (d: Date) => d.toISOString().split('T')[0];

  // ── Fetch in parallel ───────────────────────────────────────────────────────
  const [adsRes, adsAdgroupRes, adsCritRes, scRes, ga4ChanRes, ga4PagesRes] = await Promise.allSettled([
    // Ads: campaign details
    customerId && developerToken ? fetch(
      `https://googleads.googleapis.com/v17/customers/${customerId}/googleAds:search`,
      { method: 'POST', headers: adsH, body: JSON.stringify({ query: `
        SELECT campaign.id, campaign.name, campaign.status, campaign.advertising_channel_type,
          campaign.bidding_strategy_type, campaign.target_cpa.target_cpa_micros,
          campaign.maximize_conversions.target_cpa_micros,
          metrics.cost_micros, metrics.clicks, metrics.impressions, metrics.ctr,
          metrics.average_cpc, metrics.conversions, metrics.cost_per_conversion,
          metrics.all_conversions_value, metrics.search_impression_share,
          metrics.search_budget_lost_impression_share, metrics.search_rank_lost_impression_share,
          metrics.quality_score
        FROM campaign
        WHERE segments.date BETWEEN '${fmt(start)}' AND '${fmt(end)}'
        ORDER BY metrics.cost_micros DESC
      ` }), cache: 'no-store' }
    ) : Promise.resolve(null),

    // Ads: ad groups
    customerId && developerToken ? fetch(
      `https://googleads.googleapis.com/v17/customers/${customerId}/googleAds:search`,
      { method: 'POST', headers: adsH, body: JSON.stringify({ query: `
        SELECT campaign.name, ad_group.id, ad_group.name, ad_group.status,
          ad_group.cpc_bid_micros, metrics.cost_micros, metrics.clicks,
          metrics.impressions, metrics.ctr, metrics.average_cpc,
          metrics.conversions, metrics.cost_per_conversion
        FROM ad_group
        WHERE segments.date BETWEEN '${fmt(start)}' AND '${fmt(end)}'
        ORDER BY metrics.cost_micros DESC
        LIMIT 30
      ` }), cache: 'no-store' }
    ) : Promise.resolve(null),

    // Ads: keywords with quality score
    customerId && developerToken ? fetch(
      `https://googleads.googleapis.com/v17/customers/${customerId}/googleAds:search`,
      { method: 'POST', headers: adsH, body: JSON.stringify({ query: `
        SELECT campaign.name, ad_group.name, ad_group_criterion.keyword.text,
          ad_group_criterion.keyword.match_type, ad_group_criterion.quality_info.quality_score,
          ad_group_criterion.quality_info.creative_quality_score,
          ad_group_criterion.quality_info.post_click_quality_score,
          ad_group_criterion.quality_info.search_predicted_ctr,
          metrics.cost_micros, metrics.clicks, metrics.impressions,
          metrics.ctr, metrics.average_cpc, metrics.conversions
        FROM keyword_view
        WHERE segments.date BETWEEN '${fmt(start)}' AND '${fmt(end)}'
          AND ad_group_criterion.status = 'ENABLED'
        ORDER BY metrics.cost_micros DESC
        LIMIT 50
      ` }), cache: 'no-store' }
    ) : Promise.resolve(null),

    // Search Console: 90 days of keyword data
    siteUrl ? fetch(
      `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
      { method: 'POST', headers: H, body: JSON.stringify({
        startDate: fmt(new Date(Date.now() - 90 * 864e5)),
        endDate:   fmt(end),
        dimensions: ['query'],
        rowLimit:  200,
        dataState: 'all',
      }), cache: 'no-store' }
    ) : Promise.resolve(null),

    // GA4: channel performance
    ga4PropertyId ? fetch(
      `https://analyticsdata.googleapis.com/v1beta/properties/${ga4PropertyId}:runReport`,
      { method: 'POST', headers: H, body: JSON.stringify({
        dateRanges: [{ startDate: fmt(new Date(Date.now() - 90 * 864e5)), endDate: fmt(end) }],
        metrics: [{ name: 'sessions' }, { name: 'totalUsers' }, { name: 'conversions' }, { name: 'bounceRate' }],
        dimensions: [{ name: 'sessionDefaultChannelGrouping' }],
        limit: 10,
      }), cache: 'no-store' }
    ) : Promise.resolve(null),

    // GA4: landing pages with conversion funnel
    ga4PropertyId ? fetch(
      `https://analyticsdata.googleapis.com/v1beta/properties/${ga4PropertyId}:runReport`,
      { method: 'POST', headers: H, body: JSON.stringify({
        dateRanges: [{ startDate: fmt(new Date(Date.now() - 90 * 864e5)), endDate: fmt(end) }],
        metrics: [{ name: 'sessions' }, { name: 'conversions' }, { name: 'bounceRate' }, { name: 'averageSessionDuration' }],
        dimensions: [{ name: 'landingPage' }],
        orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
        limit: 30,
      }), cache: 'no-store' }
    ) : Promise.resolve(null),
  ]);

  // ── Parse results ───────────────────────────────────────────────────────────
  type Row = { dimensionValues: { value: string }[]; metricValues: { value: string }[] };
  type AdsRow = Record<string, Record<string, unknown>>;

  let campaigns:  object[] = [];
  let adGroups:   object[] = [];
  let keywords:   object[] = [];
  let scKeywords: object[] = [];
  let ga4Channels: object[] = [];
  let ga4Pages:   object[] = [];
  const errors:   string[] = [];

  if (adsRes.status === 'fulfilled' && adsRes.value?.ok) {
    const d = await adsRes.value.json();
    campaigns = (d.results ?? []).map((r: AdsRow) => {
      const cost = (r.metrics?.costMicros as number ?? 0) / 1e6;
      const conv = r.metrics?.conversions as number ?? 0;
      const imp  = r.metrics?.impressions as number ?? 0;
      const clk  = r.metrics?.clicks as number ?? 0;
      const sis  = r.metrics?.searchImpressionShare as number ?? 0;
      const sbl  = r.metrics?.searchBudgetLostImpressionShare as number ?? 0;
      const srl  = r.metrics?.searchRankLostImpressionShare as number ?? 0;
      return {
        id:     r.campaign?.id,
        name:   r.campaign?.name,
        status: r.campaign?.status,
        tipo:   r.campaign?.advertisingChannelType,
        bid:    r.campaign?.biddingStrategyType,
        gasto:  parseFloat(cost.toFixed(2)),
        clics:  Math.round(clk),
        impresiones: Math.round(imp),
        ctr:    parseFloat(((r.metrics?.ctr as number ?? 0) * 100).toFixed(2)),
        cpc:    parseFloat(((r.metrics?.averageCpc as number ?? 0) / 1e6).toFixed(2)),
        conversiones: parseFloat((conv).toFixed(1)),
        cpl:    conv > 0 ? parseFloat((cost / conv).toFixed(2)) : null,
        roas:   cost > 0 ? parseFloat(((r.metrics?.allConversionsValue as number ?? 0) / cost).toFixed(2)) : null,
        search_impression_share: sis ? `${(sis * 100).toFixed(1)}%` : null,
        budget_lost_is: sbl ? `${(sbl * 100).toFixed(1)}%` : null,
        rank_lost_is:   srl ? `${(srl * 100).toFixed(1)}%` : null,
      };
    });
  } else if (adsRes.status === 'fulfilled' && adsRes.value) {
    const e = await adsRes.value.json().catch(() => ({}));
    errors.push(`Ads campaigns: ${e?.error?.message ?? 'error'}`);
  }

  if (adsAdgroupRes.status === 'fulfilled' && adsAdgroupRes.value?.ok) {
    const d = await adsAdgroupRes.value.json();
    adGroups = (d.results ?? []).map((r: AdsRow) => {
      const cost = (r.metrics?.costMicros as number ?? 0) / 1e6;
      const conv = r.metrics?.conversions as number ?? 0;
      return {
        campaign: r.campaign?.name,
        name:     r.adGroup?.name,
        status:   r.adGroup?.status,
        cpc_bid:  parseFloat(((r.adGroup?.cpcBidMicros as number ?? 0) / 1e6).toFixed(2)),
        gasto:    parseFloat(cost.toFixed(2)),
        clics:    Math.round(r.metrics?.clicks as number ?? 0),
        impresiones: Math.round(r.metrics?.impressions as number ?? 0),
        ctr:      parseFloat(((r.metrics?.ctr as number ?? 0) * 100).toFixed(2)),
        cpc:      parseFloat(((r.metrics?.averageCpc as number ?? 0) / 1e6).toFixed(2)),
        conversiones: parseFloat((conv).toFixed(1)),
        cpl:      conv > 0 ? parseFloat((cost / conv).toFixed(2)) : null,
      };
    });
  }

  if (adsCritRes.status === 'fulfilled' && adsCritRes.value?.ok) {
    const d = await adsCritRes.value.json();
    keywords = (d.results ?? []).map((r: AdsRow) => {
      const qi = r.adGroupCriterion?.qualityInfo as Record<string, unknown> ?? {};
      return {
        campaign:   r.campaign?.name,
        ad_group:   r.adGroup?.name,
        keyword:    (r.adGroupCriterion?.keyword as Record<string, unknown>)?.text,
        match:      (r.adGroupCriterion?.keyword as Record<string, unknown>)?.matchType,
        qs:         qi.qualityScore ?? null,
        creative_q: qi.creativeQualityScore,
        landingpage_q: qi.postClickQualityScore,
        predicted_ctr: qi.searchPredictedCtr,
        gasto:      parseFloat(((r.metrics?.costMicros as number ?? 0) / 1e6).toFixed(2)),
        clics:      Math.round(r.metrics?.clicks as number ?? 0),
        impressiones: Math.round(r.metrics?.impressions as number ?? 0),
        ctr:        parseFloat(((r.metrics?.ctr as number ?? 0) * 100).toFixed(2)),
        cpc:        parseFloat(((r.metrics?.averageCpc as number ?? 0) / 1e6).toFixed(2)),
        conversiones: r.metrics?.conversions as number ?? 0,
      };
    });
  }

  if (scRes.status === 'fulfilled' && scRes.value?.ok) {
    const d = await scRes.value.json();
    scKeywords = (d.rows ?? []).map((r: { keys: string[]; clicks: number; impressions: number; ctr: number; position: number }) => ({
      keyword:     r.keys[0],
      clics:       r.clicks,
      impresiones: r.impressions,
      ctr:         `${(r.ctr * 100).toFixed(1)}%`,
      posicion:    r.position.toFixed(1),
    }));
  }

  if (ga4ChanRes.status === 'fulfilled' && ga4ChanRes.value?.ok) {
    const d = await ga4ChanRes.value.json();
    ga4Channels = (d.rows ?? []).map((r: Row) => ({
      canal:       r.dimensionValues[0]?.value,
      sessions:    parseInt(r.metricValues[0]?.value ?? '0'),
      users:       parseInt(r.metricValues[1]?.value ?? '0'),
      conversiones: parseInt(r.metricValues[2]?.value ?? '0'),
      bounce:      `${(parseFloat(r.metricValues[3]?.value ?? '0') * 100).toFixed(0)}%`,
    }));
  }

  if (ga4PagesRes.status === 'fulfilled' && ga4PagesRes.value?.ok) {
    const d = await ga4PagesRes.value.json();
    ga4Pages = (d.rows ?? []).map((r: Row) => ({
      page:        r.dimensionValues[0]?.value,
      sessions:    parseInt(r.metricValues[0]?.value ?? '0'),
      conversiones: parseInt(r.metricValues[1]?.value ?? '0'),
      bounce:      `${(parseFloat(r.metricValues[2]?.value ?? '0') * 100).toFixed(0)}%`,
      duracion:    (() => { const s = parseFloat(r.metricValues[3]?.value ?? '0'); return `${Math.floor(s / 60)}m ${Math.round(s % 60)}s`; })(),
    }));
  }

  // ── Generate recommendations ────────────────────────────────────────────────
  const recs: { tipo: string; prioridad: 'alta' | 'media' | 'baja'; titulo: string; detalle: string }[] = [];

  type Campaign = {
    name: string; status: string; gasto: number; clics: number; ctr: number;
    conversiones: number; cpl: number | null; budget_lost_is: string | null; rank_lost_is: string | null;
    bid: string;
  };
  type Keyword = { keyword: string; qs: number | null; gasto: number; conversiones: number; ctr: number; clics: number; };
  type SC = { keyword: string; clics: number; posicion: string; ctr: string; impresiones: number; };

  // Ads recs
  (campaigns as Campaign[]).forEach(c => {
    if (c.status === 'ENABLED' && c.gasto > 0 && c.conversiones === 0)
      recs.push({ tipo: 'ads', prioridad: 'alta', titulo: `"${c.name}" — sin conversiones`, detalle: `Lleva ${c.gasto}€ invertidos sin ninguna conversión. Revisar landing page, extensiones, audiences y conversiones configuradas en GA4/GTM.` });

    if (c.ctr < 2 && c.clics > 50)
      recs.push({ tipo: 'ads', prioridad: 'alta', titulo: `"${c.name}" — CTR muy bajo (${c.ctr}%)`, detalle: 'CTR <2% indica que los anuncios no son relevantes para las búsquedas. Revisar títulos, descripciones y keywords negativas.' });

    if (c.budget_lost_is && parseFloat(c.budget_lost_is) > 20)
      recs.push({ tipo: 'ads', prioridad: 'alta', titulo: `"${c.name}" — perdiendo ${c.budget_lost_is} IS por presupuesto`, detalle: 'Estás perdiendo impresiones por límite de presupuesto. Aumentar presupuesto o restringir horario/zonas para optimizar la distribución.' });

    if (c.rank_lost_is && parseFloat(c.rank_lost_is) > 30)
      recs.push({ tipo: 'ads', prioridad: 'media', titulo: `"${c.name}" — perdiendo ${c.rank_lost_is} IS por ranking`, detalle: 'Calidad de anuncios baja. Mejorar QS de keywords, landing page relevance, y CTR esperado para subir Ad Rank sin aumentar CPC.' });

    if (c.bid === 'TARGET_CPA' && c.conversiones < 30)
      recs.push({ tipo: 'ads', prioridad: 'media', titulo: `"${c.name}" — Target CPA con <30 conversiones`, detalle: 'Smart Bidding necesita ≥30 conv/mes para aprender correctamente. Con menos datos, considera Manual CPC o Maximize Clicks hasta acumular historial.' });
  });

  // Keyword recs
  (keywords as Keyword[]).forEach(kw => {
    if (kw.qs !== null && kw.qs <= 4 && kw.gasto > 5)
      recs.push({ tipo: 'keywords', prioridad: 'alta', titulo: `KW "${kw.keyword}" — Quality Score ${kw.qs}/10`, detalle: `QS bajo encarece el CPC y reduce impresiones. Revisar relevancia anuncio→keyword→landing. Posiblemente mover a un ad group específico con anuncio personalizado.` });

    if (kw.gasto > 20 && kw.conversiones === 0)
      recs.push({ tipo: 'keywords', prioridad: 'alta', titulo: `KW "${kw.keyword}" — ${kw.gasto}€ sin conversión`, detalle: 'Keyword con gasto significativo pero sin convertir. Añadir como negativa o revisar la intención de búsqueda.' });

    if (kw.ctr < 1 && kw.clics > 30)
      recs.push({ tipo: 'keywords', prioridad: 'media', titulo: `KW "${kw.keyword}" — CTR ${kw.ctr}% muy bajo`, detalle: 'Considera añadir como negativa o crear un anuncio más específico para esta keyword.' });
  });

  // SC vs Ads overlap
  const scKwList = scKeywords as SC[];
  const activeAdsKw = (keywords as Keyword[]).filter(k => k.gasto > 0).map(k => k.keyword?.toLowerCase());
  scKwList
    .filter(sk => parseFloat(sk.posicion) <= 3 && sk.clics > 10)
    .forEach(sk => {
      const overlap = activeAdsKw.some(ak => ak && (sk.keyword.includes(ak) || ak.includes(sk.keyword)));
      if (overlap)
        recs.push({ tipo: 'seo_ads', prioridad: 'media', titulo: `Solapamiento — "${sk.keyword}" ya es top-3 orgánico`, detalle: `Posición orgánica ${sk.posicion} con ${sk.clics} clics. Considera pausar la keyword en Ads y ahorrar ese gasto.` });
    });

  // SC CTR opportunities
  scKwList
    .filter(sk => parseFloat(sk.posicion) <= 10 && parseFloat(sk.posicion) > 3 && parseInt(String(sk.impresiones)) > 200 && parseFloat(sk.ctr) < 3)
    .slice(0, 5)
    .forEach(sk => {
      recs.push({ tipo: 'seo', prioridad: 'media', titulo: `Oportunidad SEO — "${sk.keyword}" pos ${sk.posicion}`, detalle: `CTR ${sk.ctr} con ${sk.impresiones} impresiones. Optimizar título y meta description para mejorar CTR. Alta probabilidad de pasar al top-3 con ajuste de contenido.` });
    });

  // GA4 pages
  type GA4Page = { page: string; sessions: number; conversiones: number; bounce: string; };
  (ga4Pages as GA4Page[])
    .filter(p => p.sessions > 30 && p.conversiones === 0)
    .slice(0, 4)
    .forEach(p => {
      recs.push({ tipo: 'analytics', prioridad: 'media', titulo: `Landing "${p.page}" — ${p.sessions} sesiones, 0 conversiones`, detalle: `Página con tráfico relevante pero sin conversión. Revisar CTA, velocidad, formulario y relevancia del contenido. Bounce: ${p.bounce}.` });
    });

  // Sort by priority
  const ORDER = { alta: 0, media: 1, baja: 2 };
  recs.sort((a, b) => ORDER[a.prioridad] - ORDER[b.prioridad]);

  return NextResponse.json({
    periodo: `${fmt(start)} → ${fmt(end)}`,
    campaigns,
    adGroups,
    keywords,
    scKeywords: scKeywords.slice(0, 50),
    ga4Channels,
    ga4Pages: ga4Pages.slice(0, 20),
    recomendaciones: recs,
    errors,
  });
}
