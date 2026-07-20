import { NextRequest, NextResponse } from 'next/server';
import { getGoogleAccessToken, googleNotConfigured } from '@/app/lib/google-auth';

const ADS_BASE = 'https://googleads.googleapis.com/v21';
const MCC_ID   = '7179865639';

async function adsMutate(token: string, devToken: string, customerId: string, resource: string, operations: object[]) {
  const res = await fetch(`${ADS_BASE}/customers/${customerId}/${resource}:mutate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'developer-token': devToken,
      'login-customer-id': MCC_ID,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ operations }),
    cache: 'no-store',
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`${resource}: ${JSON.stringify(data?.error ?? data).slice(0, 2000)}`);
  return data;
}

// POST /api/google/ads-create
// Creates a full Search campaign: budget → campaign → ad groups → keywords → RSA ads
// All campaigns created PAUSED — René must manually enable when ready
export async function POST(req: NextRequest) {
  if (googleNotConfigured()) return NextResponse.json({ error: 'Google no configurado' });
  const devToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN ?? '';

  try {
    const token = await getGoogleAccessToken();
    const { customerId, name, dailyBudgetEuros, adGroups, finalUrlSuffix } = await req.json();

    if (!customerId || !name || !dailyBudgetEuros || !adGroups?.length) {
      return NextResponse.json({ error: 'Faltan campos: customerId, name, dailyBudgetEuros, adGroups' }, { status: 400 });
    }

    const log: string[] = [];

    // 1. Create campaign budget
    const budgetRes = await adsMutate(token, devToken, customerId, 'campaignBudgets', [{
      create: {
        name: `Presupuesto ${name} ${Date.now()}`,
        amountMicros: Math.round(dailyBudgetEuros * 1_000_000),
        deliveryMethod: 'STANDARD',
      },
    }]);
    const budgetRN = budgetRes.results[0].resourceName;
    log.push(`✅ Budget creado: ${budgetRN} (${dailyBudgetEuros}€/día)`);

    // 2. Create campaign (PAUSED — René enables manually)
    const campRes = await adsMutate(token, devToken, customerId, 'campaigns', [{
      create: {
        name,
        status: 'PAUSED',
        advertisingChannelType: 'SEARCH',
        campaignBudget: budgetRN,
        biddingStrategyType: 'MANUAL_CPC',
        manualCpc: { enhancedCpcEnabled: false },
        networkSettings: {
          targetGoogleSearch: true,
          targetSearchNetwork: true,
          targetContentNetwork: false,
          targetPartnerSearchNetwork: false,
        },
        geoTargetTypeSetting: {
          positiveGeoTargetType: 'PRESENCE_OR_INTEREST',
        },
        containsEuPoliticalAdvertising: 'DOES_NOT_CONTAIN_EU_POLITICAL_ADVERTISING',
        startDate: new Date().toISOString().split('T')[0].replace(/-/g, ''),
        ...(finalUrlSuffix ? { trackingUrlTemplate: finalUrlSuffix } : {}),
      },
    }]);
    const campaignRN = campRes.results[0].resourceName;
    const campaignId = campaignRN.split('/').pop();
    log.push(`✅ Campaña creada PAUSED: ${campaignRN}`);

    // 2b. Add geo target: Valencia Spain (1005423)
    try {
      await adsMutate(token, devToken, customerId, 'campaignCriteria', [{
        create: {
          campaign: campaignRN,
          location: { geoTargetConstant: 'geoTargetConstants/1005423' },
        },
      }]);
      log.push('✅ Geo target: Valencia Spain añadido');
    } catch (e) {
      log.push(`⚠️ Geo target fallback: ${String(e).slice(0,100)}`);
    }

    // 3. Create ad groups + keywords + ads
    const createdGroups: object[] = [];

    for (const ag of adGroups) {
      // Ad group
      const agRes = await adsMutate(token, devToken, customerId, 'adGroups', [{
        create: {
          name: ag.name,
          campaign: campaignRN,
          status: 'ENABLED',
          type: 'SEARCH_STANDARD',
          cpcBidMicros: Math.round((ag.maxCpc ?? 0.80) * 1_000_000),
        },
      }]);
      const agRN = agRes.results[0].resourceName;
      log.push(`  ✅ Ad Group: ${ag.name}`);

      // Keywords
      const kwOps = ag.keywords.map((kw: { text: string; matchType: string }) => ({
        create: {
          adGroup: agRN,
          status: 'ENABLED',
          keyword: {
            text: kw.text,
            matchType: kw.matchType ?? 'PHRASE',
          },
        },
      }));
      await adsMutate(token, devToken, customerId, 'adGroupCriteria', kwOps);
      log.push(`    ✅ ${kwOps.length} keywords añadidas`);

      // Responsive Search Ad
      const adOps = [{
        create: {
          adGroup: agRN,
          status: 'ENABLED',
          ad: {
            responsiveSearchAd: {
              headlines: ag.headlines.slice(0, 15).map((h: string, i: number) => ({
                text: h.slice(0, 30),
                ...(i < 3 ? { pinnedField: i === 0 ? 'HEADLINE_1' : i === 1 ? 'HEADLINE_2' : undefined } : {}),
              })),
              descriptions: ag.descriptions.slice(0, 4).map((d: string) => ({
                text: d.slice(0, 90),
              })),
            },
            finalUrls: [ag.finalUrl],
          },
        },
      }];
      await adsMutate(token, devToken, customerId, 'adGroupAds', adOps);
      log.push(`    ✅ RSA creado → ${ag.finalUrl}`);

      createdGroups.push({ name: ag.name, resourceName: agRN, keywords: ag.keywords.length });
    }

    return NextResponse.json({
      ok: true,
      campaign: { name, resourceName: campaignRN, campaignId, status: 'PAUSED', dailyBudget: `${dailyBudgetEuros}€` },
      adGroups: createdGroups,
      log,
      next_step: `Campaña creada en PAUSED. Actívala en Google Ads cuando confirmes que el tracking está bien: https://ads.google.com/aw/campaigns?campaignId=${campaignId}`,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
