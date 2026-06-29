"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { RefreshCw, ExternalLink, Play, Pause, TrendingUp, MousePointerClick, Eye, DollarSign, Users } from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────────

interface Campaign {
  id: string;
  name: string;
  status: 'ACTIVE' | 'PAUSED' | 'DELETED' | string;
  objective: string;
  daily_budget: string | null;
  budget_remaining: string | null;
  created_time: string;
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

// ── Styles ─────────────────────────────────────────────────────────────────────

const CARD  = { background: "var(--card)", border: "1px solid var(--border)", borderRadius: "6px" } as React.CSSProperties;
const LABEL = { fontSize: "11px", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: "var(--text-muted)" };
const MONO  = { fontFamily: "'Space Mono', monospace" } as React.CSSProperties;

const DATE_OPTIONS: { value: DatePreset; label: string }[] = [
  { value: 'today',       label: 'Hoy'         },
  { value: 'last_7d',     label: '7 días'       },
  { value: 'last_14d',    label: '14 días'      },
  { value: 'last_30d',    label: '30 días'      },
  { value: 'this_month',  label: 'Este mes'     },
];

// ── Helpers ────────────────────────────────────────────────────────────────────

function statusBadge(status: string) {
  if (status === 'ACTIVE')  return { color: "var(--green)", bg: "rgba(52,211,153,0.10)", label: "ACTIVA" };
  if (status === 'PAUSED')  return { color: "var(--amber)", bg: "rgba(251,191,36,0.10)", label: "PAUSADA" };
  return { color: "var(--text-muted)", bg: "var(--border)", label: status };
}

function fmt(v: string | null, prefix = '', suffix = '') {
  if (v === null || v === undefined) return '—';
  return `${prefix}${v}${suffix}`;
}

function aggregateCampaigns(groups: ClientGroup[], statusFilter: StatusFilter): Campaign[] {
  return groups
    .flatMap(g => g.campaigns)
    .filter(c => statusFilter === 'all' || c.status === statusFilter);
}

// ── KPI Summary ────────────────────────────────────────────────────────────────

function KpiBar({ campaigns }: { campaigns: Campaign[] }) {
  const active = campaigns.filter(c => c.status === 'ACTIVE').length;
  const totalSpend = campaigns.reduce((s, c) => s + (c.spend ? parseFloat(c.spend) : 0), 0);
  const totalImpr  = campaigns.reduce((s, c) => s + (c.impressions ? parseInt(c.impressions) : 0), 0);
  const totalClicks= campaigns.reduce((s, c) => s + (c.clicks ? parseInt(c.clicks) : 0), 0);
  const totalLeads = campaigns.reduce((s, c) => s + (c.leads ? parseInt(c.leads) : 0), 0);
  const avgCpl     = totalLeads > 0 ? (totalSpend / totalLeads) : null;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: "12px", marginBottom: "24px" }}>
      {[
        { icon: <TrendingUp size={14}/>, label: "Campañas activas", value: active.toString(), color: "var(--green)" },
        { icon: <DollarSign size={14}/>, label: "Gasto total",       value: `${totalSpend.toFixed(2)}€`, color: "var(--text)" },
        { icon: <Eye size={14}/>,        label: "Impresiones",       value: totalImpr > 0 ? totalImpr.toLocaleString("es-ES") : "—", color: "var(--text)" },
        { icon: <MousePointerClick size={14}/>, label: "Clics",      value: totalClicks > 0 ? totalClicks.toLocaleString("es-ES") : "—", color: "var(--text)" },
        { icon: <Users size={14}/>,      label: "CPL medio",         value: avgCpl ? `${avgCpl.toFixed(2)}€` : "—", color: "var(--accent)" },
      ].map(({ icon, label, value, color }) => (
        <div key={label} style={{ ...CARD, padding: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px", color: "var(--text-muted)" }}>
            {icon}
            <p style={LABEL}>{label}</p>
          </div>
          <p style={{ ...MONO, fontSize: "22px", fontWeight: 700, color, lineHeight: 1 }}>{value}</p>
        </div>
      ))}
    </div>
  );
}

// ── Campaign Row ───────────────────────────────────────────────────────────────

function CampaignRow({
  campaign, clientName, accountId, onToggle, toggling,
}: {
  campaign: Campaign;
  clientName: string;
  accountId?: string;
  onToggle: (id: string, action: 'ACTIVE' | 'PAUSED') => void;
  toggling: boolean;
}) {
  const { color, bg, label } = statusBadge(campaign.status);
  const canToggle = campaign.status === 'ACTIVE' || campaign.status === 'PAUSED';
  const managerUrl = accountId
    ? `https://business.facebook.com/adsmanager/manage/campaigns?act=${accountId.replace('act_', '')}`
    : null;

  return (
    <tr style={{ borderBottom: "1px solid var(--border)" }}>
      <td style={{ padding: "12px 16px" }}>
        <p style={{ fontSize: "13px", fontWeight: 500, color: "var(--text)", marginBottom: "2px", maxWidth: "220px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{campaign.name}</p>
        <p style={{ fontSize: "11px", color: "var(--text-muted)" }}>{clientName}</p>
      </td>
      <td style={{ padding: "12px 16px" }}>
        <span style={{ fontSize: "11px", fontWeight: 600, padding: "3px 8px", borderRadius: "4px", color, background: bg }}>{label}</span>
      </td>
      <td style={{ padding: "12px 16px", ...MONO, fontSize: "12px", color: "var(--text-mid)" }}>{fmt(campaign.daily_budget, '', '€/día')}</td>
      <td style={{ padding: "12px 16px", ...MONO, fontSize: "13px", fontWeight: 700, color: campaign.spend ? "var(--text)" : "var(--text-muted)" }}>{fmt(campaign.spend, '', '€')}</td>
      <td style={{ padding: "12px 16px", ...MONO, fontSize: "12px", color: "var(--text-mid)" }}>{campaign.impressions ? parseInt(campaign.impressions).toLocaleString("es-ES") : "—"}</td>
      <td style={{ padding: "12px 16px", ...MONO, fontSize: "12px", color: "var(--text-mid)" }}>{fmt(campaign.clicks)}</td>
      <td style={{ padding: "12px 16px", ...MONO, fontSize: "12px", color: campaign.ctr ? "var(--accent)" : "var(--text-muted)" }}>{fmt(campaign.ctr, '', '%')}</td>
      <td style={{ padding: "12px 16px", ...MONO, fontSize: "12px", color: campaign.leads ? "var(--green)" : "var(--text-muted)" }}>{fmt(campaign.leads)}</td>
      <td style={{ padding: "12px 16px", ...MONO, fontSize: "12px", color: campaign.cpl ? "var(--text)" : "var(--text-muted)" }}>{fmt(campaign.cpl, '', '€')}</td>
      <td style={{ padding: "12px 16px" }}>
        <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
          {canToggle && (
            <button
              onClick={() => onToggle(campaign.id, campaign.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE')}
              disabled={toggling}
              title={campaign.status === 'ACTIVE' ? 'Pausar' : 'Activar'}
              style={{ padding: "5px 8px", borderRadius: "4px", border: `1px solid ${campaign.status === 'ACTIVE' ? "rgba(251,191,36,0.3)" : "rgba(52,211,153,0.3)"}`, background: campaign.status === 'ACTIVE' ? "rgba(251,191,36,0.08)" : "rgba(52,211,153,0.08)", color: campaign.status === 'ACTIVE' ? "var(--amber)" : "var(--green)", cursor: toggling ? "not-allowed" : "pointer", display: "flex", alignItems: "center" }}
            >
              {campaign.status === 'ACTIVE' ? <Pause size={11}/> : <Play size={11}/>}
            </button>
          )}
          {managerUrl && (
            <a href={managerUrl} target="_blank" rel="noopener noreferrer"
               style={{ padding: "5px 8px", borderRadius: "4px", border: "1px solid var(--border)", background: "var(--card)", color: "var(--text-muted)", display: "flex", alignItems: "center", textDecoration: "none" }}>
              <ExternalLink size={11}/>
            </a>
          )}
        </div>
      </td>
    </tr>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

interface TokenStatus {
  valid: boolean;
  expired?: boolean;
  userName?: string;
  daysLeft?: number | null;
  error?: string;
  hasDebugAccess?: boolean;
}

export default function CampanasPage() {
  const [groups, setGroups]           = useState<ClientGroup[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [datePreset, setDatePreset]   = useState<DatePreset>('last_7d');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [clientFilter, setClientFilter] = useState<string>('all');
  const [toggling, setToggling]       = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [tokenStatus, setTokenStatus] = useState<TokenStatus | null>(null);
  const [refreshing, setRefreshing]   = useState(false);
  const [newToken, setNewToken]       = useState<string | null>(null);

  const load = useCallback(async (preset: DatePreset) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/meta/all-campaigns?datePreset=${preset}`);
      const json = await res.json();
      if (!res.ok) { setError(json.error ?? 'Error al cargar campañas'); return; }
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
    } finally {
      setToggling(null);
    }
  }

  const filteredGroups = groups
    .filter(g => clientFilter === 'all' || g.clientId === clientFilter)
    .map(g => ({
      ...g,
      campaigns: g.campaigns.filter(c => statusFilter === 'all' || c.status === statusFilter),
    }));

  const allCampaigns = aggregateCampaigns(filteredGroups, 'all');
  const groupsWithCampaigns = filteredGroups.filter(g => g.campaigns.length > 0 || g.error);

  return (
    <div style={{ padding: "32px 40px" }}>

      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: 600, color: "var(--text)", marginBottom: "4px" }}>Campañas Manager</h1>
          <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>
            Meta Ads · todas las cuentas
            {lastUpdated && <span style={{ marginLeft: "8px" }}>· actualizado {lastUpdated.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}</span>}
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <Link href="/clientes" style={{ padding: "8px 14px", borderRadius: "6px", border: "1px solid var(--border)", background: "var(--card)", color: "var(--text-muted)", fontSize: "12px", textDecoration: "none", display: "flex", alignItems: "center", gap: "6px" }}>
            + Nueva campaña
          </Link>
          <button onClick={() => load(datePreset)} disabled={loading} style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid var(--border)", background: "var(--card)", color: "var(--text-muted)", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", fontSize: "12px" }}>
            <RefreshCw size={12} style={{ animation: loading ? "spin 1s linear infinite" : "none" }}/> Actualizar
          </button>
        </div>
      </div>

      {/* ── Token banner ── */}
      {tokenStatus && !tokenStatus.valid && (
        <div style={{ marginBottom: "20px", padding: "14px 16px", borderRadius: "6px", background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.3)", display: "flex", alignItems: "flex-start", gap: "12px" }}>
          <span style={{ fontSize: "16px" }}>🔴</span>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--red)", margin: "0 0 4px" }}>
              Token Meta {tokenStatus.expired ? 'expirado' : 'inválido'}
            </p>
            <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: "0 0 8px" }}>
              {tokenStatus.error ?? 'El token no devuelve datos. Es posible que haya vencido.'}<br/>
              Opciones: (1) Renovar token 60 días abajo · (2) Crear System User en Meta Business → token permanente
            </p>
            {!newToken ? (
              <button onClick={refreshToken} disabled={refreshing} style={{ padding: "6px 14px", borderRadius: "4px", border: "1px solid rgba(239,68,68,0.4)", background: "rgba(239,68,68,0.08)", color: "var(--red)", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>
                {refreshing ? 'Renovando...' : 'Renovar token (60 días)'}
              </button>
            ) : (
              <div style={{ marginTop: "8px", padding: "10px 12px", borderRadius: "4px", background: "var(--card)", border: "1px solid var(--border)" }}>
                <p style={{ fontSize: "11px", fontWeight: 600, color: "var(--green)", marginBottom: "6px" }}>Token nuevo generado — cópialo y actualiza META_ACCESS_TOKEN en Vercel:</p>
                <code style={{ fontSize: "10px", color: "var(--text-mid)", wordBreak: "break-all", display: "block", marginBottom: "8px" }}>{newToken}</code>
                <button onClick={() => navigator.clipboard.writeText(newToken)} style={{ padding: "4px 10px", borderRadius: "3px", background: "rgba(0,200,255,0.1)", color: "var(--accent)", border: "1px solid rgba(0,200,255,0.2)", fontSize: "11px", cursor: "pointer" }}>Copiar</button>
              </div>
            )}
          </div>
        </div>
      )}
      {tokenStatus?.valid && tokenStatus.daysLeft !== null && tokenStatus.daysLeft !== undefined && tokenStatus.daysLeft < 10 && (
        <div style={{ marginBottom: "20px", padding: "12px 16px", borderRadius: "6px", background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.3)", display: "flex", alignItems: "center", gap: "12px" }}>
          <span>⚠️</span>
          <p style={{ fontSize: "12px", color: "var(--amber)", margin: 0 }}>
            Token Meta válido pero expira en <strong>{tokenStatus.daysLeft} días</strong>. Renuévalo antes de que falle.
          </p>
          <button onClick={refreshToken} disabled={refreshing} style={{ marginLeft: "auto", padding: "5px 12px", borderRadius: "4px", border: "1px solid rgba(251,191,36,0.3)", background: "rgba(251,191,36,0.08)", color: "var(--amber)", fontSize: "11px", cursor: "pointer" }}>
            {refreshing ? '...' : 'Renovar'}
          </button>
        </div>
      )}

      {/* ── Filtros ── */}
      <div style={{ display: "flex", gap: "12px", marginBottom: "24px", flexWrap: "wrap" }}>
        {/* Periodo */}
        <div style={{ display: "flex", gap: "2px", background: "var(--card)", border: "1px solid var(--border)", borderRadius: "6px", padding: "3px" }}>
          {DATE_OPTIONS.map(({ value, label }) => (
            <button key={value} onClick={() => setDatePreset(value)} style={{ padding: "5px 12px", borderRadius: "4px", border: "none", cursor: "pointer", fontSize: "12px", fontWeight: datePreset === value ? 600 : 400, background: datePreset === value ? "var(--accent-dim)" : "transparent", color: datePreset === value ? "var(--accent)" : "var(--text-muted)", outline: datePreset === value ? "1px solid rgba(0,200,255,0.2)" : "none" }}>
              {label}
            </button>
          ))}
        </div>

        {/* Estado */}
        <div style={{ display: "flex", gap: "2px", background: "var(--card)", border: "1px solid var(--border)", borderRadius: "6px", padding: "3px" }}>
          {([['all', 'Todas'], ['ACTIVE', 'Activas'], ['PAUSED', 'Pausadas']] as [StatusFilter, string][]).map(([v, l]) => (
            <button key={v} onClick={() => setStatusFilter(v)} style={{ padding: "5px 12px", borderRadius: "4px", border: "none", cursor: "pointer", fontSize: "12px", fontWeight: statusFilter === v ? 600 : 400, background: statusFilter === v ? "var(--accent-dim)" : "transparent", color: statusFilter === v ? "var(--accent)" : "var(--text-muted)" }}>
              {l}
            </button>
          ))}
        </div>

        {/* Cliente */}
        <select
          value={clientFilter}
          onChange={e => setClientFilter(e.target.value)}
          style={{ padding: "6px 12px", borderRadius: "6px", border: "1px solid var(--border)", background: "var(--card)", color: "var(--text)", fontSize: "12px", cursor: "pointer", outline: "none" }}
        >
          <option value="all">Todos los clientes</option>
          {groups.map(g => <option key={g.clientId} value={g.clientId}>{g.clientName}</option>)}
        </select>
      </div>

      {/* ── KPIs ── */}
      {!loading && allCampaigns.length > 0 && <KpiBar campaigns={allCampaigns}/>}

      {/* ── Error global ── */}
      {error && (
        <div style={{ padding: "16px", borderRadius: "6px", background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)", marginBottom: "20px" }}>
          <p style={{ fontSize: "13px", color: "var(--red)" }}>{error}</p>
        </div>
      )}

      {/* ── Loading ── */}
      {loading && (
        <div style={{ padding: "48px 0", textAlign: "center", color: "var(--text-muted)", fontSize: "13px", display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
          <RefreshCw size={20} style={{ animation: "spin 1s linear infinite" }}/>
          Cargando campañas de Meta Ads...
        </div>
      )}

      {/* ── Tabla por cliente ── */}
      {!loading && groupsWithCampaigns.map(g => (
        <div key={g.clientId} style={{ ...CARD, marginBottom: "20px", overflow: "hidden" }}>
          {/* Cabecera grupo */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderBottom: "1px solid var(--border)", background: "rgba(255,255,255,0.01)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--text)" }}>{g.clientName}</p>
              {g.error ? (
                <span style={{ fontSize: "11px", color: "var(--red)", padding: "2px 7px", borderRadius: "3px", background: "rgba(239,68,68,0.08)" }}>Error: {g.error.slice(0, 60)}</span>
              ) : (
                <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>{g.campaigns.length} campaña{g.campaigns.length !== 1 ? 's' : ''}</span>
              )}
            </div>
            <div style={{ display: "flex", gap: "8px", alignItems: "center", fontSize: "11px", color: "var(--text-muted)" }}>
              {g.campaigns.filter(c => c.status === 'ACTIVE').length > 0 && (
                <span style={{ color: "var(--green)", fontWeight: 600 }}>{g.campaigns.filter(c => c.status === 'ACTIVE').length} activa{g.campaigns.filter(c => c.status === 'ACTIVE').length !== 1 ? 's' : ''}</span>
              )}
              {g.accountId && (
                <a href={`https://business.facebook.com/adsmanager/manage/campaigns?act=${g.accountId.replace('act_', '')}`} target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent)", display: "flex", alignItems: "center", gap: "3px", textDecoration: "none" }}>
                  Meta Ads Manager <ExternalLink size={10}/>
                </a>
              )}
            </div>
          </div>

          {/* Tabla */}
          {g.campaigns.length > 0 ? (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border)" }}>
                    {["Campaña", "Estado", "Presupuesto", "Gasto", "Impr.", "Clics", "CTR", "Leads", "CPL", ""].map(h => (
                      <th key={h} style={{ ...LABEL, padding: "10px 16px", textAlign: "left", whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {g.campaigns.map(c => (
                    <CampaignRow
                      key={c.id}
                      campaign={c}
                      clientName={g.clientName}
                      accountId={g.accountId}
                      onToggle={toggleCampaign}
                      toggling={toggling === c.id}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p style={{ padding: "20px 20px", fontSize: "12px", color: "var(--text-muted)" }}>
              {g.error ? 'No se pudieron cargar las campañas.' : 'Sin campañas con los filtros seleccionados.'}
            </p>
          )}
        </div>
      ))}

      {/* ── Empty state ── */}
      {!loading && !error && groupsWithCampaigns.length === 0 && (
        <div style={{ padding: "64px 0", textAlign: "center", color: "var(--text-muted)" }}>
          <p style={{ fontSize: "14px", marginBottom: "8px" }}>Sin campañas para mostrar</p>
          <p style={{ fontSize: "12px" }}>Cambia los filtros o verifica que las cuentas Meta estén configuradas.</p>
        </div>
      )}

      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
