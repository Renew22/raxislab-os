"use client";
import { useState, useEffect, useCallback } from "react";
import { Search, Zap, Users, RefreshCw, ExternalLink, Copy, CheckCircle, AlertTriangle, XCircle, Globe, Star, Smartphone, Monitor, Phone } from "lucide-react";

/* ── Types ── */
interface PSScore { performance: number; seo: number; accessibility: number; best_practices: number; fcp?: string; lcp?: string; cls?: string; tbt?: string; speed_index?: string; error?: string }
interface AuditResult {
  url: string; business_name: string | null; scanned_at: string; elapsed_ms: number;
  global_score: { score: number; label: string };
  pagespeed: { mobile: PSScore; desktop: PSScore };
  onpage: { title: string; title_length: number; meta_description: string; meta_desc_length: number; h1s: string[]; h2s: string[]; images: { total: number; without_alt: number }; links: { internal: number; external: number }; schema_org: boolean; issues?: Array<{ severity: string; msg: string }> };
  technical: { "/robots.txt"?: { exists: boolean }; "/sitemap.xml"?: { exists: boolean }; https_redirect?: boolean };
  google_business?: { found: boolean; name?: string; rating?: number; reviews_total?: number; phone?: string; address?: string };
  cms_detected?: Array<{ name: string; type: string; risk: string }>;
  social_presence?: { found: Array<{ name: string; handle: string | null }>; missing: Array<{ name: string }>; recommendation: string };
  summary?: { critical_issues: number; improvable_issues: number; all_issues: Array<{ severity: string; msg: string }> };
  error?: string;
}
interface DemoResult { demoUrl?: string; slug?: string; business?: { name: string; address?: string; phone?: string; rating?: number }; hasWebsite?: boolean; existingUrl?: string; url?: string; error?: string }
interface Lead { slug: string; business: string; telefono?: string; demoUrl: string; fecha: string; rating?: number; reviewsTotal?: number; address?: string }

/* ── Design tokens (CSS vars — respetan el tema light/dark) ── */
const C = {
  bg: "var(--bg)", card: "var(--card)", border: "var(--border)",
  accent: "var(--accent)", green: "var(--green)", red: "var(--red)", amber: "var(--amber)",
  text: "var(--text)", mid: "var(--text-mid)", muted: "var(--text-muted)",
};
const S: Record<string, React.CSSProperties> = {
  page:     { background: "var(--bg)", minHeight: "100vh", padding: "32px 40px", fontFamily: "'Space Grotesk', sans-serif", color: "var(--text)" },
  card:     { background: "var(--card)", border: "1px solid var(--border)", borderRadius: "12px", padding: "20px" },
  input:    { width: "100%", padding: "11px 14px", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text)", fontSize: "14px", outline: "none", boxSizing: "border-box" as const },
  btn:      { padding: "11px 22px", borderRadius: "8px", border: "none", background: "var(--accent)", color: "#fff", fontSize: "14px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "7px" },
  btnGhost: { padding: "8px 16px", borderRadius: "6px", border: "1px solid var(--border)", background: "transparent", color: "var(--text-mid)", fontSize: "12px", cursor: "pointer", display: "flex", alignItems: "center", gap: "5px" },
  lbl:      { fontSize: "11px", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: "var(--text-muted)", marginBottom: "6px", display: "block" },
  mono:     { fontFamily: "'Space Mono', monospace" },
};

function scoreColor(n: number) { return n >= 80 ? C.green : n >= 50 ? C.amber : C.red; }

function ScoreRing({ value, size = 72 }: { value: number; size?: number }) {
  const r = size / 2 - 6; const circ = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} style={{ flexShrink: 0 }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={C.border} strokeWidth={6} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={scoreColor(value)} strokeWidth={6}
        strokeDasharray={circ} strokeDashoffset={circ - (value / 100) * circ}
        strokeLinecap="round" transform={`rotate(-90 ${size/2} ${size/2})`} />
      <text x={size/2} y={size/2+1} textAnchor="middle" dominantBaseline="middle"
        fill={scoreColor(value)} fontSize={size < 60 ? 13 : 17} fontWeight={800}
        fontFamily="'Space Mono', monospace">{value}</text>
    </svg>
  );
}

function MetricBar({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 10px", background: C.bg, borderRadius: "6px", border: `1px solid ${C.border}` }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <span style={{ color: scoreColor(value), display: "flex" }}>
          {value >= 80 ? <CheckCircle size={12} /> : value >= 50 ? <AlertTriangle size={12} /> : <XCircle size={12} />}
        </span>
        <span style={{ fontSize: "11px", color: C.mid }}>{label}</span>
      </div>
      <span style={{ ...S.mono, fontSize: "13px", fontWeight: 700, color: scoreColor(value) }}>{value}</span>
    </div>
  );
}

function PSCard({ title, Icon, data }: { title: string; Icon: React.ElementType; data: PSScore | null }) {
  if (!data) return null;
  if (data.error) return (
    <div style={{ ...S.card, opacity: 0.5 }}>
      <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "8px" }}>
        <Icon size={13} color={C.muted} /><span style={{ fontSize: "13px", fontWeight: 600, color: C.mid }}>{title}</span>
      </div>
      <p style={{ fontSize: "12px", color: C.muted, margin: 0 }}>Timeout — sin datos</p>
    </div>
  );
  const vitals = [{ l: "FCP", v: data.fcp }, { l: "LCP", v: data.lcp }, { l: "CLS", v: data.cls }, { l: "TBT", v: data.tbt }].filter(x => x.v);
  return (
    <div style={S.card}>
      <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "14px" }}>
        <Icon size={13} color={C.accent} /><span style={{ fontSize: "13px", fontWeight: 600 }}>{title}</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: vitals.length ? "10px" : 0 }}>
        <MetricBar label="Performance" value={data.performance} />
        <MetricBar label="SEO" value={data.seo} />
        <MetricBar label="Accesibilidad" value={data.accessibility} />
        <MetricBar label="Best Practices" value={data.best_practices} />
      </div>
      {vitals.length > 0 && (
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          {vitals.map(({ l, v }) => (
            <span key={l} style={{ fontSize: "11px", padding: "3px 8px", background: C.bg, border: `1px solid ${C.border}`, borderRadius: "4px", color: C.mid }}>
              <span style={{ color: C.muted }}>{l} </span>{v}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   PAGE
══════════════════════════════════════════════════════════ */
export default function AuditoriaPage() {
  const [tab, setTab] = useState<"audit" | "demo" | "leads">("audit");

  /* Audit */
  const [auditUrl,  setAuditUrl]  = useState("");
  const [bizName,   setBizName]   = useState("");
  const [city,      setCity]      = useState("");
  const [auditing,  setAuditing]  = useState(false);
  const [result,    setResult]    = useState<AuditResult | null>(null);
  const [auditErr,  setAuditErr]  = useState("");

  /* Demo */
  const [demoBiz,    setDemoBiz]    = useState("");
  const [generating, setGenerating] = useState(false);
  const [demoRes,    setDemoRes]    = useState<DemoResult | null>(null);
  const [demoErr,    setDemoErr]    = useState("");
  const [copied,     setCopied]     = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [manualName,     setManualName]     = useState("");
  const [manualAddress,  setManualAddress]  = useState("");
  const [manualPhone,    setManualPhone]    = useState("");
  const [manualCategory, setManualCategory] = useState("peluqueria");
  const [manualDesc,     setManualDesc]     = useState("");

  /* Leads */
  const [leads,        setLeads]        = useState<Lead[]>([]);
  const [leadsLoading, setLeadsLoading] = useState(false);

  const loadLeads = useCallback(async () => {
    setLeadsLoading(true);
    try {
      const r = await fetch("/api/audit/leads");
      if (r.ok) { const d = await r.json(); setLeads(Array.isArray(d) ? [...d].reverse() : []); }
    } finally { setLeadsLoading(false); }
  }, []);

  useEffect(() => { if (tab === "leads") loadLeads(); }, [tab, loadLeads]);

  async function runAudit() {
    if (!auditUrl.trim()) return;
    setAuditing(true); setResult(null); setAuditErr("");
    try {
      const r = await fetch("/api/audit/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: auditUrl.trim(), business_name: bizName.trim() || undefined, city: city.trim() || undefined }),
      });
      const d: AuditResult = await r.json();
      if (d.error) setAuditErr(d.error); else setResult(d);
    } catch { setAuditErr("Error de conexión"); }
    finally { setAuditing(false); }
  }

  async function runDemo(manual = false) {
    setGenerating(true); setDemoRes(null); setDemoErr("");
    try {
      const body: Record<string, unknown> = { business: demoBiz.trim() || manualName.trim() };
      if (manual) {
        body.manual = { name: manualName, address: manualAddress, phone: manualPhone, category: manualCategory };
      }
      const r = await fetch("/api/audit/demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const d: DemoResult = await r.json();
      if (d.error) { setDemoErr(d.error); if (!manual) setShowManual(true); }
      else { setShowManual(false); setDemoRes(d); }
    } catch { setDemoErr("Error generando demo"); }
    finally { setGenerating(false); }
  }

  function copyLink(url: string) {
    navigator.clipboard.writeText(url);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  }

  const TABS = [
    { id: "audit", label: "Auditar URL",     Icon: Search },
    { id: "demo",  label: "Generar Demo Web", Icon: Zap   },
    { id: "leads", label: "Demos activas",    Icon: Users  },
  ] as const;

  return (
    <div style={S.page}>
      {/* ── Header ── */}
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: 700, margin: 0 }}>Auditoría IA</h1>
        <p style={{ fontSize: "13px", color: C.muted, margin: "5px 0 0" }}>
          Analiza webs · Genera demos para prospectos sin web · Convierte leads en clientes
        </p>
      </div>

      {/* ── Tabs ── */}
      <div style={{ display: "flex", gap: "2px", marginBottom: "24px", borderBottom: `1px solid ${C.border}` }}>
        {TABS.map(({ id, label, Icon }) => (
          <button key={id} onClick={() => setTab(id)} style={{
            display: "flex", alignItems: "center", gap: "7px", padding: "9px 18px",
            borderRadius: "6px 6px 0 0", border: "1px solid transparent",
            borderBottom: tab === id ? `1px solid ${C.card}` : "1px solid transparent",
            background: tab === id ? C.card : "transparent",
            color: tab === id ? C.accent : C.muted,
            fontSize: "13px", fontWeight: tab === id ? 600 : 400, cursor: "pointer",
            fontFamily: "'Space Grotesk', sans-serif", marginBottom: tab === id ? "-1px" : 0,
          }}>
            <Icon size={13} />{label}
          </button>
        ))}
      </div>

      {/* ══════ TAB: AUDITAR ══════ */}
      {tab === "audit" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

          {/* Input form */}
          <div style={S.card}>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: "12px", marginBottom: "14px" }}>
              <div>
                <span style={S.lbl}>URL del negocio *</span>
                <input style={S.input} placeholder="https://desancho.com" value={auditUrl}
                  onChange={e => setAuditUrl(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && runAudit()} />
              </div>
              <div>
                <span style={S.lbl}>Nombre negocio (GBP)</span>
                <input style={S.input} placeholder="Desancho Estilistas" value={bizName}
                  onChange={e => setBizName(e.target.value)} />
              </div>
              <div>
                <span style={S.lbl}>Ciudad</span>
                <input style={S.input} placeholder="Valencia" value={city}
                  onChange={e => setCity(e.target.value)} />
              </div>
            </div>
            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              <button style={{ ...S.btn, opacity: auditing || !auditUrl.trim() ? 0.6 : 1 }}
                onClick={runAudit} disabled={auditing || !auditUrl.trim()}>
                {auditing
                  ? <RefreshCw size={14} style={{ animation: "spin 1s linear infinite" }} />
                  : <Search size={14} />}
                {auditing ? "Analizando..." : "Auditar"}
              </button>
              {auditing && <span style={{ fontSize: "12px", color: C.muted }}>PageSpeed + SEO on-page + GBP · ~30 seg</span>}
              {auditErr && <span style={{ fontSize: "13px", color: C.red }}>⚠ {auditErr}</span>}
            </div>
          </div>

          {/* ── Resultados ── */}
          {result && (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

              {/* Score global */}
              <div style={{ ...S.card, display: "flex", gap: "24px", alignItems: "center", border: `1px solid ${scoreColor(result.global_score.score)}44` }}>
                <ScoreRing value={result.global_score.score} size={82} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "12px", color: C.muted, marginBottom: "4px" }}>{result.url}</div>
                  <div style={{ fontSize: "20px", fontWeight: 700, color: scoreColor(result.global_score.score) }}>
                    {result.global_score.label}
                  </div>
                  <div style={{ fontSize: "11px", color: C.muted, marginTop: "4px" }}>
                    {new Date(result.scanned_at).toLocaleString("es")} · {(result.elapsed_ms / 1000).toFixed(1)}s
                  </div>
                </div>
                {result.summary && (
                  <div style={{ display: "flex", gap: "10px" }}>
                    {result.summary.critical_issues > 0 && (
                      <div style={{ textAlign: "center", padding: "12px 18px", background: `${C.red}12`, borderRadius: "8px", border: `1px solid ${C.red}30` }}>
                        <div style={{ ...S.mono, fontSize: "24px", fontWeight: 800, color: C.red }}>{result.summary.critical_issues}</div>
                        <div style={{ fontSize: "10px", color: C.muted, marginTop: "2px" }}>CRÍTICOS</div>
                      </div>
                    )}
                    {result.summary.improvable_issues > 0 && (
                      <div style={{ textAlign: "center", padding: "12px 18px", background: `${C.amber}12`, borderRadius: "8px", border: `1px solid ${C.amber}30` }}>
                        <div style={{ ...S.mono, fontSize: "24px", fontWeight: 800, color: C.amber }}>{result.summary.improvable_issues}</div>
                        <div style={{ fontSize: "10px", color: C.muted, marginTop: "2px" }}>MEJORABLES</div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* PageSpeed */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <PSCard title="Mobile" Icon={Smartphone} data={result.pagespeed?.mobile ?? null} />
                <PSCard title="Desktop" Icon={Monitor} data={result.pagespeed?.desktop ?? null} />
              </div>

              {/* Issues + SEO */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                {result.summary?.all_issues && result.summary.all_issues.length > 0 && (
                  <div style={S.card}>
                    <h3 style={{ fontSize: "13px", fontWeight: 600, margin: "0 0 12px" }}>Problemas detectados</h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                      {result.summary.all_issues.map((iss, i) => (
                        <div key={i} style={{ display: "flex", gap: "8px", padding: "7px 10px", background: C.bg, borderRadius: "5px", border: `1px solid ${iss.severity === "crítico" ? C.red : C.amber}22` }}>
                          <span style={{ color: iss.severity === "crítico" ? C.red : C.amber, flexShrink: 0, marginTop: "1px" }}>
                            {iss.severity === "crítico" ? <XCircle size={12} /> : <AlertTriangle size={12} />}
                          </span>
                          <span style={{ fontSize: "12px", color: C.mid, lineHeight: 1.5 }}>{iss.msg}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div style={S.card}>
                  <h3 style={{ fontSize: "13px", fontWeight: 600, margin: "0 0 12px" }}>SEO On-page</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "12px" }}>
                    {[
                      { l: "Title",             v: result.onpage?.title?.substring(0, 50) + (result.onpage?.title?.length > 50 ? "…" : "") || "—", sub: `${result.onpage?.title_length || 0} chars` },
                      { l: "Meta desc",          v: result.onpage?.meta_description?.substring(0, 55) + "…" || "—", sub: `${result.onpage?.meta_desc_length || 0} chars` },
                      { l: "H1",                 v: result.onpage?.h1s?.[0]?.substring(0, 45) || "Sin H1 ⚠", sub: `${result.onpage?.h1s?.length || 0} encontrados` },
                      { l: "Imágenes sin alt",   v: `${result.onpage?.images?.without_alt || 0} / ${result.onpage?.images?.total || 0}`, sub: result.onpage?.images?.without_alt ? "⚠ Falta alt" : "✅ Ok" },
                      { l: "Schema.org",         v: result.onpage?.schema_org ? "✅ Sí" : "❌ No", sub: "Datos estructurados" },
                      { l: "Links internos",     v: String(result.onpage?.links?.internal || 0), sub: `${result.onpage?.links?.external || 0} externos` },
                    ].map(({ l, v, sub }) => (
                      <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "6px 9px", background: C.bg, borderRadius: "4px", border: `1px solid ${C.border}` }}>
                        <span style={{ color: C.muted, fontWeight: 600, minWidth: "100px" }}>{l}</span>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ color: C.text }}>{v}</div>
                          <div style={{ fontSize: "10px", color: C.muted }}>{sub}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Técnico + Social + GBP */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
                <div style={S.card}>
                  <h3 style={{ fontSize: "13px", fontWeight: 600, margin: "0 0 12px" }}>Técnico</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    {[
                      { l: "HTTPS",       ok: result.technical?.https_redirect !== false },
                      { l: "robots.txt",  ok: !!result.technical?.["/robots.txt"]?.exists },
                      { l: "sitemap.xml", ok: !!result.technical?.["/sitemap.xml"]?.exists },
                    ].map(({ l, ok }) => (
                      <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "7px 10px", background: C.bg, borderRadius: "5px", border: `1px solid ${C.border}`, fontSize: "12px" }}>
                        <span style={{ color: C.mid }}>{l}</span>
                        <span style={{ color: ok ? C.green : C.red }}>{ok ? "✅" : "❌"}</span>
                      </div>
                    ))}
                    {result.cms_detected?.slice(0, 2).map((cms, i) => (
                      <div key={i} style={{ padding: "7px 10px", background: C.bg, borderRadius: "5px", border: `1px solid ${C.border}`, fontSize: "12px" }}>
                        <span style={{ color: C.accent }}>{cms.name}</span>
                        <span style={{ color: C.muted }}> · {cms.type}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={S.card}>
                  <h3 style={{ fontSize: "13px", fontWeight: 600, margin: "0 0 12px" }}>Social</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "5px", fontSize: "12px" }}>
                    {result.social_presence?.found?.map((s, i) => (
                      <div key={i} style={{ display: "flex", gap: "8px", padding: "6px 9px", background: C.bg, borderRadius: "5px", border: `1px solid ${C.green}22` }}>
                        <span style={{ color: C.green }}>✅</span>
                        <span style={{ color: C.mid }}>{s.name}{s.handle ? ` @${s.handle}` : ""}</span>
                      </div>
                    ))}
                    {result.social_presence?.missing?.map((s, i) => (
                      <div key={i} style={{ display: "flex", gap: "8px", padding: "6px 9px", background: C.bg, borderRadius: "5px", border: `1px solid ${C.red}22` }}>
                        <span style={{ color: C.red }}>❌</span>
                        <span style={{ color: C.muted }}>{s.name}</span>
                      </div>
                    ))}
                    {!result.social_presence?.found?.length && !result.social_presence?.missing?.length && (
                      <p style={{ fontSize: "12px", color: C.muted, margin: 0 }}>Sin datos sociales</p>
                    )}
                  </div>
                </div>

                <div style={S.card}>
                  <h3 style={{ fontSize: "13px", fontWeight: 600, margin: "0 0 12px" }}>Google Business</h3>
                  {result.google_business?.found ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                        <Star size={16} color={C.amber} fill={C.amber} />
                        <span style={{ ...S.mono, fontSize: "20px", fontWeight: 700, color: C.amber }}>
                          {result.google_business.rating?.toFixed(1)}
                        </span>
                        <span style={{ fontSize: "12px", color: C.muted }}>
                          ({result.google_business.reviews_total} reseñas)
                        </span>
                      </div>
                      {result.google_business.phone && (
                        <div style={{ display: "flex", gap: "6px", alignItems: "center", fontSize: "12px", color: C.mid }}>
                          <Phone size={11} />{result.google_business.phone}
                        </div>
                      )}
                      {result.google_business.address && (
                        <div style={{ fontSize: "11px", color: C.muted, lineHeight: 1.5 }}>
                          {result.google_business.address}
                        </div>
                      )}
                    </div>
                  ) : bizName ? (
                    <p style={{ fontSize: "12px", color: C.muted, margin: 0 }}>No encontrado en Google Maps</p>
                  ) : (
                    <p style={{ fontSize: "12px", color: C.muted, margin: 0 }}>
                      Introduce nombre del negocio para consultar GBP
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════ TAB: GENERAR DEMO ══════ */}
      {tab === "demo" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px", maxWidth: "680px" }}>
          <div style={{ ...S.card, border: `1px solid ${C.accent}33`, background: `${C.accent}05` }}>
            <p style={{ fontSize: "13px", color: C.mid, lineHeight: 1.7, margin: 0 }}>
              <strong style={{ color: C.accent }}>Para negocios SIN web.</strong> Busca el negocio en Google Business, genera una web one-page con Claude IA usando sus fotos y reseñas reales, y obtienes un enlace para mandarle. La demo caduca en 14 días — suficiente para cerrar.
            </p>
          </div>

          <div style={S.card}>
            <span style={S.lbl}>Nombre del negocio + ciudad</span>
            <div style={{ display: "flex", gap: "10px", marginTop: "4px" }}>
              <input style={{ ...S.input, flex: 1 }} placeholder="Peluquería García Valencia"
                value={demoBiz} onChange={e => setDemoBiz(e.target.value)}
                onKeyDown={e => e.key === "Enter" && runDemo()} />
              <button style={{ ...S.btn, whiteSpace: "nowrap", opacity: generating || !demoBiz.trim() ? 0.6 : 1 }}
                onClick={() => runDemo(false)} disabled={generating || !demoBiz.trim()}>
                {generating
                  ? <RefreshCw size={14} style={{ animation: "spin 1s linear infinite" }} />
                  : <Zap size={14} />}
                {generating ? "Generando..." : "Generar Demo"}
              </button>
            </div>
            {generating && (
              <p style={{ fontSize: "12px", color: C.muted, marginTop: "10px", lineHeight: 1.6 }}>
                Buscando en Google Business · Descargando fotos y reseñas · Generando web con Claude (~40 seg)
              </p>
            )}
          </div>

          {demoErr && (
            <div style={{ ...S.card, border: `1px solid ${C.red}44`, background: `${C.red}07` }}>
              <p style={{ fontSize: "13px", color: C.red, margin: "0 0 8px" }}>⚠ {demoErr}</p>
              {showManual && <button onClick={() => {}} style={{ fontSize: "12px", color: C.accent, background: "none", border: "none", cursor: "pointer", padding: 0, textDecoration: "underline" }}>
                Introducir datos manualmente →
              </button>}
            </div>
          )}

          {showManual && (
            <div style={{ ...S.card, border: `1px solid ${C.amber}33` }}>
              <p style={{ fontSize: "13px", fontWeight: 600, color: C.amber, margin: "0 0 14px" }}>Datos manuales del negocio</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <div><span style={S.lbl}>Nombre del negocio *</span>
                  <input style={S.input} placeholder="Ripieno Ibiza" value={manualName} onChange={e => setManualName(e.target.value)} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <div><span style={S.lbl}>Dirección</span>
                    <input style={S.input} placeholder="Calle Principal 12, Ibiza" value={manualAddress} onChange={e => setManualAddress(e.target.value)} />
                  </div>
                  <div><span style={S.lbl}>Teléfono</span>
                    <input style={S.input} placeholder="+34 600 000 000" value={manualPhone} onChange={e => setManualPhone(e.target.value)} />
                  </div>
                </div>
                <div><span style={S.lbl}>Categoría</span>
                  <select style={S.input} value={manualCategory} onChange={e => setManualCategory(e.target.value)}>
                    <option value="peluqueria">Peluquería / Salón</option>
                    <option value="restaurante">Restaurante / Bar</option>
                    <option value="estetica">Estética / Spa</option>
                    <option value="clinica">Clínica / Salud</option>
                    <option value="retail">Tienda / Retail</option>
                    <option value="negocio_local">Otro negocio local</option>
                  </select>
                </div>
                <button style={{ ...S.btn, opacity: !manualName.trim() || generating ? 0.6 : 1 }}
                  onClick={() => runDemo(true)} disabled={!manualName.trim() || generating}>
                  {generating ? <RefreshCw size={14} style={{ animation: "spin 1s linear infinite" }} /> : <Zap size={14} />}
                  {generating ? "Generando..." : "Generar Demo con estos datos"}
                </button>
              </div>
            </div>
          )}

          {demoRes && !demoRes.error && (
            <div style={{ ...S.card, border: `1px solid ${C.green}44` }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  {demoRes.hasWebsite && (
                    <div style={{ padding: "10px 14px", background: `${C.amber}10`, borderRadius: "8px", border: `1px solid ${C.amber}33`, fontSize: "12px", color: C.amber }}>
                      ⚠ Ya tiene web: <a href={demoRes.existingUrl} target="_blank" rel="noreferrer" style={{ color: C.accent, textDecoration: "none" }}>{demoRes.existingUrl}</a>
                      <span style={{ color: C.muted }}> — igualmente generamos la demo para mostrarle cómo podría mejorar</span>
                    </div>
                  )}
                  <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                    <CheckCircle size={18} color={C.green} />
                    <div>
                      <p style={{ fontSize: "14px", fontWeight: 700, color: C.green, margin: 0 }}>Demo generada</p>
                      <p style={{ fontSize: "12px", color: C.muted, margin: "2px 0 0" }}>{demoRes.business?.name}</p>
                    </div>
                  </div>
                  <div style={{ padding: "12px 14px", background: C.bg, borderRadius: "8px", border: `1px solid ${C.accent}44` }}>
                    <p style={{ fontSize: "11px", color: C.muted, margin: "0 0 6px", fontWeight: 600, letterSpacing: "0.06em" }}>ENLACE DEMO (14 días)</p>
                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                      <a href={demoRes.demoUrl} target="_blank" rel="noreferrer"
                        style={{ ...S.mono, fontSize: "13px", color: C.accent, textDecoration: "none", flex: 1, wordBreak: "break-all" }}>
                        {demoRes.demoUrl}
                      </a>
                      <button onClick={() => copyLink(demoRes.demoUrl!)} style={S.btnGhost}>
                        {copied ? <CheckCircle size={11} color={C.green} /> : <Copy size={11} />}
                        {copied ? "Copiado" : "Copiar"}
                      </button>
                      <a href={demoRes.demoUrl} target="_blank" rel="noreferrer" style={S.btnGhost}>
                        <ExternalLink size={11} /> Ver
                      </a>
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                    {demoRes.business?.address && (
                      <div style={{ padding: "8px 10px", background: C.bg, borderRadius: "6px", border: `1px solid ${C.border}`, fontSize: "12px", color: C.muted, display: "flex", gap: "6px", alignItems: "flex-start" }}>
                        <Globe size={11} style={{ marginTop: "2px", flexShrink: 0 }} />{demoRes.business.address}
                      </div>
                    )}
                    {demoRes.business?.phone && (
                      <div style={{ padding: "8px 10px", background: C.bg, borderRadius: "6px", border: `1px solid ${C.border}`, fontSize: "12px", color: C.mid, display: "flex", gap: "6px", alignItems: "center" }}>
                        <Phone size={11} />{demoRes.business.phone}
                      </div>
                    )}
                    {demoRes.business?.rating && (
                      <div style={{ padding: "8px 10px", background: C.bg, borderRadius: "6px", border: `1px solid ${C.border}`, fontSize: "12px", color: C.amber, display: "flex", gap: "6px", alignItems: "center" }}>
                        <Star size={11} fill={C.amber} />{demoRes.business.rating.toFixed(1)} en Google Maps
                      </div>
                    )}
                  </div>
                  <div style={{ fontSize: "12px", color: C.muted, padding: "10px 14px", background: `${C.accent}06`, borderRadius: "6px", border: `1px solid ${C.accent}22`, lineHeight: 1.7 }}>
                    <strong style={{ color: C.accent }}>Mensaje para enviar:</strong><br />
                    {`"He preparado una demo de cómo podría quedar tu web. Échale un vistazo: ${demoRes.demoUrl} — caduca en 14 días, si te gusta lo hablamos."`}
                  </div>
                </div>
            </div>
          )}

          <div style={S.card}>
            <h3 style={{ fontSize: "13px", fontWeight: 600, margin: "0 0 12px" }}>Flujo de venta</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {[
                { n: "1", t: "Generas la demo gratis",   d: "El cliente ve su negocio con web profesional en 10 minutos. Sin pedirle nada." },
                { n: "2", t: "Mandas el link por WA",    d: "\"He preparado algo para ti...\" — la curiosidad hace el resto. CTR altísimo." },
                { n: "3", t: "Propuesta en 24h",         d: "Web real desde 490€ · Posicionamiento desde 350€/mes · Pack con Meta Ads desde 650€/mes" },
                { n: "4", t: "Cierre en 2-3 días",       d: "Ya vio el resultado. La barrera del 'no sé cómo quedaría' está rota." },
              ].map(({ n, t, d }) => (
                <div key={n} style={{ display: "flex", gap: "10px", padding: "9px 12px", background: C.bg, borderRadius: "6px", border: `1px solid ${C.border}`, fontSize: "12px" }}>
                  <span style={{ width: "20px", height: "20px", borderRadius: "50%", background: `${C.accent}18`, color: C.accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 700, flexShrink: 0 }}>{n}</span>
                  <div><span style={{ color: C.text, fontWeight: 600 }}>{t} — </span><span style={{ color: C.muted }}>{d}</span></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ══════ TAB: LEADS ══════ */}
      {tab === "leads" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <p style={{ fontSize: "13px", color: C.muted, margin: 0 }}>
              {leads.length} demos generadas
            </p>
            <button onClick={loadLeads} style={S.btnGhost} disabled={leadsLoading}>
              <RefreshCw size={12} style={leadsLoading ? { animation: "spin 1s linear infinite" } : {}} />
              Actualizar
            </button>
          </div>

          {!leadsLoading && leads.length === 0 && (
            <div style={{ ...S.card, textAlign: "center", padding: "52px 20px" }}>
              <Users size={36} color={C.muted} style={{ marginBottom: "12px", opacity: 0.4 }} />
              <p style={{ color: C.muted, fontSize: "14px", margin: 0 }}>Sin demos generadas aún</p>
              <p style={{ color: C.muted, fontSize: "12px", margin: "6px 0 0" }}>Ve al tab "Generar Demo Web" para crear la primera</p>
            </div>
          )}

          {leads.length > 0 && (
            <div style={{ ...S.card, padding: 0, overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                    {["Negocio", "Teléfono", "Rating", "Demo URL", "Fecha / Estado", ""].map(h => (
                      <th key={h} style={{ padding: "10px 14px", textAlign: "left", color: C.muted, fontWeight: 600, fontSize: "10px", letterSpacing: "0.07em", textTransform: "uppercase" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {leads.map((lead, i) => {
                    const daysAgo = Math.floor((Date.now() - new Date(lead.fecha).getTime()) / 86400000);
                    const expired = daysAgo >= 14;
                    return (
                      <tr key={i} style={{ borderBottom: `1px solid ${C.border}`, background: expired ? `${C.red}04` : "transparent" }}>
                        <td style={{ padding: "10px 14px" }}>
                          <div style={{ fontWeight: 600, color: C.text }}>{lead.business}</div>
                          {lead.address && <div style={{ fontSize: "11px", color: C.muted, marginTop: "2px" }}>{lead.address}</div>}
                        </td>
                        <td style={{ padding: "10px 14px", ...S.mono, color: C.mid }}>{lead.telefono || "—"}</td>
                        <td style={{ padding: "10px 14px" }}>
                          {lead.rating ? (
                            <span style={{ color: C.amber, display: "flex", alignItems: "center", gap: "4px" }}>
                              <Star size={11} fill={C.amber} />{lead.rating.toFixed(1)}
                              <span style={{ color: C.muted, fontSize: "11px" }}>({lead.reviewsTotal})</span>
                            </span>
                          ) : "—"}
                        </td>
                        <td style={{ padding: "10px 14px" }}>
                          <a href={lead.demoUrl} target="_blank" rel="noreferrer"
                            style={{ color: expired ? C.muted : C.accent, textDecoration: "none", display: "flex", alignItems: "center", gap: "4px", fontSize: "11px" }}>
                            {lead.demoUrl.replace("https://", "")} <ExternalLink size={10} />
                          </a>
                        </td>
                        <td style={{ padding: "10px 14px" }}>
                          <div style={{ color: C.mid }}>{new Date(lead.fecha).toLocaleDateString("es")}</div>
                          <div style={{ fontSize: "11px", color: expired ? C.red : daysAgo >= 10 ? C.amber : C.green }}>
                            {expired ? "Caducada" : `${14 - daysAgo}d restantes`}
                          </div>
                        </td>
                        <td style={{ padding: "10px 14px" }}>
                          <button onClick={() => copyLink(lead.demoUrl)} style={S.btnGhost}>
                            <Copy size={10} /> Copiar
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  );
}
