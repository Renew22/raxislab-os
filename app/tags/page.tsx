"use client";

import { useState } from "react";
import { RefreshCw, CheckCircle, XCircle, AlertTriangle, Tag, ExternalLink } from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────────

interface ConvTag { name: string; type: string; paused: boolean; }
interface GtmContainer {
  account: string; accountId: string;
  container: string; containerId: string;
  publicId: string; clientKey: string | null;
  live_version: string;
  total_tags: number; total_triggers: number;
  workspaces: string[];
  conversion_tags: ConvTag[];
  all_tags: ConvTag[];
  error?: string;
}
interface GtmData { containers: GtmContainer[]; known: Record<string, string>; }

// ── Styles ─────────────────────────────────────────────────────────────────────

const CARD  = { background: "var(--card)", border: "1px solid var(--border)", borderRadius: "6px" } as React.CSSProperties;
const LABEL = { fontSize: "11px", fontWeight: 600 as const, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: "var(--text-muted)" };
const MONO  = { fontFamily: "'Space Mono', monospace" } as React.CSSProperties;

// Tag types that are conversion tracking
const CONVERSION_TYPES: Record<string, string> = {
  awct:    'Google Ads Conversion',
  ga4:     'GA4 Event',
  html:    'HTML personalizado',
  img:     'Pixel/Image',
  fls:     'Floodlight',
};

function tagTypeLabel(type: string) {
  return CONVERSION_TYPES[type] ?? type;
}

// Health check heuristics for known problematic patterns
function analyzeTag(tag: ConvTag, containerPublicId: string): { status: 'ok' | 'warn' | 'error'; reason: string } {
  if (tag.paused) return { status: 'warn', reason: 'Tag pausado' };
  if (tag.type === 'html' && tag.name.toLowerCase().includes('descarga'))
    return { status: 'error', reason: 'Conversión "Descarga" con tag HTML — probable configuración errónea (debería ser tipo awct)' };
  if (tag.type !== 'awct' && (tag.name.toLowerCase().includes('lead') || tag.name.toLowerCase().includes('conver') || tag.name.toLowerCase().includes('reserva')))
    return { status: 'warn', reason: `Tipo ${tagTypeLabel(tag.type)} — verificar si es el tipo correcto para conversiones de Google Ads` };
  if (containerPublicId === 'GTM-W3VKZM6' && (tag.name.toLowerCase().includes('teléfono') || tag.name.toLowerCase().includes('contacto') || tag.name.toLowerCase().includes('reserva')))
    return { status: 'warn', reason: 'Conversión "Requiere atención" en Desancho — revisar configuración en Google Ads' };
  return { status: 'ok', reason: 'Configuración válida' };
}

const STATUS_COLOR = { ok: 'var(--green)', warn: 'var(--amber)', error: 'var(--red)' };
const STATUS_ICON = {
  ok:   <CheckCircle size={13} color="var(--green)"/>,
  warn: <AlertTriangle size={13} color="var(--amber)"/>,
  error: <XCircle size={13} color="var(--red)"/>,
};

// ── Client label mapping ───────────────────────────────────────────────────────

const CLIENT_NAMES: Record<string, string> = {
  desancho: 'Desancho Estilistas',
  lastmile: 'Last Mile Distribution',
  identity: 'Identity Peluqueros',
};

// ── Tags Page ──────────────────────────────────────────────────────────────────

export default function TagsPage() {
  const [data, setData]       = useState<GtmData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  async function load() {
    setLoading(true); setError(null);
    try {
      const res = await fetch('/api/google/gtm', { cache: 'no-store' });
      const json = await res.json();
      if (json.error) { setError(json.error); return; }
      setData(json);
    } catch (e) { setError(String(e)); }
    finally { setLoading(false); }
  }

  // Global conversion health summary
  const allConvTags = data?.containers.flatMap(c =>
    (c.conversion_tags ?? []).map(t => ({ ...t, publicId: c.publicId }))
  ) ?? [];
  const errors   = allConvTags.filter(t => analyzeTag(t, t.publicId).status === 'error');
  const warnings = allConvTags.filter(t => analyzeTag(t, t.publicId).status === 'warn');

  return (
    <div style={{ padding: "32px 40px" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: 600, color: "var(--text)", marginBottom: "4px" }}>Tags · Estado de conversiones</h1>
          <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>Google Tag Manager · Auditoría por contenedor</p>
        </div>
        <button onClick={load} disabled={loading} style={{ padding: "9px 16px", borderRadius: "6px", border: "none", background: loading ? "var(--border)" : "var(--accent)", color: loading ? "var(--text-muted)" : "#000", fontSize: "12px", fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: "6px" }}>
          <RefreshCw size={12}/>{loading ? 'Auditando...' : 'Auditar GTM'}
        </button>
      </div>

      {error && (
        <div style={{ marginBottom: "16px", padding: "12px 16px", background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: "6px" }}>
          <p style={{ fontSize: "12px", color: "var(--red)", margin: 0 }}>{error}</p>
        </div>
      )}

      {/* Summary bar */}
      {data && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "10px", marginBottom: "20px" }}>
          {[
            ["Contenedores", data.containers.length, "var(--text)"],
            ["Tags conversión", allConvTags.length, "#4285F4"],
            ["Errores críticos", errors.length, errors.length > 0 ? "var(--red)" : "var(--green)"],
            ["Advertencias", warnings.length, warnings.length > 0 ? "var(--amber)" : "var(--green)"],
          ].map(([l, v, c]) => (
            <div key={l as string} style={{ ...CARD, padding: "14px 16px" }}>
              <p style={{ ...LABEL, fontSize: "10px", marginBottom: "4px" }}>{l}</p>
              <p style={{ ...MONO, fontSize: "22px", fontWeight: 700, color: c as string, margin: 0 }}>{v}</p>
            </div>
          ))}
        </div>
      )}

      {/* Alert on errors */}
      {errors.length > 0 && (
        <div style={{ marginBottom: "16px", padding: "14px 16px", background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "6px" }}>
          <p style={{ fontSize: "12px", fontWeight: 600, color: "var(--red)", marginBottom: "8px" }}>⚠ {errors.length} errores críticos detectados</p>
          {errors.map((t, i) => (
            <p key={i} style={{ fontSize: "11px", color: "var(--text-muted)", margin: "2px 0" }}>
              <strong style={{ color: "var(--text)" }}>{t.name}</strong> — {analyzeTag(t, t.publicId).reason}
            </p>
          ))}
          <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "8px" }}>
            Para corregir: abrir GTM → crear nuevo área de trabajo → modificar el tag → publicar. No tocar la versión live directamente.
          </p>
        </div>
      )}

      {/* Containers */}
      {data && data.containers.length === 0 && (
        <div style={{ ...CARD, padding: "24px", textAlign: "center" }}>
          <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>No se encontraron contenedores GTM accesibles con esta cuenta de servicio.</p>
          <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "6px" }}>Verificar que la Service Account tiene acceso de lectura en Google Tag Manager.</p>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {(data?.containers ?? []).map(container => {
          const clientName = container.clientKey ? (CLIENT_NAMES[container.clientKey] ?? container.clientKey) : container.container;
          const hasError  = container.error;
          const convTags  = container.conversion_tags ?? [];
          const isOpen    = expanded[container.containerId ?? container.publicId];

          if (hasError) {
            return (
              <div key={container.publicId} style={{ ...CARD, padding: "16px 20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <XCircle size={14} color="var(--red)"/>
                  <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)", margin: 0 }}>{container.publicId}</p>
                  <p style={{ fontSize: "11px", color: "var(--red)", margin: 0 }}>{hasError}</p>
                </div>
              </div>
            );
          }

          return (
            <div key={container.containerId} style={{ ...CARD, overflow: "hidden" }}>
              {/* Container header */}
              <div
                onClick={() => setExpanded(p => ({ ...p, [container.containerId]: !isOpen }))}
                style={{ padding: "16px 20px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <Tag size={14} color="var(--accent)"/>
                  <div>
                    <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)", margin: 0 }}>{clientName}</p>
                    <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: "2px 0 0" }}>{container.publicId} · versión live #{container.live_version} · {container.total_tags} tags · {container.total_triggers} triggers</p>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  {convTags.some(t => analyzeTag(t, container.publicId).status === 'error') && <XCircle size={14} color="var(--red)"/>}
                  {convTags.some(t => analyzeTag(t, container.publicId).status === 'warn') && !convTags.some(t => analyzeTag(t, container.publicId).status === 'error') && <AlertTriangle size={14} color="var(--amber)"/>}
                  {convTags.length > 0 && convTags.every(t => analyzeTag(t, container.publicId).status === 'ok') && <CheckCircle size={14} color="var(--green)"/>}
                  <a
                    href={`https://tagmanager.google.com/#/container/${container.containerId}/workspaces`}
                    target="_blank" rel="noopener noreferrer"
                    onClick={e => e.stopPropagation()}
                    style={{ color: "var(--text-muted)", display: "flex" }}
                  >
                    <ExternalLink size={11}/>
                  </a>
                  <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>{isOpen ? '▲' : '▼'}</span>
                </div>
              </div>

              {isOpen && (
                <div style={{ borderTop: "1px solid var(--border)", padding: "16px 20px", display: "flex", flexDirection: "column", gap: "16px" }}>
                  {/* Conversion tags */}
                  {convTags.length === 0 ? (
                    <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>Sin tags de conversión detectadas. Puede que los nombres no coincidan con los patrones de búsqueda.</p>
                  ) : (
                    <div>
                      <p style={{ ...LABEL, marginBottom: "10px" }}>Tags de conversión ({convTags.length})</p>
                      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        {convTags.map((tag, i) => {
                          const health = analyzeTag(tag, container.publicId);
                          return (
                            <div key={i} style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px", padding: "10px 12px", background: `rgba(${health.status === 'error' ? '239,68,68' : health.status === 'warn' ? '251,191,36' : '52,211,153'},0.05)`, border: `1px solid rgba(${health.status === 'error' ? '239,68,68' : health.status === 'warn' ? '251,191,36' : '52,211,153'},0.2)`, borderRadius: "5px" }}>
                              <div style={{ display: "flex", alignItems: "flex-start", gap: "8px", flex: 1 }}>
                                {STATUS_ICON[health.status]}
                                <div>
                                  <p style={{ fontSize: "12px", fontWeight: 600, color: "var(--text)", margin: 0 }}>{tag.name}</p>
                                  <p style={{ fontSize: "11px", color: STATUS_COLOR[health.status], margin: "2px 0 0" }}>{health.reason}</p>
                                </div>
                              </div>
                              <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
                                <span style={{ fontSize: "10px", padding: "2px 6px", borderRadius: "3px", background: "var(--surface)", color: "var(--text-muted)", border: "1px solid var(--border)" }}>{tagTypeLabel(tag.type)}</span>
                                {tag.paused && <span style={{ fontSize: "10px", padding: "2px 6px", borderRadius: "3px", background: "rgba(251,191,36,0.1)", color: "var(--amber)", border: "1px solid rgba(251,191,36,0.3)" }}>PAUSADO</span>}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* All tags summary */}
                  <div>
                    <p style={{ ...LABEL, marginBottom: "8px" }}>Todos los tags ({container.all_tags?.length ?? 0})</p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
                      {(container.all_tags ?? []).map((t, i) => (
                        <span key={i} style={{ fontSize: "10px", padding: "3px 8px", borderRadius: "3px", background: t.paused ? "rgba(251,191,36,0.08)" : "rgba(255,255,255,0.04)", border: `1px solid ${t.paused ? "rgba(251,191,36,0.3)" : "var(--border)"}`, color: t.paused ? "var(--amber)" : "var(--text-muted)" }}>{t.name}</span>
                      ))}
                    </div>
                  </div>

                  {/* Workspaces */}
                  {container.workspaces?.length > 0 && (
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <p style={{ ...LABEL, margin: 0 }}>Workspaces:</p>
                      {container.workspaces.map((w, i) => (
                        <span key={i} style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "3px", background: "rgba(66,133,244,0.08)", border: "1px solid rgba(66,133,244,0.2)", color: "#4285F4" }}>{w}</span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {!data && !loading && (
        <div style={{ ...CARD, padding: "48px", textAlign: "center" }}>
          <Tag size={32} color="var(--text-muted)" style={{ marginBottom: "12px" }}/>
          <p style={{ fontSize: "14px", color: "var(--text-muted)", marginBottom: "6px" }}>Sin datos de GTM</p>
          <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>Haz clic en "Auditar GTM" para cargar el estado de todos los contenedores.</p>
        </div>
      )}

      {/* Instructions */}
      {data && (
        <div style={{ marginTop: "20px", padding: "14px 16px", background: "rgba(66,133,244,0.04)", border: "1px solid rgba(66,133,244,0.15)", borderRadius: "6px" }}>
          <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: 0, lineHeight: 1.8 }}>
            <strong style={{ color: "var(--text)" }}>Para corregir una tag:</strong> GTM → crear nuevo área de trabajo → modificar la tag errónea → previsualizar para probar → publicar. <strong>Nunca modificar sobre la versión live directamente.</strong><br/>
            El botón GTM ↗ de cada contenedor abre Tag Manager en esa cuenta.
          </p>
        </div>
      )}
    </div>
  );
}
