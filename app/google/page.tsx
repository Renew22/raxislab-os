"use client";

import { useState, useCallback, useEffect } from "react";
import { RefreshCw, Tag, AlertTriangle, CheckCircle, XCircle, ChevronDown, ChevronUp, ExternalLink, Zap } from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────────

interface Campaign {
  id: string; name: string; status: string; tipo: string;
  gasto: number; clics: number; impresiones: number; ctr: number; cpc: number;
  conversiones: number; cpl: number | null; roas: number | null;
}
interface AdsData {
  periodo: string;
  totales: { gasto: number; clics: number; impresiones: number; conversiones: number; ctr: number; cpc: number; cpl: number | null };
  campanas: Campaign[];
  error?: string;
}

interface KwEntry { keyword: string; clics: number; impresiones: number; ctr: string; posicion: string; }
interface GscData {
  periodo: string;
  totales: { clics: number; impresiones: number; ctr: string; posicion_media: string; };
  keywords_top3: KwEntry[];
  keywords_oportunidad: KwEntry[];
  keywords_ctr_bajo: KwEntry[];
  paginas_top: { url: string; clics: number; impresiones: number; posicion: string; }[];
  error?: string;
}

interface Ga4Conv { evento: string; ocurrencias: number; conversiones: number; }
interface Ga4Page { url: string; sessions: number; conversiones: number; }
interface Ga4Data {
  periodo: string;
  totales: { sesiones: number; usuarios: number; paginas_vistas: number; tasa_rebote: string; duracion_media: string; fuente_principal: string; };
  canales: { canal: string; sessions: number; users: number; }[];
  conversiones: Ga4Conv[];
  paginas_sin_conversion: Ga4Page[];
  error?: string;
}

interface GtmTag { name: string; type: string; paused: boolean; }
interface GtmContainer {
  container: string; publicId: string; clientKey: string | null;
  live_version: string; total_tags: number;
  conversion_tags: GtmTag[];
  error?: string;
}
interface GtmData { containers: GtmContainer[]; error?: string; }

interface ClientData {
  ads: AdsData | null;
  gsc: GscData | null;
  ga4: Ga4Data | null;
  gtm: GtmData | null;
  loading: boolean;
  loaded: boolean;
}

// ── Client config ──────────────────────────────────────────────────────────────

const CLIENTS = [
  {
    id: 'identity',
    name: 'Identity Peluqueros',
    sector: 'Peluquería · Valencia',
    color: '#8B5CF6',
    siteUrl: 'https://identitypeluqueros.com/',
    adsId: '2979427201',
    gtmId: '',
    ga4Key: 'identity_ga4',
    adsUrl: 'https://ads.google.com/aw/campaigns?__e=2979427201',
  },
  {
    id: 'desancho',
    name: 'Desancho Estilistas',
    color: '#F59E0B',
    sector: 'Peluquería · Valencia',
    siteUrl: 'https://desancho.com/',
    adsId: '7395427320',
    gtmId: 'GTM-W3VKZM6',
    ga4Key: 'desancho_ga4',
    adsUrl: 'https://ads.google.com/aw/campaigns?__e=7395427320',
  },
  {
    id: 'lastmile',
    name: 'Last Mile Distribution',
    color: '#10B981',
    sector: 'Distribución · España/Paraguay',
    siteUrl: 'https://lastmiledist.com/',
    adsId: '9497091021',
    gtmId: 'GTM-TWJL8NHF',
    ga4Key: 'lastmile_ga4',
    adsUrl: 'https://ads.google.com/aw/campaigns?__e=9497091021',
  },
] as const;

type ClientId = typeof CLIENTS[number]['id'];

const GA4_STORAGE = 'raxislab_ga4ids_v2';

// ── Styles ─────────────────────────────────────────────────────────────────────

const CARD  = { background: "var(--card)", border: "1px solid var(--border)", borderRadius: "8px" } as React.CSSProperties;
const LABEL = { fontSize: "10px", fontWeight: 600 as const, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: "var(--text-muted)" };
const MONO  = { fontFamily: "'Space Mono', monospace" } as React.CSSProperties;

function Stat({ label, value, sub, color = "var(--text)" }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div style={{ padding: "12px 14px", background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)", borderRadius: "6px" }}>
      <p style={{ ...LABEL, marginBottom: "4px" }}>{label}</p>
      <p style={{ ...MONO, fontSize: "18px", fontWeight: 700, color, margin: 0 }}>{value}</p>
      {sub && <p style={{ fontSize: "10px", color: "var(--text-muted)", margin: "3px 0 0" }}>{sub}</p>}
    </div>
  );
}

function StatusDot({ ok }: { ok: boolean | null }) {
  if (ok === null) return <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--border)", display: "inline-block" }}/>;
  return ok
    ? <CheckCircle size={12} color="var(--green)"/>
    : <XCircle size={12} color="var(--red)"/>;
}

function TagBadge({ status }: { status: 'ok' | 'warn' | 'error' }) {
  const map = { ok: ["var(--green)", "OK"], warn: ["var(--amber)", "WARN"], error: ["var(--red)", "ERROR"] };
  const [c, l] = map[status];
  return <span style={{ fontSize: "9px", padding: "2px 6px", borderRadius: "3px", background: `${c}18`, color: c, fontWeight: 700 }}>{l}</span>;
}

function analyzeTag(tag: GtmTag, publicId: string): 'ok' | 'warn' | 'error' {
  if (tag.paused) return 'warn';
  if (tag.type === 'html' && tag.name.toLowerCase().includes('descarga')) return 'error';
  if (publicId === 'GTM-W3VKZM6' && (tag.name.toLowerCase().includes('teléfono') || tag.name.toLowerCase().includes('reserva'))) return 'warn';
  return 'ok';
}

// ── Ads section ────────────────────────────────────────────────────────────────

function AdsSection({ data, clientColor }: { data: AdsData | null; clientColor: string }) {
  if (!data) return null;
  if (data.error) return (
    <div style={{ padding: "14px 16px", background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "6px" }}>
      <p style={{ fontSize: "12px", color: "var(--red)", margin: 0 }}>Google Ads: {data.error}</p>
    </div>
  );

  const t = data.totales;
  const activeC = data.campanas.filter(c => c.status === 'ENABLED');
  const pausedC = data.campanas.filter(c => c.status !== 'ENABLED');

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
      <p style={{ ...LABEL, color: clientColor, margin: 0 }}>Google Ads · {data.periodo}</p>

      {/* Totals */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: "8px" }}>
        <Stat label="Inversión" value={`${t.gasto.toFixed(0)}€`} color={clientColor}/>
        <Stat label="Clics" value={t.clics.toLocaleString("es")} color="var(--text)"/>
        <Stat label="Impresiones" value={t.impresiones.toLocaleString("es")} color="var(--text)"/>
        <Stat label="CTR" value={`${t.ctr}%`} color={t.ctr > 5 ? "var(--green)" : t.ctr > 2 ? "var(--amber)" : "var(--red)"}/>
        <Stat label="CPC medio" value={`${t.cpc.toFixed(2)}€`} color="var(--text)"/>
        <Stat label="Conversiones" value={t.conversiones > 0 ? t.conversiones.toFixed(0) : "—"} sub={t.cpl ? `${t.cpl.toFixed(2)}€/conv` : undefined} color={t.conversiones > 0 ? "var(--green)" : "var(--text-muted)"}/>
      </div>

      {/* Campaigns table */}
      {data.campanas.length > 0 && (
        <div style={{ ...CARD, overflow: "hidden" }}>
          <div style={{ padding: "10px 14px", borderBottom: "1px solid var(--border)", display: "flex", gap: "12px", alignItems: "center" }}>
            <p style={{ fontSize: "12px", fontWeight: 600, color: "var(--text)", margin: 0 }}>Campañas ({activeC.length} activas · {pausedC.length} pausadas)</p>
            {pausedC.length > 0 && <span style={{ fontSize: "10px", color: "var(--amber)", padding: "2px 7px", background: "rgba(251,191,36,0.1)", borderRadius: "3px", fontWeight: 600 }}>⚠ {pausedC.length} pausadas</span>}
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px" }}>
            <thead>
              <tr style={{ background: "rgba(255,255,255,0.02)" }}>
                {["Campaña","Estado","Gasto","Clics","CTR","CPC","Conv.","CPL","ROAS"].map(h => (
                  <th key={h} style={{ padding: "8px 10px", textAlign: "left", ...LABEL, borderBottom: "1px solid var(--border)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.campanas.map((c, i) => (
                <tr key={c.id ?? i} style={{ borderBottom: "1px solid var(--border)", opacity: c.status !== 'ENABLED' ? 0.5 : 1 }}>
                  <td style={{ padding: "9px 10px", color: "var(--text)", fontWeight: 500, maxWidth: "180px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name}</td>
                  <td style={{ padding: "9px 10px" }}>
                    <span style={{ fontSize: "9px", padding: "2px 6px", borderRadius: "3px", fontWeight: 700, background: c.status === 'ENABLED' ? "rgba(52,211,153,0.12)" : "rgba(251,191,36,0.12)", color: c.status === 'ENABLED' ? "var(--green)" : "var(--amber)" }}>
                      {c.status === 'ENABLED' ? 'ACTIVA' : 'PAUSA'}
                    </span>
                  </td>
                  <td style={{ padding: "9px 10px", ...MONO, color: clientColor, fontWeight: 700 }}>{c.gasto.toFixed(0)}€</td>
                  <td style={{ padding: "9px 10px", ...MONO }}>{c.clics.toLocaleString("es")}</td>
                  <td style={{ padding: "9px 10px", ...MONO, color: c.ctr > 5 ? "var(--green)" : c.ctr > 2 ? "var(--amber)" : "var(--red)" }}>{c.ctr}%</td>
                  <td style={{ padding: "9px 10px", ...MONO }}>{c.cpc.toFixed(2)}€</td>
                  <td style={{ padding: "9px 10px", ...MONO, color: c.conversiones > 0 ? "var(--green)" : "var(--text-muted)" }}>{c.conversiones > 0 ? c.conversiones.toFixed(1) : "—"}</td>
                  <td style={{ padding: "9px 10px", ...MONO, color: "var(--text-muted)" }}>{c.cpl ? `${c.cpl.toFixed(0)}€` : "—"}</td>
                  <td style={{ padding: "9px 10px", ...MONO, color: c.roas && c.roas > 1 ? "var(--green)" : "var(--text-muted)" }}>{c.roas ? `${c.roas.toFixed(1)}x` : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data.campanas.length === 0 && (
        <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>Sin campañas con datos en este período.</p>
      )}
    </div>
  );
}

// ── GSC section ────────────────────────────────────────────────────────────────

function GscSection({ data }: { data: GscData | null }) {
  if (!data) return null;
  if (data.error) return <p style={{ fontSize: "12px", color: "var(--red)" }}>Search Console: {data.error}</p>;

  const t = data.totales;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
      <p style={{ ...LABEL, color: "#4285F4", margin: 0 }}>Search Console · {data.periodo}</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "8px" }}>
        <Stat label="Clics org." value={t.clics.toLocaleString("es")} color="#4285F4"/>
        <Stat label="Impresiones" value={t.impresiones.toLocaleString("es")} color="var(--text)"/>
        <Stat label="CTR" value={t.ctr} color={parseFloat(t.ctr) > 3 ? "var(--green)" : "var(--amber)"}/>
        <Stat label="Posición media" value={t.posicion_media} color={parseFloat(t.posicion_media) <= 5 ? "var(--green)" : parseFloat(t.posicion_media) <= 15 ? "var(--amber)" : "var(--red)"}/>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
        {/* Top3 */}
        {data.keywords_top3.length > 0 && (
          <div>
            <p style={{ ...LABEL, color: "var(--green)", marginBottom: "6px" }}>Top 3 ({data.keywords_top3.length})</p>
            {data.keywords_top3.slice(0, 8).map((kw, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid var(--border)", fontSize: "11px", gap: "6px" }}>
                <span style={{ color: "var(--text-mid)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{kw.keyword}</span>
                <span style={{ ...MONO, color: "var(--green)", flexShrink: 0, fontSize: "10px" }}>p{kw.posicion}</span>
              </div>
            ))}
          </div>
        )}

        {/* Oportunidad */}
        {data.keywords_oportunidad.length > 0 && (
          <div>
            <p style={{ ...LABEL, color: "var(--amber)", marginBottom: "6px" }}>Oportunidad pos.4-10 ({data.keywords_oportunidad.length})</p>
            {data.keywords_oportunidad.slice(0, 8).map((kw, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid var(--border)", fontSize: "11px", gap: "6px" }}>
                <span style={{ color: "var(--text-mid)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{kw.keyword}</span>
                <span style={{ ...MONO, color: "var(--amber)", flexShrink: 0, fontSize: "10px" }}>p{kw.posicion}</span>
              </div>
            ))}
          </div>
        )}

        {/* CTR bajo */}
        {data.keywords_ctr_bajo.length > 0 && (
          <div>
            <p style={{ ...LABEL, color: "var(--red)", marginBottom: "6px" }}>CTR bajo + impr. altas ({data.keywords_ctr_bajo.length})</p>
            {data.keywords_ctr_bajo.slice(0, 8).map((kw, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid var(--border)", fontSize: "11px", gap: "6px" }}>
                <span style={{ color: "var(--text-mid)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{kw.keyword}</span>
                <span style={{ ...MONO, color: "var(--red)", flexShrink: 0, fontSize: "10px" }}>{kw.ctr}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pages */}
      {data.paginas_top.length > 0 && (
        <div>
          <p style={{ ...LABEL, marginBottom: "6px" }}>Páginas con más tráfico orgánico</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
            {data.paginas_top.slice(0, 6).map((pg, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 8px", background: "rgba(255,255,255,0.02)", borderRadius: "4px", border: "1px solid var(--border)", fontSize: "11px", gap: "8px" }}>
                <span style={{ color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{pg.url.replace(/https?:\/\/[^/]+/, '') || '/'}</span>
                <span style={{ ...MONO, color: "#4285F4", flexShrink: 0 }}>{pg.clics} clics</span>
                <span style={{ color: "var(--text-muted)", flexShrink: 0 }}>pos {pg.posicion}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── GA4 section ────────────────────────────────────────────────────────────────

function Ga4Section({ data }: { data: Ga4Data | null }) {
  if (!data) return null;
  if (data.error) return <p style={{ fontSize: "12px", color: "var(--red)" }}>Analytics GA4: {data.error}</p>;

  const t = data.totales;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
      <p style={{ ...LABEL, color: "#4285F4", margin: 0 }}>Analytics GA4 · {data.periodo}</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: "8px" }}>
        <Stat label="Sesiones" value={t.sesiones.toLocaleString("es")} color="#4285F4"/>
        <Stat label="Usuarios" value={t.usuarios.toLocaleString("es")} color="var(--text)"/>
        <Stat label="Páginas vistas" value={t.paginas_vistas.toLocaleString("es")} color="var(--text)"/>
        <Stat label="Rebote" value={t.tasa_rebote} color={parseFloat(t.tasa_rebote) < 50 ? "var(--green)" : parseFloat(t.tasa_rebote) < 70 ? "var(--amber)" : "var(--red)"}/>
        <Stat label="Duración" value={t.duracion_media} color="var(--text)"/>
        <Stat label="Canal top" value={t.fuente_principal} color="#4285F4"/>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
        {/* Channels */}
        <div>
          <p style={{ ...LABEL, marginBottom: "6px" }}>Canales</p>
          {data.canales.slice(0, 6).map((c, i) => {
            const pct = t.sesiones > 0 ? Math.round(c.sessions / t.sesiones * 100) : 0;
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "4px 0", fontSize: "11px", borderBottom: "1px solid var(--border)" }}>
                <span style={{ color: "var(--text-muted)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.canal}</span>
                <div style={{ width: "50px", height: "3px", background: "var(--border)", borderRadius: "2px", flexShrink: 0 }}>
                  <div style={{ width: `${pct}%`, height: "100%", background: "#4285F4", borderRadius: "2px" }}/>
                </div>
                <span style={{ ...MONO, color: "#4285F4", fontSize: "10px", width: "28px", textAlign: "right", flexShrink: 0 }}>{pct}%</span>
              </div>
            );
          })}
        </div>

        {/* Conversiones */}
        <div>
          <p style={{ ...LABEL, color: "var(--green)", marginBottom: "6px" }}>
            Conversiones ({data.conversiones.length > 0 ? data.conversiones.length + " eventos" : "sin datos"})
          </p>
          {data.conversiones.length === 0 ? (
            <div style={{ padding: "10px", background: "rgba(239,68,68,0.05)", borderRadius: "5px", border: "1px solid rgba(239,68,68,0.2)" }}>
              <p style={{ fontSize: "11px", color: "var(--red)", margin: 0 }}>⚠ Sin conversiones en GA4. Verificar Tags.</p>
            </div>
          ) : (
            data.conversiones.map((c, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid var(--border)", fontSize: "11px", gap: "6px" }}>
                <span style={{ color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{c.evento}</span>
                <span style={{ ...MONO, color: "var(--green)", flexShrink: 0 }}>{c.conversiones}</span>
              </div>
            ))
          )}
        </div>

        {/* Friction pages */}
        <div>
          <p style={{ ...LABEL, color: "var(--amber)", marginBottom: "6px" }}>
            Fricción — tráfico sin conv. ({data.paginas_sin_conversion.length})
          </p>
          {data.paginas_sin_conversion.length === 0 ? (
            <p style={{ fontSize: "11px", color: "var(--green)" }}>✓ Sin páginas problemáticas detectadas</p>
          ) : (
            data.paginas_sin_conversion.slice(0, 6).map((pg, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid var(--border)", fontSize: "11px", gap: "6px" }}>
                <span style={{ color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{pg.url}</span>
                <span style={{ ...MONO, color: "var(--amber)", flexShrink: 0 }}>{pg.sessions}s</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ── GTM section ────────────────────────────────────────────────────────────────

function GtmSection({ data, clientId }: { data: GtmData | null; clientId: string }) {
  if (!data) return null;
  if (data.error) return <p style={{ fontSize: "12px", color: "var(--red)" }}>GTM: {data.error}</p>;

  const myContainers = data.containers.filter(c => c.clientKey === clientId);
  if (myContainers.length === 0) return (
    <div style={{ padding: "12px 14px", background: "rgba(255,255,255,0.02)", border: "1px solid var(--border)", borderRadius: "6px" }}>
      <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: 0 }}>Sin contenedor GTM conocido para este cliente. Si tiene GTM, añadir el ID en la configuración del route.</p>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      <p style={{ ...LABEL, color: "var(--text-muted)", margin: 0 }}>Google Tag Manager</p>
      {myContainers.map((cont, ci) => {
        const convTags = cont.conversion_tags ?? [];
        const errors   = convTags.filter(t => analyzeTag(t, cont.publicId) === 'error');
        const warns    = convTags.filter(t => analyzeTag(t, cont.publicId) === 'warn');
        return (
          <div key={ci} style={{ padding: "12px 14px", background: "rgba(255,255,255,0.02)", border: "1px solid var(--border)", borderRadius: "6px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Tag size={12} color="var(--text-muted)"/>
                <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text)" }}>{cont.publicId}</span>
                <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>versión #{cont.live_version} · {cont.total_tags} tags</span>
              </div>
              <div style={{ display: "flex", gap: "5px", alignItems: "center" }}>
                {errors.length > 0 && <TagBadge status="error"/>}
                {warns.length > 0 && warns.length > 0 && !errors.length && <TagBadge status="warn"/>}
                {errors.length === 0 && warns.length === 0 && convTags.length > 0 && <TagBadge status="ok"/>}
                <a href={`https://tagmanager.google.com/`} target="_blank" rel="noopener noreferrer" style={{ color: "var(--text-muted)", display: "flex" }}><ExternalLink size={10}/></a>
              </div>
            </div>
            {convTags.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                {convTags.map((tag, ti) => {
                  const status = analyzeTag(tag, cont.publicId);
                  const col = status === 'error' ? "var(--red)" : status === 'warn' ? "var(--amber)" : "var(--green)";
                  return (
                    <div key={ti} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 8px", background: `rgba(${status==='error'?'239,68,68':status==='warn'?'251,191,36':'52,211,153'},0.05)`, borderRadius: "4px", fontSize: "11px" }}>
                      <span style={{ color: "var(--text-mid)" }}>{tag.name}</span>
                      <div style={{ display: "flex", gap: "5px", alignItems: "center" }}>
                        <span style={{ fontSize: "9px", color: "var(--text-muted)" }}>{tag.type}</span>
                        <TagBadge status={status}/>
                        {tag.paused && <span style={{ fontSize: "9px", color: col, fontWeight: 700 }}>PAUSADO</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {convTags.length === 0 && (
              <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: 0 }}>Sin tags de conversión detectadas (revisar nombres)</p>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Cross analysis ─────────────────────────────────────────────────────────────

function CrossAnalysis({ ads, gsc, ga4 }: { ads: AdsData | null; gsc: GscData | null; ga4: Ga4Data | null }) {
  if (!ads || !gsc) return null;

  const adsKeywords = new Set(ads.campanas.filter(c => c.status === 'ENABLED').map(c => c.name.toLowerCase()));
  const overlapping = gsc.keywords_top3.filter(kw => {
    const kwLow = kw.keyword.toLowerCase();
    return Array.from(adsKeywords).some(ak => ak.includes(kwLow) || kwLow.includes(ak.split(' ')[0]));
  });

  const noConvPages = ga4?.paginas_sin_conversion ?? [];
  const highTrafficNoConv = noConvPages.filter(p => p.sessions > 20);

  if (overlapping.length === 0 && highTrafficNoConv.length === 0) return null;

  return (
    <div style={{ padding: "14px 16px", background: "rgba(200,245,66,0.04)", border: "1px solid rgba(200,245,66,0.2)", borderRadius: "6px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
        <Zap size={13} color="var(--accent)"/>
        <p style={{ fontSize: "12px", fontWeight: 700, color: "var(--accent)", margin: 0 }}>Cruce estratégico — oportunidades de optimización</p>
      </div>
      {overlapping.length > 0 && (
        <div style={{ marginBottom: "8px" }}>
          <p style={{ fontSize: "11px", fontWeight: 600, color: "var(--text)", margin: "0 0 4px" }}>Keywords top-3 orgánico con posible solapamiento de pago → candidatas a pausar en Ads:</p>
          {overlapping.map((kw, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", padding: "3px 0", color: "var(--text-muted)" }}>
              <span>{kw.keyword}</span>
              <span style={{ color: "var(--amber)" }}>pos {kw.posicion} orgánico · {kw.clics} clics gratis</span>
            </div>
          ))}
        </div>
      )}
      {highTrafficNoConv.length > 0 && (
        <div>
          <p style={{ fontSize: "11px", fontWeight: 600, color: "var(--text)", margin: "0 0 4px" }}>Páginas con tráfico pero sin conversión → optimizar CTA o landing:</p>
          {highTrafficNoConv.slice(0, 4).map((pg, i) => (
            <div key={i} style={{ fontSize: "11px", padding: "3px 0", color: "var(--text-muted)" }}>
              {pg.url} — <span style={{ color: "var(--amber)" }}>{pg.sessions} sesiones, 0 conversiones</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Client Panel ───────────────────────────────────────────────────────────────

type SubTab = 'ads' | 'seo' | 'analytics' | 'tags' | 'cruce';

function ClientPanel({
  client, ga4Id, onGa4Change, gtmData,
}: {
  client: typeof CLIENTS[number];
  ga4Id: string;
  onGa4Change: (v: string) => void;
  gtmData: GtmData | null;
}) {
  const [open, setOpen]       = useState(false);
  const [subTab, setSubTab]   = useState<SubTab>('ads');
  const [data, setData]       = useState<ClientData>({ ads: null, gsc: null, ga4: null, gtm: null, loading: false, loaded: false });
  const [days, setDays]       = useState(30);
  const [ga4Input, setGa4Input] = useState(ga4Id);

  const load = useCallback(async () => {
    setData(p => ({ ...p, loading: true }));
    const [adsRes, gscRes, ga4Res] = await Promise.allSettled([
      fetch('/api/google/campaigns', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ customerId: client.adsId, days }) }),
      fetch('/api/google/search-console', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ siteUrl: client.siteUrl, days: 90 }) }),
      ga4Input ? fetch('/api/google/analytics', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ propertyId: ga4Input, days: 90 }) }) : Promise.resolve(null),
    ]);

    const ads = adsRes.status === 'fulfilled' && adsRes.value ? await adsRes.value.json().catch(() => null) : null;
    const gsc = gscRes.status === 'fulfilled' && gscRes.value ? await gscRes.value.json().catch(() => null) : null;
    const ga4 = ga4Res.status === 'fulfilled' && ga4Res.value ? await (ga4Res.value as Response).json().catch(() => null) : null;

    setData({ ads, gsc, ga4, gtm: gtmData, loading: false, loaded: true });
    if (!open) setOpen(true);
  }, [client, days, ga4Input, gtmData, open]);

  // Health status for header
  const adsOk  = data.ads && !data.ads.error;
  const gscOk  = data.gsc && !data.gsc.error;
  const ga4Ok  = data.ga4 && !data.ga4.error;
  const convOk = data.ga4 && !data.ga4.error && data.ga4.conversiones.length > 0;

  const SUB_TABS: { id: SubTab; label: string }[] = [
    { id: 'ads',       label: `Ads ${adsOk ? '✓' : ''}` },
    { id: 'seo',       label: `SEO ${gscOk ? '✓' : ''}` },
    { id: 'analytics', label: `Analytics ${ga4Ok ? '✓' : ''}` },
    { id: 'tags',      label: 'Tags GTM' },
    { id: 'cruce',     label: '⚡ Cruce' },
  ];

  return (
    <div style={{ ...CARD, overflow: "hidden" }}>
      {/* Header */}
      <div style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap" }}>
        <div style={{ width: 10, height: 10, borderRadius: "50%", background: client.color, flexShrink: 0 }}/>
        <div style={{ flex: 1, minWidth: "160px" }}>
          <p style={{ fontSize: "14px", fontWeight: 700, color: "var(--text)", margin: 0 }}>{client.name}</p>
          <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: "2px 0 0" }}>{client.sector}</p>
        </div>

        {/* GA4 ID input */}
        <input
          value={ga4Input}
          onChange={e => { setGa4Input(e.target.value); onGa4Change(e.target.value); }}
          placeholder="GA4 Property ID"
          style={{ padding: "6px 10px", borderRadius: "4px", border: "1px solid var(--border)", background: "rgba(255,255,255,0.03)", color: "var(--text)", fontSize: "11px", width: "150px", outline: "none" }}
        />

        {/* Days selector */}
        <div style={{ display: "flex", gap: "2px", background: "var(--border)", borderRadius: "4px", padding: "2px" }}>
          {[7, 30, 90].map(d => (
            <button key={d} onClick={() => setDays(d)} style={{ padding: "4px 8px", borderRadius: "3px", border: "none", cursor: "pointer", fontSize: "10px", fontWeight: days === d ? 700 : 400, background: days === d ? "var(--card)" : "transparent", color: days === d ? "var(--accent)" : "var(--text-muted)" }}>{d}d</button>
          ))}
        </div>

        {/* Status dots */}
        {data.loaded && (
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2px" }}><StatusDot ok={adsOk ?? null}/><span style={{ fontSize: "8px", color: "var(--text-muted)" }}>Ads</span></div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2px" }}><StatusDot ok={gscOk ?? null}/><span style={{ fontSize: "8px", color: "var(--text-muted)" }}>SEO</span></div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2px" }}><StatusDot ok={ga4Ok ?? null}/><span style={{ fontSize: "8px", color: "var(--text-muted)" }}>GA4</span></div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2px" }}><StatusDot ok={convOk ?? null}/><span style={{ fontSize: "8px", color: "var(--text-muted)" }}>Conv</span></div>
          </div>
        )}

        <button onClick={load} disabled={data.loading} style={{ padding: "7px 14px", borderRadius: "5px", border: "none", background: client.color, color: "#fff", fontSize: "11px", fontWeight: 700, cursor: data.loading ? "wait" : "pointer", display: "flex", alignItems: "center", gap: "5px", whiteSpace: "nowrap" }}>
          <RefreshCw size={10}/>{data.loading ? "Cargando..." : data.loaded ? "Actualizar" : "Cargar todo"}
        </button>

        <button onClick={() => setOpen(p => !p)} style={{ padding: "6px 8px", borderRadius: "4px", border: "1px solid var(--border)", background: "transparent", color: "var(--text-muted)", cursor: "pointer", display: "flex", alignItems: "center" }}>
          {open ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
        </button>
      </div>

      {/* Detail panel */}
      {open && data.loaded && (
        <div style={{ borderTop: "1px solid var(--border)" }}>
          {/* Sub-tabs */}
          <div style={{ display: "flex", borderBottom: "1px solid var(--border)", padding: "0 20px" }}>
            {SUB_TABS.map(({ id, label }) => (
              <button key={id} onClick={() => setSubTab(id)} style={{ padding: "10px 14px", border: "none", borderBottom: subTab === id ? `2px solid ${client.color}` : "2px solid transparent", background: "transparent", color: subTab === id ? client.color : "var(--text-muted)", fontSize: "11px", fontWeight: subTab === id ? 700 : 400, cursor: "pointer", marginBottom: "-1px" }}>
                {label}
              </button>
            ))}

            <div style={{ flex: 1 }}/>
            <a href={client.adsUrl} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: "4px", padding: "0 8px", fontSize: "10px", color: "var(--text-muted)", textDecoration: "none" }}>
              Google Ads <ExternalLink size={9}/>
            </a>
          </div>

          {/* Tab content */}
          <div style={{ padding: "20px 20px" }}>
            {subTab === 'ads'       && <AdsSection data={data.ads} clientColor={client.color}/>}
            {subTab === 'seo'       && <GscSection data={data.gsc}/>}
            {subTab === 'analytics' && <Ga4Section data={data.ga4}/>}
            {subTab === 'tags'      && <GtmSection data={data.gtm} clientId={client.id}/>}
            {subTab === 'cruce'     && <CrossAnalysis ads={data.ads} gsc={data.gsc} ga4={data.ga4}/>}
          </div>
        </div>
      )}

      {open && !data.loaded && (
        <div style={{ padding: "20px", borderTop: "1px solid var(--border)", textAlign: "center" }}>
          <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: 0 }}>Haz clic en "Cargar todo" para obtener los datos de este cliente.</p>
        </div>
      )}
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function GooglePage() {
  const [ga4Ids, setGa4Ids] = useState<Record<string, string>>(() => {
    if (typeof window === 'undefined') return {};
    try { return JSON.parse(localStorage.getItem(GA4_STORAGE) ?? '{}'); } catch { return {}; }
  });
  const [gtmData, setGtmData]     = useState<GtmData | null>(null);
  const [gtmLoading, setGtmLoading] = useState(false);
  const [hasDeveloperToken, setHasDeveloperToken] = useState<boolean | null>(null);

  const loadGtm = useCallback(async () => {
    setGtmLoading(true);
    try {
      const res = await fetch('/api/google/gtm');
      const json = await res.json();
      setGtmData(json);
    } catch {}
    finally { setGtmLoading(false); }
  }, []);

  // Check if developer token is set by probing the verify-account endpoint
  const checkToken = useCallback(async () => {
    const res = await fetch('/api/google/verify-account', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customerId: '2979427201' }),
    });
    const j = await res.json();
    setHasDeveloperToken(!j.error?.includes('GOOGLE_ADS_DEVELOPER_TOKEN'));
  }, []);

  useEffect(() => { checkToken(); loadGtm(); }, [checkToken, loadGtm]);

  function setGa4Id(clientId: string, v: string) {
    setGa4Ids(prev => {
      const next = { ...prev, [clientId]: v };
      localStorage.setItem(GA4_STORAGE, JSON.stringify(next));
      return next;
    });
  }

  return (
    <div style={{ padding: "32px 40px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "20px" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: 600, color: "var(--text)", marginBottom: "4px" }}>Google Intelligence</h1>
          <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>Ads · Search Console · Analytics GA4 · Tag Manager · Cruce estratégico</p>
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <button onClick={loadGtm} disabled={gtmLoading} style={{ padding: "7px 12px", borderRadius: "5px", border: "1px solid var(--border)", background: "transparent", color: "var(--text-muted)", fontSize: "11px", cursor: "pointer", display: "flex", alignItems: "center", gap: "5px" }}>
            <Tag size={11}/>{gtmLoading ? "..." : "GTM refresh"}
          </button>
        </div>
      </div>

      {/* Developer token warning */}
      {hasDeveloperToken === false && (
        <div style={{ marginBottom: "16px", padding: "12px 16px", background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.3)", borderRadius: "6px", display: "flex", alignItems: "flex-start", gap: "10px" }}>
          <AlertTriangle size={14} color="var(--amber)" style={{ flexShrink: 0, marginTop: "1px" }}/>
          <div>
            <p style={{ fontSize: "12px", fontWeight: 600, color: "var(--amber)", margin: "0 0 3px" }}>Google Ads sin datos — falta GOOGLE_ADS_DEVELOPER_TOKEN en Vercel</p>
            <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: 0 }}>Ve a Vercel → Settings → Env vars → añade <code style={{ color: "var(--accent)" }}>GOOGLE_ADS_DEVELOPER_TOKEN</code>. El valor está en Google Ads → Admin → API center → MCC 717-986-5639. Search Console y GA4 funcionan sin él.</p>
          </div>
        </div>
      )}

      {hasDeveloperToken === true && (
        <div style={{ marginBottom: "16px", padding: "10px 14px", background: "rgba(52,211,153,0.05)", border: "1px solid rgba(52,211,153,0.2)", borderRadius: "6px", display: "flex", alignItems: "center", gap: "8px" }}>
          <CheckCircle size={12} color="var(--green)"/>
          <p style={{ fontSize: "12px", color: "var(--green)", margin: 0, fontWeight: 600 }}>Google Ads API activa · Service Account · Basic Access · MCC 717-986-5639</p>
        </div>
      )}

      {/* GA4 IDs info */}
      <div style={{ marginBottom: "16px", padding: "10px 14px", background: "rgba(66,133,244,0.04)", border: "1px solid rgba(66,133,244,0.15)", borderRadius: "6px" }}>
        <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: 0 }}>
          <strong style={{ color: "var(--text)" }}>GA4 Property IDs:</strong> Introduce el ID numérico de cada propiedad (GA4 → Admin → Información propiedad → ID). Se guarda localmente. Sin él, Analytics no carga.
        </p>
      </div>

      {/* Client panels */}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {CLIENTS.map(client => (
          <ClientPanel
            key={client.id}
            client={client}
            ga4Id={ga4Ids[client.id] ?? ''}
            onGa4Change={v => setGa4Id(client.id, v)}
            gtmData={gtmData}
          />
        ))}
      </div>
    </div>
  );
}
