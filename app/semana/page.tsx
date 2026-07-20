"use client";
import { useState, useEffect, useCallback } from "react";
import { Calendar, CheckCircle, Circle, RefreshCw, ExternalLink, AlertTriangle, TrendingUp, FileText, Image, Star, Megaphone, Search } from "lucide-react";

/* ── Types ── */
interface WPPost { id: number; title: { rendered: string }; date?: string; modified?: string; status: string; link: string; excerpt?: { rendered: string } }
interface ClientData { scheduled: WPPost[]; drafts: WPPost[]; loading: boolean; error?: string }

/* ── Design tokens ── */
const C = {
  bg: "var(--bg)", card: "var(--card)", border: "var(--border)",
  accent: "var(--accent)", green: "var(--green)", red: "var(--red)", amber: "var(--amber)",
  text: "var(--text)", mid: "var(--text-mid)", muted: "var(--text-muted)",
  purple: "#a78bfa",
};
const S: Record<string, React.CSSProperties> = {
  page:     { background: "var(--bg)", minHeight: "100vh", padding: "32px 40px", fontFamily: "'Space Grotesk', sans-serif", color: "var(--text)" },
  card:     { background: "var(--card)", border: "1px solid var(--border)", borderRadius: "12px", padding: "20px" },
  btn:      { padding: "9px 18px", borderRadius: "8px", border: "none", background: "var(--accent)", color: "#fff", fontSize: "13px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" },
  btnGhost: { padding: "7px 14px", borderRadius: "6px", border: "1px solid var(--border)", background: "transparent", color: "var(--text-mid)", fontSize: "12px", cursor: "pointer", display: "flex", alignItems: "center", gap: "5px" },
  lbl:      { fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: "var(--text-muted)" },
  tag:      (color: string): React.CSSProperties => ({ display: "inline-flex", alignItems: "center", gap: "4px", padding: "3px 9px", borderRadius: "20px", fontSize: "10px", fontWeight: 700, background: `${color}18`, color, border: `1px solid ${color}33` }),
};

/* ── SEO weekly tasks per client ── */
const SEO_TASKS: Record<string, Array<{ id: string; text: string; icon: string; priority: "high" | "mid" | "low" }>> = {
  desancho: [
    { id: "d1", text: "Responder reseñas Google Business pendientes", icon: "⭐", priority: "high" },
    { id: "d2", text: "Subir 3–5 fotos nuevas a Google Business", icon: "📸", priority: "high" },
    { id: "d3", text: "Revisar posición 'peluquería Valencia' en Google (objetivo: top 3)", icon: "🔍", priority: "high" },
    { id: "d4", text: "Publicar un post en Google Business (oferta / novedad)", icon: "📢", priority: "mid" },
    { id: "d5", text: "Comprobar velocidad mobile desancho.com (PageSpeed >80)", icon: "⚡", priority: "mid" },
    { id: "d6", text: "Revisar Google Ads — CTR campañas activas", icon: "📊", priority: "mid" },
    { id: "d7", text: "Añadir enlace interno en el blog post de esta semana", icon: "🔗", priority: "low" },
    { id: "d8", text: "Comprobar tracking conversiones GA4 (0 conversiones = bug)", icon: "⚠️", priority: "high" },
  ],
  identity: [
    { id: "i1", text: "Responder reseñas Google Business pendientes", icon: "⭐", priority: "high" },
    { id: "i2", text: "Subir 3–5 fotos nuevas a Google Business", icon: "📸", priority: "high" },
    { id: "i3", text: "Revisar posición 'peluquería Valencia' en Google (objetivo: top 5)", icon: "🔍", priority: "high" },
    { id: "i4", text: "Publicar un post en Google Business", icon: "📢", priority: "mid" },
    { id: "i5", text: "Revisar Google Ads — campañas Bodas + Coloración (PAUSED → activar cuando confirme René)", icon: "📊", priority: "mid" },
    { id: "i6", text: "Actualizar Yoast SEO en wp-admin (pendiente)", icon: "🔧", priority: "high" },
    { id: "i7", text: "Comprobar GTM — pixel Meta correcto (duplicado eliminado esta semana)", icon: "✅", priority: "low" },
  ],
  lastmile: [
    { id: "l1", text: "Publicar contenido blog programado esta semana", icon: "📝", priority: "high" },
    { id: "l2", text: "Publicar post en Instagram (imagen 1080×1080)", icon: "📸", priority: "high" },
    { id: "l3", text: "Compartir post en LinkedIn de Last Mile", icon: "💼", priority: "mid" },
    { id: "l4", text: "Responder mensajes/comentarios redes sociales", icon: "💬", priority: "mid" },
  ],
  malvarrosa: [
    { id: "m1", text: "Diseñar 2 posts semana (HTML+CSS → screenshot)", icon: "🎨", priority: "high" },
    { id: "m2", text: "Diseñar 3 historias semana", icon: "📱", priority: "high" },
    { id: "m3", text: "Publicar según calendario 14 jul–28 ago", icon: "📅", priority: "high" },
  ],
};

const SOCIAL_TASKS: Record<string, Array<{ text: string; days: string }>> = {
  desancho: [
    { text: "Reel resultado de la semana (antes/después)", days: "Lun/Mar" },
    { text: "Story proceso en el salón (BTS)", days: "Mié" },
    { text: "Post informativo (balayage / alisado / tendencia)", days: "Jue" },
    { text: "Reel fin de semana (ambiente salón / equipo)", days: "Vie" },
  ],
  identity: [
    { text: "Reel resultado (coloración / balayage / corte)", days: "Lun/Mar" },
    { text: "Story BTS del salón + equipo", days: "Mié" },
    { text: "Post Christian Vendrell / equipo (humaniza la marca)", days: "Jue" },
    { text: "Reel inspiracional (tendencias 2026)", days: "Vie" },
  ],
  lastmile: [
    { text: "Reels vino/aceite (producto en mano, packaging, bodega)", days: "Mar" },
    { text: "Post catálogo producto de la semana", days: "Jue" },
    { text: "Story proceso de distribución / comerciales", days: "Vie" },
  ],
  malvarrosa: [
    { text: "Post partido / equipo (diseño HTML+CSS)", days: "Lun" },
    { text: "Post resultados / jugador destacado", days: "Mié" },
    { text: "Historia partido próximo (HH, lugar, rival)", days: "Vie" },
  ],
};

const CLIENTS = [
  { id: "desancho", label: "DeSancho",   color: "#f59e0b", url: "https://desancho.com",            gbp: "https://business.google.com" },
  { id: "identity", label: "Identity",   color: "#6366f1", url: "https://identitypeluqueros.com", gbp: "https://business.google.com" },
  { id: "lastmile", label: "Last Mile",  color: "#10b981", url: "https://lastmiledist.com",        gbp: "" },
  { id: "malvarrosa", label: "Malvarrosa", color: "#ef4444", url: "", gbp: "" },
] as const;

type ClientId = typeof CLIENTS[number]["id"];

/* ── Week helpers ── */
function getWeekDates(offset = 0) {
  const now = new Date();
  const day = now.getDay(); // 0 = Sunday
  const mon = new Date(now);
  mon.setDate(now.getDate() - (day === 0 ? 6 : day - 1) + offset * 7);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(mon);
    d.setDate(mon.getDate() + i);
    return d;
  });
}

function fmt(d: Date) { return d.toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "short" }); }
function fmtShort(d: Date) { return d.toLocaleDateString("es-ES", { day: "numeric", month: "short" }); }
function isToday(d: Date) { const t = new Date(); return d.toDateString() === t.toDateString(); }
function isThisWeek(dateStr: string, weekDates: Date[]) {
  const d = new Date(dateStr);
  return d >= weekDates[0] && d <= weekDates[6];
}

function stripHtml(html: string) { return html.replace(/<[^>]*>/g, "").trim().substring(0, 100); }

/* ══════════════════════════════════════════════════════════
   PAGE
══════════════════════════════════════════════════════════ */
export default function SemanaPage() {
  const [activeClient, setActiveClient] = useState<ClientId>("desancho");
  const [weekOffset, setWeekOffset] = useState(0);
  const [clientData, setClientData] = useState<Record<ClientId, ClientData>>({
    desancho:   { scheduled: [], drafts: [], loading: false },
    identity:   { scheduled: [], drafts: [], loading: false },
    lastmile:   { scheduled: [], drafts: [], loading: false },
    malvarrosa: { scheduled: [], drafts: [], loading: false },
  });
  const [done, setDone] = useState<Record<string, boolean>>({});
  const [storageKey] = useState("raxislab_semana_done_v1");

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) ?? "{}");
      // reset done status weekly
      const weekKey = `week_${new Date().toISOString().slice(0,10)}`;
      if (saved.__week !== weekKey) { setDone({ __week: weekKey }); localStorage.setItem(storageKey, JSON.stringify({ __week: weekKey })); }
      else setDone(saved);
    } catch { setDone({}); }
  }, [storageKey]);

  const toggleDone = useCallback((taskId: string) => {
    setDone(prev => {
      const next = { ...prev, [taskId]: !prev[taskId] };
      localStorage.setItem(storageKey, JSON.stringify(next));
      return next;
    });
  }, [storageKey]);

  const loadClient = useCallback(async (id: ClientId) => {
    if (id === "malvarrosa") return;
    setClientData(prev => ({ ...prev, [id]: { ...prev[id], loading: true, error: undefined } }));
    try {
      const r = await fetch(`/api/wp/scheduled?client=${id}`);
      const d = await r.json();
      setClientData(prev => ({ ...prev, [id]: { scheduled: d.scheduled ?? [], drafts: d.drafts ?? [], loading: false } }));
    } catch (e) {
      setClientData(prev => ({ ...prev, [id]: { ...prev[id], loading: false, error: String(e) } }));
    }
  }, []);

  useEffect(() => { loadClient(activeClient); }, [activeClient, loadClient]);

  const weekDates = getWeekDates(weekOffset);
  const client = CLIENTS.find(c => c.id === activeClient)!;
  const data = clientData[activeClient];
  const seoTasks = SEO_TASKS[activeClient] ?? [];
  const socialTasks = SOCIAL_TASKS[activeClient] ?? [];

  const thisWeekPosts = data.scheduled.filter(p => p.date && isThisWeek(p.date, weekDates));
  const nextWeekPosts = data.scheduled.filter(p => p.date && !isThisWeek(p.date, weekDates));
  const doneSeo = seoTasks.filter(t => done[t.id]).length;
  const totalSeo = seoTasks.length;

  return (
    <div style={S.page}>

      {/* ── Header ── */}
      <div style={{ marginBottom: "24px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: 700, margin: 0, display: "flex", alignItems: "center", gap: "10px" }}>
            <Calendar size={22} color={C.accent} /> Plan Semanal
          </h1>
          <p style={{ fontSize: "13px", color: C.muted, margin: "5px 0 0" }}>
            Blog · SEO · Social · GBP — todo en un sitio por cliente
          </p>
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <button style={S.btnGhost} onClick={() => setWeekOffset(w => w - 1)}>← Anterior</button>
          <span style={{ fontSize: "12px", color: C.mid, padding: "0 8px" }}>
            {fmtShort(weekDates[0])} – {fmtShort(weekDates[6])}
          </span>
          <button style={S.btnGhost} onClick={() => setWeekOffset(w => w + 1)}>Siguiente →</button>
          {weekOffset !== 0 && (
            <button style={{ ...S.btnGhost, color: C.accent }} onClick={() => setWeekOffset(0)}>Hoy</button>
          )}
        </div>
      </div>

      {/* ── Week calendar strip ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "6px", marginBottom: "24px" }}>
        {weekDates.map((d, i) => {
          const DAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
          const postsThisDay = data.scheduled.filter(p => p.date && new Date(p.date).toDateString() === d.toDateString());
          const isWE = i >= 5;
          return (
            <div key={i} style={{
              ...S.card,
              padding: "10px 12px",
              background: isToday(d) ? `${C.accent}15` : isWE ? `${C.border}50` : C.card,
              border: isToday(d) ? `1px solid ${C.accent}66` : `1px solid ${C.border}`,
              minHeight: "70px",
            }}>
              <div style={{ fontSize: "10px", fontWeight: 700, color: isToday(d) ? C.accent : C.muted, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "4px" }}>
                {DAYS[i]}
              </div>
              <div style={{ fontSize: "18px", fontWeight: 800, color: isToday(d) ? C.accent : C.text }}>
                {d.getDate()}
              </div>
              {postsThisDay.map((p, j) => (
                <div key={j} style={{ marginTop: "4px", fontSize: "9px", color: client.color, background: `${client.color}15`, borderRadius: "3px", padding: "2px 5px", fontWeight: 600, lineHeight: 1.3 }}>
                  📝 {p.title?.rendered?.replace(/&#\d+;/g, "").substring(0, 25)}…
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {/* ── Client tabs ── */}
      <div style={{ display: "flex", gap: "2px", marginBottom: "24px", borderBottom: `1px solid ${C.border}` }}>
        {CLIENTS.map(c => (
          <button key={c.id} onClick={() => setActiveClient(c.id)} style={{
            padding: "9px 18px", borderRadius: "6px 6px 0 0",
            border: "1px solid transparent",
            borderBottom: activeClient === c.id ? `1px solid ${C.card}` : "1px solid transparent",
            background: activeClient === c.id ? C.card : "transparent",
            color: activeClient === c.id ? c.color : C.muted,
            fontSize: "13px", fontWeight: activeClient === c.id ? 700 : 400, cursor: "pointer",
            fontFamily: "'Space Grotesk', sans-serif", marginBottom: activeClient === c.id ? "-1px" : 0,
          }}>
            <span style={{ display: "inline-block", width: "8px", height: "8px", borderRadius: "50%", background: c.color, marginRight: "7px", verticalAlign: "middle" }} />
            {c.label}
          </button>
        ))}
      </div>

      {/* ── Client content ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>

        {/* LEFT COL: Blog posts */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

          {/* Blog posts this week */}
          <div style={S.card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <FileText size={14} color={C.accent} />
                <span style={{ fontSize: "13px", fontWeight: 700 }}>Blog esta semana</span>
                {thisWeekPosts.length > 0 && (
                  <span style={S.tag(C.green)}>{thisWeekPosts.length} posts</span>
                )}
              </div>
              <button style={S.btnGhost} onClick={() => loadClient(activeClient)} disabled={data.loading}>
                <RefreshCw size={11} style={data.loading ? { animation: "spin 1s linear infinite" } : {}} />
                {data.loading ? "..." : "Sync"}
              </button>
            </div>

            {data.error && <p style={{ fontSize: "12px", color: C.red }}>⚠ {data.error}</p>}

            {thisWeekPosts.length === 0 && !data.loading && (
              <p style={{ fontSize: "12px", color: C.muted }}>Sin posts programados esta semana</p>
            )}

            {thisWeekPosts.map(p => (
              <div key={p.id} style={{ padding: "10px 12px", background: C.bg, borderRadius: "8px", border: `1px solid ${client.color}33`, marginBottom: "8px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: "12px", fontWeight: 700, margin: "0 0 3px", color: C.text }}
                      dangerouslySetInnerHTML={{ __html: p.title.rendered }} />
                    <p style={{ fontSize: "10px", color: C.muted, margin: 0 }}>
                      📅 {p.date ? new Date(p.date).toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "short" }) : "—"}
                    </p>
                    {p.excerpt?.rendered && (
                      <p style={{ fontSize: "11px", color: C.mid, margin: "4px 0 0" }}>{stripHtml(p.excerpt.rendered)}…</p>
                    )}
                  </div>
                  <a href={p.link} target="_blank" rel="noreferrer" style={S.btnGhost}>
                    <ExternalLink size={10} /> Ver
                  </a>
                </div>
              </div>
            ))}

            {/* Drafts */}
            {data.drafts.length > 0 && (
              <div style={{ marginTop: "12px" }}>
                <p style={{ ...S.lbl, marginBottom: "8px" }}>Borradores pendientes ({data.drafts.length})</p>
                {data.drafts.map(p => (
                  <div key={p.id} style={{ padding: "8px 12px", background: C.bg, borderRadius: "6px", border: `1px solid ${C.amber}22`, marginBottom: "6px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "12px", color: C.mid }}
                      dangerouslySetInnerHTML={{ __html: p.title.rendered }} />
                    <span style={S.tag(C.amber)}>borrador</span>
                  </div>
                ))}
              </div>
            )}

            {/* Upcoming scheduled */}
            {nextWeekPosts.length > 0 && (
              <div style={{ marginTop: "12px" }}>
                <p style={{ ...S.lbl, marginBottom: "8px" }}>Próximas semanas ({nextWeekPosts.length})</p>
                {nextWeekPosts.slice(0, 5).map(p => (
                  <div key={p.id} style={{ padding: "7px 12px", background: C.bg, borderRadius: "6px", border: `1px solid ${C.border}`, marginBottom: "5px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "11px", color: C.muted }}
                      dangerouslySetInnerHTML={{ __html: p.title.rendered }} />
                    <span style={{ fontSize: "10px", color: C.muted }}>
                      {p.date ? new Date(p.date).toLocaleDateString("es-ES", { day: "numeric", month: "short" }) : ""}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Social content plan */}
          <div style={S.card}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
              <Image size={14} color={C.purple} />
              <span style={{ fontSize: "13px", fontWeight: 700 }}>Contenido social esta semana</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
              {socialTasks.map((t, i) => {
                const key = `social_${activeClient}_${i}`;
                return (
                  <div key={i} onClick={() => toggleDone(key)} style={{ cursor: "pointer", display: "flex", gap: "10px", alignItems: "flex-start", padding: "9px 12px", background: done[key] ? `${C.green}0a` : C.bg, borderRadius: "8px", border: `1px solid ${done[key] ? C.green : C.border}33` }}>
                    {done[key]
                      ? <CheckCircle size={14} color={C.green} style={{ flexShrink: 0, marginTop: "1px" }} />
                      : <Circle size={14} color={C.muted} style={{ flexShrink: 0, marginTop: "1px" }} />}
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: "12px", color: done[key] ? C.muted : C.text, margin: 0, textDecoration: done[key] ? "line-through" : "none" }}>{t.text}</p>
                      <p style={{ fontSize: "10px", color: C.muted, margin: "2px 0 0" }}>{t.days}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT COL: SEO + GBP tasks */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

          {/* Progress */}
          <div style={{ ...S.card, display: "flex", gap: "20px", alignItems: "center" }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "28px", fontWeight: 800, color: doneSeo === totalSeo ? C.green : C.accent }}>{doneSeo}/{totalSeo}</div>
              <div style={{ fontSize: "10px", color: C.muted, fontWeight: 600, letterSpacing: "0.06em" }}>TAREAS SEO</div>
            </div>
            <div style={{ flex: 1, height: "8px", background: C.border, borderRadius: "4px", overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${(doneSeo/totalSeo)*100}%`, background: doneSeo === totalSeo ? C.green : C.accent, borderRadius: "4px", transition: "width 0.3s" }} />
            </div>
            {client.url && (
              <div style={{ display: "flex", gap: "6px" }}>
                <a href={client.url} target="_blank" rel="noreferrer" style={S.btnGhost}><ExternalLink size={10} /> Web</a>
                {client.gbp && <a href={client.gbp} target="_blank" rel="noreferrer" style={S.btnGhost}><Star size={10} /> GBP</a>}
              </div>
            )}
          </div>

          {/* SEO tasks */}
          <div style={S.card}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
              <Search size={14} color={C.accent} />
              <span style={{ fontSize: "13px", fontWeight: 700 }}>Tareas SEO / GBP</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
              {seoTasks.map(t => (
                <div key={t.id} onClick={() => toggleDone(t.id)} style={{ cursor: "pointer", display: "flex", gap: "10px", alignItems: "flex-start", padding: "9px 12px", background: done[t.id] ? `${C.green}0a` : t.priority === "high" ? `${C.red}05` : C.bg, borderRadius: "8px", border: `1px solid ${done[t.id] ? C.green : t.priority === "high" ? C.red : C.border}33` }}>
                  {done[t.id]
                    ? <CheckCircle size={14} color={C.green} style={{ flexShrink: 0, marginTop: "1px" }} />
                    : t.priority === "high"
                    ? <AlertTriangle size={14} color={C.red} style={{ flexShrink: 0, marginTop: "1px" }} />
                    : <Circle size={14} color={C.muted} style={{ flexShrink: 0, marginTop: "1px" }} />}
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: "12px", color: done[t.id] ? C.muted : C.text, margin: 0, textDecoration: done[t.id] ? "line-through" : "none" }}>
                      <span style={{ marginRight: "5px" }}>{t.icon}</span>{t.text}
                    </p>
                  </div>
                  {!done[t.id] && t.priority === "high" && <span style={S.tag(C.red)}>urgente</span>}
                </div>
              ))}
            </div>
          </div>

          {/* Positioning targets */}
          <div style={S.card}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
              <TrendingUp size={14} color={C.green} />
              <span style={{ fontSize: "13px", fontWeight: 700 }}>Objetivos de posicionamiento</span>
            </div>
            {activeClient === "desancho" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {[
                  { kw: "peluquería Valencia", pos: "4.5", obj: "1-3", trend: "↗" },
                  { kw: "alisado vegano Valencia", pos: "9.9", obj: "1-5", trend: "↗" },
                  { kw: "balayage Valencia", pos: "—", obj: "1-5", trend: "🆕" },
                  { kw: "coloración cabello Valencia", pos: "—", obj: "1-5", trend: "🆕" },
                  { kw: "corte escalonado Valencia", pos: "7.2", obj: "1-5", trend: "↗" },
                ].map(({ kw, pos, obj, trend }) => (
                  <div key={kw} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 10px", background: C.bg, borderRadius: "6px", border: `1px solid ${C.border}`, fontSize: "12px" }}>
                    <span style={{ color: C.mid }}>{kw}</span>
                    <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                      <span style={{ color: C.text, fontWeight: 700 }}>pos. {pos}</span>
                      <span style={{ color: C.green, fontSize: "10px" }}>→ obj. {obj}</span>
                      <span style={{ fontSize: "14px" }}>{trend}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {activeClient === "identity" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {[
                  { kw: "peluquería Valencia", pos: "sin datos", obj: "1-10", trend: "🆕" },
                  { kw: "balayage Valencia", pos: "sin datos", obj: "1-10", trend: "🆕" },
                  { kw: "peinados bodas Valencia", pos: "sin datos", obj: "1-5", trend: "🆕" },
                  { kw: "coloración cabello Valencia", pos: "sin datos", obj: "1-10", trend: "🆕" },
                  { kw: "airtouch Valencia", pos: "sin datos", obj: "1-5", trend: "🆕" },
                ].map(({ kw, pos, obj, trend }) => (
                  <div key={kw} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 10px", background: C.bg, borderRadius: "6px", border: `1px solid ${C.border}`, fontSize: "12px" }}>
                    <span style={{ color: C.mid }}>{kw}</span>
                    <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                      <span style={{ color: C.muted, fontWeight: 700 }}>{pos}</span>
                      <span style={{ color: C.green, fontSize: "10px" }}>→ obj. {obj}</span>
                      <span style={{ fontSize: "14px" }}>{trend}</span>
                    </div>
                  </div>
                ))}
                <div style={{ marginTop: "8px", padding: "10px 12px", background: `${C.amber}10`, borderRadius: "8px", border: `1px solid ${C.amber}33`, fontSize: "11px", color: C.amber }}>
                  ⚠ Schema Yoast decía "Madrid" — corregido en landing /peluqueria-valencia/ esta semana. Pendiente que René actualice Yoast en wp-admin para fix site-wide.
                </div>
              </div>
            )}
            {(activeClient === "lastmile" || activeClient === "malvarrosa") && (
              <p style={{ fontSize: "12px", color: C.muted }}>Posicionamiento orgánico no aplica como prioridad esta semana.</p>
            )}
          </div>

          {/* Quick links */}
          <div style={S.card}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
              <Megaphone size={14} color={C.amber} />
              <span style={{ fontSize: "13px", fontWeight: 700 }}>Accesos rápidos</span>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {activeClient === "desancho" && (<>
                <a href="https://desancho.com/wp-admin" target="_blank" rel="noreferrer" style={S.btnGhost}>🔧 wp-admin</a>
                <a href="https://ads.google.com" target="_blank" rel="noreferrer" style={S.btnGhost}>📊 Google Ads</a>
                <a href="https://www.facebook.com/adsmanager" target="_blank" rel="noreferrer" style={S.btnGhost}>📘 Meta Ads</a>
                <a href="https://search.google.com/search-console" target="_blank" rel="noreferrer" style={S.btnGhost}>🔍 Search Console</a>
                <a href="https://analytics.google.com" target="_blank" rel="noreferrer" style={S.btnGhost}>📈 GA4</a>
              </>)}
              {activeClient === "identity" && (<>
                <a href="https://identitypeluqueros.com/wp-admin" target="_blank" rel="noreferrer" style={S.btnGhost}>🔧 wp-admin</a>
                <a href="https://ads.google.com" target="_blank" rel="noreferrer" style={S.btnGhost}>📊 Google Ads</a>
                <a href="https://www.facebook.com/adsmanager" target="_blank" rel="noreferrer" style={S.btnGhost}>📘 Meta Ads</a>
                <a href="https://tagmanager.google.com" target="_blank" rel="noreferrer" style={S.btnGhost}>🏷 GTM</a>
              </>)}
              {activeClient === "lastmile" && (<>
                <a href="https://lastmiledist.com/wp-admin" target="_blank" rel="noreferrer" style={S.btnGhost}>🔧 wp-admin</a>
              </>)}
            </div>
          </div>

        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  );
}
