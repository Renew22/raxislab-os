"use client";
import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";

interface ClientData {
  name: string; slug: string; sector: string; logo?: string;
  website?: string; plan: string; status: string;
}
interface MetaMetrics { spend: string; leads: number; cpl: string; ctr: string; impressions: number; clicks: number; }
interface GoogleAudit { campaigns: any[]; keywords: any[]; seoPhrases: any[]; recommendations: any[]; }
interface Tab { id: string; label: string; emoji: string; }

const TABS: Tab[] = [
  { id: "resumen",   label: "Resumen",    emoji: "📊" },
  { id: "meta",      label: "Meta Ads",   emoji: "📣" },
  { id: "google",    label: "Google",     emoji: "🔍" },
  { id: "gmb",       label: "GMB",        emoji: "📍" },
  { id: "web",       label: "Web & SEO",  emoji: "🌐" },
  { id: "contenido", label: "Contenido",  emoji: "✍️" },
];

export default function ClienteDashboard() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const [tab, setTab] = useState("resumen");
  const [client, setClient] = useState<ClientData | null>(null);
  const [meta, setMeta] = useState<MetaMetrics | null>(null);
  const [audit, setAudit] = useState<GoogleAudit | null>(null);
  const [webScore, setWebScore] = useState<number | null>(null);
  const [loadingMeta, setLoadingMeta] = useState(false);
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [loadingWeb, setLoadingWeb] = useState(false);
  const [period, setPeriod] = useState("30");

  useEffect(() => {
    fetch("/api/auth/me").then(r => {
      if (!r.ok) router.push("/login-saas?next=/cliente/" + slug);
    });
    fetch(`/api/saas/client/${slug}`).then(r => r.json()).then(setClient);
  }, [slug, router]);

  const loadMeta = useCallback(async () => {
    setLoadingMeta(true);
    const r = await fetch(`/api/saas/client/${slug}/meta?days=${period}`);
    if (r.ok) setMeta(await r.json());
    setLoadingMeta(false);
  }, [slug, period]);

  const loadGoogle = useCallback(async () => {
    setLoadingAudit(true);
    const r = await fetch(`/api/saas/client/${slug}/google?days=${period}`);
    if (r.ok) setAudit(await r.json());
    setLoadingAudit(false);
  }, [slug, period]);

  const loadWeb = useCallback(async () => {
    if (!client?.website) return;
    setLoadingWeb(true);
    const r = await fetch(`/api/scanner?action=audit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: client.website }),
    });
    if (r.ok) {
      const d = await r.json();
      setWebScore(d.global_score?.score ?? null);
    }
    setLoadingWeb(false);
  }, [client]);

  useEffect(() => {
    if (tab === "meta" && !meta) loadMeta();
    if (tab === "google" && !audit) loadGoogle();
    if (tab === "web" && webScore === null) loadWeb();
  }, [tab, meta, audit, webScore, loadMeta, loadGoogle, loadWeb]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login-saas");
  }

  const scoreColor = (n: number) =>
    n >= 80 ? "var(--green)" : n >= 50 ? "var(--amber)" : "var(--red)";

  if (!client) return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: "24px", height: "24px", border: "2px solid var(--border)", borderTopColor: "var(--accent)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", fontFamily: "'Space Grotesk', sans-serif", color: "var(--text)" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* Header */}
      <header style={{ background: "var(--card)", borderBottom: "1px solid var(--border)", padding: "0 24px", height: "56px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <Image src="/raxislab-icon.svg" alt="Raxislab" width={32} height={32} />
          <div>
            <p style={{ fontSize: "14px", fontWeight: 700, margin: 0 }}>{client.name}</p>
            <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: 0, textTransform: "uppercase", letterSpacing: "0.06em" }}>{client.plan}</p>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <select
            value={period}
            onChange={e => { setPeriod(e.target.value); setMeta(null); setAudit(null); }}
            style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--text-mid)", fontSize: "12px", padding: "5px 10px", borderRadius: "6px", cursor: "pointer" }}
          >
            <option value="7">7 días</option>
            <option value="30">30 días</option>
            <option value="90">90 días</option>
          </select>
          <button onClick={logout} style={{ fontSize: "12px", color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer" }}>Salir</button>
        </div>
      </header>

      {/* Nav tabs */}
      <nav style={{ background: "var(--card)", borderBottom: "1px solid var(--border)", display: "flex", overflowX: "auto", padding: "0 24px" }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ padding: "14px 18px", fontSize: "13px", fontWeight: tab === t.id ? 600 : 400, color: tab === t.id ? "var(--accent)" : "var(--text-mid)", background: "none", border: "none", borderBottom: tab === t.id ? "2px solid var(--accent)" : "2px solid transparent", cursor: "pointer", whiteSpace: "nowrap", fontFamily: "inherit", display: "flex", alignItems: "center", gap: "6px" }}>
            {t.emoji} {t.label}
          </button>
        ))}
      </nav>

      {/* Content */}
      <main style={{ padding: "32px 24px", maxWidth: "1100px", margin: "0 auto" }}>

        {/* ── RESUMEN ── */}
        {tab === "resumen" && (
          <div>
            <h2 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "24px" }}>Vista general — últimos {period} días</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "32px" }}>
              {[
                { label: "Inversión Meta", value: meta?.spend ?? "—", color: "var(--accent)" },
                { label: "Leads generados", value: meta?.leads ?? "—", color: "var(--green)" },
                { label: "Coste por lead", value: meta?.cpl ?? "—", color: "var(--amber)" },
                { label: "Score web", value: webScore !== null ? `${webScore}/100` : "—", color: webScore ? scoreColor(webScore) : "var(--amber)" },
              ].map(stat => (
                <div key={stat.label} style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "12px", padding: "20px" }}>
                  <p style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.06em" }}>{stat.label}</p>
                  <p style={{ fontSize: "28px", fontWeight: 800, color: stat.color, fontFamily: "'Space Mono', monospace" }}>{String(stat.value)}</p>
                </div>
              ))}
            </div>

            {!meta && !loadingMeta && (
              <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "12px", padding: "24px", textAlign: "center" }}>
                <p style={{ color: "var(--text-mid)", marginBottom: "16px" }}>Carga tus métricas para ver el resumen completo</p>
                <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
                  <button onClick={loadMeta} style={{ padding: "10px 20px", background: "var(--accent)", color: "#fff", border: "none", borderRadius: "8px", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Cargar Meta Ads</button>
                  <button onClick={loadGoogle} style={{ padding: "10px 20px", background: "transparent", color: "var(--accent)", border: "1px solid var(--accent)", borderRadius: "8px", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Cargar Google</button>
                  <button onClick={loadWeb} style={{ padding: "10px 20px", background: "transparent", color: "var(--text-mid)", border: "1px solid var(--border)", borderRadius: "8px", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Auditar web</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── META ADS ── */}
        {tab === "meta" && (
          <div>
            <h2 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "24px" }}>Meta Ads</h2>
            {loadingMeta && <Spinner />}
            {meta && !loadingMeta && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
                {[
                  { label: "Inversión", value: meta.spend },
                  { label: "Leads", value: String(meta.leads) },
                  { label: "CPL", value: meta.cpl },
                  { label: "CTR", value: meta.ctr },
                  { label: "Clics", value: String(meta.clicks) },
                  { label: "Impresiones", value: String(meta.impressions) },
                ].map(s => (
                  <StatCard key={s.label} label={s.label} value={s.value} />
                ))}
              </div>
            )}
            {!meta && !loadingMeta && <EmptyState label="Meta Ads" onLoad={loadMeta} />}
          </div>
        )}

        {/* ── GOOGLE ── */}
        {tab === "google" && (
          <div>
            <h2 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "24px" }}>Google Ads + SEO</h2>
            {loadingAudit && <Spinner />}
            {audit && !loadingAudit && (
              <div>
                {audit.recommendations?.length > 0 && (
                  <div style={{ marginBottom: "24px" }}>
                    <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-muted)", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Recomendaciones</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      {audit.recommendations.slice(0, 8).map((r: any, i: number) => (
                        <div key={i} style={{ background: "var(--card)", border: `1px solid ${r.priority === "alta" ? "rgba(229,57,75,0.3)" : r.priority === "media" ? "rgba(255,184,0,0.3)" : "var(--border)"}`, borderRadius: "8px", padding: "12px 16px", fontSize: "13px" }}>
                          <span style={{ color: r.priority === "alta" ? "var(--red)" : r.priority === "media" ? "var(--amber)" : "var(--text-mid)", fontWeight: 700, fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.06em" }}>{r.priority} · </span>
                          <span style={{ color: "var(--text)" }}>{r.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {audit.campaigns?.length > 0 && (
                  <div>
                    <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-muted)", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Campañas activas</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      {audit.campaigns.map((c: any, i: number) => (
                        <div key={i} style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "8px", padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontSize: "13px" }}>{c.name}</span>
                          <div style={{ display: "flex", gap: "16px" }}>
                            <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>{c.cost_micros ? `${(c.cost_micros / 1_000_000).toFixed(0)}€` : "—"}</span>
                            <span style={{ fontSize: "12px", color: c.status === "ENABLED" ? "var(--green)" : "var(--text-muted)" }}>{c.status}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            {!audit && !loadingAudit && <EmptyState label="Google Ads + SEO" onLoad={loadGoogle} />}
          </div>
        )}

        {/* ── GMB ── */}
        {tab === "gmb" && (
          <div>
            <h2 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "24px" }}>Google Business Profile</h2>
            <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "12px", padding: "32px", textAlign: "center" }}>
              <p style={{ color: "var(--text-mid)", marginBottom: "8px" }}>Próximamente: reseñas, publicaciones y métricas de tu ficha</p>
              <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>Integración GMB en desarrollo</p>
            </div>
          </div>
        )}

        {/* ── WEB & SEO ── */}
        {tab === "web" && (
          <div>
            <h2 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "24px" }}>Web & SEO</h2>
            {loadingWeb && <Spinner />}
            {webScore !== null && !loadingWeb && (
              <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "12px", padding: "32px", textAlign: "center" }}>
                <p style={{ fontSize: "64px", fontWeight: 900, color: scoreColor(webScore), fontFamily: "'Space Mono', monospace", margin: 0 }}>{webScore}</p>
                <p style={{ color: "var(--text-mid)", marginTop: "8px" }}>Score global de tu web</p>
                <a href={client.website} target="_blank" rel="noreferrer" style={{ display: "inline-block", marginTop: "12px", fontSize: "12px", color: "var(--accent)" }}>{client.website}</a>
              </div>
            )}
            {webScore === null && !loadingWeb && <EmptyState label="Auditoría web" onLoad={loadWeb} />}
          </div>
        )}

        {/* ── CONTENIDO ── */}
        {tab === "contenido" && (
          <div>
            <h2 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "24px" }}>Contenido publicado</h2>
            <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "12px", padding: "32px", textAlign: "center" }}>
              <p style={{ color: "var(--text-mid)" }}>Posts, historias y campañas generadas para {client.name}</p>
              <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "8px" }}>Integración de contenido en desarrollo</p>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}

function Spinner() {
  return (
    <div style={{ display: "flex", justifyContent: "center", padding: "60px" }}>
      <div style={{ width: "28px", height: "28px", border: "2px solid var(--border)", borderTopColor: "var(--accent)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: "10px", padding: "18px" }}>
      <p style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "8px" }}>{label}</p>
      <p style={{ fontSize: "22px", fontWeight: 800, color: "var(--accent)", fontFamily: "'Space Mono', monospace", margin: 0 }}>{value}</p>
    </div>
  );
}

function EmptyState({ label, onLoad }: { label: string; onLoad: () => void }) {
  return (
    <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "12px", padding: "48px", textAlign: "center" }}>
      <p style={{ color: "var(--text-mid)", marginBottom: "16px" }}>Sin datos de {label} cargados</p>
      <button onClick={onLoad} style={{ padding: "10px 24px", background: "var(--accent)", color: "#fff", border: "none", borderRadius: "8px", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Cargar ahora</button>
    </div>
  );
}
