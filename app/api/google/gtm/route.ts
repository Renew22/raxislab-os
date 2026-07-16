import { NextResponse } from 'next/server';
import { getGoogleAccessToken, googleNotConfigured } from '@/app/lib/google-auth';

const GTM_BASE = 'https://www.googleapis.com/tagmanager/v2';

// Known GTM container public IDs (GTM-XXXXX format)
const KNOWN_CONTAINERS: Record<string, string> = {
  desancho:         'GTM-W3VKZM6',
  identity_web:     'GTM-T2J7JGD',
  identity_server:  'GTM-THW23VLK',
  lastmile:         'GTM-TWJL8NHF',
};

async function gtmGet(token: string, path: string) {
  const res = await fetch(`${GTM_BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message ?? `GTM HTTP ${res.status}`);
  }
  return res.json();
}

export async function GET() {
  if (googleNotConfigured()) return NextResponse.json({ error: 'Google no configurado' }, { status: 500 });

  try {
    const token = await getGoogleAccessToken();

    // List all GTM accounts accessible to the service account
    const accountsData = await gtmGet(token, '/accounts');
    const accounts: { accountId: string; name: string; path: string }[] = accountsData.account ?? [];

    const results: object[] = [];

    for (const account of accounts) {
      const containersData = await gtmGet(token, `/accounts/${account.accountId}/containers`);
      const containers: { containerId: string; publicId: string; name: string; path: string }[] =
        containersData.container ?? [];

      for (const container of containers) {
        try {
          const [liveData, workspacesData] = await Promise.all([
            gtmGet(token, `/accounts/${account.accountId}/containers/${container.containerId}/versions:live`),
            gtmGet(token, `/accounts/${account.accountId}/containers/${container.containerId}/workspaces`),
          ]);

          const tags: { name: string; type: string; paused: boolean; firingRuleId?: string[] }[] =
            liveData.tag ?? [];
          const triggers: { name: string; type: string }[] = liveData.trigger ?? [];

          const conversionTags = tags.filter(t =>
            t.type === 'awct' || // Google Ads Conversion Tracking
            t.name.toLowerCase().includes('conver') ||
            t.name.toLowerCase().includes('descarga') ||
            t.name.toLowerCase().includes('lead') ||
            t.name.toLowerCase().includes('reserva') ||
            t.name.toLowerCase().includes('contacto')
          );

          const workspaces: { name: string; workspaceId: string }[] =
            workspacesData.workspace ?? [];

          // Map known container IDs
          const clientKey = Object.entries(KNOWN_CONTAINERS).find(
            ([, pubId]) => pubId === container.publicId
          )?.[0] ?? null;

          results.push({
            account:         account.name,
            accountId:       account.accountId,
            container:       container.name,
            containerId:     container.containerId,
            publicId:        container.publicId,
            clientKey,
            live_version:    liveData.containerVersionId ?? '—',
            live_updated:    liveData.fingerprint ?? '—',
            total_tags:      tags.length,
            total_triggers:  triggers.length,
            workspaces:      workspaces.map(w => w.name),
            conversion_tags: conversionTags.map(t => ({
              name:   t.name,
              type:   t.type,
              paused: !!t.paused,
            })),
            all_tags: tags.map(t => ({ name: t.name, type: t.type, paused: !!t.paused })),
          });
        } catch (e) {
          results.push({
            account:     account.name,
            container:   container.name,
            publicId:    container.publicId,
            error:       String(e),
          });
        }
      }
    }

    return NextResponse.json({ containers: results, known: KNOWN_CONTAINERS });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
