"use client";

import { useState, useEffect } from "react";
import { RefreshCw, ExternalLink, Search, BarChart2, MapPin, Send } from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────────

interface GscData {
  clics: number; impresiones: number; ctr: string; posicionMedia: string;
  keywords: { query: string; clics: number; impresiones: number; posicion: string }[];
}
interface Ga4Data {
  sesiones: number; usuarios: number; paginas_vistas: number;
  tasa_rebote: string; duracion_media: string; fuente_principal: string;
  canales: { name: string; sessions: number; users: number }[];
}
interface GbpLocation { name: string; title: string; phone: string; website: string }
interface GbpData { locations: GbpLocation[] }

interface ClientConfig {
  id: string; name: string; sector: string;
  googleSiteUrl: string;
  ga4PropertyId: string;
}

// ── Static clients ─────────────────────────────────────────────────────────────

const CLIENTS: ClientConfig[] = [
  { id: 'identity-peluqueros',    name: 'Identity Peluqueros',    sector: 'Peluquería', googleSiteUrl: '', ga4PropertyId: '' },
  { id: 'desancho-estilistas',    name: 'Desancho Estilistas',    sector: 'Peluquería', googleSiteUrl: '', ga4PropertyId: '' },
  { id: 'malvarrosa-cf',          name: 'Malvarrosa CF',          sector: 'Deporte',    googleSiteUrl: '', ga4PropertyId: '' },
  { id: 'matias-benegas-tattoo',  name: 'Matías Benegas Tattoo',  sector: 'Tattoo',     googleSiteUrl: '', ga4PropertyId: '' },
];

const STORAGE_KEY = 'raxislab_google_ids_v1';

// ── Styles ─────────────────────────────────────────────────────────────────────

const CARD  = { background: "var(--card)", border: "1px solid var(--border)", borderRadius: "6px" } as React.CSSProperties;
const LABEL = { fontSize: "11px", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: "var(--text-muted)" };
const MONO  = { fontFamily: "'Space Mono', monospace" } as React.CSSProperties;
const INPUT = { width: "100%", padding: "8px 12px", borderRadius: "4px", border: "1px solid var(--border)", background: "rgba(255,255,255,0.03)", color: "var(--text)", fontSize: "12px", outline: "none", boxSizing: "border-box" } as React.CSSProperties;

// ── GBP Post Modal ─────────────────────────────────────────────────────────────

function GbpPostModal({ location, onClose }: { location: GbpLocation; onClose: () => void }) {
  const [text, setText]     = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult]  = useState<string | null>(null);

  async function publicar() {
    setSending(true);
    try {
      const res = await fetch('/api/google/business-profile', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locationName: location.name, summary: text }),
      });
      const json = await res.json();
      setResult(json.success ? '✅ Post publicado en Google Business' : `Error: ${json.error}`);
    } finally { setSending(false); }
  }

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 100 }}/>
      <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: "480px", zIndex: 101, background: "var(--card)", border: "1px solid var(--border)", borderRadius: "8px", padding: "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px" }}>
          <div>
            <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--text)", margin: 0 }}>Nuevo post GBP</p>
            <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: "2px 0 0" }}>{location.title}</p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "18px" }}>×</button>
        </div>
        <textarea
          value={text} onChange={e => setText(e.target.value)} rows={5}
          placeholder="Escribe el texto del post de Google Business..."
          style={{ ...INPUT, resize: "vertical", fontFamily: "inherit", lineHeight: 1.5 }}
        />
        {result && <p style={{ fontSize: "12px", color: result.startsWith('✅') ? "var(--green)" : "var(--red)", marginTop: "8px" }}>{result}</p>}
        <div style={{ display: "flex", gap: "8px", marginTop: "16px" }}>
          <button onClick={onClose} style={{ flex: 1, padding: "10px", borderRadius: "6px", border: "1px solid var(--border)", background: "transparent", color: "var(--text-muted)", fontSize: "13px", cursor: "pointer" }}>Cancelar</button>
          <button onClick={publicar} disabled={!text.trim() || sending} style={{ flex: 2, padding: "10px", borderRadius: "6px", border: "none", background: text.trim() ? "var(--accent)" : "var(--border)", color: text.trim() ? "#000" : "var(--text-muted)", fontSize: "13px", fontWeight: 600, cursor: text.trim() ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
            <Send size={13}/>{sending ? 'Publicando...' : 'Publicar en GBP'}
          </button>
        </div>
      </div>
    </>
  );
}

// ── Client Google Panel ────────────────────────────────────────────────────────

function ClientPanel({ client, ids, onIdsChange }: {
  client: ClientConfig;
  ids: { googleSiteUrl: string; ga4PropertyId: string };
  onIdsChange: (id: string, field: string, value: string) => void;
}) {
  const [gsc, setGsc]             = useState<GscData | null>(null);
  const [gscLoading, setGscLoading] = useState(false);
  const [gscError, setGscError]   = useState<string | null>(null);

  const [ga4, setGa4]             = useState<Ga4Data | null>(null);
  const [ga4Loading, setGa4Loading] = useState(false);
  const [ga4Error, setGa4Error]   = useState<string | null>(null);

  const [gbp, setGbp]             = useState<GbpData | null>(null);
  const [gbpLoading, setGbpLoading] = useState(false);
  const [gbpError, setGbpError]   = useState<string | null>(null);
  const [gbpPostLoc, setGbpPostLoc] = useState<GbpLocation | null>(null);

  const [days, setDays] = useState(28);

  async function loadGsc() {
    const siteUrl = ids.googleSiteUrl;
    if (!siteUrl) return;
    setGscLoading(true); setGscError(null);
    try {
      const res = await fetch('/api/google/search-console', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteUrl, days }),
      });
      const json = await res.json();
      if (json.error) { setGscError(json.error); return; }
      setGsc(json);
    } catch (e) { setGscError(String(e)); } finally { setGscLoading(false); }
  }

  async function loadGa4() {
    const propertyId = ids.ga4PropertyId;
    if (!propertyId) return;
    setGa4Loading(true); setGa4Error(null);
    try {
      const res = await fetch('/api/google/analytics', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propertyId, days }),
      });
      const json = await res.json();
      if (json.error) { setGa4Error(json.error); return; }
      setGa4(json);
    } catch (e) { setGa4Error(String(e)); } finally { setGa4Loading(false); }
  }

  async function loadGbp() {
    setGbpLoading(true); setGbpError(null);
    try {
      const res = await fetch('/api/google/business-profile');
      const json = await res.json();
      if (json.error) { setGbpError(json.error); return; }
      setGbp(json);
    } catch (e) { setGbpError(String(e)); } finally { setGbpLoading(false); }
  }

  const siteUrl     = ids.googleSiteUrl;
  const propertyId  = ids.ga4PropertyId;

  return (
    <div style={{ ...CARD, padding: "20px", display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--text)", margin: 0 }}>{client.name}</p>
          <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: "2px 0 0" }}>{client.sector}</p>
        </div>
        <div style={{ display: "flex", gap: "4px", background: "var(--border)", borderRadius: "5px", padding: "2px" }}>
          {[7, 14, 28, 90].map(d => (
            <button key={d} onClick={() => setDays(d)} style={{ padding: "3px 8px", borderRadius: "3px", border: "none", cursor: "pointer", fontSize: "11px", fontWeight: days === d ? 600 : 400, background: days === d ? "var(--card)" : "transparent", color: days === d ? "var(--accent)" : "var(--text-muted)" }}>{d}d</button>
          ))}
        </div>
      </div>

      {/* IDs config */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
        <div>
          <p style={{ ...LABEL, marginBottom: "5px" }}>URL Search Console</p>
          <input value={siteUrl} onChange={e => onIdsChange(client.id, 'googleSiteUrl', e.target.value)} placeholder="https://raxislab.com/ o sc-domain:..." style={INPUT}/>
        </div>
        <div>
          <p style={{ ...LABEL, marginBottom: "5px" }}>ID Propiedad GA4</p>
          <input value={propertyId} onChange={e => onIdsChange(client.id, 'ga4PropertyId', e.target.value)} placeholder="123456789" style={INPUT}/>
        </div>
      </div>

      {/* Action buttons */}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        <button onClick={loadGsc} disabled={!siteUrl || gscLoading} style={{ padding: "7px 12px", borderRadius: "5px", border: "1px solid rgba(66,133,244,0.3)", background: "rgba(66,133,244,0.06)", color: !siteUrl ? "var(--text-muted)" : "#4285F4", fontSize: "12px", cursor: !siteUrl ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: "5px" }}>
          <Search size={12}/>{gscLoading ? 'Cargando...' : 'Search Console'}
        </button>
        <button onClick={loadGa4} disabled={!propertyId || ga4Loading} style={{ padding: "7px 12px", borderRadius: "5px", border: "1px solid rgba(66,133,244,0.3)", background: "rgba(66,133,244,0.06)", color: !propertyId ? "var(--text-muted)" : "#4285F4", fontSize: "12px", cursor: !propertyId ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: "5px" }}>
          <BarChart2 size={12}/>{ga4Loading ? 'Cargando...' : 'Analytics GA4'}
        </button>
        <button onClick={loadGbp} disabled={gbpLoading} style={{ padding: "7px 12px", borderRadius: "5px", border: "1px solid rgba(52,211,153,0.3)", background: "rgba(52,211,153,0.06)", color: "var(--green)", fontSize: "12px", cursor: "pointer", display: "flex", alignItems: "center", gap: "5px" }}>
          <MapPin size={12}/>{gbpLoading ? 'Cargando...' : 'Business Profile'}
        </button>
      </div>

      {/* ── GSC results ── */}
      {gscError && <p style={{ fontSize: "12px", color: "var(--red)" }}>GSC: {gscError}</p>}
      {gsc && (
        <div>
          <p style={{ ...LABEL, marginBottom: "10px", color: "#4285F4" }}>Search Console · {days} días</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "8px", marginBottom: "12px" }}>
            {[["Clics", gsc.clics.toLocaleString("es-ES")], ["Impresiones", gsc.impresiones.toLocaleString("es-ES")], ["CTR", gsc.ctr], ["Posición media", gsc.posicionMedia]].map(([l, v]) => (
              <div key={l} style={{ padding: "10px 12px", background: "rgba(66,133,244,0.05)", border: "1px solid rgba(66,133,244,0.15)", borderRadius: "5px" }}>
                <p style={{ ...LABEL, fontSize: "10px", marginBottom: "4px" }}>{l}</p>
                <p style={{ ...MONO, fontSize: "18px", fontWeight: 700, color: "#4285F4" }}>{v}</p>
              </div>
            ))}
          </div>
          {gsc.keywords.length > 0 && (
            <div>
              <p style={{ ...LABEL, marginBottom: "8px", fontSize: "10px" }}>Top keywords</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                {gsc.keywords.slice(0, 8).map((kw, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid var(--border)", fontSize: "12px" }}>
                    <span style={{ color: "var(--text-mid)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "240px" }}>{kw.query}</span>
                    <div style={{ display: "flex", gap: "12px", flexShrink: 0 }}>
                      <span style={{ ...MONO, color: "#4285F4", fontSize: "11px" }}>{kw.clics} clics</span>
                      <span style={{ color: "var(--text-muted)", fontSize: "11px" }}>pos {kw.posicion}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── GA4 results ── */}
      {ga4Error && <p style={{ fontSize: "12px", color: "var(--red)" }}>GA4: {ga4Error}</p>}
      {ga4 && (
        <div>
          <p style={{ ...LABEL, marginBottom: "10px", color: "#4285F4" }}>Analytics GA4 · {days} días</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "8px", marginBottom: "12px" }}>
            {[
              ["Sesiones", ga4.sesiones.toLocaleString("es-ES")],
              ["Usuarios", ga4.usuarios.toLocaleString("es-ES")],
              ["Páginas vistas", ga4.paginas_vistas.toLocaleString("es-ES")],
              ["Tasa de rebote", ga4.tasa_rebote],
              ["Duración media", ga4.duracion_media],
              ["Canal principal", ga4.fuente_principal],
            ].map(([l, v]) => (
              <div key={l} style={{ padding: "10px 12px", background: "rgba(66,133,244,0.05)", border: "1px solid rgba(66,133,244,0.15)", borderRadius: "5px" }}>
                <p style={{ ...LABEL, fontSize: "10px", marginBottom: "4px" }}>{l}</p>
                <p style={{ ...MONO, fontSize: "15px", fontWeight: 700, color: "#4285F4" }}>{v}</p>
              </div>
            ))}
          </div>
          {ga4.canales.length > 0 && (
            <div>
              <p style={{ ...LABEL, marginBottom: "8px", fontSize: "10px" }}>Canales de tráfico</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                {ga4.canales.slice(0, 5).map((c, i) => {
                  const pct = ga4.sesiones > 0 ? Math.round(c.sessions / ga4.sesiones * 100) : 0;
                  return (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "5px 0", fontSize: "12px" }}>
                      <span style={{ color: "var(--text-mid)", width: "140px", flexShrink: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name}</span>
                      <div style={{ flex: 1, height: "4px", background: "var(--border)", borderRadius: "2px" }}>
                        <div style={{ width: `${pct}%`, height: "100%", background: "#4285F4", borderRadius: "2px" }}/>
                      </div>
                      <span style={{ ...MONO, fontSize: "11px", color: "#4285F4", width: "40px", textAlign: "right" }}>{pct}%</span>
                      <span style={{ color: "var(--text-muted)", fontSize: "11px", width: "60px", textAlign: "right" }}>{c.sessions.toLocaleString("es-ES")} ses</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── GBP results ── */}
      {gbpError && <p style={{ fontSize: "12px", color: "var(--red)" }}>GBP: {gbpError}</p>}
      {gbp && gbp.locations.length > 0 && (
        <div>
          <p style={{ ...LABEL, marginBottom: "10px", color: "var(--green)" }}>Google Business · Fichas</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {gbp.locations.map(loc => (
              <div key={loc.name} style={{ padding: "12px 14px", background: "rgba(52,211,153,0.04)", border: "1px solid rgba(52,211,153,0.15)", borderRadius: "5px", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px" }}>
                <div>
                  <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)", margin: "0 0 4px" }}>{loc.title}</p>
                  <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: 0 }}>{loc.phone !== '—' ? loc.phone : ''}{loc.website !== '—' ? ` · ${loc.website}` : ''}</p>
                </div>
                <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
                  {loc.website !== '—' && (
                    <a href={loc.website} target="_blank" rel="noopener noreferrer" style={{ padding: "5px 8px", borderRadius: "4px", border: "1px solid var(--border)", background: "var(--card)", color: "var(--text-muted)", textDecoration: "none", display: "flex", alignItems: "center" }}>
                      <ExternalLink size={11}/>
                    </a>
                  )}
                  <button onClick={() => setGbpPostLoc(loc)} style={{ padding: "5px 10px", borderRadius: "4px", border: "1px solid rgba(52,211,153,0.3)", background: "rgba(52,211,153,0.06)", color: "var(--green)", fontSize: "11px", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
                    <Send size={10}/> Post
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {gbp && gbp.locations.length === 0 && (
        <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>Sin fichas GBP en esta cuenta Google.</p>
      )}

      {/* Modal GBP post */}
      {gbpPostLoc && <GbpPostModal location={gbpPostLoc} onClose={() => setGbpPostLoc(null)}/>}
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function GooglePage() {
  const [ids, setIds] = useState<Record<string, { googleSiteUrl: string; ga4PropertyId: string }>>(() => {
    if (typeof window === 'undefined') return {};
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}'); } catch { return {}; }
  });
  const [googleConnected, setGoogleConnected] = useState<boolean | null>(null);

  useEffect(() => {
    fetch('/api/google/search-console', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ siteUrl: 'https://raxislab.com/', days: 1 }),
    }).then(r => r.json()).then(d => {
      setGoogleConnected(!d._notConnected);
    }).catch(() => setGoogleConnected(false));
  }, []);

  function handleIdsChange(clientId: string, field: string, value: string) {
    setIds(prev => {
      const next = { ...prev, [clientId]: { ...prev[clientId], [field]: value } };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }

  function getIds(clientId: string) {
    return ids[clientId] ?? { googleSiteUrl: '', ga4PropertyId: '' };
  }

  return (
    <div style={{ padding: "32px 40px" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: 600, color: "var(--text)", marginBottom: "4px" }}>Google · Vista unificada</h1>
          <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>Search Console · Analytics GA4 · Business Profile</p>
        </div>
        <a href="/api/auth/google" style={{ padding: "8px 14px", borderRadius: "6px", border: "1px solid rgba(66,133,244,0.3)", background: "rgba(66,133,244,0.06)", color: "#4285F4", fontSize: "12px", fontWeight: 600, textDecoration: "none", display: "flex", alignItems: "center", gap: "6px" }}>
          <RefreshCw size={12}/> Reconectar Google
        </a>
      </div>

      {/* Google connection status */}
      {googleConnected === false && (
        <div style={{ marginBottom: "24px", padding: "14px 16px", borderRadius: "6px", background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.25)" }}>
          <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--red)", margin: "0 0 4px" }}>Google no conectado</p>
          <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: "0 0 10px" }}>
            Falta <code style={{ color: "var(--accent)" }}>GOOGLE_REFRESH_TOKEN</code> en Vercel, o el token no tiene permisos.
          </p>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <a href="/api/auth/google" style={{ padding: "7px 14px", borderRadius: "5px", border: "none", background: "#4285F4", color: "#fff", fontSize: "12px", fontWeight: 600, textDecoration: "none" }}>
              Autorizar Google →
            </a>
            <div style={{ padding: "7px 14px", borderRadius: "5px", border: "1px solid var(--border)", background: "var(--card)", fontSize: "12px", color: "var(--text-muted)" }}>
              Scopes necesarios: Search Console, Analytics, Business Profile
            </div>
          </div>
        </div>
      )}
      {googleConnected === true && (
        <div style={{ marginBottom: "24px", padding: "10px 14px", borderRadius: "6px", background: "rgba(52,211,153,0.05)", border: "1px solid rgba(52,211,153,0.2)", display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ color: "var(--green)", fontSize: "12px" }}>✓</span>
          <p style={{ fontSize: "12px", color: "var(--green)", margin: 0, fontWeight: 600 }}>Google conectado · OAuth activo</p>
        </div>
      )}

      {/* Google Ads — pendiente de aprobación de acceso estándar */}
      <div style={{ marginBottom: "24px", padding: "16px 20px", borderRadius: "6px", background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.3)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
          <span style={{ fontSize: "14px" }}>⏳</span>
          <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--amber)", margin: 0 }}>Google Ads — Pendiente de aprobación de acceso estándar</p>
        </div>
        <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: "0 0 10px", lineHeight: 1.6 }}>
          El Developer Token del proyecto (cuenta Manager 717-986-5639) está en <strong style={{ color: "var(--amber)" }}>modo cuenta de prueba</strong> — solo puede acceder a cuentas de test, no a cuentas de producción reales.<br/>
          <strong style={{ color: "var(--text)" }}>GSC, GA4 y GBP funcionan correctamente</strong>. Solo Google Ads está pendiente.
        </p>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <div style={{ padding: "6px 12px", borderRadius: "4px", background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.25)", fontSize: "11px", color: "var(--amber)", fontWeight: 600 }}>
            Acción pendiente (solo René): Google Ads → Centro de la API → "Solicita el acceso estándar"
          </div>
          <div style={{ padding: "6px 12px", borderRadius: "4px", background: "var(--surface)", border: "1px solid var(--border)", fontSize: "11px", color: "var(--text-muted)" }}>
            Google revisa manualmente — puede tardar varios días
          </div>
        </div>
      </div>

      {/* Panels por cliente */}
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {CLIENTS.map(client => (
          <ClientPanel
            key={client.id}
            client={client}
            ids={getIds(client.id)}
            onIdsChange={handleIdsChange}
          />
        ))}
      </div>
    </div>
  );
}
