import { NextRequest, NextResponse } from 'next/server';
import { getGoogleAccessToken, googleNotConfigured } from '@/app/lib/google-auth';

const GTM_BASE = 'https://www.googleapis.com/tagmanager/v2';

async function gtmReq(token: string, path: string, method = 'GET', body?: object) {
  const res = await fetch(`${GTM_BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
    cache: 'no-store',
  });
  const text = await res.text();
  if (!res.ok) {
    let err: unknown;
    try { err = JSON.parse(text); } catch { err = text; }
    throw new Error(`GTM ${method} ${path} → HTTP ${res.status}: ${JSON.stringify(err).slice(0, 300)}`);
  }
  return text ? JSON.parse(text) : {};
}

// POST /api/google/gtm-edit
// { action: 'delete_tag_by_name'|'list_triggers'|'pause_tag'|'inspect_tags', accountId, containerId, tagName? }
export async function POST(req: NextRequest) {
  if (googleNotConfigured()) return NextResponse.json({ error: 'Google no configurado' }, { status: 500 });

  const { action, accountId, containerId, tagName, tagId } = await req.json();

  try {
    const token = await getGoogleAccessToken();

    if (action === 'list_triggers') {
      const wsData = await gtmReq(token, `/accounts/${accountId}/containers/${containerId}/workspaces`);
      const wsId = (wsData.workspace ?? [])[0]?.workspaceId;
      if (!wsId) throw new Error('No workspace');
      const [tagsData, triggersData] = await Promise.all([
        gtmReq(token, `/accounts/${accountId}/containers/${containerId}/workspaces/${wsId}/tags`),
        gtmReq(token, `/accounts/${accountId}/containers/${containerId}/workspaces/${wsId}/triggers`),
      ]);
      const triggers: Array<{ triggerId: string; name: string; type: string; filter?: unknown[] }> = triggersData.trigger ?? [];
      const tags: Array<{ tagId: string; name: string; type: string; firingTriggerId?: string[]; blockingTriggerId?: string[]; paused?: boolean }> = tagsData.tag ?? [];
      const triggerMap: Record<string, string> = {};
      for (const t of triggers) triggerMap[t.triggerId] = `${t.name} [${t.type}]`;
      const tagsWithTriggers = tags.map(t => ({
        tagId: t.tagId,
        name: t.name,
        type: t.type,
        paused: t.paused ?? false,
        fires_on: (t.firingTriggerId ?? []).map(id => triggerMap[id] ?? id),
        blocked_by: (t.blockingTriggerId ?? []).map(id => triggerMap[id] ?? id),
      }));
      return NextResponse.json({ triggers, tags: tagsWithTriggers });
    }

    if (action === 'pause_tag') {
      if (!tagId) throw new Error('tagId requerido');
      const wsData = await gtmReq(token, `/accounts/${accountId}/containers/${containerId}/workspaces`);
      const wsId = (wsData.workspace ?? [])[0]?.workspaceId;
      if (!wsId) throw new Error('No workspace');
      const tagData = await gtmReq(token, `/accounts/${accountId}/containers/${containerId}/workspaces/${wsId}/tags/${tagId}`);
      const updated = await gtmReq(
        token,
        `/accounts/${accountId}/containers/${containerId}/workspaces/${wsId}/tags/${tagId}`,
        'PUT',
        { ...tagData, paused: true }
      );
      const version = await gtmReq(
        token,
        `/accounts/${accountId}/containers/${containerId}/workspaces/${wsId}:create_version`,
        'POST',
        { name: `Pausado tag ${tagData.name} — raxislab ${new Date().toISOString().slice(0, 10)}` }
      );
      const versionId = version.containerVersion?.containerVersionId;
      await gtmReq(token, `/accounts/${accountId}/containers/${containerId}/versions/${versionId}:publish`, 'POST');
      return NextResponse.json({ ok: true, paused_tag: updated.name, tagId, version_published: versionId });
    }

    if (action === 'delete_tag_by_name') {
      // 1. Get default workspace
      const wsData = await gtmReq(token, `/accounts/${accountId}/containers/${containerId}/workspaces`);
      const workspace = (wsData.workspace ?? [])[0];
      if (!workspace) throw new Error('No workspace found');
      const wsId = workspace.workspaceId;

      // 2. List tags in workspace to find the one by name
      const tagsData = await gtmReq(token, `/accounts/${accountId}/containers/${containerId}/workspaces/${wsId}/tags`);
      const tags: { tagId: string; name: string }[] = tagsData.tag ?? [];
      // Use normalized comparison to handle encoding differences (accented chars)
      const normalize = (s: string) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
      const target = tags.find(t => t.name === tagName || normalize(t.name) === normalize(tagName));
      if (!target) throw new Error(`Tag "${tagName}" not found. Available: ${tags.map(t => t.name).join(', ')}`);

      // 3. Delete the tag
      await gtmReq(token, `/accounts/${accountId}/containers/${containerId}/workspaces/${wsId}/tags/${target.tagId}`, 'DELETE');

      // 4. Create a new version
      const version = await gtmReq(
        token,
        `/accounts/${accountId}/containers/${containerId}/workspaces/${wsId}:create_version`,
        'POST',
        { name: `Eliminado pixel duplicado FB (${tagName}) — raxislab ${new Date().toISOString().slice(0, 10)}` }
      );
      const versionId = version.containerVersion?.containerVersionId;

      // 5. Publish the version
      await gtmReq(
        token,
        `/accounts/${accountId}/containers/${containerId}/versions/${versionId}:publish`,
        'POST'
      );

      return NextResponse.json({
        ok: true,
        deleted_tag: tagName,
        tagId: target.tagId,
        version_published: versionId,
      });
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
