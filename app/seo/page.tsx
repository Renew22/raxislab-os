"use client";

import { useState } from "react";
import { Search, BarChart2, TrendingUp, AlertTriangle, RefreshCw } from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────────

interface KwEntry { keyword: string; clics: number; impresiones: number; ctr: string; posicion: string; }
interface PgEntry { url: string; clics: number; impresiones: number; posicion: string; }

interface GscData {
  periodo: string;
  totales: { clics: number; impresiones: number; ctr: string; posicion_media: string; };
  keywords_top3: KwEntry[];
  keywords_oportunidad: KwEntry[];
  keywords_ctr_bajo: KwEntry[];
  paginas_top: PgEntry[];
}

interface Ga4Channel { canal: string; sessions: number; users: number; }
interface Ga4Conv { evento: string; ocurrencias: number; conversiones: number; }
interface Ga4Page { url: string; sessions: number; conversiones: number; }
interface Ga4Data {
  periodo: string;
  totales: { sesiones: number; usuarios: number; paginas_vistas: number; tasa_rebote: string; duracion_media: string; fuente_principal: string; };
  canales: Ga4Channel[];
  conversiones: Ga4Conv[];
  paginas_sin_conversion: Ga4Page[];
}

// ── Static config ──────────────────────────────────────────────────────────────

const CLIENTS = [
  { id: 'desancho',  name: 'Desancho Estilistas',  siteUrl: 'https://desancho.com/',              ga4: '' },
  { id: 'identity',  name: 'Identity Peluqueros',   siteUrl: 'https://identitypeluqueros.com/',    ga4: '' },
  { id: 'lastmile',  name: 'Last Mile Distribution',siteUrl: 'https://lastmiledist.com/',          ga4: '' },
];

const STORAGE_KEY = 'raxislab_seo_ids_v1';

// ── Styles ─────────────────────────────────────────────────────────────────────

const CARD  = { background: "var(--card)", border: "1px solid var(--border)", borderRadius: "6px" } as React.CSSProperties;
const LABEL = { fontSize: "11px", fontWeight: 600 as const, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: "var(--text-muted)" };
const MONO  = { fontFamily: "'Space Mono', monospace" } as React.CSSProperties;
const INPUT = { width: "100%", padding: "8px 12px", borderRadius: "4px", border: "1px solid var(--border)", background: "rgba(255,255,255,0.03)", color: "var(--text)", fontSize: "12px", outline: "none", boxSizing: "border-box" as const };

const BADGE = (color: string) => ({
  display: "inline-block", padding: "2px 7px", borderRadius: "3px",
  fontSize: "10px", fontWeight: 600 as const,
  background: `rgba(${color},0.12)`, color: `rgb(${color})`,
});

// ── Keyword row ────────────────────────────────────────────────────────────────

function KwRow({ kw, accent }: { kw: KwEntry; accent: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid var(--border)", fontSize: "12px", gap: "8px" }}>
      <span style={{ color: "var(--text-mid)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{kw.keyword}</span>
      <div style={{ display: "flex", gap: "12px", flexShrink: 0 }}>
        <span style={{ ...MONO, color: accent, fontSize: "11px" }}>{kw.clics} clics</span>
        <span style={{ color: "var(--text-muted)", fontSize: "11px", width: "50px", textAlign: "right" }}>pos {kw.posicion}</span>
        <span style={{ color: "var(--text-muted)", fontSize: "11px", width: "38px", textAlign: "right" }}>CTR {kw.ctr}</span>
      </div>
    </div>
  );
}

// ── Client SEO Panel ───────────────────────────────────────────────────────────

function SeoPanel({ client, ga4Id, onGa4Change }: { client: typeof CLIENTS[0]; ga4Id: string; onGa4Change: (v: string) => void }) {
  const [gsc, setGsc]     = useState<GscData | null>(null);
  const [ga4, setGa4]     = useState<Ga4Data | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadAll() {
    setLoading(true); setError(null);
    try {
      const [gscRes, ga4Res] = await Promise.all([
        fetch('/api/google/search-console', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ siteUrl: client.siteUrl, days: 90 }) }),
        ga4Id ? fetch('/api/google/analytics', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ propertyId: ga4Id, days: 90 }) }) : Promise.resolve(null),
      ]);
      const gscJson = await gscRes.json();
      if (gscJson.error) { setError(`GSC: ${gscJson.error}`); return; }
      setGsc(gscJson);
      if (ga4Res) {
        const ga4Json = await ga4Res.json();
        if (!ga4Json.error) setGa4(ga4Json);
        else setError(`GA4: ${ga4Json.error}`);
      }
    } catch (e) { setError(String(e)); }
    finally { setLoading(false); }
  }

  // Cross-analysis: top3 keywords overlapping with paid search (annotation only)
  const crossOpportunities = gsc?.keywords_top3?.filter(kw =>
    kw.clics > 5 && parseFloat(kw.posicion) <= 3
  ) ?? [];

  return (
    <div style={{ ...CARD, padding: "20px", display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
        <div>
          <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--text)", margin: 0 }}>{client.name}</p>
          <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: "2px 0 0" }}>{client.siteUrl}</p>
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <input
            value={ga4Id} onChange={e => onGa4Change(e.target.value)}
            placeholder="GA4 Property ID (ej: 123456789)"
            style={{ ...INPUT, width: "200px" }}
          />
          <button onClick={loadAll} disabled={loading} style={{ padding: "8px 14px", borderRadius: "5px", border: "none", background: loading ? "var(--border)" : "var(--accent)", color: loading ? "var(--text-muted)" : "#000", fontSize: "12px", fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: "5px", whiteSpace: "nowrap" }}>
            <RefreshCw size={11}/>{loading ? 'Cargando...' : 'Analizar 90 días'}
          </button>
        </div>
      </div>

      {error && <p style={{ fontSize: "12px", color: "var(--red)", margin: 0 }}>{error}</p>}

      {gsc && (
        <>
          {/* Totales GSC */}
          <div>
            <p style={{ ...LABEL, marginBottom: "10px" }}>Search Console · {gsc.periodo}</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "8px" }}>
              {[
                ["Clics", gsc.totales.clics.toLocaleString("es-ES"), "#4285F4"],
                ["Impresiones", gsc.totales.impresiones.toLocaleString("es-ES"), "#4285F4"],
                ["CTR", gsc.totales.ctr, gsc.totales.ctr !== '—' && parseFloat(gsc.totales.ctr) < 2 ? "var(--red)" : "#4285F4"],
                ["Posición media", gsc.totales.posicion_media, parseFloat(gsc.totales.posicion_media) <= 5 ? "var(--green)" : "var(--amber)"],
              ].map(([l, v, c]) => (
                <div key={l as string} style={{ padding: "10px 12px", background: "rgba(66,133,244,0.05)", border: "1px solid rgba(66,133,244,0.15)", borderRadius: "5px" }}>
                  <p style={{ ...LABEL, fontSize: "10px", marginBottom: "4px" }}>{l}</p>
                  <p style={{ ...MONO, fontSize: "17px", fontWeight: 700, color: c as string, margin: 0 }}>{v}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Keywords Top 3 */}
          {gsc.keywords_top3.length > 0 && (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
                <TrendingUp size={13} color="var(--green)"/>
                <p style={{ ...LABEL, color: "var(--green)", margin: 0 }}>Posición 1–3 ({gsc.keywords_top3.length})</p>
              </div>
              {gsc.keywords_top3.slice(0, 10).map((kw, i) => <KwRow key={i} kw={kw} accent="var(--green)"/>)}
            </div>
          )}

          {/* Keywords Oportunidad */}
          {gsc.keywords_oportunidad.length > 0 && (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
                <Search size={13} color="var(--amber)"/>
                <p style={{ ...LABEL, color: "var(--amber)", margin: 0 }}>Oportunidad pos. 4–10 ({gsc.keywords_oportunidad.length})</p>
                <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>— Ligero push en contenido puede llevarlos al top 3</span>
              </div>
              {gsc.keywords_oportunidad.slice(0, 10).map((kw, i) => <KwRow key={i} kw={kw} accent="var(--amber)"/>)}
            </div>
          )}

          {/* Keywords CTR bajo */}
          {gsc.keywords_ctr_bajo.length > 0 && (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
                <AlertTriangle size={13} color="var(--red)"/>
                <p style={{ ...LABEL, color: "var(--red)", margin: 0 }}>CTR bajo con impresiones altas ({gsc.keywords_ctr_bajo.length})</p>
                <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>— Mejorar title/meta para aumentar CTR</span>
              </div>
              {gsc.keywords_ctr_bajo.slice(0, 8).map((kw, i) => <KwRow key={i} kw={kw} accent="var(--red)"/>)}
            </div>
          )}

          {/* Páginas top */}
          {gsc.paginas_top.length > 0 && (
            <div>
              <p style={{ ...LABEL, marginBottom: "8px" }}>Páginas con más tráfico orgánico</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                {gsc.paginas_top.slice(0, 8).map((pg, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid var(--border)", fontSize: "12px", gap: "8px" }}>
                    <span style={{ color: "var(--text-mid)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1, fontSize: "11px" }}>{pg.url.replace(/https?:\/\/[^/]+/, '')}</span>
                    <span style={{ ...MONO, color: "#4285F4", fontSize: "11px", flexShrink: 0 }}>{pg.clics} clics</span>
                    <span style={{ color: "var(--text-muted)", fontSize: "11px", width: "50px", textAlign: "right", flexShrink: 0 }}>pos {pg.posicion}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Cruce estratégico */}
          {crossOpportunities.length > 0 && (
            <div style={{ padding: "14px", background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.25)", borderRadius: "5px" }}>
              <p style={{ ...LABEL, color: "var(--amber)", marginBottom: "8px" }}>⚡ Cruce estratégico — SEO top 3 + posible solapamiento Ads</p>
              <p style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "10px" }}>Estas keywords ya posicionan orgánico en top 3. Si están activas como keyword pagada en Google Ads, son candidatas a pausar → ahorro en CPC.</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                {crossOpportunities.slice(0, 5).map((kw, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", padding: "4px 0" }}>
                    <span style={{ color: "var(--text-mid)" }}>{kw.keyword}</span>
                    <span style={{ ...BADGE("251,191,36") }}>pos {kw.posicion} orgánico</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {ga4 && (
        <>
          {/* GA4 totales */}
          <div>
            <p style={{ ...LABEL, marginBottom: "10px", color: "#4285F4" }}>Analytics GA4 · {ga4.periodo}</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "8px", marginBottom: "12px" }}>
              {[
                ["Sesiones", ga4.totales.sesiones.toLocaleString("es-ES")],
                ["Usuarios", ga4.totales.usuarios.toLocaleString("es-ES")],
                ["Páginas vistas", ga4.totales.paginas_vistas.toLocaleString("es-ES")],
                ["Tasa de rebote", ga4.totales.tasa_rebote],
                ["Duración media", ga4.totales.duracion_media],
                ["Canal principal", ga4.totales.fuente_principal],
              ].map(([l, v]) => (
                <div key={l as string} style={{ padding: "10px 12px", background: "rgba(66,133,244,0.05)", border: "1px solid rgba(66,133,244,0.15)", borderRadius: "5px" }}>
                  <p style={{ ...LABEL, fontSize: "10px", marginBottom: "4px" }}>{l}</p>
                  <p style={{ ...MONO, fontSize: "14px", fontWeight: 700, color: "#4285F4", margin: 0 }}>{v}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Conversiones */}
          {ga4.conversiones.length > 0 && (
            <div>
              <p style={{ ...LABEL, marginBottom: "8px", color: "var(--green)" }}>Conversiones por evento</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                {ga4.conversiones.map((c, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid var(--border)", fontSize: "12px" }}>
                    <span style={{ color: "var(--text-mid)" }}>{c.evento}</span>
                    <div style={{ display: "flex", gap: "12px" }}>
                      <span style={{ ...MONO, color: "var(--green)", fontSize: "11px" }}>{c.conversiones} conv.</span>
                      <span style={{ color: "var(--text-muted)", fontSize: "11px" }}>{c.ocurrencias} ocurr.</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {ga4.conversiones.length === 0 && (
            <div style={{ padding: "12px", background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "5px" }}>
              <p style={{ fontSize: "12px", color: "var(--red)", margin: 0 }}>⚠ Sin conversiones registradas en GA4. Verificar etiquetas en /tags.</p>
            </div>
          )}

          {/* Páginas sin conversión */}
          {ga4.paginas_sin_conversion.length > 0 && (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
                <AlertTriangle size={13} color="var(--amber)"/>
                <p style={{ ...LABEL, color: "var(--amber)", margin: 0 }}>Páginas con tráfico pero sin conversión (fricción)</p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                {ga4.paginas_sin_conversion.map((pg, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 0", borderBottom: "1px solid var(--border)", fontSize: "12px", gap: "8px" }}>
                    <span style={{ color: "var(--text-mid)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1, fontSize: "11px" }}>{pg.url}</span>
                    <span style={{ ...MONO, color: "var(--amber)", fontSize: "11px", flexShrink: 0 }}>{pg.sessions} ses</span>
                    <span style={{ ...BADGE("251,191,36") }}>0 conv.</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function SeoPage() {
  const [ga4Ids, setGa4Ids] = useState<Record<string, string>>(() => {
    if (typeof window === 'undefined') return {};
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}'); } catch { return {}; }
  });

  function handleGa4Change(clientId: string, v: string) {
    setGa4Ids(prev => {
      const next = { ...prev, [clientId]: v };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }

  return (
    <div style={{ padding: "32px 40px" }}>
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: 600, color: "var(--text)", marginBottom: "4px" }}>SEO · Auditoría estratégica</h1>
        <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>Search Console + GA4 · 90 días · Análisis por cliente</p>
      </div>

      <div style={{ marginBottom: "20px", padding: "12px 16px", background: "rgba(66,133,244,0.05)", border: "1px solid rgba(66,133,244,0.2)", borderRadius: "6px" }}>
        <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: 0, lineHeight: 1.6 }}>
          <strong style={{ color: "var(--text)" }}>Cómo usar:</strong> Introduce el ID de propiedad GA4 (solo números) para cada cliente y haz clic en "Analizar 90 días". Search Console se carga automáticamente. El cruce estratégico detecta keywords top-3 candidatas a ahorrar presupuesto en Google Ads.
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {CLIENTS.map(c => (
          <SeoPanel
            key={c.id}
            client={c}
            ga4Id={ga4Ids[c.id] ?? ''}
            onGa4Change={v => handleGa4Change(c.id, v)}
          />
        ))}
      </div>
    </div>
  );
}
