"use client";

import { useState, useCallback, useEffect } from "react";
import {
  RefreshCw, Tag, AlertTriangle, CheckCircle, XCircle,
  ChevronDown, ChevronUp, ExternalLink, Zap, Search, BarChart2,
  TrendingUp, TrendingDown, Target, Globe
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────────

interface Campaign {
  id: string; name: string; status: string; tipo: string; bid: string;
  gasto: number; clics: number; impresiones: number; ctr: number; cpc: number;
  conversiones: number; cpl: number | null; roas: number | null;
  search_impression_share: string | null;
  budget_lost_is: string | null;
  rank_lost_is:   string | null;
}

interface AdGroup {
  campaign: string; name: string; status: string; cpc_bid: number;
  gasto: number; clics: number; impresiones: number; ctr: number; cpc: number;
  conversiones: number; cpl: number | null;
}

interface Keyword {
  campaign: string; ad_group: string; keyword: string; match: string;
  qs: number | null; creative_q: string | null; landingpage_q: string | null; predicted_ctr: string | null;
  gasto: number; clics: number; impressiones: number; ctr: number; cpc: number; conversiones: number;
}

interface ScKw {
  keyword: string; clics: number; impresiones: number; ctr: string; posicion: string;
}

interface Ga4Channel {
  canal: string; sessions: number; users: number; conversiones: number; bounce: string;
}

interface Ga4Page {
  page: string; sessions: number; conversiones: number; bounce: string; duracion: string;
}

interface Rec {
  tipo: string; prioridad: 'alta' | 'media' | 'baja'; titulo: string; detalle: string;
}

interface AuditData {
  periodo:         string;
  campaigns:       Campaign[];
  adGroups:        AdGroup[];
  keywords:        Keyword[];
  scKeywords:      ScKw[];
  ga4Channels:     Ga4Channel[];
  ga4Pages:        Ga4Page[];
  recomendaciones: Rec[];
  errors:          string[];
}

interface DiscoverData {
  ga4Properties: { id: string; displayName: string }[];
  scSites:       { url: string; permission: string }[];
  gtmAccounts:   { id: string; name: string }[];
  autoMap:       { ga4: Record<string, { id: string; displayName: string }>; sc: Record<string, string> };
}

// ── Config ─────────────────────────────────────────────────────────────────────

const CLIENTS = [
  { id: 'identity', name: 'Identity Peluqueros',    color: '#8B5CF6', siteUrl: 'https://identitypeluqueros.com/', adsId: '2979427201', ga4Default: '359963445', adsUrl: 'https://ads.google.com/aw/campaigns?__e=2979427201' },
  { id: 'desancho', name: 'Desancho Estilistas',    color: '#F59E0B', siteUrl: 'https://desancho.com/',           adsId: '7395427320', ga4Default: '262734277', adsUrl: 'https://ads.google.com/aw/campaigns?__e=7395427320' },
  { id: 'lastmile', name: 'Last Mile Distribution', color: '#10B981', siteUrl: 'https://lastmiledist.com/',       adsId: '9497091021', ga4Default: '523165876', adsUrl: 'https://ads.google.com/aw/campaigns?__e=9497091021' },
] as const;

type ClientId = typeof CLIENTS[number]['id'];
const STORE = 'raxislab_google_v3';

function loadStore(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  try { return JSON.parse(localStorage.getItem(STORE) ?? '{}'); } catch { return {}; }
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const CARD = { background: "var(--card)", border: "1px solid var(--border)", borderRadius: "8px" } as React.CSSProperties;
const MONO = { fontFamily: "'Space Mono', monospace" } as React.CSSProperties;
const LABEL: React.CSSProperties = { fontSize: "10px", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)" };

const QS_COLOR = (qs: number | null) => qs === null ? "var(--text-muted)" : qs >= 7 ? "var(--green)" : qs >= 5 ? "var(--amber)" : "var(--red)";
const CTR_COLOR = (v: number) => v >= 5 ? "var(--green)" : v >= 2 ? "var(--amber)" : "var(--red)";
const POS_COLOR = (p: string) => { const n = parseFloat(p); return n <= 3 ? "var(--green)" : n <= 10 ? "var(--amber)" : "var(--red)"; };

function Stat({ label, value, sub, color = "var(--text)" }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div style={{ padding: "10px 12px", background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)", borderRadius: "6px" }}>
      <p style={{ ...LABEL, marginBottom: "4px" }}>{label}</p>
      <p style={{ ...MONO, fontSize: "16px", fontWeight: 700, color, margin: 0 }}>{value}</p>
      {sub && <p style={{ fontSize: "9px", color: "var(--text-muted)", margin: "2px 0 0" }}>{sub}</p>}
    </div>
  );
}

function PrioBadge({ p }: { p: 'alta' | 'media' | 'baja' }) {
  const map = { alta: ["var(--red)", "ALTA"], media: ["var(--amber)", "MEDIA"], baja: ["var(--green)", "BAJA"] };
  const [c, l] = map[p];
  return <span style={{ fontSize: "9px", padding: "2px 6px", borderRadius: "3px", background: `${c}18`, color: c, fontWeight: 700, flexShrink: 0 }}>{l}</span>;
}

function QsBadge({ qs }: { qs: number | null }) {
  if (qs === null) return <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>—</span>;
  const color = QS_COLOR(qs);
  return <span style={{ ...MONO, fontSize: "11px", fontWeight: 700, color, padding: "2px 6px", background: `${color}15`, borderRadius: "3px" }}>{qs}/10</span>;
}

function MatchBadge({ m }: { m: string }) {
  const map: Record<string, [string, string]> = { EXACT: ["var(--green)", "EXACT"], PHRASE: ["var(--amber)", "PHRASE"], BROAD: ["var(--red)", "BROAD"] };
  const [c, l] = map[m] ?? ["var(--text-muted)", m];
  return <span style={{ fontSize: "9px", padding: "1px 5px", borderRadius: "3px", background: `${c}15`, color: c, fontWeight: 700 }}>{l}</span>;
}

function StatusPill({ status }: { status: string }) {
  const ok = status === 'ENABLED';
  return <span style={{ fontSize: "9px", padding: "2px 6px", borderRadius: "3px", fontWeight: 700, background: ok ? "rgba(52,211,153,0.1)" : "rgba(251,191,36,0.1)", color: ok ? "var(--green)" : "var(--amber)" }}>{ok ? 'ACTIVA' : 'PAUSA'}</span>;
}

function TH({ children }: { children: React.ReactNode }) {
  return <th style={{ padding: "7px 10px", textAlign: "left", ...LABEL, borderBottom: "1px solid var(--border)", whiteSpace: "nowrap" }}>{children}</th>;
}

function TD({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <td style={{ padding: "8px 10px", borderBottom: "1px solid var(--border)", fontSize: "11px", ...style }}>{children}</td>;
}

// ── Campaigns tab ──────────────────────────────────────────────────────────────

function CampaignsTab({ data, color }: { data: AuditData; color: string }) {
  const [expandCamp, setExpandCamp] = useState<string | null>(null);
  const camp = data.campaigns;
  if (!camp.length) return <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>Sin datos de campañas. Verifica que GOOGLE_ADS_API_KEY esté configurada.</p>;

  const totGasto = camp.reduce((a, c) => a + c.gasto, 0);
  const totClics = camp.reduce((a, c) => a + c.clics, 0);
  const totConv  = camp.reduce((a, c) => a + c.conversiones, 0);
  const totImp   = camp.reduce((a, c) => a + c.impresiones, 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
      {/* Totals */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: "8px" }}>
        <Stat label="Inversión total" value={`${totGasto.toFixed(0)}€`} color={color}/>
        <Stat label="Clics" value={totClics.toLocaleString("es")}/>
        <Stat label="Impresiones" value={totImp.toLocaleString("es")}/>
        <Stat label="CTR medio" value={`${totImp > 0 ? (totClics / totImp * 100).toFixed(2) : 0}%`} color={CTR_COLOR(totImp > 0 ? totClics / totImp * 100 : 0)}/>
        <Stat label="Conversiones" value={totConv.toFixed(0)} color={totConv > 0 ? "var(--green)" : "var(--text-muted)"}/>
        <Stat label="CPL" value={totConv > 0 ? `${(totGasto / totConv).toFixed(0)}€` : "—"} color={totConv > 0 ? "var(--text)" : "var(--text-muted)"}/>
      </div>

      {/* Campaign rows */}
      <div style={{ ...CARD, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px" }}>
          <thead><tr style={{ background: "rgba(255,255,255,0.02)" }}>
            <TH>Campaña</TH><TH>Estado</TH><TH>Tipo</TH><TH>Gasto</TH><TH>Clics</TH>
            <TH>CTR</TH><TH>CPC</TH><TH>Conv.</TH><TH>CPL</TH><TH>ROAS</TH>
            <TH>IS%</TH><TH>Perd.€</TH><TH>Perd.rank</TH>
          </tr></thead>
          <tbody>
            {camp.map((c, i) => (
              <>
                <tr key={c.id ?? i} onClick={() => setExpandCamp(expandCamp === c.name ? null : c.name)}
                  style={{ cursor: "pointer", opacity: c.status !== 'ENABLED' ? 0.55 : 1, background: expandCamp === c.name ? "rgba(255,255,255,0.03)" : "transparent" }}>
                  <TD><span style={{ color: "var(--text)", fontWeight: 500, maxWidth: "160px", display: "inline-block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name}</span></TD>
                  <TD><StatusPill status={c.status}/></TD>
                  <TD style={{ color: "var(--text-muted)", fontSize: "9px" }}>{c.tipo?.replace('ADVERTISING_CHANNEL_TYPE_', '')}</TD>
                  <TD style={{ ...MONO, color: color, fontWeight: 700 }}>{c.gasto.toFixed(0)}€</TD>
                  <TD style={MONO}>{c.clics.toLocaleString("es")}</TD>
                  <TD style={{ ...MONO, color: CTR_COLOR(c.ctr) }}>{c.ctr}%</TD>
                  <TD style={MONO}>{c.cpc.toFixed(2)}€</TD>
                  <TD style={{ ...MONO, color: c.conversiones > 0 ? "var(--green)" : "var(--red)", fontWeight: c.conversiones === 0 ? 700 : 400 }}>{c.conversiones > 0 ? c.conversiones.toFixed(1) : "✗"}</TD>
                  <TD style={{ ...MONO, color: "var(--text-muted)" }}>{c.cpl ? `${c.cpl.toFixed(0)}€` : "—"}</TD>
                  <TD style={{ ...MONO, color: c.roas && c.roas > 2 ? "var(--green)" : "var(--text-muted)" }}>{c.roas ? `${c.roas.toFixed(1)}x` : "—"}</TD>
                  <TD style={{ ...MONO, color: c.search_impression_share ? "var(--green)" : "var(--text-muted)" }}>{c.search_impression_share ?? "—"}</TD>
                  <TD style={{ ...MONO, color: c.budget_lost_is && parseFloat(c.budget_lost_is) > 15 ? "var(--red)" : "var(--text-muted)" }}>{c.budget_lost_is ?? "—"}</TD>
                  <TD style={{ ...MONO, color: c.rank_lost_is && parseFloat(c.rank_lost_is) > 20 ? "var(--amber)" : "var(--text-muted)" }}>{c.rank_lost_is ?? "—"}</TD>
                </tr>
                {expandCamp === c.name && (
                  <tr key={`${c.id}-exp`}>
                    <td colSpan={13} style={{ padding: "10px 14px", background: "rgba(255,255,255,0.015)", borderBottom: "1px solid var(--border)" }}>
                      <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: "0 0 6px", fontWeight: 600 }}>Ad Groups en "{c.name}"</p>
                      {data.adGroups.filter(ag => ag.campaign === c.name).length === 0
                        ? <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: 0 }}>Sin datos de ad groups</p>
                        : <table style={{ width: "100%", fontSize: "10px", borderCollapse: "collapse" }}>
                          <thead><tr>
                            {["Ad Group","Estado","CPC bid","Gasto","Clics","CTR","Conv."].map(h => <th key={h} style={{ ...LABEL, padding: "4px 8px", textAlign: "left" }}>{h}</th>)}
                          </tr></thead>
                          <tbody>
                            {data.adGroups.filter(ag => ag.campaign === c.name).map((ag, j) => (
                              <tr key={j}>
                                <td style={{ padding: "5px 8px", color: "var(--text-mid)" }}>{ag.name}</td>
                                <td style={{ padding: "5px 8px" }}><StatusPill status={ag.status}/></td>
                                <td style={{ padding: "5px 8px", ...MONO, color: "var(--text-muted)" }}>{ag.cpc_bid.toFixed(2)}€</td>
                                <td style={{ padding: "5px 8px", ...MONO, color: color, fontWeight: 700 }}>{ag.gasto.toFixed(2)}€</td>
                                <td style={{ padding: "5px 8px", ...MONO }}>{ag.clics}</td>
                                <td style={{ padding: "5px 8px", ...MONO, color: CTR_COLOR(ag.ctr) }}>{ag.ctr}%</td>
                                <td style={{ padding: "5px 8px", ...MONO, color: ag.conversiones > 0 ? "var(--green)" : "var(--red)" }}>{ag.conversiones > 0 ? ag.conversiones.toFixed(1) : "0"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      }
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Keywords tab ───────────────────────────────────────────────────────────────

function KeywordsTab({ data, color }: { data: AuditData; color: string }) {
  const [filter, setFilter] = useState<'all' | 'bad_qs' | 'no_conv'>('all');
  const kws = data.keywords;

  const filtered = kws.filter(kw => {
    if (filter === 'bad_qs')  return kw.qs !== null && kw.qs <= 5;
    if (filter === 'no_conv') return kw.gasto > 5 && kw.conversiones === 0;
    return true;
  });

  const avgQS = kws.filter(k => k.qs !== null).reduce((a, k) => a + (k.qs ?? 0), 0) / (kws.filter(k => k.qs !== null).length || 1);
  const lowQS = kws.filter(k => k.qs !== null && k.qs <= 5).length;
  const noConv = kws.filter(k => k.gasto > 5 && k.conversiones === 0).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "8px" }}>
        <Stat label="Keywords activas" value={kws.length} color={color}/>
        <Stat label="QS medio" value={avgQS.toFixed(1)} color={avgQS >= 7 ? "var(--green)" : avgQS >= 5 ? "var(--amber)" : "var(--red)"} sub="objetivo ≥7"/>
        <Stat label="QS bajo (≤5)" value={lowQS} color={lowQS > 0 ? "var(--red)" : "var(--green)"}/>
        <Stat label="Gasto sin conv." value={noConv} color={noConv > 0 ? "var(--amber)" : "var(--green)"}/>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: "6px" }}>
        {[
          { k: 'all'     as const, l: `Todas (${kws.length})` },
          { k: 'bad_qs'  as const, l: `QS bajo (${lowQS})` },
          { k: 'no_conv' as const, l: `Sin conv. (${noConv})` },
        ].map(({ k, l }) => (
          <button key={k} onClick={() => setFilter(k)} style={{ padding: "5px 10px", borderRadius: "4px", border: "1px solid var(--border)", background: filter === k ? color : "transparent", color: filter === k ? "#fff" : "var(--text-muted)", fontSize: "11px", cursor: "pointer", fontWeight: filter === k ? 700 : 400 }}>{l}</button>
        ))}
      </div>

      <div style={{ ...CARD, overflow: "auto", maxHeight: "420px" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px" }}>
          <thead style={{ position: "sticky", top: 0, background: "var(--card)", zIndex: 1 }}>
            <tr><TH>Keyword</TH><TH>Match</TH><TH>Ad Group</TH><TH>QS</TH><TH>Land.Q</TH><TH>Anuncio.Q</TH><TH>CTR pred.</TH><TH>Gasto</TH><TH>Clics</TH><TH>CTR</TH><TH>CPC</TH><TH>Conv.</TH></tr>
          </thead>
          <tbody>
            {filtered.map((kw, i) => (
              <tr key={i} style={{ background: (kw.qs !== null && kw.qs <= 4) ? "rgba(239,68,68,0.04)" : "transparent" }}>
                <TD style={{ color: "var(--text)", fontWeight: 500, maxWidth: "160px" }}><span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" }}>{kw.keyword}</span></TD>
                <TD><MatchBadge m={kw.match}/></TD>
                <TD style={{ color: "var(--text-muted)", fontSize: "10px", maxWidth: "120px" }}><span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" }}>{kw.ad_group}</span></TD>
                <TD><QsBadge qs={kw.qs}/></TD>
                <TD style={{ fontSize: "10px", color: kw.landingpage_q === 'ABOVE_AVERAGE' ? "var(--green)" : kw.landingpage_q === 'BELOW_AVERAGE' ? "var(--red)" : "var(--amber)" }}>{kw.landingpage_q?.replace('_AVERAGE', '') ?? "—"}</TD>
                <TD style={{ fontSize: "10px", color: kw.creative_q === 'ABOVE_AVERAGE' ? "var(--green)" : kw.creative_q === 'BELOW_AVERAGE' ? "var(--red)" : "var(--amber)" }}>{kw.creative_q?.replace('_AVERAGE', '') ?? "—"}</TD>
                <TD style={{ fontSize: "10px", color: kw.predicted_ctr === 'ABOVE_AVERAGE' ? "var(--green)" : kw.predicted_ctr === 'BELOW_AVERAGE' ? "var(--red)" : "var(--amber)" }}>{kw.predicted_ctr?.replace('_AVERAGE', '') ?? "—"}</TD>
                <TD style={{ ...MONO, color: color, fontWeight: 700 }}>{kw.gasto.toFixed(2)}€</TD>
                <TD style={MONO}>{kw.clics}</TD>
                <TD style={{ ...MONO, color: CTR_COLOR(kw.ctr) }}>{kw.ctr}%</TD>
                <TD style={MONO}>{kw.cpc.toFixed(2)}€</TD>
                <TD style={{ ...MONO, color: kw.conversiones > 0 ? "var(--green)" : "var(--text-muted)" }}>{kw.conversiones > 0 ? kw.conversiones : "—"}</TD>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <p style={{ padding: "20px", textAlign: "center", color: "var(--text-muted)", fontSize: "12px" }}>Sin keywords con este filtro</p>}
      </div>
    </div>
  );
}

// ── SEO tab ────────────────────────────────────────────────────────────────────

function SeoTab({ data }: { data: AuditData }) {
  const [filter, setFilter] = useState<'all' | 'top3' | 'oportunidad' | 'ctr_bajo'>('all');
  const kws = data.scKeywords;

  const top3    = kws.filter(k => parseFloat(k.posicion) <= 3);
  const oport   = kws.filter(k => parseFloat(k.posicion) > 3 && parseFloat(k.posicion) <= 10);
  const ctrBajo = kws.filter(k => parseFloat(k.posicion) <= 15 && parseFloat(k.ctr) < 3 && k.impresiones > 100);

  const filtered = filter === 'top3' ? top3 : filter === 'oportunidad' ? oport : filter === 'ctr_bajo' ? ctrBajo : kws;

  const totClics = kws.reduce((a, k) => a + k.clics, 0);
  const totImp   = kws.reduce((a, k) => a + k.impresiones, 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "8px" }}>
        <Stat label="Clics orgánicos (90d)" value={totClics.toLocaleString("es")} color="#4285F4"/>
        <Stat label="Impresiones" value={totImp.toLocaleString("es")}/>
        <Stat label="Top 3" value={top3.length} color="var(--green)" sub="keywords"/>
        <Stat label="Oportunidades" value={oport.length} color="var(--amber)" sub="pos 4-10"/>
      </div>

      <div style={{ display: "flex", gap: "6px" }}>
        {[
          { k: 'all'        as const, l: `Todas (${kws.length})` },
          { k: 'top3'       as const, l: `Top 3 (${top3.length})`, c: "var(--green)" },
          { k: 'oportunidad'as const, l: `Oportunidad (${oport.length})`, c: "var(--amber)" },
          { k: 'ctr_bajo'   as const, l: `CTR bajo (${ctrBajo.length})`, c: "var(--red)" },
        ].map(({ k, l, c }) => (
          <button key={k} onClick={() => setFilter(k)} style={{ padding: "5px 10px", borderRadius: "4px", border: `1px solid ${filter === k ? (c ?? 'var(--accent)') : 'var(--border)'}`, background: filter === k ? `${c ?? 'var(--accent)'}18` : "transparent", color: filter === k ? (c ?? 'var(--accent)') : "var(--text-muted)", fontSize: "11px", cursor: "pointer", fontWeight: filter === k ? 700 : 400 }}>{l}</button>
        ))}
      </div>

      <div style={{ ...CARD, overflow: "auto", maxHeight: "420px" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px" }}>
          <thead style={{ position: "sticky", top: 0, background: "var(--card)", zIndex: 1 }}>
            <tr><TH>Keyword</TH><TH>Clics</TH><TH>Impresiones</TH><TH>CTR</TH><TH>Posición media</TH></tr>
          </thead>
          <tbody>
            {filtered.map((kw, i) => (
              <tr key={i}>
                <TD style={{ color: "var(--text-mid)", fontWeight: 500 }}>{kw.keyword}</TD>
                <TD style={{ ...MONO, color: "#4285F4" }}>{kw.clics.toLocaleString("es")}</TD>
                <TD style={MONO}>{kw.impresiones.toLocaleString("es")}</TD>
                <TD style={{ ...MONO, color: parseFloat(kw.ctr) < 2 ? "var(--red)" : parseFloat(kw.ctr) < 4 ? "var(--amber)" : "var(--green)" }}>{kw.ctr}</TD>
                <TD style={{ ...MONO, color: POS_COLOR(kw.posicion) }}>{kw.posicion}</TD>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <p style={{ padding: "16px", textAlign: "center", color: "var(--text-muted)", fontSize: "12px" }}>Sin datos de Search Console. Verifica que la URL del sitio sea correcta.</p>}
      </div>
    </div>
  );
}

// ── Analytics tab ──────────────────────────────────────────────────────────────

function AnalyticsTab({ data }: { data: AuditData }) {
  const totalSessions = data.ga4Channels.reduce((a, c) => a + c.sessions, 0);
  const totalConv     = data.ga4Channels.reduce((a, c) => a + c.conversiones, 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
      {data.ga4Channels.length === 0 ? (
        <div style={{ padding: "16px", background: "rgba(255,255,255,0.02)", border: "1px solid var(--border)", borderRadius: "6px" }}>
          <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: 0 }}>Sin datos de GA4. Introduce el Property ID para este cliente (número en GA4 → Admin → Información propiedad).</p>
        </div>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "8px" }}>
            <Stat label="Sesiones (90d)" value={totalSessions.toLocaleString("es")} color="#4285F4"/>
            <Stat label="Conversiones GA4" value={totalConv} color={totalConv > 0 ? "var(--green)" : "var(--red)"}/>
            <Stat label="Tasa conv." value={totalSessions > 0 ? `${(totalConv / totalSessions * 100).toFixed(2)}%` : "—"} color="var(--text)"/>
          </div>

          {/* Channels breakdown */}
          <div style={{ ...CARD, overflow: "hidden" }}>
            <p style={{ padding: "10px 14px", ...LABEL, margin: 0, borderBottom: "1px solid var(--border)" }}>Canales de tráfico</p>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px" }}>
              <thead><tr><TH>Canal</TH><TH>Sesiones</TH><TH>%</TH><TH>Usuarios</TH><TH>Conversiones</TH><TH>Rebote</TH></tr></thead>
              <tbody>
                {data.ga4Channels.map((c, i) => {
                  const pct = totalSessions > 0 ? (c.sessions / totalSessions * 100) : 0;
                  return (
                    <tr key={i}>
                      <TD style={{ color: "var(--text-mid)", fontWeight: 500 }}>{c.canal}</TD>
                      <TD style={{ ...MONO, color: "#4285F4" }}>{c.sessions.toLocaleString("es")}</TD>
                      <TD>
                        <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                          <div style={{ width: "50px", height: "3px", background: "var(--border)", borderRadius: "2px" }}>
                            <div style={{ width: `${Math.min(pct, 100)}%`, height: "100%", background: "#4285F4", borderRadius: "2px" }}/>
                          </div>
                          <span style={{ ...MONO, fontSize: "10px", color: "#4285F4" }}>{pct.toFixed(0)}%</span>
                        </div>
                      </TD>
                      <TD style={MONO}>{c.users.toLocaleString("es")}</TD>
                      <TD style={{ ...MONO, color: c.conversiones > 0 ? "var(--green)" : "var(--text-muted)" }}>{c.conversiones > 0 ? c.conversiones : "—"}</TD>
                      <TD style={{ ...MONO, color: parseFloat(c.bounce) < 50 ? "var(--green)" : parseFloat(c.bounce) < 70 ? "var(--amber)" : "var(--red)" }}>{c.bounce}</TD>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Landing pages */}
          {data.ga4Pages.length > 0 && (
            <div style={{ ...CARD, overflow: "hidden" }}>
              <p style={{ padding: "10px 14px", ...LABEL, margin: 0, borderBottom: "1px solid var(--border)" }}>Landing pages — sesiones vs conversiones</p>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px" }}>
                <thead><tr><TH>Página</TH><TH>Sesiones</TH><TH>Conv.</TH><TH>Rebote</TH><TH>Duración</TH><TH>Estado</TH></tr></thead>
                <tbody>
                  {data.ga4Pages.map((p, i) => (
                    <tr key={i} style={{ background: p.sessions > 30 && p.conversiones === 0 ? "rgba(239,68,68,0.03)" : "transparent" }}>
                      <TD style={{ color: "var(--text-muted)", fontSize: "10px", maxWidth: "200px" }}><span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" }}>{p.page}</span></TD>
                      <TD style={{ ...MONO, color: "#4285F4" }}>{p.sessions.toLocaleString("es")}</TD>
                      <TD style={{ ...MONO, color: p.conversiones > 0 ? "var(--green)" : "var(--text-muted)" }}>{p.conversiones > 0 ? p.conversiones : "—"}</TD>
                      <TD style={{ ...MONO, color: parseFloat(p.bounce) < 50 ? "var(--green)" : "var(--red)" }}>{p.bounce}</TD>
                      <TD style={{ ...MONO, color: "var(--text-muted)" }}>{p.duracion}</TD>
                      <TD>{p.sessions > 30 && p.conversiones === 0
                        ? <span style={{ fontSize: "9px", color: "var(--red)", fontWeight: 700 }}>⚠ FRICCIÓN</span>
                        : p.conversiones > 0 ? <span style={{ fontSize: "9px", color: "var(--green)", fontWeight: 700 }}>✓</span>
                        : null}
                      </TD>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Recommendations tab ────────────────────────────────────────────────────────

function RecsTab({ recs }: { recs: Rec[] }) {
  const alta  = recs.filter(r => r.prioridad === 'alta');
  const media = recs.filter(r => r.prioridad === 'media');

  if (recs.length === 0) return (
    <div style={{ padding: "20px", textAlign: "center", color: "var(--green)", fontSize: "12px" }}>
      <CheckCircle size={20} style={{ marginBottom: "8px" }}/>
      <p style={{ margin: 0 }}>Sin problemas detectados automáticamente. Cuentas bien configuradas.</p>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      <div style={{ display: "flex", gap: "8px", marginBottom: "4px" }}>
        {alta.length > 0 && <span style={{ padding: "4px 10px", borderRadius: "4px", background: "rgba(239,68,68,0.1)", color: "var(--red)", fontSize: "11px", fontWeight: 700 }}>{alta.length} urgentes</span>}
        {media.length > 0 && <span style={{ padding: "4px 10px", borderRadius: "4px", background: "rgba(251,191,36,0.1)", color: "var(--amber)", fontSize: "11px", fontWeight: 700 }}>{media.length} a mejorar</span>}
      </div>

      {recs.map((r, i) => (
        <div key={i} style={{ padding: "12px 14px", background: r.prioridad === 'alta' ? "rgba(239,68,68,0.04)" : "rgba(255,255,255,0.02)", border: `1px solid ${r.prioridad === 'alta' ? "rgba(239,68,68,0.25)" : r.prioridad === 'media' ? "rgba(251,191,36,0.2)" : "var(--border)"}`, borderRadius: "6px" }}>
          <div style={{ display: "flex", gap: "8px", alignItems: "flex-start", marginBottom: "6px" }}>
            <PrioBadge p={r.prioridad}/>
            <span style={{ fontSize: "9px", padding: "2px 6px", borderRadius: "3px", background: "rgba(255,255,255,0.05)", color: "var(--text-muted)", flexShrink: 0, fontWeight: 600 }}>{r.tipo.toUpperCase()}</span>
            <p style={{ fontSize: "12px", fontWeight: 600, color: "var(--text)", margin: 0 }}>{r.titulo}</p>
          </div>
          <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: 0, lineHeight: "1.6" }}>{r.detalle}</p>
        </div>
      ))}
    </div>
  );
}

// ── Client Panel ───────────────────────────────────────────────────────────────

type SubTab = 'recs' | 'campaigns' | 'keywords' | 'seo' | 'analytics';

function ClientPanel({
  client, ga4Id, siteUrl, onConfig,
}: {
  client: typeof CLIENTS[number];
  ga4Id: string;
  siteUrl: string;
  onConfig: (ga4: string, site: string) => void;
}) {
  const [open, setOpen]         = useState(false);
  const [subTab, setSubTab]     = useState<SubTab>('recs');
  const [audit, setAudit]       = useState<AuditData | null>(null);
  const [loading, setLoading]   = useState(false);
  const [days, setDays]         = useState(30);
  const [ga4Input, setGa4Input] = useState(ga4Id);
  const [siteInput, setSiteInput] = useState(siteUrl || client.siteUrl);
  const [editConfig, setEditConfig] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/google/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId:   client.adsId,
          siteUrl:      siteInput,
          ga4PropertyId: ga4Input || undefined,
          days,
        }),
      });
      const j = await res.json();
      setAudit(j);
      onConfig(ga4Input, siteInput);
      if (!open) setOpen(true);
    } finally { setLoading(false); }
  }, [client, ga4Input, siteInput, days, open, onConfig]);

  const alta = audit?.recomendaciones.filter(r => r.prioridad === 'alta').length ?? 0;

  const SUB_TABS: { id: SubTab; label: string; icon: React.ReactNode }[] = [
    { id: 'recs',      label: `Mejoras${audit ? ` (${audit.recomendaciones.length})` : ''}`, icon: <Zap size={10}/> },
    { id: 'campaigns', label: `Campañas${audit ? ` (${audit.campaigns.length})` : ''}`,     icon: <Target size={10}/> },
    { id: 'keywords',  label: `Keywords${audit ? ` (${audit.keywords.length})` : ''}`,      icon: <TrendingUp size={10}/> },
    { id: 'seo',       label: `SEO${audit ? ` (${audit.scKeywords.length})` : ''}`,         icon: <Search size={10}/> },
    { id: 'analytics', label: 'Analytics',                                                    icon: <BarChart2 size={10}/> },
  ];

  return (
    <div style={{ ...CARD, overflow: "hidden" }}>
      {/* Header */}
      <div style={{ padding: "14px 18px", display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
        <div style={{ width: 10, height: 10, borderRadius: "50%", background: client.color, flexShrink: 0 }}/>
        <div style={{ flex: 1, minWidth: "140px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--text)", margin: 0 }}>{client.name}</p>
            {alta > 0 && <span style={{ fontSize: "9px", padding: "2px 6px", borderRadius: "3px", background: "rgba(239,68,68,0.12)", color: "var(--red)", fontWeight: 700 }}>{alta} urgente{alta > 1 ? 's' : ''}</span>}
          </div>
          <p style={{ fontSize: "10px", color: "var(--text-muted)", margin: "2px 0 0" }}>Ads {client.adsId} · {siteInput}</p>
        </div>

        {/* Config */}
        {editConfig && (
          <div style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap" }}>
            <input value={siteInput} onChange={e => setSiteInput(e.target.value)} placeholder="https://sitio.com/" style={{ padding: "5px 8px", borderRadius: "4px", border: "1px solid var(--border)", background: "rgba(255,255,255,0.03)", color: "var(--text)", fontSize: "11px", width: "180px", outline: "none" }}/>
            <input value={ga4Input} onChange={e => setGa4Input(e.target.value)} placeholder="GA4 Property ID" style={{ padding: "5px 8px", borderRadius: "4px", border: "1px solid var(--border)", background: "rgba(255,255,255,0.03)", color: "var(--text)", fontSize: "11px", width: "130px", outline: "none" }}/>
          </div>
        )}

        <button onClick={() => setEditConfig(p => !p)} style={{ padding: "5px 8px", borderRadius: "4px", border: "1px solid var(--border)", background: editConfig ? "rgba(255,255,255,0.06)" : "transparent", color: "var(--text-muted)", fontSize: "10px", cursor: "pointer" }}>⚙</button>

        <div style={{ display: "flex", gap: "2px", background: "var(--border)", borderRadius: "4px", padding: "2px" }}>
          {[7, 30, 90].map(d => (
            <button key={d} onClick={() => setDays(d)} style={{ padding: "4px 7px", borderRadius: "3px", border: "none", cursor: "pointer", fontSize: "10px", fontWeight: days === d ? 700 : 400, background: days === d ? "var(--card)" : "transparent", color: days === d ? client.color : "var(--text-muted)" }}>{d}d</button>
          ))}
        </div>

        <button onClick={load} disabled={loading} style={{ padding: "7px 14px", borderRadius: "5px", border: "none", background: client.color, color: "#fff", fontSize: "11px", fontWeight: 700, cursor: loading ? "wait" : "pointer", display: "flex", alignItems: "center", gap: "5px", whiteSpace: "nowrap" }}>
          <RefreshCw size={10}/>{loading ? "Cargando..." : audit ? "Actualizar" : "Auditar"}
        </button>

        <button onClick={() => setOpen(p => !p)} style={{ padding: "6px 8px", borderRadius: "4px", border: "1px solid var(--border)", background: "transparent", color: "var(--text-muted)", cursor: "pointer", display: "flex" }}>
          {open ? <ChevronUp size={13}/> : <ChevronDown size={13}/>}
        </button>
      </div>

      {/* Detail */}
      {open && audit && (
        <div style={{ borderTop: "1px solid var(--border)" }}>
          {/* Sub-tabs */}
          <div style={{ display: "flex", borderBottom: "1px solid var(--border)", padding: "0 18px", overflowX: "auto" }}>
            {SUB_TABS.map(({ id, label, icon }) => (
              <button key={id} onClick={() => setSubTab(id)} style={{ padding: "9px 12px", border: "none", borderBottom: subTab === id ? `2px solid ${client.color}` : "2px solid transparent", background: "transparent", color: subTab === id ? client.color : "var(--text-muted)", fontSize: "11px", fontWeight: subTab === id ? 700 : 400, cursor: "pointer", marginBottom: "-1px", display: "flex", alignItems: "center", gap: "5px", whiteSpace: "nowrap" }}>
                {icon}{label}
              </button>
            ))}
            <div style={{ flex: 1 }}/>
            <a href={client.adsUrl} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: "4px", padding: "0 8px", fontSize: "10px", color: "var(--text-muted)", textDecoration: "none", flexShrink: 0 }}>
              Google Ads <ExternalLink size={9}/>
            </a>
          </div>

          {/* Errors */}
          {audit.errors.length > 0 && (
            <div style={{ margin: "12px 18px 0", padding: "8px 12px", background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "5px" }}>
              {audit.errors.map((e, i) => <p key={i} style={{ fontSize: "11px", color: "var(--red)", margin: "2px 0" }}>⚠ {e}</p>)}
            </div>
          )}

          <div style={{ padding: "18px" }}>
            {subTab === 'recs'      && <RecsTab recs={audit.recomendaciones}/>}
            {subTab === 'campaigns' && <CampaignsTab data={audit} color={client.color}/>}
            {subTab === 'keywords'  && <KeywordsTab data={audit} color={client.color}/>}
            {subTab === 'seo'       && <SeoTab data={audit}/>}
            {subTab === 'analytics' && <AnalyticsTab data={audit}/>}
          </div>
        </div>
      )}

      {open && !audit && !loading && (
        <div style={{ padding: "20px", borderTop: "1px solid var(--border)", textAlign: "center" }}>
          <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: 0 }}>Haz clic en "Auditar" para cargar datos de Ads + SEO + Analytics.</p>
        </div>
      )}
    </div>
  );
}

// ── Discover panel ─────────────────────────────────────────────────────────────

function DiscoverPanel({ data }: { data: DiscoverData | null }) {
  const [open, setOpen] = useState(false);
  if (!data) return null;

  return (
    <div style={{ ...CARD, marginBottom: "12px", overflow: "hidden" }}>
      <button onClick={() => setOpen(p => !p)} style={{ width: "100%", padding: "12px 16px", background: "transparent", border: "none", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", color: "var(--text-muted)", fontSize: "12px", textAlign: "left" }}>
        <span style={{ display: "flex", alignItems: "center", gap: "8px" }}><Globe size={12}/>Auto-descubrimiento Google — {data.ga4Properties.length} props GA4 · {data.scSites.length} sitios SC · {data.gtmAccounts.length} cuentas GTM</span>
        {open ? <ChevronUp size={12}/> : <ChevronDown size={12}/>}
      </button>

      {open && (
        <div style={{ borderTop: "1px solid var(--border)", padding: "14px 16px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
          <div>
            <p style={{ ...LABEL, marginBottom: "6px" }}>Propiedades GA4 accesibles</p>
            {data.ga4Properties.length === 0 ? <p style={{ fontSize: "11px", color: "var(--red)" }}>Sin acceso a GA4 Admin API</p>
              : data.ga4Properties.map((p, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px solid var(--border)", fontSize: "11px", gap: "8px" }}>
                  <span style={{ color: "var(--text-muted)" }}>{p.displayName}</span>
                  <span style={{ ...MONO, color: "var(--accent)", fontSize: "10px" }}>{p.id}</span>
                </div>
              ))
            }
          </div>

          <div>
            <p style={{ ...LABEL, marginBottom: "6px" }}>Sitios Search Console</p>
            {data.scSites.length === 0 ? <p style={{ fontSize: "11px", color: "var(--red)" }}>Sin sitios SC accesibles</p>
              : data.scSites.map((s, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px solid var(--border)", fontSize: "11px", gap: "8px" }}>
                  <span style={{ color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.url}</span>
                  <span style={{ fontSize: "9px", color: "var(--text-muted)" }}>{s.permission}</span>
                </div>
              ))
            }
          </div>

          <div>
            <p style={{ ...LABEL, marginBottom: "6px" }}>Automap detectado</p>
            {Object.entries(data.autoMap.ga4).map(([k, v]) => (
              <div key={k} style={{ padding: "4px 0", borderBottom: "1px solid var(--border)", fontSize: "11px" }}>
                <span style={{ color: "var(--text-muted)" }}>{k}: </span>
                <span style={{ ...MONO, color: "var(--accent)", fontSize: "10px" }}>{v.id}</span>
                <span style={{ fontSize: "10px", color: "var(--text-muted)" }}> ({v.displayName})</span>
              </div>
            ))}
            {Object.keys(data.autoMap.ga4).length === 0 && <p style={{ fontSize: "11px", color: "var(--amber)" }}>Sin match automático — introduce IDs manualmente en cada cliente.</p>}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function GooglePage() {
  const [configs, setConfigs] = useState<Record<string, { ga4: string; siteUrl: string }>>(() => {
    const s = loadStore();
    return {
      identity: { ga4: s['identity_ga4'] ?? '359963445', siteUrl: s['identity_site'] ?? 'https://identitypeluqueros.com/' },
      desancho: { ga4: s['desancho_ga4'] ?? '262734277', siteUrl: s['desancho_site'] ?? 'https://desancho.com/' },
      lastmile: { ga4: s['lastmile_ga4'] ?? '523165876', siteUrl: s['lastmile_site'] ?? 'https://lastmiledist.com/' },
    };
  });

  const [discover, setDiscover]     = useState<DiscoverData | null>(null);
  const [discoverLoading, setDL]    = useState(false);

  const loadDiscover = useCallback(async () => {
    setDL(true);
    try {
      const r = await fetch('/api/google/discover');
      const j = await r.json();
      setDiscover(j);
    } finally { setDL(false); }
  }, []);

  useEffect(() => { loadDiscover(); }, [loadDiscover]);

  function saveConfig(clientId: ClientId, ga4: string, siteUrl: string) {
    setConfigs(p => ({ ...p, [clientId]: { ga4, siteUrl } }));
    const s = loadStore();
    s[`${clientId}_ga4`]  = ga4;
    s[`${clientId}_site`] = siteUrl;
    localStorage.setItem(STORE, JSON.stringify(s));
  }

  return (
    <div style={{ padding: "28px 36px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "20px" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 600, color: "var(--text)", marginBottom: "3px" }}>Google Intelligence</h1>
          <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>Ads · Keywords · Search Console · GA4 · Recomendaciones — por cliente</p>
        </div>
        <button onClick={loadDiscover} disabled={discoverLoading} style={{ padding: "7px 12px", borderRadius: "5px", border: "1px solid var(--border)", background: "transparent", color: "var(--text-muted)", fontSize: "11px", cursor: "pointer", display: "flex", alignItems: "center", gap: "5px" }}>
          <RefreshCw size={10}/>{discoverLoading ? "Descubriendo..." : "Re-descubrir"}
        </button>
      </div>

      {/* Discover panel */}
      <DiscoverPanel data={discover}/>

      {/* Clients */}
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {CLIENTS.map(client => (
          <ClientPanel
            key={client.id}
            client={client}
            ga4Id={configs[client.id]?.ga4 ?? ''}
            siteUrl={configs[client.id]?.siteUrl ?? client.siteUrl}
            onConfig={(ga4, site) => saveConfig(client.id as ClientId, ga4, site)}
          />
        ))}
      </div>
    </div>
  );
}
