"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { RefreshCw, ExternalLink, Play, Pause, TrendingUp, MousePointerClick, Eye, DollarSign, Users, PlusCircle, AlertCircle } from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────────

interface Campaign {
  id: string;
  name: string;
  status: 'ACTIVE' | 'PAUSED' | 'DELETED' | string;
  objective: string;
  daily_budget: string | null;
  spend: string | null;
  impressions: string | null;
  clicks: string | null;
  ctr: string | null;
  cpc: string | null;
  leads: string | null;
  cpl: string | null;
}

interface ClientGroup {
  clientId: string;
  clientName: string;
  accountId?: string;
  campaigns: Campaign[];
  error: string | null;
}

type DatePreset = 'today' | 'last_7d' | 'last_14d' | 'last_30d' | 'this_month';
type StatusFilter = 'all' | 'ACTIVE' | 'PAUSED';

interface TokenStatus {
  valid: boolean;
  expired?: boolean;
  userName?: string;
  daysLeft?: number | null;
  error?: string;
  hasDebugAccess?: boolean;
}

const DATE_OPTIONS: { value: DatePreset; label: string }[] = [
  { value: 'today',      label: 'Hoy'      },
  { value: 'last_7d',    label: '7d'       },
  { value: 'last_14d',   label: '14d'      },
  { value: 'last_30d',   label: '30d'      },
  { value: 'this_month', label: 'Mes'      },
];

function fmt(v: string | null, prefix = '', suffix = '') {
  if (v === null || v === undefined) return '—';
  return `${prefix}${v}${suffix}`;
}

function statusBadge(status: string) {
  if (status === 'ACTIVE') return { color: "var(--green)", bg: "rgba(0,230,118,0.10)", label: "ACTIVA"  };
  if (status === 'PAUSED') return { color: "var(--amber)", bg: "rgba(255,184,0,0.10)",  label: "PAUSADA" };
  return { color: "var(--text-muted)", bg: "var(--card)", label: status };
}

// ── KPI Bar ────────────────────────────────────────────────────────────────────

function KpiBar({ campaigns }: { campaigns: Campaign[] }) {
  const active      = campaigns.filter(c => c.status === 'ACTIVE').length;
  const totalSpend  = campaigns.reduce((s, c) => s + (c.spend ? parseFloat(c.spend) : 0), 0);
  const totalImpr   = campaigns.reduce((s, c) => s + (c.impressions ? parseInt(c.impressions) : 0), 0);
  const totalClicks = campaigns.reduce((s, c) => s + (c.clicks ? parseInt(c.clicks) : 0), 0);
  const totalLeads  = campaigns.reduce((s, c) => s + (c.leads ? parseInt(c.leads) : 0), 0);
  const avgCpl      = totalLeads > 0 ? (totalSpend / totalLeads).toFixed(2) : null;

  const kpis = [
    { icon: <TrendingUp size={14}/>,      label: "Activas",      value: String(active),                        accent: active > 0 },
    { icon: <DollarSign size={14}/>,      label: "Gasto total",  value: `${totalSpend.toFixed(2)}€`,           accent: false },
    { icon: <Eye size={14}/>,             label: "Impresiones",  value: totalImpr > 0 ? totalImpr.toLocaleString() : '—', accent: false },
    { icon: <MousePointerClick size={14}/>,label: "Clics",       value: totalClicks > 0 ? totalClicks.toLocaleString() : '—', accent: false },
    { icon: <Users size={14}/>,           label: "Leads",        value: totalLeads > 0 ? String(totalLeads) : '—', accent: totalLeads > 0 },
    { icon: <DollarSign size={14}/>,      label: "CPL",          value: avgCpl ? `${avgCpl}€` : '—',          accent: false },
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px", marginBottom: "20px" }} className="kpi-grid">
      {kpis.map(k => (
        <div key={k.label} style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "8px", padding: "12px 14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--text-muted)", marginBottom: "6px" }}>
            {k.icon}
            <span style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>{k.label}</span>
          </div>
          <p style={{ fontSize: "18px", fontWeight: 700, color: k.accent ? "var(--green)" : "var(--text)", fontFamily: "'Space Mono', monospace", margin: 0 }}>
            {k.value}
          </p>
        </div>
      ))}
    </div>
  );
}

// ── Campaign Card (mobile) ────────────────────────────────────────────────────

function CampaignCard({ campaign, onToggle, toggling }: {
  campaign: Campaign;
  onToggle: (id: string, action: 'ACTIVE' | 'PAUSED') => void;
  toggling: boolean;
}) {
  const badge = statusBadge(campaign.status);
  return (
    <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border)" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px", marginBottom: "10px" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)", margin: "0 0 4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {campaign.name}
          </p>
          <span style={{ fontSize: "10px", fontWeight: 700, padding: "2px 7px", borderRadius: "3px", background: badge.bg, color: badge.color, letterSpacing: "0.06em" }}>
            {badge.label}
          </span>
        </div>
        <button
          onClick={() => onToggle(campaign.id, campaign.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE')}
          disabled={toggling}
          style={{ padding: "7px 12px", borderRadius: "6px", border: `1px solid ${campaign.status === 'ACTIVE' ? "rgba(255,184,0,0.3)" : "rgba(0,230,118,0.3)"}`, background: campaign.status === 'ACTIVE' ? "rgba(255,184,0,0.06)" : "rgba(0,230,118,0.06)", color: campaign.status === 'ACTIVE' ? "var(--amber)" : "var(--green)", cursor: toggling ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: "5px", fontSize: "12px", flexShrink: 0 }}
        >
          {toggling ? <RefreshCw size={12} style={{ animation: "spin 1s linear infinite" }}/> : campaign.status === 'ACTIVE' ? <Pause size={12}/> : <Play size={12}/>}
          {campaign.status === 'ACTIVE' ? 'Pausar' : 'Activar'}
        </button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px" }}>
        {[
          { l: "Gasto",  v: fmt(campaign.spend, "", "€") },
          { l: "Leads",  v: fmt(campaign.leads)           },
          { l: "CPL",    v: fmt(campaign.cpl, "", "€")    },
          { l: "Impr.",  v: campaign.impressions ? parseInt(campaign.impressions).toLocaleString() : "—" },
          { l: "Clics",  v: fmt(campaign.clicks)           },
          { l: "CTR",    v: fmt(campaign.ctr, "", "%")     },
        ].map(m => (
          <div key={m.l}>
            <p style={{ fontSize: "10px", color: "var(--text-muted)", marginBottom: "2px", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" }}>{m.l}</p>
            <p style={{ fontSize: "13px", color: "var(--text)", fontFamily: "'Space Mono', monospace", margin: 0 }}>{m.v}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Campaign Row (desktop) ────────────────────────────────────────────────────

function CampaignRow({ campaign, accountId, onToggle, toggling }: {
  campaign: Campaign;
  accountId?: string;
  onToggle: (id: string, action: 'ACTIVE' | 'PAUSED') => void;
  toggling: boolean;
}) {
  const badge = statusBadge(campaign.status);
  return (
    <tr style={{ borderBottom: "1px solid var(--border)" }}>
      <td style={{ padding: "12px 16px", fontSize: "13px", color: "var(--text)", maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{campaign.name}</td>
      <td style={{ padding: "12px 16px" }}>
        <span style={{ fontSize: "10px", fontWeight: 700, padding: "2px 7px", borderRadius: "3px", background: badge.bg, color: badge.color, letterSpacing: "0.06em" }}>{badge.label}</span>
      </td>
      <td style={{ padding: "12px 16px", fontSize: "12px", color: "var(--text-muted)", fontFamily: "'Space Mono', monospace" }}>{campaign.daily_budget ? `${campaign.daily_budget}€/d` : '—'}</td>
      <td style={{ padding: "12px 16px", fontSize: "12px", fontFamily: "'Space Mono', monospace", color: "var(--text)" }}>{fmt(campaign.spend, "", "€")}</td>
      <td style={{ padding: "12px 16px", fontSize: "12px", color: "var(--text-muted)", fontFamily: "'Space Mono', monospace" }}>{campaign.impressions ? parseInt(campaign.impressions).toLocaleString() : "—"}</td>
      <td style={{ padding: "12px 16px", fontSize: "12px", color: "var(--text-muted)", fontFamily: "'Space Mono', monospace" }}>{fmt(campaign.clicks)}</td>
      <td style={{ padding: "12px 16px", fontSize: "12px", color: "var(--text-muted)", fontFamily: "'Space Mono', monospace" }}>{fmt(campaign.ctr, "", "%")}</td>
      <td style={{ padding: "12px 16px", fontSize: "13px", fontWeight: 600, color: campaign.leads ? "var(--green)" : "var(--text-muted)", fontFamily: "'Space Mono', monospace" }}>{fmt(campaign.leads)}</td>
      <td style={{ padding: "12px 16px", fontSize: "12px", color: "var(--text-muted)", fontFamily: "'Space Mono', monospace" }}>{fmt(campaign.cpl, "", "€")}</td>
      <td style={{ padding: "12px 16px" }}>
        <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
          <button
            onClick={() => onToggle(campaign.id, campaign.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE')}
            disabled={toggling}
            style={{ padding: "5px 10px", borderRadius: "4px", border: `1px solid ${campaign.status === 'ACTIVE' ? "rgba(255,184,0,0.3)" : "rgba(0,230,118,0.3)"}`, background: campaign.status === 'ACTIVE' ? "rgba(255,184,0,0.06)" : "rgba(0,230,118,0.06)", color: campaign.status === 'ACTIVE' ? "var(--amber)" : "var(--green)", cursor: toggling ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: "4px", fontSize: "11px" }}
          >
            {toggling ? <RefreshCw size={10} style={{ animation: "spin 1s linear infinite" }}/> : campaign.status === 'ACTIVE' ? <Pause size={10}/> : <Play size={10}/>}
            {campaign.status === 'ACTIVE' ? 'Pausar' : 'Activar'}
          </button>
          {accountId && (
            <a href={`https://business.facebook.com/adsmanager/manage/campaigns?act=${accountId.replace('act_', '')}&selected_campaign_ids=${campaign.id}`} target="_blank" rel="noopener noreferrer" style={{ color: "var(--text-muted)", display: "flex" }}>
              <ExternalLink size={12}/>
            </a>
          )}
        </div>
      </td>
    </tr>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function CampanasPage() {
  const [groups, setGroups]             = useState<ClientGroup[]>([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState<string | null>(null);
  const [datePreset, setDatePreset]     = useState<DatePreset>('last_7d');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [clientFilter, setClientFilter] = useState<string>('all');
  const [toggling, setToggling]         = useState<string | null>(null);
  const [lastUpdated, setLastUpdated]   = useState<Date | null>(null);
  const [tokenStatus, setTokenStatus]   = useState<TokenStatus | null>(null);
  const [refreshing, setRefreshing]     = useState(false);
  const [newToken, setNewToken]         = useState<string | null>(null);

  const load = useCallback(async (preset: DatePreset) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/meta/all-campaigns?datePreset=${preset}`);
      const json = await res.json();
      if (!res.ok) { setError(json.error ?? 'Error al cargar'); return; }
      setGroups(json.data ?? []);
      setLastUpdated(new Date());
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(datePreset); }, [load, datePreset]);
  useEffect(() => {
    fetch('/api/meta/token-status')
      .then(r => r.json()).then(setTokenStatus).catch(() => null);
  }, []);

  async function refreshToken() {
    setRefreshing(true);
    setNewToken(null);
    try {
      const res = await fetch('/api/meta/refresh-token', { method: 'POST' });
      const json = await res.json();
      if (json.newToken) setNewToken(json.newToken);
      else setError(json.error ?? 'Error al renovar token');
    } finally { setRefreshing(false); }
  }

  async function toggleCampaign(campaignId: string, action: 'ACTIVE' | 'PAUSED') {
    setToggling(campaignId);
    try {
      const res = await fetch('/api/meta/toggle-campaign', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignId, action }),
      });
      if (res.ok) {
        setGroups(prev => prev.map(g => ({
          ...g,
          campaigns: g.campaigns.map(c => c.id === campaignId ? { ...c, status: action } : c),
        })));
      }
    } finally { setToggling(null); }
  }

  const filteredGroups = groups
    .filter(g => clientFilter === 'all' || g.clientId === clientFilter)
    .map(g => ({ ...g, campaigns: g.campaigns.filter(c => statusFilter === 'all' || c.status === statusFilter) }));

  const allCampaigns      = filteredGroups.flatMap(g => g.campaigns);
  const visibleGroups     = filteredGroups.filter(g => g.campaigns.length > 0 || g.error);
  const groupsNoCampaigns = filteredGroups.filter(g => !g.error && g.campaigns.length === 0 && g.accountId);
  const groupsNoAccount   = filteredGroups.filter(g => !g.error && !g.accountId);

  return (
    <div className="page-container">

      {/* ── Header ── */}
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: "20px", fontWeight: 700, color: "var(--text)", margin: 0 }}>Campañas</h1>
          <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: "3px 0 0" }}>
            Meta Ads · todas las cuentas
            {lastUpdated && <span> · {lastUpdated.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}</span>}
          </p>
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <Link href="/clientes"
            style={{ padding: "7px 12px", borderRadius: "6px", border: "1px solid var(--border)", background: "var(--card)", color: "var(--accent)", fontSize: "12px", textDecoration: "none", display: "flex", alignItems: "center", gap: "5px", fontWeight: 600 }}>
            <PlusCircle size={13}/> <span className="hide-mobile">Nueva</span>
          </Link>
          <button onClick={() => load(datePreset)} disabled={loading}
            style={{ padding: "7px 12px", borderRadius: "6px", border: "1px solid var(--border)", background: "var(--card)", color: "var(--text-muted)", cursor: "pointer", display: "flex", alignItems: "center", gap: "5px", fontSize: "12px" }}>
            <RefreshCw size={12} style={{ animation: loading ? "spin 1s linear infinite" : "none" }}/>
            <span className="hide-mobile">Actualizar</span>
          </button>
        </div>
      </div>

      {/* ── Token banner ── */}
      {tokenStatus && !tokenStatus.valid && (
        <div style={{ marginBottom: "16px", padding: "12px 14px", borderRadius: "8px", background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.3)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", marginBottom: "6px" }}>
            <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--red)", margin: 0 }}>
              🔴 Token Meta {tokenStatus.expired ? 'expirado' : 'inválido'}
            </p>
            {!newToken && (
              <button onClick={refreshToken} disabled={refreshing}
                style={{ padding: "5px 12px", borderRadius: "4px", border: "1px solid rgba(239,68,68,0.4)", background: "rgba(239,68,68,0.08)", color: "var(--red)", fontSize: "12px", fontWeight: 600, cursor: "pointer", flexShrink: 0 }}>
                {refreshing ? '...' : 'Renovar'}
              </button>
            )}
          </div>
          <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: 0 }}>
            {tokenStatus.error ?? 'Actualiza META_ACCESS_TOKEN en Vercel con un token nuevo.'}
          </p>
          {newToken && (
            <div style={{ marginTop: "10px", padding: "10px", borderRadius: "6px", background: "var(--card)", border: "1px solid var(--border)" }}>
              <p style={{ fontSize: "11px", color: "var(--green)", marginBottom: "6px", fontWeight: 600 }}>Token renovado — cópialo en Vercel como META_ACCESS_TOKEN:</p>
              <code style={{ fontSize: "10px", color: "var(--text-mid)", wordBreak: "break-all", display: "block", marginBottom: "8px" }}>{newToken}</code>
              <button onClick={() => navigator.clipboard.writeText(newToken)}
                style={{ padding: "4px 10px", borderRadius: "3px", background: "rgba(0,200,255,0.1)", color: "var(--accent)", border: "1px solid rgba(0,200,255,0.2)", fontSize: "11px", cursor: "pointer" }}>
                Copiar
              </button>
            </div>
          )}
        </div>
      )}
      {tokenStatus?.valid && tokenStatus.daysLeft !== null && tokenStatus.daysLeft !== undefined && tokenStatus.daysLeft < 10 && (
        <div style={{ marginBottom: "16px", padding: "10px 14px", borderRadius: "8px", background: "rgba(255,184,0,0.06)", border: "1px solid rgba(255,184,0,0.3)", display: "flex", alignItems: "center", gap: "10px" }}>
          <span>⚠️</span>
          <p style={{ fontSize: "12px", color: "var(--amber)", margin: 0, flex: 1 }}>Token expira en {tokenStatus.daysLeft} días</p>
          <button onClick={refreshToken} disabled={refreshing}
            style={{ padding: "4px 10px", borderRadius: "4px", border: "1px solid rgba(255,184,0,0.3)", background: "rgba(255,184,0,0.08)", color: "var(--amber)", fontSize: "11px", cursor: "pointer", flexShrink: 0 }}>
            {refreshing ? '...' : 'Renovar'}
          </button>
        </div>
      )}

      {/* ── Filtros ── */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "20px", flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: "2px", background: "var(--card)", border: "1px solid var(--border)", borderRadius: "6px", padding: "3px" }}>
          {DATE_OPTIONS.map(({ value, label }) => (
            <button key={value} onClick={() => setDatePreset(value)}
              style={{ padding: "5px 10px", borderRadius: "4px", border: "none", cursor: "pointer", fontSize: "12px", fontWeight: datePreset === value ? 600 : 400, background: datePreset === value ? "var(--accent-dim)" : "transparent", color: datePreset === value ? "var(--accent)" : "var(--text-muted)" }}>
              {label}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: "2px", background: "var(--card)", border: "1px solid var(--border)", borderRadius: "6px", padding: "3px" }}>
          {([['all', 'Todas'], ['ACTIVE', 'Activas'], ['PAUSED', 'Pausadas']] as [StatusFilter, string][]).map(([v, l]) => (
            <button key={v} onClick={() => setStatusFilter(v)}
              style={{ padding: "5px 10px", borderRadius: "4px", border: "none", cursor: "pointer", fontSize: "12px", fontWeight: statusFilter === v ? 600 : 400, background: statusFilter === v ? "var(--accent-dim)" : "transparent", color: statusFilter === v ? "var(--accent)" : "var(--text-muted)" }}>
              {l}
            </button>
          ))}
        </div>
        {groups.length > 1 && (
          <select value={clientFilter} onChange={e => setClientFilter(e.target.value)}
            style={{ padding: "6px 10px", borderRadius: "6px", border: "1px solid var(--border)", background: "var(--card)", color: "var(--text)", fontSize: "12px", cursor: "pointer", outline: "none" }}>
            <option value="all">Todos los clientes</option>
            {groups.map(g => <option key={g.clientId} value={g.clientId}>{g.clientName}</option>)}
          </select>
        )}
      </div>

      {/* ── KPIs ── */}
      {!loading && allCampaigns.length > 0 && <KpiBar campaigns={allCampaigns}/>}

      {/* ── Error global ── */}
      {error && (
        <div style={{ padding: "14px 16px", borderRadius: "8px", background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)", marginBottom: "16px", display: "flex", gap: "10px", alignItems: "flex-start" }}>
          <AlertCircle size={16} style={{ color: "var(--red)", flexShrink: 0, marginTop: "1px" }}/>
          <div>
            <p style={{ fontSize: "13px", color: "var(--red)", margin: "0 0 4px", fontWeight: 600 }}>Error al cargar campañas</p>
            <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: 0 }}>{error}</p>
          </div>
        </div>
      )}

      {/* ── Loading ── */}
      {loading && (
        <div style={{ padding: "48px 0", textAlign: "center", color: "var(--text-muted)", display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
          <RefreshCw size={20} style={{ animation: "spin 1s linear infinite" }}/>
          <p style={{ fontSize: "13px", margin: 0 }}>Cargando campañas de Meta Ads...</p>
        </div>
      )}

      {/* ── Clientes sin cuenta configurada ── */}
      {!loading && groupsNoAccount.length > 0 && (
        <div style={{ marginBottom: "16px", padding: "12px 14px", borderRadius: "8px", background: "rgba(255,184,0,0.05)", border: "1px solid rgba(255,184,0,0.2)" }}>
          <p style={{ fontSize: "12px", color: "var(--amber)", margin: "0 0 4px", fontWeight: 600 }}>Sin cuenta configurada</p>
          <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: 0 }}>
            {groupsNoAccount.map(g => g.clientName).join(', ')} — Añade el env var en Vercel (ej: META_ACCOUNT_IDENTITY_PELUQUEROS = act_XXXXXXXXX)
          </p>
        </div>
      )}

      {/* ── Grupos con campañas ── */}
      {!loading && visibleGroups.map(g => (
        <div key={g.clientId} style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "8px", marginBottom: "16px", overflow: "hidden" }}>
          {/* Header grupo */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: "1px solid var(--border)", background: "rgba(255,255,255,0.01)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
              <p style={{ fontSize: "14px", fontWeight: 700, color: "var(--text)", margin: 0 }}>{g.clientName}</p>
              {g.error ? (
                <span style={{ fontSize: "10px", color: "var(--red)", padding: "2px 6px", borderRadius: "3px", background: "rgba(239,68,68,0.08)" }}>Error</span>
              ) : (
                <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>{g.campaigns.length} campaña{g.campaigns.length !== 1 ? 's' : ''}</span>
              )}
            </div>
            <div style={{ display: "flex", gap: "8px", alignItems: "center", flexShrink: 0 }}>
              {g.campaigns.filter(c => c.status === 'ACTIVE').length > 0 && (
                <span style={{ fontSize: "11px", color: "var(--green)", fontWeight: 600 }}>{g.campaigns.filter(c => c.status === 'ACTIVE').length} activa{g.campaigns.filter(c => c.status === 'ACTIVE').length !== 1 ? 's' : ''}</span>
              )}
              {g.accountId && (
                <a href={`https://business.facebook.com/adsmanager/manage/campaigns?act=${g.accountId.replace('act_', '')}`} target="_blank" rel="noopener noreferrer"
                  style={{ color: "var(--accent)", display: "flex", alignItems: "center", gap: "3px", textDecoration: "none", fontSize: "11px" }}>
                  <span className="hide-mobile">Ads Manager</span> <ExternalLink size={10}/>
                </a>
              )}
            </div>
          </div>

          {g.error ? (
            <p style={{ padding: "14px 16px", fontSize: "12px", color: "var(--red)", margin: 0 }}>
              {g.error.length > 120 ? g.error.slice(0, 120) + '…' : g.error}
            </p>
          ) : g.campaigns.length > 0 ? (
            <>
              {/* Mobile: cards */}
              <div className="show-mobile">
                {g.campaigns.map(c => (
                  <CampaignCard key={c.id} campaign={c} onToggle={toggleCampaign} toggling={toggling === c.id}/>
                ))}
              </div>
              {/* Desktop: table */}
              <div className="hide-mobile" style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--border)" }}>
                      {["Campaña", "Estado", "Presupuesto", "Gasto", "Impr.", "Clics", "CTR", "Leads", "CPL", ""].map(h => (
                        <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: "10px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)", whiteSpace: "nowrap" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {g.campaigns.map(c => (
                      <CampaignRow key={c.id} campaign={c} accountId={g.accountId} onToggle={toggleCampaign} toggling={toggling === c.id}/>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : null}
        </div>
      ))}

      {/* ── Clientes sin campañas → CTA crear ── */}
      {!loading && groupsNoCampaigns.length > 0 && (
        <div style={{ background: "var(--card)", border: "1px dashed var(--border)", borderRadius: "8px", padding: "20px 16px", textAlign: "center", marginBottom: "16px" }}>
          <p style={{ fontSize: "14px", color: "var(--text-muted)", margin: "0 0 8px" }}>
            {groupsNoCampaigns.map(g => g.clientName).join(', ')} — sin campañas en este periodo
          </p>
          <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: "0 0 14px" }}>
            Si es un cliente nuevo, crea su primera campaña desde Clientes.
          </p>
          <Link href="/clientes"
            style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "9px 18px", borderRadius: "6px", background: "var(--accent)", color: "#fff", fontSize: "13px", fontWeight: 600, textDecoration: "none" }}>
            <PlusCircle size={14}/> Crear primera campaña
          </Link>
        </div>
      )}

      {/* ── Empty total ── */}
      {!loading && !error && visibleGroups.length === 0 && groupsNoCampaigns.length === 0 && groupsNoAccount.length === 0 && (
        <div style={{ padding: "64px 0", textAlign: "center", color: "var(--text-muted)" }}>
          <p style={{ fontSize: "14px", marginBottom: "8px" }}>Sin campañas para mostrar</p>
          <p style={{ fontSize: "12px" }}>Cambia los filtros o crea una nueva campaña.</p>
        </div>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
        .page-container { padding: 20px 16px; max-width: 1200px; }
        .page-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 20px; gap: 12px; }
        .show-mobile { display: none; }
        .hide-mobile { display: block; }
        .kpi-grid { grid-template-columns: repeat(3, 1fr); }
        @media (min-width: 768px) {
          .page-container { padding: 32px 40px; }
          .kpi-grid { grid-template-columns: repeat(6, 1fr); }
        }
        @media (max-width: 767px) {
          .show-mobile { display: block; }
          .hide-mobile { display: none !important; }
        }
      `}</style>
    </div>
  );
}
