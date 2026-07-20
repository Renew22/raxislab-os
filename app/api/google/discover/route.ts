import { NextResponse } from 'next/server';
import { getGoogleAccessToken, googleNotConfigured } from '@/app/lib/google-auth';

// Discover all GA4 properties + Search Console sites accessible to the service account
export async function GET() {
  if (googleNotConfigured()) return NextResponse.json({ error: 'Google no configurado' }, { status: 500 });

  try {
    const token = await getGoogleAccessToken();
    const H = { Authorization: `Bearer ${token}` };

    const [scRes, gtmRes] = await Promise.allSettled([
      // Search Console — list all verified sites
      fetch('https://www.googleapis.com/webmasters/v3/sites', {
        headers: H, cache: 'no-store',
      }),
      // GTM — list accounts
      fetch('https://www.googleapis.com/tagmanager/v2/accounts', {
        headers: H, cache: 'no-store',
      }),
    ]);

    // GA4 properties — must first list accounts, then properties per account
    type GA4Prop = { name: string; displayName: string; timeZone?: string; parent?: string };
    let ga4Properties: { id: string; displayName: string; timeZone: string }[] = [];
    try {
      const accsRes = await fetch('https://analyticsadmin.googleapis.com/v1beta/accounts?pageSize=50', {
        headers: H, cache: 'no-store',
      });
      if (accsRes.ok) {
        const accsData = await accsRes.json();
        const accounts: { name: string }[] = accsData.accounts ?? [];
        const propResults = await Promise.allSettled(
          accounts.map(acc =>
            fetch(`https://analyticsadmin.googleapis.com/v1beta/properties?pageSize=50&filter=parent:${acc.name}`, {
              headers: H, cache: 'no-store',
            }).then(r => r.json())
          )
        );
        for (const r of propResults) {
          if (r.status === 'fulfilled') {
            const props: GA4Prop[] = r.value.properties ?? [];
            ga4Properties.push(...props.map(p => ({
              id:          p.name?.replace('properties/', '') ?? '',
              displayName: p.displayName ?? '',
              timeZone:    p.timeZone ?? '',
            })));
          }
        }
      } else {
        const err = await accsRes.json().catch(() => ({}));
        ga4Properties = [{ id: 'error', displayName: err?.error?.message ?? 'GA4 Admin error', timeZone: '' }];
      }
    } catch (e) {
      ga4Properties = [{ id: 'error', displayName: String(e), timeZone: '' }];
    }

    // SC sites
    type SCSite = { siteUrl: string; permissionLevel: string };
    let scSites: { url: string; permission: string }[] = [];
    if (scRes.status === 'fulfilled' && scRes.value.ok) {
      const d = await scRes.value.json();
      scSites = (d.siteEntry ?? []).map((s: SCSite) => ({
        url:        s.siteUrl,
        permission: s.permissionLevel,
      }));
    }

    // GTM accounts
    type GTMAcc = { accountId: string; name: string };
    let gtmAccounts: { id: string; name: string }[] = [];
    if (gtmRes.status === 'fulfilled' && gtmRes.value.ok) {
      const d = await gtmRes.value.json();
      gtmAccounts = (d.account ?? []).map((a: GTMAcc) => ({ id: a.accountId, name: a.name }));
    }

    // Auto-map: try to match properties/sites by known domain keywords
    const CLIENTS = [
      { key: 'identity', keywords: ['identity', 'identitypeluqueros'] },
      { key: 'desancho', keywords: ['desancho', 'sancho'] },
      { key: 'lastmile', keywords: ['lastmile', 'last mile', 'lmd'] },
    ];

    const ga4Map: Record<string, { id: string; displayName: string }> = {};
    const scMap:  Record<string, string> = {};

    for (const client of CLIENTS) {
      const match = ga4Properties.find(p =>
        client.keywords.some(kw => p.displayName.toLowerCase().includes(kw))
      );
      if (match) ga4Map[client.key] = { id: match.id, displayName: match.displayName };

      const scMatch = scSites.find(s =>
        client.keywords.some(kw => s.url.toLowerCase().includes(kw))
      );
      if (scMatch) scMap[client.key] = scMatch.url;
    }

    return NextResponse.json({
      ga4Properties,
      scSites,
      gtmAccounts,
      autoMap: { ga4: ga4Map, sc: scMap },
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
