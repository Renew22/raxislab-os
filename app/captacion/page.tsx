"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, X, Trash2, ChevronRight, Search, Zap, RefreshCw, Phone, Star, Globe, ExternalLink, Copy, CheckCircle } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Lead {
  id: string;
  negocio: string;
  sector: string;
  ciudad: string;
  contacto: string;
  como_llego: string;
  necesita: string;
  notas: string;
  columna: "Nuevo" | "Contactado" | "Propuesta" | "Cerrado";
  created_at: string;
  updated_at: string;
}

type Columna = "Nuevo" | "Contactado" | "Propuesta" | "Cerrado";

// ── Config ────────────────────────────────────────────────────────────────────

// ── Tipos Buscar ─────────────────────────────────────────────────────────────

interface Prospecto {
  placeId: string;
  name: string;
  address: string;
  phone: string | null;
  rating: number | null;
  reviewsTotal: number;
  hasRealWebsite: boolean;
  socialLink: string | null;
  demoUrl?: string;
  demoGenerating?: boolean;
  emailSent?: boolean;
}

const CATEGORIAS_BUSQUEDA = [
  "Peluquería", "Salón de belleza", "Barbería", "Restaurante", "Bar",
  "Cafetería", "Gimnasio", "Clínica dental", "Fisioterapia", "Estética",
  "Floristería", "Pastelería", "Panadería", "Tienda de ropa", "Ferretería",
  "Fontanería", "Electricista", "Academia", "Autoescuela", "Inmobiliaria",
];

const COLUMNAS: Columna[] = ["Nuevo", "Contactado", "Propuesta", "Cerrado"];

const COL_COLORS: Record<Columna, string> = {
  Nuevo:      "var(--accent)",
  Contactado: "var(--amber)",
  Propuesta:  "#a78bfa",
  Cerrado:    "var(--green)",
};

const SECTORES = [
  "Peluquería / Estética", "Restauración / Hostelería", "Deporte / Gimnasio",
  "Clínica / Salud", "Retail / Tienda", "Inmobiliaria", "Educación / Academia",
  "Servicios profesionales", "Construcción / Reformas", "Automoción",
  "Distribución / Logística", "Tecnología", "Otro",
];

const CANALES = [
  "Referido / Recomendación", "LinkedIn", "Instagram", "Web", "Llamada fría",
  "Evento / Networking", "Google", "WhatsApp", "Otro",
];

const COMPETENCIA = [
  { nombre: "Webs.com", servicios: "Web + SEO básico", diferencial: "Precio bajo", capta: "Google Ads", punto_debil: "Sin IA, templates genéricos" },
  { nombre: "Suommo", servicios: "Redes + SEO", diferencial: "Agencia local Valencia", capta: "Referidos", punto_debil: "No hacen campañas Meta avanzadas" },
  { nombre: "Rocket Content", servicios: "Contenido + RRSS", diferencial: "Producción audiovisual", capta: "Instagram", punto_debil: "Sin datos ni automatización" },
  { nombre: "Conintex", servicios: "Web + SEM", diferencial: "Google Partner", capta: "Google Ads", punto_debil: "Sin Meta, sin IA" },
  { nombre: "Agencias genéricas", servicios: "Pack estándar", diferencial: "Precio", capta: "Directorios", punto_debil: "Sin personalización, sin resultados medibles" },
];

const OPORTUNIDADES = [
  { oportunidad: "IA integrada en reportes", detalle: "Ninguna agencia local genera reportes narrativos con IA. Raxislab lo hace automático.", prioridad: "Alta" },
  { oportunidad: "Fondeo de trading como servicio extra", detalle: "Perfil inversor que habla su idioma. Único en agencias locales.", prioridad: "Media" },
  { oportunidad: "Automatización real de reseñas", detalle: "Las agencias lo prometen pero no lo ejecutan. Nuestro flow de reseñas es real.", prioridad: "Alta" },
  { oportunidad: "Sistema de fidelización (Raxis Club)", detalle: "Ninguna agencia ofrece SaaS de puntos propio. Alto ticket + recurrencia.", prioridad: "Alta" },
  { oportunidad: "Transparencia total con dashboard", detalle: "Clientes ven en tiempo real sus métricas. Confianza diferencial.", prioridad: "Media" },
  { oportunidad: "Sector hostelería & turismo Levante", detalle: "Costa Blanca + Ibiza sin agencias especializadas en temporada. Ripieno como referencia.", prioridad: "Alta" },
];

// ── Estilos ───────────────────────────────────────────────────────────────────

const CARD: React.CSSProperties = { background: "var(--card)", border: "1px solid var(--border)", borderRadius: "8px", padding: "16px" };
const LABEL: React.CSSProperties = { fontSize: "11px", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: "var(--text-muted)" };
const INPUT: React.CSSProperties = { width: "100%", padding: "8px 11px", borderRadius: "6px", border: "1px solid var(--border)", background: "var(--bg)", color: "var(--text)", fontSize: "13px", outline: "none", boxSizing: "border-box" as const };

// ── Componente principal ──────────────────────────────────────────────────────

export default function CaptacionPage() {
  const [tab, setTab]       = useState<"buscar" | "pipeline" | "competencia" | "oportunidades">("buscar");
  const [leads, setLeads]   = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<Columna | null>(null);

  const [form, setForm] = useState({
    negocio: "", sector: SECTORES[0], ciudad: "", contacto: "",
    como_llego: CANALES[0], necesita: "", notas: "",
  });
  const [saving, setSaving] = useState(false);

  // ── Buscar prospectos ──────────────────────────────────────────────────────
  const [buscarCategory, setBuscarCategory] = useState("Peluquería");
  const [buscarCustom,   setBuscarCustom]   = useState("");
  const [buscarCity,     setBuscarCity]     = useState("Valencia");
  const [buscarMode,     setBuscarMode]     = useState<"all"|"sinweb">("all");
  const [buscando,       setBuscando]       = useState(false);
  const [prospectos,     setProspectos]     = useState<Prospecto[]>([]);
  const [buscarErr,      setBuscarErr]      = useState("");
  const [copied,         setCopied]         = useState<string | null>(null);
  const [emailModal,     setEmailModal]     = useState<Prospecto | null>(null);
  const [emailAddr,      setEmailAddr]      = useState("");
  const [emailSending,   setEmailSending]   = useState(false);
  const [auditando,      setAuditando]      = useState<string | null>(null);
  const [audits,         setAudits]         = useState<Record<string, {score:number;lcp:string;issues:string[]}>>({});

  const categoryFinal = buscarCustom.trim() || buscarCategory;

  async function buscarProspectos() {
    setBuscando(true); setProspectos([]); setBuscarErr(""); setAudits({});
    try {
      const r = await fetch("/api/captacion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category: categoryFinal, city: buscarCity, mode: buscarMode, maxResults: 20 }),
      });
      const d = await r.json();
      if (d.error) setBuscarErr(d.error);
      else setProspectos(d.results || []);
    } catch { setBuscarErr("Error de conexión"); }
    finally { setBuscando(false); }
  }

  async function auditarWeb(p: Prospecto) {
    if (!p.website) return;
    setAuditando(p.placeId);
    try {
      const r = await fetch("http://167.233.72.200:8880/api/audit-scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: p.website }),
      });
      const d = await r.json();
      setAudits(prev => ({ ...prev, [p.placeId]: {
        score: d.score || 0,
        lcp: d.pagespeed?.mobile?.lcp || "?",
        issues: (d.issues || []).slice(0, 3),
      }}));
    } catch { setAudits(prev => ({ ...prev, [p.placeId]: { score: 0, lcp: "error", issues: [] } })); }
    finally { setAuditando(null); }
  }

  function waMessage(p: Prospecto) {
    const msg = `Hola ${p.name}, soy René de RaxisLab. Vi que su negocio aparece en Google Maps y creo que podemos ayudarles a conseguir más clientes. ¿Tienen unos minutos para hablar? 🙌`;
    return `https://wa.me/${(p.phone || "").replace(/\D/g, "")}?text=${encodeURIComponent(msg)}`;
  }

  function addToPipeline(p: Prospecto) {
    setForm(f => ({ ...f, negocio: p.name, ciudad: buscarCity, sector: categoryFinal, contacto: p.phone || "", necesita: p.oportunidades?.[0] || "Sin definir" }));
    setModalOpen(true);
  }

  async function generarDemo(p: Prospecto) {
    setProspectos(prev => prev.map(x => x.placeId === p.placeId ? { ...x, demoGenerating: true } : x));
    try {
      const r = await fetch("/api/audit/demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ business: `${p.name} ${buscarCity}` }),
      });
      const d = await r.json();
      setProspectos(prev => prev.map(x =>
        x.placeId === p.placeId ? { ...x, demoGenerating: false, demoUrl: d.demoUrl || undefined } : x
      ));
    } catch {
      setProspectos(prev => prev.map(x => x.placeId === p.placeId ? { ...x, demoGenerating: false } : x));
    }
  }

  function copyLink(url: string, id: string) {
    navigator.clipboard.writeText(url);
    setCopied(id); setTimeout(() => setCopied(null), 2000);
  }

  async function enviarEmail(p: Prospecto, email: string) {
    if (!p.demoUrl || !email) return;
    setEmailSending(true);
    try {
      await fetch("/api/brevo/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: email,
          subject: `${p.name} — tu web ya está lista (mírala aquí)`,
          html: `<p>Hola,</p>
<p>He preparado una demo de cómo podría quedar la web de <strong>${p.name}</strong> con tu información real de Google.</p>
<p><a href="${p.demoUrl}" style="background:#1E9BF0;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;">Ver mi demo web →</a></p>
<p>La demo caduca en 14 días. Si te gusta lo que ves, podemos hablar — sin compromiso.</p>
<p>Un saludo,<br>René · RaxisLab<br>WhatsApp: +34 654 835 593</p>`,
        }),
      });
      setProspectos(prev => prev.map(x => x.placeId === p.placeId ? { ...x, emailSent: true } : x));
      setEmailModal(null); setEmailAddr("");
    } finally { setEmailSending(false); }
  }

  const loadLeads = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/leads");
      const d = await r.json();
      setLeads(d.leads ?? []);
    } catch { setError("No se pudo conectar al servidor de leads"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadLeads(); }, [loadLeads]);

  async function createLead() {
    if (!form.negocio.trim()) return;
    setSaving(true);
    try {
      const r = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const d = await r.json();
      if (d.lead) { setLeads(prev => [d.lead, ...prev]); setModalOpen(false); setForm({ negocio:"", sector:SECTORES[0], ciudad:"", contacto:"", como_llego:CANALES[0], necesita:"", notas:"" }); }
    } catch { setError("Error al crear lead"); }
    finally { setSaving(false); }
  }

  async function moveCol(id: string, columna: Columna) {
    setLeads(prev => prev.map(l => l.id === id ? { ...l, columna } : l));
    await fetch(`/api/leads?id=${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ columna }),
    });
  }

  async function updateNotes(id: string, notas: string) {
    setLeads(prev => prev.map(l => l.id === id ? { ...l, notas } : l));
    await fetch(`/api/leads?id=${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notas }),
    });
  }

  async function deleteLead(id: string) {
    setLeads(prev => prev.filter(l => l.id !== id));
    if (selectedLead?.id === id) setSelectedLead(null);
    await fetch(`/api/leads?id=${id}`, { method: "DELETE" });
  }

  function onDragStart(id: string) { setDragging(id); }
  function onDragEnd() { setDragging(null); setDragOver(null); }
  function onDragOver(e: React.DragEvent, col: Columna) { e.preventDefault(); setDragOver(col); }
  async function onDrop(col: Columna) {
    if (dragging && dragging !== leads.find(l => l.id === dragging)?.columna) {
      await moveCol(dragging, col);
    }
    setDragging(null); setDragOver(null);
  }

  const byCol = (col: Columna) => leads.filter(l => l.columna === col);

  return (
    <div style={{ padding: "32px 40px" }}>
      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"24px" }}>
        <div>
          <h1 style={{ fontSize:"24px", fontWeight:600, color:"var(--text)", margin:0 }}>Captación</h1>
          <p style={{ fontSize:"13px", color:"var(--text-muted)", margin:"4px 0 0" }}>{leads.length} leads · {byCol("Cerrado").length} cerrados</p>
        </div>
        <button onClick={() => setModalOpen(true)}
          style={{ display:"flex", alignItems:"center", gap:"6px", padding:"9px 18px", borderRadius:"8px", background:"var(--accent)", color:"#fff", fontSize:"13px", fontWeight:600, border:"none", cursor:"pointer" }}>
          <Plus size={15}/> Nuevo lead
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display:"flex", gap:"4px", marginBottom:"24px", borderBottom:"1px solid var(--border)", paddingBottom:"0" }}>
        {([["buscar","Buscar prospectos"], ["pipeline","Pipeline"], ["competencia","Competencia"], ["oportunidades","Oportunidades"]] as const).map(([k, label]) => (
          <button key={k} onClick={() => setTab(k)}
            style={{ padding:"8px 16px", borderRadius:"6px 6px 0 0", border:"none", background:tab===k?"var(--card)":"transparent", color:tab===k?"var(--accent)":"var(--text-muted)", fontSize:"13px", fontWeight:tab===k?600:400, cursor:"pointer", borderBottom:tab===k?"2px solid var(--accent)":"2px solid transparent", marginBottom:"-1px" }}>
            {label}
          </button>
        ))}
      </div>

      {/* ══════ BUSCAR PROSPECTOS ══════ */}
      {tab === "buscar" && (
        <div style={{ display:"flex", flexDirection:"column", gap:"20px" }}>
          {/* Intro */}
          <div style={{ ...CARD, background:"rgba(30,155,240,0.04)", border:"1px solid rgba(30,155,240,0.15)" }}>
            <p style={{ fontSize:"13px", color:"var(--text-mid)", lineHeight:1.7, margin:0 }}>
              <strong style={{ color:"var(--accent)" }}>Score de presencia digital de cualquier sector y ciudad.</strong> Busca en Google Maps — cada negocio recibe un score 0-100 (web, redes, reseñas, rating). Los de menor score = más oportunidad. Envía WhatsApp con mensaje listo, genera demo web, audita su web existente o añade al pipeline.
            </p>
          </div>

          {/* Búsqueda */}
          <div style={CARD}>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 0.8fr auto", gap:"12px", alignItems:"flex-end" }}>
              <div>
                <p style={{ fontSize:"11px", fontWeight:600, letterSpacing:"0.08em", color:"var(--text-muted)", textTransform:"uppercase", margin:"0 0 5px" }}>Sector (libre o predefinido)</p>
                <input value={buscarCustom} onChange={e => setBuscarCustom(e.target.value)}
                  placeholder={buscarCategory}
                  onKeyDown={e => e.key === "Enter" && buscarProspectos()}
                  style={INPUT} />
                <select value={buscarCategory} onChange={e => { setBuscarCategory(e.target.value); setBuscarCustom(""); }}
                  style={{ ...INPUT, marginTop:"5px", fontSize:"11px" }}>
                  {CATEGORIAS_BUSQUEDA.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <p style={{ fontSize:"11px", fontWeight:600, letterSpacing:"0.08em", color:"var(--text-muted)", textTransform:"uppercase", margin:"0 0 5px" }}>Ciudad</p>
                <input value={buscarCity} onChange={e => setBuscarCity(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && buscarProspectos()}
                  placeholder="Valencia" style={INPUT} />
              </div>
              <div>
                <p style={{ fontSize:"11px", fontWeight:600, letterSpacing:"0.08em", color:"var(--text-muted)", textTransform:"uppercase", margin:"0 0 5px" }}>Filtro</p>
                <select value={buscarMode} onChange={e => setBuscarMode(e.target.value as "all"|"sinweb")} style={INPUT}>
                  <option value="all">Todos (por oportunidad)</option>
                  <option value="sinweb">Solo sin web</option>
                </select>
              </div>
              <button onClick={buscarProspectos} disabled={buscando}
                style={{ padding:"9px 20px", borderRadius:"8px", border:"none", background:buscando?"var(--border)":"var(--accent)", color:"#fff", fontSize:"13px", fontWeight:700, cursor:buscando?"not-allowed":"pointer", display:"flex", alignItems:"center", gap:"7px", height:"38px", alignSelf:"flex-end", whiteSpace:"nowrap" }}>
                {buscando ? <RefreshCw size={14} style={{ animation:"spin 1s linear infinite" }} /> : <Search size={14} />}
                {buscando ? "Buscando..." : "Buscar"}
              </button>
            </div>
            {buscando && <p style={{ fontSize:"12px", color:"var(--text-muted)", margin:"10px 0 0" }}>Consultando Google Maps · obteniendo detalles · calculando oportunidades (~15 seg)</p>}
            {buscarErr && <p style={{ fontSize:"13px", color:"var(--red)", margin:"10px 0 0" }}>⚠ {buscarErr}</p>}
          </div>

          {/* Resultados */}
          {prospectos.length > 0 && (
            <div>
              <p style={{ fontSize:"13px", color:"var(--text-muted)", margin:"0 0 12px" }}>
                {prospectos.length} negocios en <strong style={{ color:"var(--text)" }}>{categoryFinal}</strong> · {buscarCity} — ordenados por menor presencia digital (más oportunidad)
              </p>
              <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
                {prospectos.map(p => {
                  const sc = (p as Prospecto & { presenciaScore?: number; oportunidades?: string[]; website?: string }).presenciaScore ?? 0;
                  const ops = (p as Prospecto & { oportunidades?: string[] }).oportunidades ?? [];
                  const scoreColor = sc < 30 ? "var(--red)" : sc < 60 ? "var(--amber)" : "var(--green)";
                  const audit = audits[p.placeId];
                  return (
                  <div key={p.placeId} style={{ ...CARD, display:"flex", gap:"16px", alignItems:"flex-start" }}>
                    {/* Score badge */}
                    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", flexShrink:0, minWidth:"52px" }}>
                      <div style={{ width:"48px", height:"48px", borderRadius:"50%", background:`${scoreColor}18`, border:`2px solid ${scoreColor}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"14px", fontWeight:700, color:scoreColor }}>
                        {sc}
                      </div>
                      <span style={{ fontSize:"9px", color:"var(--text-muted)", marginTop:"3px", textTransform:"uppercase", letterSpacing:"0.05em" }}>presencia</span>
                    </div>

                    {/* Info */}
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:"8px", flexWrap:"wrap" }}>
                        <p style={{ fontSize:"14px", fontWeight:700, color:"var(--text)", margin:0 }}>{p.name}</p>
                        {p.rating && <span style={{ display:"flex", alignItems:"center", gap:"3px", fontSize:"12px", color:"var(--amber)" }}><Star size={11} fill="var(--amber)" />{p.rating.toFixed(1)} ({p.reviewsTotal})</span>}
                        {p.emailSent && <span style={{ fontSize:"10px", padding:"2px 7px", borderRadius:"999px", background:"rgba(0,230,118,0.1)", color:"var(--green)", border:"1px solid rgba(0,230,118,0.2)" }}>Email enviado</span>}
                      </div>
                      {p.address && <p style={{ fontSize:"12px", color:"var(--text-muted)", margin:"3px 0 0" }}>{p.address}</p>}
                      {p.phone && <p style={{ fontSize:"12px", color:"var(--text-mid)", margin:"3px 0 0", display:"flex", alignItems:"center", gap:"5px" }}><Phone size={11}/>{p.phone}</p>}

                      {/* Oportunidades */}
                      {ops.length > 0 && (
                        <div style={{ display:"flex", gap:"5px", flexWrap:"wrap", marginTop:"6px" }}>
                          {ops.map(o => (
                            <span key={o} style={{ fontSize:"10px", padding:"2px 7px", borderRadius:"999px", background:"rgba(239,68,68,0.08)", color:"var(--red)", border:"1px solid rgba(239,68,68,0.2)", fontWeight:500 }}>{o}</span>
                          ))}
                        </div>
                      )}

                      {/* Resultado auditoría web */}
                      {audit && (
                        <div style={{ marginTop:"8px", padding:"8px 10px", background:"var(--bg)", borderRadius:"6px", border:"1px solid var(--border)", fontSize:"12px" }}>
                          <span style={{ fontWeight:600, color: audit.score < 50 ? "var(--red)" : "var(--amber)" }}>Score web: {audit.score}/100</span>
                          <span style={{ color:"var(--text-muted)", marginLeft:"10px" }}>LCP: {audit.lcp}</span>
                          {audit.issues.length > 0 && <p style={{ margin:"4px 0 0", color:"var(--text-muted)" }}>{audit.issues.join(" · ")}</p>}
                        </div>
                      )}

                      {/* Demo URL */}
                      {p.demoUrl && (
                        <div style={{ display:"flex", alignItems:"center", gap:"8px", marginTop:"8px", padding:"8px 10px", background:"var(--bg)", borderRadius:"6px", border:"1px solid rgba(30,155,240,0.3)" }}>
                          <a href={p.demoUrl} target="_blank" rel="noreferrer" style={{ fontSize:"12px", color:"var(--accent)", textDecoration:"none", flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", fontFamily:"monospace" }}>{p.demoUrl}</a>
                          <button onClick={() => copyLink(p.demoUrl!, p.placeId)} style={{ padding:"4px 8px", borderRadius:"4px", border:"1px solid var(--border)", background:"transparent", color:"var(--text-muted)", fontSize:"11px", cursor:"pointer", display:"flex", alignItems:"center", gap:"4px" }}>
                            {copied === p.placeId ? <CheckCircle size={10} color="var(--green)" /> : <Copy size={10} />}
                            {copied === p.placeId ? "Copiado" : "Copiar"}
                          </button>
                          <a href={p.demoUrl} target="_blank" rel="noreferrer" style={{ padding:"4px 8px", borderRadius:"4px", border:"1px solid var(--border)", background:"transparent", color:"var(--text-muted)", fontSize:"11px", cursor:"pointer", display:"flex", alignItems:"center", gap:"4px", textDecoration:"none" }}><ExternalLink size={10}/> Ver</a>
                          <button onClick={() => setEmailModal(p)} style={{ padding:"4px 10px", borderRadius:"4px", border:"none", background:"var(--accent)", color:"#fff", fontSize:"11px", cursor:"pointer" }}>Email</button>
                        </div>
                      )}
                    </div>

                    {/* Acciones */}
                    <div style={{ display:"flex", flexDirection:"column", gap:"6px", flexShrink:0 }}>
                      {/* WhatsApp con mensaje pre-llenado */}
                      {p.phone && (
                        <a href={waMessage(p)} target="_blank" rel="noreferrer"
                          style={{ padding:"7px 12px", borderRadius:"6px", border:"none", background:"#25D366", color:"#fff", fontSize:"12px", fontWeight:600, cursor:"pointer", display:"flex", alignItems:"center", gap:"5px", textDecoration:"none", whiteSpace:"nowrap" }}>
                          <Globe size={12}/> WhatsApp
                        </a>
                      )}
                      {/* Demo */}
                      {!p.demoUrl && !p.hasRealWebsite && (
                        <button onClick={() => generarDemo(p)} disabled={p.demoGenerating}
                          style={{ padding:"7px 12px", borderRadius:"6px", border:"none", background:p.demoGenerating?"var(--border)":"var(--accent)", color:"#fff", fontSize:"12px", fontWeight:600, cursor:p.demoGenerating?"not-allowed":"pointer", display:"flex", alignItems:"center", gap:"5px", whiteSpace:"nowrap" }}>
                          {p.demoGenerating ? <RefreshCw size={12} style={{ animation:"spin 1s linear infinite" }}/> : <Zap size={12}/>}
                          {p.demoGenerating ? "Demo..." : "Demo web"}
                        </button>
                      )}
                      {/* Auditar web existente */}
                      {(p as Prospecto & {website?:string}).website && !audit && (
                        <button onClick={() => auditarWeb(p as Prospecto & {website:string})} disabled={auditando === p.placeId}
                          style={{ padding:"7px 12px", borderRadius:"6px", border:"1px solid var(--border)", background:"transparent", color:"var(--text-mid)", fontSize:"12px", cursor:"pointer", display:"flex", alignItems:"center", gap:"5px", whiteSpace:"nowrap" }}>
                          {auditando===p.placeId ? <RefreshCw size={12} style={{ animation:"spin 1s linear infinite" }}/> : <Search size={12}/>}
                          {auditando===p.placeId ? "Auditando..." : "Auditar web"}
                        </button>
                      )}
                      {/* Añadir al pipeline */}
                      <button onClick={() => addToPipeline(p)}
                        style={{ padding:"7px 12px", borderRadius:"6px", border:"1px solid var(--border)", background:"transparent", color:"var(--text-muted)", fontSize:"12px", cursor:"pointer", display:"flex", alignItems:"center", gap:"5px", whiteSpace:"nowrap" }}>
                        <Plus size={12}/> Pipeline
                      </button>
                    </div>
                  </div>
                  );
                })}
              </div>
            </div>
          )}

          {!buscando && prospectos.length === 0 && !buscarErr && (
            <div style={{ textAlign:"center", padding:"48px 24px", color:"var(--text-muted)", fontSize:"13px" }}>
              Escribe sector y ciudad — verás todos los negocios con su score de presencia digital
            </div>
          )}
        </div>
      )}

      {/* Email Modal */}
      {emailModal && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.6)", zIndex:500, display:"flex", alignItems:"center", justifyContent:"center" }}
          onClick={e => { if (e.target === e.currentTarget) setEmailModal(null); }}>
          <div style={{ ...CARD, width:460, maxWidth:"94vw" }}>
            <p style={{ fontSize:"15px", fontWeight:700, color:"var(--text)", margin:"0 0 4px" }}>Enviar demo por email</p>
            <p style={{ fontSize:"12px", color:"var(--text-muted)", margin:"0 0 16px" }}>{emailModal.name}</p>
            <p style={{ fontSize:"11px", fontWeight:600, letterSpacing:"0.08em", color:"var(--text-muted)", textTransform:"uppercase", margin:"0 0 5px" }}>Email del negocio</p>
            <input value={emailAddr} onChange={e => setEmailAddr(e.target.value)}
              placeholder="info@negocio.com" style={{ ...INPUT, marginBottom:"12px" }} />
            <div style={{ padding:"10px 12px", background:"var(--bg)", borderRadius:"6px", border:"1px solid var(--border)", fontSize:"12px", color:"var(--text-muted)", marginBottom:"16px" }}>
              <p style={{ margin:"0 0 4px", fontWeight:600, color:"var(--text-mid)" }}>Asunto: {emailModal.name} — tu web ya está lista (mírala aquí)</p>
              <p style={{ margin:0 }}>Demo URL: {emailModal.demoUrl}</p>
            </div>
            <div style={{ display:"flex", gap:"8px" }}>
              <button onClick={() => setEmailModal(null)} style={{ flex:1, padding:"9px", borderRadius:"6px", border:"1px solid var(--border)", background:"transparent", color:"var(--text-muted)", cursor:"pointer", fontSize:"13px" }}>Cancelar</button>
              <button onClick={() => enviarEmail(emailModal, emailAddr)} disabled={emailSending || !emailAddr.includes("@")}
                style={{ flex:2, padding:"9px", borderRadius:"6px", border:"none", background:emailSending||!emailAddr.includes("@")?"var(--border)":"var(--accent)", color:"#fff", cursor:"pointer", fontSize:"13px", fontWeight:600 }}>
                {emailSending ? "Enviando..." : "Enviar email"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pipeline Kanban */}
      {tab === "pipeline" && (
        <div>
          {error && <div style={{ padding:"12px 16px", background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.2)", borderRadius:"6px", color:"var(--red)", fontSize:"13px", marginBottom:"16px" }}>{error}</div>}
          {loading ? (
            <p style={{ color:"var(--text-muted)", fontSize:"13px" }}>Cargando leads...</p>
          ) : (
            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"12px" }}>
              {COLUMNAS.map(col => (
                <div key={col}
                  onDragOver={e => onDragOver(e, col)}
                  onDrop={() => onDrop(col)}
                  style={{ minHeight:"400px", background: dragOver===col ? "rgba(255,255,255,0.04)" : "var(--bg)", borderRadius:"10px", border:`1px solid ${dragOver===col?"var(--border-accent)":"var(--border)"}`, padding:"12px", transition:"border-color 0.15s" }}>

                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"12px" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:"6px" }}>
                      <div style={{ width:"8px", height:"8px", borderRadius:"50%", background:COL_COLORS[col] }}/>
                      <span style={{ fontSize:"12px", fontWeight:600, color:"var(--text)" }}>{col}</span>
                    </div>
                    <span style={{ fontSize:"11px", color:"var(--text-muted)", fontFamily:"monospace" }}>{byCol(col).length}</span>
                  </div>

                  <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
                    {byCol(col).map(lead => (
                      <div key={lead.id}
                        draggable
                        onDragStart={() => onDragStart(lead.id)}
                        onDragEnd={onDragEnd}
                        onClick={() => setSelectedLead(selectedLead?.id === lead.id ? null : lead)}
                        style={{ background:"var(--card)", borderRadius:"7px", padding:"11px 13px", cursor:"grab", border:`1px solid ${selectedLead?.id===lead.id?"var(--border-accent)":"var(--border)"}`, transition:"border-color 0.12s", opacity: dragging===lead.id?0.4:1 }}>

                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                          <p style={{ fontSize:"13px", fontWeight:600, color:"var(--text)", margin:0, lineHeight:1.3 }}>{lead.negocio}</p>
                          <button onClick={e => { e.stopPropagation(); deleteLead(lead.id); }}
                            style={{ background:"none", border:"none", color:"var(--text-muted)", cursor:"pointer", padding:"0 0 0 6px", flexShrink:0 }}>
                            <Trash2 size={12}/>
                          </button>
                        </div>
                        <p style={{ fontSize:"11px", color:"var(--text-muted)", margin:"4px 0 0" }}>{lead.sector} · {lead.ciudad}</p>
                        {lead.necesita && <p style={{ fontSize:"11px", color:"var(--accent)", margin:"5px 0 0", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{lead.necesita}</p>}
                        <p style={{ fontSize:"10px", color:"var(--text-muted)", margin:"6px 0 0", fontFamily:"monospace" }}>
                          {new Date(lead.created_at).toLocaleDateString("es-ES", { day:"numeric", month:"short" })}
                        </p>
                      </div>
                    ))}

                    {byCol(col).length === 0 && (
                      <div style={{ textAlign:"center", padding:"24px 12px", color:"var(--text-muted)", fontSize:"12px", border:"1px dashed var(--border)", borderRadius:"6px" }}>
                        Arrastra aquí
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Ficha lead seleccionada */}
          {selectedLead && (
            <div style={{ ...CARD, marginTop:"20px" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"16px" }}>
                <h3 style={{ fontSize:"16px", fontWeight:600, color:"var(--text)", margin:0 }}>{selectedLead.negocio}</h3>
                <button onClick={() => setSelectedLead(null)} style={{ background:"none", border:"none", cursor:"pointer", color:"var(--text-muted)" }}><X size={18}/></button>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"12px", marginBottom:"16px" }}>
                {[["Sector", selectedLead.sector], ["Ciudad", selectedLead.ciudad], ["Contacto", selectedLead.contacto], ["Llegó por", selectedLead.como_llego], ["Necesita", selectedLead.necesita], ["Estado", selectedLead.columna]].map(([k, v]) => (
                  <div key={k}>
                    <p style={{ ...LABEL, margin:"0 0 3px" }}>{k}</p>
                    <p style={{ fontSize:"13px", color:"var(--text)", margin:0 }}>{v || "—"}</p>
                  </div>
                ))}
              </div>
              <div>
                <p style={{ ...LABEL, margin:"0 0 6px" }}>Notas</p>
                <textarea
                  defaultValue={selectedLead.notas}
                  onBlur={e => updateNotes(selectedLead.id, e.target.value)}
                  rows={3}
                  style={{ ...INPUT, resize:"vertical" }}
                  placeholder="Añade notas aquí..."
                />
              </div>
              <div style={{ display:"flex", gap:"8px", marginTop:"14px", flexWrap:"wrap" }}>
                {COLUMNAS.filter(c => c !== selectedLead.columna).map(c => (
                  <button key={c} onClick={() => { moveCol(selectedLead.id, c); setSelectedLead(prev => prev ? {...prev, columna:c} : prev); }}
                    style={{ padding:"5px 12px", borderRadius:"5px", border:`1px solid ${COL_COLORS[c]}44`, background:`${COL_COLORS[c]}11`, color:COL_COLORS[c], fontSize:"11px", fontWeight:600, cursor:"pointer", display:"flex", alignItems:"center", gap:"4px" }}>
                    <ChevronRight size={11}/> Mover a {c}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Competencia */}
      {tab === "competencia" && (
        <div>
          <div style={{ ...CARD, marginBottom:"16px", background:"rgba(251,191,36,0.04)", border:"1px solid rgba(251,191,36,0.15)" }}>
            <p style={{ fontSize:"12px", color:"var(--amber)", margin:0 }}>⚡ Agencias de marketing digital con IA en España y Valencia — análisis de posicionamiento y captación.</p>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:"0" }}>
            <div style={{ display:"grid", gridTemplateColumns:"1.5fr 1.5fr 1fr 1fr 2fr", gap:"12px", padding:"8px 16px", background:"var(--bg)", borderRadius:"6px 6px 0 0", border:"1px solid var(--border)" }}>
              {["Competidor","Servicios","Diferencial","Capta por","Punto débil"].map(h => (
                <span key={h} style={{ ...LABEL }}>{h}</span>
              ))}
            </div>
            {COMPETENCIA.map((c, i) => (
              <div key={c.nombre} style={{ display:"grid", gridTemplateColumns:"1.5fr 1.5fr 1fr 1fr 2fr", gap:"12px", padding:"12px 16px", background:"var(--card)", border:"1px solid var(--border)", borderTop:"none", borderRadius:i===COMPETENCIA.length-1?"0 0 6px 6px":"0" }}>
                <span style={{ fontSize:"13px", fontWeight:600, color:"var(--text)" }}>{c.nombre}</span>
                <span style={{ fontSize:"12px", color:"var(--text-mid)" }}>{c.servicios}</span>
                <span style={{ fontSize:"12px", color:"var(--text-mid)" }}>{c.diferencial}</span>
                <span style={{ fontSize:"12px", color:"var(--accent)" }}>{c.capta}</span>
                <span style={{ fontSize:"12px", color:"var(--text-muted)" }}>{c.punto_debil}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Oportunidades */}
      {tab === "oportunidades" && (
        <div style={{ display:"flex", flexDirection:"column", gap:"12px" }}>
          {OPORTUNIDADES.map(o => (
            <div key={o.oportunidad} style={{ ...CARD, display:"flex", gap:"16px", alignItems:"flex-start" }}>
              <div style={{ width:"6px", height:"6px", borderRadius:"50%", background:o.prioridad==="Alta"?"var(--red)":"var(--amber)", flexShrink:0, marginTop:"6px" }}/>
              <div style={{ flex:1 }}>
                <div style={{ display:"flex", alignItems:"center", gap:"10px", marginBottom:"4px" }}>
                  <p style={{ fontSize:"14px", fontWeight:600, color:"var(--text)", margin:0 }}>{o.oportunidad}</p>
                  <span style={{ fontSize:"10px", padding:"2px 7px", borderRadius:"999px", background:o.prioridad==="Alta"?"rgba(239,68,68,0.1)":"rgba(251,191,36,0.1)", color:o.prioridad==="Alta"?"var(--red)":"var(--amber)", fontWeight:600 }}>{o.prioridad}</span>
                </div>
                <p style={{ fontSize:"12px", color:"var(--text-muted)", margin:0, lineHeight:1.5 }}>{o.detalle}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal nuevo lead */}
      {modalOpen && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.6)", zIndex:500, display:"flex", alignItems:"center", justifyContent:"center" }}
          onClick={e => { if (e.target === e.currentTarget) setModalOpen(false); }}>
          <div style={{ ...CARD, width:480, maxWidth:"94vw", boxShadow:"0 20px 60px rgba(0,0,0,0.4)" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"20px" }}>
              <p style={{ fontSize:"16px", fontWeight:600, color:"var(--text)", margin:0 }}>Nuevo lead</p>
              <button onClick={() => setModalOpen(false)} style={{ background:"none", border:"none", cursor:"pointer", color:"var(--text-muted)" }}><X size={18}/></button>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:"12px" }}>
              {[
                ["negocio","Nombre del negocio *","text"],
                ["ciudad","Ciudad","text"],
                ["contacto","Contacto (nombre / tel / email)","text"],
                ["necesita","¿Qué necesita?","text"],
                ["notas","Notas adicionales","text"],
              ].map(([k, ph, t]) => (
                <div key={k}>
                  <p style={{ ...LABEL, margin:"0 0 4px" }}>{ph}</p>
                  <input type={t} value={(form as Record<string,string>)[k]} onChange={e => setForm(f => ({...f, [k]:e.target.value}))} placeholder={ph} style={INPUT}/>
                </div>
              ))}
              <div>
                <p style={{ ...LABEL, margin:"0 0 4px" }}>Sector</p>
                <select value={form.sector} onChange={e => setForm(f => ({...f, sector:e.target.value}))} style={INPUT}>
                  {SECTORES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <p style={{ ...LABEL, margin:"0 0 4px" }}>¿Cómo llegó?</p>
                <select value={form.como_llego} onChange={e => setForm(f => ({...f, como_llego:e.target.value}))} style={INPUT}>
                  {CANALES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display:"flex", gap:"8px", marginTop:"20px" }}>
              <button onClick={() => setModalOpen(false)} style={{ flex:1, padding:"9px", borderRadius:"6px", border:"1px solid var(--border)", background:"transparent", color:"var(--text-muted)", cursor:"pointer", fontSize:"13px" }}>Cancelar</button>
              <button onClick={createLead} disabled={saving || !form.negocio.trim()} style={{ flex:2, padding:"9px", borderRadius:"6px", border:"none", background:saving||!form.negocio.trim()?"var(--border)":"var(--accent)", color:"#fff", cursor:saving||!form.negocio.trim()?"not-allowed":"pointer", fontSize:"13px", fontWeight:600 }}>
                {saving ? "Guardando..." : "✅ Crear lead + notificar Telegram"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
