"use client";

import { useState, useEffect } from "react";

type Tab = "audit" | "demo" | "leads";

interface Issue { severity: string; msg: string }
interface AuditResult {
  url: string;
  global_score?: { score: number; label: string };
  pagespeed?: { mobile?: any; desktop?: any };
  onpage?: { title: string; meta_description: string; h1s: string[]; issues: Issue[]; error?: string };
  technical?: any;
  google_business?: any;
  summary?: { critical_issues: number; improvable_issues: number };
  error?: string;
}
interface DemoResult {
  demoUrl?: string;
  business?: { name: string; address: string; phone: string; rating: number; mapUrl: string };
  hasWebsite?: boolean;
  url?: string;
  error?: string;
}
interface Lead {
  slug: string; business: string; telefono: string;
  demoUrl: string; fecha: string; rating: number;
  reviewsTotal: number; address: string;
}

const s: Record<string, React.CSSProperties> = {
  page:    { padding: "24px", maxWidth: 900, margin: "0 auto" },
  tabs:    { display: "flex", gap: 8, marginBottom: 24 },
  tab:     { padding: "8px 20px", borderRadius: 6, border: "1px solid var(--border)", cursor: "pointer", fontSize: 13, fontWeight: 500, background: "transparent", color: "var(--text-muted)" },
  tabAct:  { padding: "8px 20px", borderRadius: 6, border: "1px solid var(--accent)", cursor: "pointer", fontSize: 13, fontWeight: 500, background: "var(--accent-dim)", color: "var(--text)" },
  card:    { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, padding: 20, marginBottom: 16 },
  input:   { width: "100%", padding: "10px 14px", borderRadius: 6, border: "1px solid var(--border)", background: "var(--bg)", color: "var(--text)", fontSize: 14, boxSizing: "border-box" as const },
  btn:     { padding: "10px 24px", borderRadius: 6, border: "none", background: "var(--accent)", color: "#fff", fontWeight: 600, fontSize: 14, cursor: "pointer" },
  btnSec:  { padding: "6px 14px", borderRadius: 6, border: "1px solid var(--border)", background: "transparent", color: "var(--text-muted)", fontSize: 12, cursor: "pointer" },
  score:   { fontSize: 48, fontWeight: 700, lineHeight: 1 },
  label:   { fontSize: 12, color: "var(--text-muted)", marginBottom: 4 },
  row:     { display: "flex", gap: 16, flexWrap: "wrap" as const },
  chip:    { display: "inline-block", padding: "2px 10px", borderRadius: 12, fontSize: 11, fontWeight: 600 },
  h2:      { fontSize: 16, fontWeight: 600, marginBottom: 12, marginTop: 0 },
  h3:      { fontSize: 13, fontWeight: 600, marginBottom: 8, color: "var(--text-muted)" },
  link:    { color: "var(--accent)", textDecoration: "none", fontSize: 13 },
};

function scoreColor(n: number) {
  if (n >= 75) return "var(--green)";
  if (n >= 50) return "var(--amber)";
  return "#ef4444";
}

function SeverityChip({ sev }: { sev: string }) {
  const color = sev === "crítico" ? "#ef4444" : "var(--amber)";
  return <span style={{ ...s.chip, background: color + "22", color }}>{sev}</span>;
}

export default function AuditoriaPage() {
  const [tab, setTab] = useState<Tab>("audit");

  // Audit
  const [auditUrl, setAuditUrl] = useState("");
  const [auditEmail, setAuditEmail] = useState("");
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditResult, setAuditResult] = useState<AuditResult | null>(null);

  // Demo
  const [demoName, setDemoName] = useState("");
  const [demoTipo, setDemoTipo] = useState("");
  const [demoCiudad, setDemoCiudad] = useState("");
  const [demoTel, setDemoTel] = useState("");
  const [demoLoading, setDemoLoading] = useState(false);
  const [demoResult, setDemoResult] = useState<DemoResult | null>(null);

  // Leads
  const [leads, setLeads] = useState<Lead[]>([]);
  const [leadsLoading, setLeadsLoading] = useState(false);

  async function runAudit() {
    if (!auditUrl.trim()) return;
    setAuditLoading(true);
    setAuditResult(null);
    try {
      const res = await fetch("/api/scanner?action=audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: auditUrl, send_email: !!auditEmail, email_to: auditEmail }),
      });
      setAuditResult(await res.json());
    } catch (e: any) {
      setAuditResult({ url: auditUrl, error: e.message });
    } finally {
      setAuditLoading(false);
    }
  }

  async function runDemo() {
    if (!demoName.trim() || !demoTipo.trim() || !demoCiudad.trim()) return;
    setDemoLoading(true);
    setDemoResult(null);
    try {
      const res = await fetch("/api/scanner?action=demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: demoName, tipo: demoTipo, ciudad: demoCiudad, telefono: demoTel }),
      });
      setDemoResult(await res.json());
    } catch (e: any) {
      setDemoResult({ error: e.message });
    } finally {
      setDemoLoading(false);
    }
  }

  async function loadLeads() {
    setLeadsLoading(true);
    try {
      const res = await fetch("/api/scanner");
      const data = await res.json();
      setLeads(data.leads || []);
    } catch {}
    setLeadsLoading(false);
  }

  useEffect(() => { if (tab === "leads") loadLeads(); }, [tab]);

  const ps = auditResult?.pagespeed?.mobile;

  return (
    <div style={s.page}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>Auditoría Web & Demos</h1>
      <p style={{ color: "var(--text-muted)", fontSize: 13, marginBottom: 24 }}>
        Audita cualquier web o genera una demo automática para negocios sin presencia online.
      </p>

      <div style={s.tabs}>
        {(["audit","demo","leads"] as Tab[]).map(t => (
          <button key={t} style={tab === t ? s.tabAct : s.tab} onClick={() => setTab(t)}>
            {t === "audit" ? "🔍 Auditar Web" : t === "demo" ? "🚀 Generar Demo" : "📋 Leads / Demos"}
          </button>
        ))}
      </div>

      {/* ── TAB AUDIT ── */}
      {tab === "audit" && (
        <div>
          <div style={s.card}>
            <h2 style={s.h2}>Analizar una web</h2>
            <div style={{ marginBottom: 12 }}>
              <div style={s.label}>URL del sitio web</div>
              <input style={s.input} placeholder="https://negociocliente.com"
                value={auditUrl} onChange={e => setAuditUrl(e.target.value)}
                onKeyDown={e => e.key === "Enter" && runAudit()} />
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={s.label}>Enviar informe por email (opcional)</div>
              <input style={s.input} placeholder="cliente@email.com"
                value={auditEmail} onChange={e => setAuditEmail(e.target.value)} />
            </div>
            <button style={s.btn} onClick={runAudit} disabled={auditLoading}>
              {auditLoading ? "Analizando... (puede tardar 30s)" : "Auditar"}
            </button>
          </div>

          {auditResult?.error && (
            <div style={{ ...s.card, borderColor: "#ef4444" }}>
              <span style={{ color: "#ef4444" }}>Error: {auditResult.error}</span>
            </div>
          )}

          {auditResult && !auditResult.error && (
            <>
              {/* Score global */}
              {auditResult.global_score && (
                <div style={{ ...s.card, textAlign: "center" }}>
                  <div style={{ ...s.score, color: scoreColor(auditResult.global_score.score) }}>
                    {auditResult.global_score.score}
                    <span style={{ fontSize: 20, color: "var(--text-muted)" }}>/100</span>
                  </div>
                  <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>
                    Puntuación global — {auditResult.global_score.label}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 8 }}>
                    {auditResult.summary?.critical_issues} problemas críticos · {auditResult.summary?.improvable_issues} mejorables
                  </div>
                </div>
              )}

              {/* PageSpeed */}
              {ps && !ps.error && (
                <div style={s.card}>
                  <h2 style={s.h2}>PageSpeed Mobile</h2>
                  <div style={s.row}>
                    {[
                      { label: "Performance", val: ps.performance },
                      { label: "SEO", val: ps.seo },
                      { label: "Accesibilidad", val: ps.accessibility },
                      { label: "Best Practices", val: ps.best_practices },
                    ].map(({ label, val }) => (
                      <div key={label} style={{ textAlign: "center", minWidth: 80 }}>
                        <div style={{ fontSize: 28, fontWeight: 700, color: scoreColor(val) }}>{val}</div>
                        <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{label}</div>
                      </div>
                    ))}
                  </div>
                  {ps.lcp && (
                    <div style={{ marginTop: 12, fontSize: 12, color: "var(--text-muted)" }}>
                      FCP: {ps.fcp} · LCP: {ps.lcp} · CLS: {ps.cls} · TBT: {ps.tbt}
                    </div>
                  )}
                </div>
              )}

              {/* On-page SEO */}
              {auditResult.onpage && !auditResult.onpage.error && (
                <div style={s.card}>
                  <h2 style={s.h2}>SEO On-Page</h2>
                  <div style={{ marginBottom: 12 }}>
                    <div style={s.h3}>Title</div>
                    <div style={{ fontSize: 13 }}>{auditResult.onpage.title || "❌ Sin title"}</div>
                  </div>
                  <div style={{ marginBottom: 12 }}>
                    <div style={s.h3}>Meta Description</div>
                    <div style={{ fontSize: 13 }}>{auditResult.onpage.meta_description || "❌ Sin meta description"}</div>
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    <div style={s.h3}>H1</div>
                    <div style={{ fontSize: 13 }}>
                      {auditResult.onpage.h1s?.length ? auditResult.onpage.h1s.join(" / ") : "❌ Sin H1"}
                    </div>
                  </div>
                  {auditResult.onpage.issues?.length > 0 && (
                    <>
                      <div style={s.h3}>Problemas detectados</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        {auditResult.onpage.issues.map((iss, i) => (
                          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
                            <SeverityChip sev={iss.severity} />
                            {iss.msg}
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Técnico */}
              {auditResult.technical && (
                <div style={s.card}>
                  <h2 style={s.h2}>Técnico</h2>
                  <div style={s.row}>
                    {[
                      ["robots.txt", auditResult.technical["/robots.txt"]?.exists],
                      ["sitemap.xml", auditResult.technical["/sitemap.xml"]?.exists],
                      ["HTTPS redirect", auditResult.technical["https_redirect"]],
                    ].map(([label, ok]) => (
                      <div key={String(label)} style={{ fontSize: 13 }}>
                        {ok ? "✅" : "❌"} {label}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Google Business */}
              {auditResult.google_business?.found && (
                <div style={s.card}>
                  <h2 style={s.h2}>Google Business</h2>
                  <div style={{ fontSize: 14 }}>
                    ⭐ {auditResult.google_business.rating} ({auditResult.google_business.reviews_total} reseñas)
                    · 📞 {auditResult.google_business.phone || "Sin teléfono"}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── TAB DEMO ── */}
      {tab === "demo" && (
        <div>
          <div style={s.card}>
            <h2 style={s.h2}>Generar web demo automática</h2>
            <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 16 }}>
              Para negocios sin web. Claude genera una web completa en ~30s y la publica en demo.raxislab.com.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
              <div>
                <div style={s.label}>Nombre del negocio *</div>
                <input style={s.input} placeholder="Peluquería El Rincón"
                  value={demoName} onChange={e => setDemoName(e.target.value)} />
              </div>
              <div>
                <div style={s.label}>Tipo de negocio *</div>
                <input style={s.input} placeholder="peluquería / restaurante / clínica..."
                  value={demoTipo} onChange={e => setDemoTipo(e.target.value)} />
              </div>
              <div>
                <div style={s.label}>Ciudad *</div>
                <input style={s.input} placeholder="Asunción, Paraguay"
                  value={demoCiudad} onChange={e => setDemoCiudad(e.target.value)} />
              </div>
              <div>
                <div style={s.label}>Teléfono (opcional)</div>
                <input style={s.input} placeholder="+595 21 000000"
                  value={demoTel} onChange={e => setDemoTel(e.target.value)} />
              </div>
            </div>
            <button style={s.btn} onClick={runDemo}
              disabled={demoLoading || !demoName.trim() || !demoTipo.trim() || !demoCiudad.trim()}>
              {demoLoading ? "Generando demo... (30-60s)" : "Generar Demo"}
            </button>
          </div>

          {demoResult?.error && (
            <div style={{ ...s.card, borderColor: "#ef4444" }}>
              <span style={{ color: "#ef4444" }}>Error: {demoResult.error}</span>
            </div>
          )}

          {demoResult?.hasWebsite && (
            <div style={{ ...s.card, borderColor: "var(--amber)" }}>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>⚠️ Este negocio ya tiene web</div>
              <div style={{ fontSize: 13, marginBottom: 12 }}>
                {demoResult.business?.name} — <a href={demoResult.url} target="_blank" style={s.link}>{demoResult.url}</a>
              </div>
              <button style={s.btn} onClick={() => {
                setTab("audit");
                setAuditUrl(demoResult.url || "");
              }}>Auditar su web →</button>
            </div>
          )}

          {demoResult?.demoUrl && (
            <div style={{ ...s.card, borderColor: "var(--green)" }}>
              <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 8 }}>✅ Demo generada</div>
              <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 4 }}>
                {demoResult.business?.name} · {demoResult.business?.address}
              </div>
              {demoResult.business?.rating && (
                <div style={{ fontSize: 13, marginBottom: 12 }}>
                  ⭐ {demoResult.business.rating} · 📞 {demoResult.business.phone || "Sin teléfono"}
                </div>
              )}
              <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                <a href={demoResult.demoUrl} target="_blank" style={{ ...s.btn, textDecoration: "none", display: "inline-block" }}>
                  Ver Demo →
                </a>
                <button style={s.btnSec} onClick={() => navigator.clipboard.writeText(demoResult.demoUrl!)}>
                  Copiar link
                </button>
                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{demoResult.demoUrl}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TAB LEADS ── */}
      {tab === "leads" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h2 style={{ ...s.h2, margin: 0 }}>Demos generadas ({leads.length})</h2>
            <button style={s.btnSec} onClick={loadLeads}>↻ Actualizar</button>
          </div>

          {leadsLoading && <div style={{ color: "var(--text-muted)", fontSize: 13 }}>Cargando...</div>}

          {!leadsLoading && leads.length === 0 && (
            <div style={{ ...s.card, textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
              No hay demos generadas todavía. Ve a la pestaña "Generar Demo" para crear la primera.
            </div>
          )}

          {leads.map((lead, i) => (
            <div key={i} style={s.card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{lead.business}</div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{lead.address}</div>
                  {lead.rating && (
                    <div style={{ fontSize: 12, marginTop: 4 }}>
                      ⭐ {lead.rating} ({lead.reviewsTotal} reseñas) · 📞 {lead.telefono || "—"}
                    </div>
                  )}
                </div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", textAlign: "right" }}>
                  {new Date(lead.fecha).toLocaleDateString("es-ES")}
                </div>
              </div>
              <div style={{ marginTop: 12, display: "flex", gap: 10 }}>
                <a href={lead.demoUrl} target="_blank" style={{ ...s.btnSec, textDecoration: "none" }}>
                  Ver demo →
                </a>
                {lead.telefono && (
                  <a href={`https://wa.me/${lead.telefono.replace(/\D/g,"")}`} target="_blank"
                    style={{ ...s.btnSec, textDecoration: "none", color: "#25d366" }}>
                    WhatsApp
                  </a>
                )}
                <button style={s.btnSec} onClick={() => navigator.clipboard.writeText(lead.demoUrl)}>
                  Copiar link
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
