"use client";

import { useState, useEffect } from "react";
import { Client, ClientEvento } from "../lib/clients-data";
import { getClients, addClient, updateClient } from "../lib/clients-storage";

// ─── Static data keyed by client id ───────────────────────────────────────────

const METRICAS: Record<string, { cpl: string; roas: string; inversion: string; leads: string }> = {
  "identity-peluqueros":    { cpl: "4.80€", roas: "5.2x", inversion: "220€/sem", leads: "46/mes" },
  "desancho-estilistas":    { cpl: "5.40€", roas: "4.8x", inversion: "180€/sem", leads: "33/mes" },
  "last-mile-distribution": { cpl: "—",     roas: "—",    inversion: "—",         leads: "—" },
  "malvarrosa-cf":          { cpl: "2.10€", roas: "3.1x", inversion: "90€/sem",   leads: "22/mes" },
  "matias-benegas-tattoo":  { cpl: "3.60€", roas: "4.2x", inversion: "110€/sem",  leads: "28/mes" },
};

// ─── Tipos para reservas Ripieno ──────────────────────────────────────────────

type RipienoReserva = {
  id: number;
  nombre: string;
  fecha: string;
  hora: string;
  personas: string;
  email: string;
  telefono: string | null;
  comentarios: string | null;
  estado: 'pendiente' | 'confirmada' | 'cancelada';
  review_sent: number;
  created_at: string;
};

type RipienoStats = {
  total: number;
  este_mes: number;
  confirmadas: number;
  canceladas: number;
  reviews_enviados: number;
};

const TAREAS_BASE: Record<string, string[]> = {
  "identity-peluqueros":    ["Revisar creatividades junio", "Enviar reporte semanal", "Reunión mensual"],
  "desancho-estilistas":    ["Actualizar fotos GMB", "Responder reseñas", "Enviar reporte semanal"],
  "last-mile-distribution": ["Enviar propuesta formal", "Reunión briefing"],
  "malvarrosa-cf":          ["Creatividades torneo verano", "Enviar reporte semanal"],
  "matias-benegas-tattoo":  ["Post de portfolio", "Optimizar campaña booking", "Enviar reporte semanal"],
};

const HISTORIAL: Record<string, { fecha: string; tipo: string; nota: string }[]> = {
  "identity-peluqueros":    [{ fecha: "2026-06-01", tipo: "Reunión", nota: "Resultados mayo. Cliente muy satisfecho, renueva." }, { fecha: "2026-05-15", tipo: "Email", nota: "Reporte mensual con métricas enviado." }],
  "desancho-estilistas":    [{ fecha: "2026-05-28", tipo: "Email", nota: "Reporte mensual enviado." }, { fecha: "2026-05-10", tipo: "Call", nota: "Feedback creatividades nuevas." }],
  "last-mile-distribution": [{ fecha: "2026-06-03", tipo: "Reunión", nota: "Primera reunión descubrimiento. Muy interesados." }],
  "malvarrosa-cf":          [{ fecha: "2026-06-02", tipo: "Email", nota: "Campaña torneo verano iniciada." }],
  "matias-benegas-tattoo":  [{ fecha: "2026-05-30", tipo: "WhatsApp", nota: "Solicitud contenido booking adicional." }],
  "ripieno-ibiza":          [{ fecha: "2026-06-25", tipo: "Proyecto", nota: "Inicio proyecto: menú digital + sistema de reservas. Diseño y desarrollo en curso." }],
};

const DOCS: Record<string, string[]> = {
  "identity-peluqueros":    ["Contrato firmado", "Propuesta inicial", "Brief servicio"],
  "desancho-estilistas":    ["Contrato firmado", "Propuesta inicial"],
  "last-mile-distribution": ["Propuesta borrador"],
  "malvarrosa-cf":          ["Contrato firmado", "Brief servicio"],
  "matias-benegas-tattoo":  ["Contrato firmado", "Propuesta inicial", "Brief contenido"],
  "ripieno-ibiza":          ["Brief inicial", "Accesos SMTP pendientes"],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function statusColor(status: Client['status']): { color: string; bg: string; label: string } {
  if (status === 'activo')   return { color: "#00E676", bg: "rgba(0,230,118,0.08)", label: "ACTIVO" };
  if (status === 'en_curso') return { color: "#FFB800", bg: "rgba(255,184,0,0.08)",  label: "EN CURSO" };
  return { color: "var(--text-muted)", bg: "rgba(90,100,112,0.08)", label: "PAUSADO" };
}

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function mrrLabel(mrr: number): string {
  return mrr > 0 ? `${mrr}€` : "TBD";
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const CARD  = { background: "var(--card)", border: "1px solid var(--border)", borderRadius: "6px" } as React.CSSProperties;
const LABEL = { fontSize: "11px", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: "var(--text-muted)" };
const INPUT_STYLE: React.CSSProperties = { width: "100%", padding: "8px 12px", borderRadius: "4px", border: "1px solid var(--border)", background: "var(--card)", color: "var(--text)", fontSize: "13px", outline: "none", boxSizing: "border-box" };
const SELECT_STYLE: React.CSSProperties = { ...INPUT_STYLE, cursor: "pointer" };

// ─── Tipos panel ──────────────────────────────────────────────────────────────

type PanelTab = "Resumen" | "Métricas" | "Tareas" | "Contenido" | "Tendencias" | "Documentos" | "Reservas";
const PANEL_TABS: PanelTab[] = ["Resumen", "Métricas", "Tareas", "Contenido", "Tendencias", "Documentos"];
const PANEL_TABS_RIPIENO: PanelTab[] = ["Resumen", "Reservas", "Tareas", "Documentos"];

const SECTORES = ["Peluquería/Estética", "Taller mecánico", "Rent a car", "Restaurante", "Clínica", "Logística", "Deporte", "Estudio Tattoo", "Otro"];
const SERVICIOS_OPTS = ["Meta Ads", "Google Ads", "GMB", "Email Marketing", "Web", "Contenido redes"];

// ─── Componente ───────────────────────────────────────────────────────────────

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Client[]>([]);
  const [selected, setSelected] = useState<Client | null>(null);
  const [panelTab, setPanelTab] = useState<PanelTab>("Resumen");
  const [tareas, setTareas] = useState<Record<string, { texto: string; done: boolean }[]>>({});
  const [nuevaTarea, setNuevaTarea] = useState("");
  const [tendencias, setTendencias] = useState<Record<string, string[] | null>>({});
  const [contenidoResult, setContenidoResult] = useState<{ tipo: string; texto: string } | null>(null);
  const [contenidoLoading, setContenidoLoading] = useState(false);
  const [tendenciasLoading, setTendenciasLoading] = useState(false);
  const [reseñaInput, setReseñaInput] = useState("");

  // Métricas reales
  const [metaMetrics, setMetaMetrics] = useState<Record<string, object | null>>({});
  const [metaLoading, setMetaLoading] = useState(false);
  const [metaError, setMetaError] = useState<string | null>(null);

  // Modal crear campaña
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [campaign, setCampaign] = useState({ objetivo: 'leads', presupuesto: '', audiencia: '', textoAnuncio: '', cta: 'Más información' });
  const [campaignLoading, setCampaignLoading] = useState(false);
  const [campaignResult, setCampaignResult] = useState<{ editUrl: string } | null>(null);
  const [campaignError, setCampaignError] = useState<string | null>(null);
  const [copyLoading, setCopyLoading] = useState(false);

  // Google Search Console
  const [gscMetrics, setGscMetrics]   = useState<Record<string, Record<string, unknown> | null>>({});
  const [gscLoading, setGscLoading]   = useState(false);
  const [gscError, setGscError]       = useState<string | null>(null);
  const [gscSiteUrl, setGscSiteUrl]   = useState<Record<string, string>>({});

  // Google Analytics GA4
  const [ga4Metrics, setGa4Metrics]       = useState<Record<string, Record<string, unknown> | null>>({});
  const [ga4Loading, setGa4Loading]       = useState(false);
  const [ga4Error, setGa4Error]           = useState<string | null>(null);
  const [ga4PropertyId, setGa4PropertyId] = useState<Record<string, string>>({});

  // Onboarding email
  const [onboarding, setOnboarding]           = useState<{ subject: string; body: string } | null>(null);
  const [onboardingLoading, setOnboardingLoading] = useState(false);

  // Ripieno — reservas
  const [ripienoReservas, setRipienoReservas] = useState<RipienoReserva[]>([]);
  const [ripienoStats,    setRipienoStats]    = useState<RipienoStats | null>(null);
  const [ripienoLoading,  setRipienoLoading]  = useState(false);
  const [ripienoError,    setRipienoError]    = useState<string | null>(null);
  const [ripienoFiltro,   setRipienoFiltro]   = useState('');

  // Modal nuevo cliente
  const [showModal, setShowModal] = useState(false);
  const [modalStep, setModalStep] = useState(1);
  const [form, setForm] = useState({
    name: "", sector: SECTORES[0], mrr: "", contactName: "", contactPhone: "", contactEmail: "",
    services: [] as string[],
    metaAccountId: "", metaVerified: false, metaVerifying: false, metaVerifyError: "",
    metaVerifiedName: "",
    googleCustomerId: "", googleVerified: false, googleVerifying: false, googleVerifyError: "",
    googleVerifiedName: "",
  });

  useEffect(() => {
    const loaded = getClients();
    setClientes(loaded);
    setTareas(Object.fromEntries(
      loaded.map(c => [c.id, (TAREAS_BASE[c.id] ?? []).map(t => ({ texto: t, done: false }))])
    ));
  }, []);

  function reloadClientes() {
    setClientes(getClients());
  }

  function abrirPanel(c: Client) {
    setSelected(c);
    setPanelTab("Resumen");
    setContenidoResult(null);
    setMetaError(null);
    if (c.id === 'ripieno-ibiza') {
      cargarRipieno();
    }
  }

  async function cargarRipieno() {
    setRipienoLoading(true);
    setRipienoError(null);
    try {
      const [resRes, statsRes] = await Promise.all([
        fetch('/api/ripieno/reservas'),
        fetch('/api/ripieno/stats'),
      ]);
      const resData   = await resRes.json();
      const statsData = await statsRes.json();
      if (resData.reservas) setRipienoReservas(resData.reservas);
      if (statsData.stats)  setRipienoStats(statsData.stats);
    } catch {
      setRipienoError('No se puede conectar con el backend de Ripieno.');
    } finally {
      setRipienoLoading(false);
    }
  }

  async function cambiarEstadoReserva(id: number, estado: string) {
    try {
      const res = await fetch('/api/ripieno/reservas', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, estado }),
      });
      if (res.ok) {
        setRipienoReservas(prev => prev.map(r => r.id === id ? { ...r, estado: estado as RipienoReserva['estado'] } : r));
      }
    } catch { /* non-fatal */ }
  }

  function toggleTarea(idx: number) {
    if (!selected) return;
    setTareas(prev => ({
      ...prev,
      [selected.id]: prev[selected.id].map((t, i) => i === idx ? { ...t, done: !t.done } : t),
    }));
  }

  function addTarea() {
    if (!selected || !nuevaTarea.trim()) return;
    setTareas(prev => ({
      ...prev,
      [selected.id]: [...(prev[selected.id] ?? []), { texto: nuevaTarea.trim(), done: false }],
    }));
    setNuevaTarea("");
  }

  async function buscarTendencias() {
    if (!selected) return;
    setTendenciasLoading(true);
    try {
      const res = await fetch('/api/claude/generate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'tendencias', data: { sector: selected.sector } }),
      });
      const json = await res.json();
      const lines = json.content.split('\n').filter((l: string) => l.trim()).slice(0, 8);
      setTendencias(prev => ({ ...prev, [selected.id]: lines }));
    } catch {
      setTendencias(prev => ({ ...prev, [selected.id]: ['Error al cargar tendencias.'] }));
    } finally {
      setTendenciasLoading(false);
    }
  }

  async function generarContenido(tipo: string) {
    if (!selected) return;
    setContenidoLoading(true);
    setContenidoResult(null);
    const typeMap: Record<string, string> = { "GBP Post": "gbp_post", "Artículo Blog": "blog_article", "Respuesta Reseña": "review_response" };
    const dataMap: Record<string, object> = {
      "GBP Post": { cliente: selected.name, sector: selected.sector },
      "Artículo Blog": { topic: `${selected.sector} en Valencia`, keyword: selected.sector },
      "Respuesta Reseña": { cliente: selected.name, review: reseñaInput || "Excelente servicio, muy satisfecho con los resultados" },
    };
    try {
      const res = await fetch('/api/claude/generate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: typeMap[tipo], data: dataMap[tipo] }),
      });
      const json = await res.json();
      setContenidoResult({ tipo, texto: json.content });
    } catch {
      setContenidoResult({ tipo, texto: 'Error generando contenido. Inténtalo de nuevo.' });
    } finally {
      setContenidoLoading(false);
    }
  }

  async function actualizarMetaMetics() {
    if (!selected?.adAccounts.metaAccountId) return;
    setMetaLoading(true);
    setMetaError(null);
    try {
      const res = await fetch('/api/meta/metrics', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId: selected.adAccounts.metaAccountId }),
      });
      const json = await res.json();
      if (!res.ok) { setMetaError(json.error || 'Error al obtener métricas'); return; }
      setMetaMetrics(prev => ({ ...prev, [selected.id]: json }));
    } catch {
      setMetaError('Error de red al obtener métricas.');
    } finally {
      setMetaLoading(false);
    }
  }

  // ── Modal helpers ────────────────────────────────────────────────────────────

  function resetModal() {
    setForm({
      name: "", sector: SECTORES[0], mrr: "", contactName: "", contactPhone: "", contactEmail: "",
      services: [],
      metaAccountId: "", metaVerified: false, metaVerifying: false, metaVerifyError: "", metaVerifiedName: "",
      googleCustomerId: "", googleVerified: false, googleVerifying: false, googleVerifyError: "", googleVerifiedName: "",
    });
    setModalStep(1);
    setShowModal(false);
  }

  function toggleService(s: string) {
    setForm(f => ({
      ...f,
      services: f.services.includes(s) ? f.services.filter(x => x !== s) : [...f.services, s],
    }));
  }

  async function verificarMeta() {
    setForm(f => ({ ...f, metaVerifying: true, metaVerifyError: "", metaVerified: false, metaVerifiedName: "" }));
    try {
      const res = await fetch('/api/meta/verify-account', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId: form.metaAccountId }),
      });
      const json = await res.json();
      if (json.valid) {
        setForm(f => ({ ...f, metaVerified: true, metaVerifiedName: json.name || "Cuenta verificada", metaVerifying: false }));
      } else {
        setForm(f => ({ ...f, metaVerifyError: json.error || "No se pudo verificar. Revisa el ID o los permisos.", metaVerifying: false }));
      }
    } catch {
      setForm(f => ({ ...f, metaVerifyError: "Error de red al verificar.", metaVerifying: false }));
    }
  }

  async function verificarGoogle() {
    setForm(f => ({ ...f, googleVerifying: true, googleVerifyError: "", googleVerified: false, googleVerifiedName: "" }));
    try {
      const res = await fetch('/api/google/verify-account', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId: form.googleCustomerId }),
      });
      const json = await res.json();
      if (json.valid) {
        setForm(f => ({ ...f, googleVerified: true, googleVerifiedName: json.name || "Cuenta verificada", googleVerifying: false }));
      } else {
        setForm(f => ({ ...f, googleVerifyError: json.error || "No se pudo verificar.", googleVerifying: false }));
      }
    } catch {
      setForm(f => ({ ...f, googleVerifyError: "Error de red al verificar.", googleVerifying: false }));
    }
  }

  function guardarCliente(withAds: boolean) {
    const id = slugify(form.name) || `cliente-${Date.now()}`;
    const nuevo: Client = {
      id,
      name: form.name,
      sector: form.sector,
      mrr: parseFloat(form.mrr) || 0,
      status: 'activo',
      startDate: new Date().toISOString().split('T')[0],
      contact: { name: form.contactName, phone: form.contactPhone || undefined, email: form.contactEmail || undefined },
      services: form.services,
      adAccounts: withAds ? {
        metaAccountId: form.metaVerified ? form.metaAccountId : undefined,
        googleCustomerId: form.googleVerified ? form.googleCustomerId : undefined,
      } : {},
      createdAt: new Date().toISOString(),
    };
    addClient(nuevo);
    setTareas(prev => ({ ...prev, [id]: [] }));
    reloadClientes();
    resetModal();
  }

  async function obtenerGSC() {
    if (!selected) return;
    const siteUrl = gscSiteUrl[selected.id];
    if (!siteUrl) return;
    setGscLoading(true);
    setGscError(null);
    try {
      const res  = await fetch('/api/google/search-console', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteUrl }),
      });
      const json = await res.json();
      if (!res.ok || json.error) { setGscError(json.error || 'Error Search Console'); return; }
      setGscMetrics(prev => ({ ...prev, [selected.id]: json }));
    } catch { setGscError('Error de red.'); } finally { setGscLoading(false); }
  }

  async function obtenerGA4() {
    if (!selected) return;
    const propertyId = ga4PropertyId[selected.id];
    if (!propertyId) return;
    setGa4Loading(true);
    setGa4Error(null);
    try {
      const res  = await fetch('/api/google/analytics', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propertyId }),
      });
      const json = await res.json();
      if (!res.ok || json.error) { setGa4Error(json.error || 'Error GA4'); return; }
      setGa4Metrics(prev => ({ ...prev, [selected.id]: json }));
    } catch { setGa4Error('Error de red.'); } finally { setGa4Loading(false); }
  }

  async function generarOnboarding() {
    if (!selected) return;
    setOnboardingLoading(true);
    setOnboarding(null);
    try {
      const res  = await fetch('/api/onboarding/email', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientName: selected.name, services: selected.services }),
      });
      const json = await res.json();
      setOnboarding(json);
    } finally { setOnboardingLoading(false); }
  }

  async function generarCopyIA() {
    if (!selected) return;
    setCopyLoading(true);
    try {
      const res = await fetch('/api/claude/generate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'meta_ad_copy', data: { cliente: selected.name, sector: selected.sector, objetivo: campaign.objetivo, audiencia: campaign.audiencia } }),
      });
      const json = await res.json();
      setCampaign(c => ({ ...c, textoAnuncio: json.content }));
    } finally {
      setCopyLoading(false);
    }
  }

  async function crearCampanaMeta() {
    if (!selected?.adAccounts.metaAccountId) return;
    setCampaignLoading(true);
    setCampaignError(null);
    setCampaignResult(null);
    try {
      const res = await fetch('/api/meta/create-campaign', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId: selected.adAccounts.metaAccountId, ...campaign }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) { setCampaignError(json.error || 'Error al crear la campaña.'); return; }
      setCampaignResult({ editUrl: json.editUrl });
    } catch {
      setCampaignError('Error de red al crear la campaña.');
    } finally {
      setCampaignLoading(false);
    }
  }

  // ─── MRR total ────────────────────────────────────────────────────────────────
  const totalMrr = clientes.reduce((s, c) => s + c.mrr, 0);

  return (
    <div style={{ padding: "32px 40px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: 600, color: "var(--text)" }}>Clientes</h1>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>{clientes.length} clientes · MRR {totalMrr}€</span>
          <button
            onClick={() => setShowModal(true)}
            style={{ padding: "8px 16px", borderRadius: "6px", background: "#00C8FF", color: "#000", fontSize: "13px", fontWeight: 600, border: "none", cursor: "pointer" }}
          >
            + Nuevo Cliente
          </button>
        </div>
      </div>

      {/* Tabla */}
      <div style={{ ...CARD, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)" }}>
              {["Cliente", "Sector", "MRR", "Estado", "Ads conectados"].map(h => (
                <th key={h} style={{ ...LABEL, padding: "12px 16px", textAlign: "left" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {clientes.map(c => {
              const { color, bg, label } = statusColor(c.status);
              const hasMeta = !!c.adAccounts.metaAccountId;
              const hasGoogle = !!c.adAccounts.googleCustomerId;
              return (
                <tr
                  key={c.id}
                  onClick={() => abrirPanel(c)}
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", cursor: "pointer", transition: "background 0.12s" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "var(--card-hover)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                >
                  <td style={{ padding: "14px 16px", fontSize: "13px", fontWeight: 500, color: "var(--text)" }}>{c.name}</td>
                  <td style={{ padding: "14px 16px", fontSize: "12px", color: "var(--text-muted)" }}>{c.sector}</td>
                  <td style={{ padding: "14px 16px", fontSize: "13px", fontFamily: "'Space Mono', monospace", fontWeight: 700, color: "var(--text)" }}>{mrrLabel(c.mrr)}</td>
                  <td style={{ padding: "14px 16px" }}>
                    <span style={{ fontSize: "11px", fontWeight: 600, padding: "3px 8px", borderRadius: "4px", color, background: bg }}>{label}</span>
                  </td>
                  <td style={{ padding: "14px 16px", display: "flex", gap: "6px", alignItems: "center" }}>
                    {hasMeta   && <span style={{ fontSize: "11px", padding: "2px 7px", borderRadius: "3px", background: "rgba(0,200,255,0.08)", color: "#00C8FF", border: "1px solid rgba(0,200,255,0.15)" }}>Meta</span>}
                    {hasGoogle && <span style={{ fontSize: "11px", padding: "2px 7px", borderRadius: "3px", background: "rgba(66,133,244,0.08)", color: "#4285F4", border: "1px solid rgba(66,133,244,0.15)" }}>Google</span>}
                    {!hasMeta && !hasGoogle && <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>—</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── Panel lateral ─────────────────────────────────────────────────────── */}
      {selected && (
        <>
          <div style={{ position: "fixed", inset: 0, zIndex: 40, background: "rgba(0,0,0,0.4)" }} onClick={() => setSelected(null)} />
          <div style={{ position: "fixed", right: 0, top: 0, bottom: 0, width: "480px", zIndex: 50, background: "var(--bg)", borderLeft: "1px solid var(--border)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
            {/* Header */}
            <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "12px" }}>
              <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "18px", lineHeight: 1, padding: "0 4px" }}>×</button>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--text)" }}>{selected.name}</div>
                <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>{selected.sector}</div>
              </div>
              <span style={{ fontSize: "11px", fontWeight: 600, padding: "3px 8px", borderRadius: "4px", color: statusColor(selected.status).color, background: statusColor(selected.status).bg }}>{statusColor(selected.status).label}</span>
            </div>

            {/* Tabs */}
            <div style={{ display: "flex", gap: "2px", padding: "10px 16px", borderBottom: "1px solid var(--border)", overflowX: "auto" }}>
              {(selected.id === 'ripieno-ibiza' ? PANEL_TABS_RIPIENO : PANEL_TABS).map(t => (
                <button key={t} onClick={() => { setPanelTab(t); setContenidoResult(null); if (t === 'Reservas') cargarRipieno(); }} style={{ padding: "6px 12px", borderRadius: "4px", border: "none", cursor: "pointer", fontSize: "12px", fontWeight: panelTab === t ? 600 : 400, whiteSpace: "nowrap", background: panelTab === t ? "rgba(0,200,255,0.1)" : "transparent", color: panelTab === t ? "#00C8FF" : "var(--text-muted)", outline: panelTab === t ? "1px solid rgba(0,200,255,0.2)" : "none" }}>{t}</button>
              ))}
            </div>

            {/* Contenido panel */}
            <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>

              {/* Resumen */}
              {panelTab === "Resumen" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {[
                    { label: "Sector",       value: selected.sector },
                    { label: "MRR",          value: mrrLabel(selected.mrr) },
                    { label: "Fecha inicio", value: selected.startDate },
                    { label: "Contacto",     value: selected.contact.name + (selected.contact.phone ? ` · ${selected.contact.phone}` : '') },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <p style={{ ...LABEL, marginBottom: "4px" }}>{label}</p>
                      <p style={{ fontSize: "14px", color: "var(--text)" }}>{value}</p>
                    </div>
                  ))}
                  <div>
                    <p style={{ ...LABEL, marginBottom: "8px" }}>Servicios activos</p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                      {selected.services.map(s => (
                        <span key={s} style={{ fontSize: "12px", padding: "4px 10px", borderRadius: "4px", background: "rgba(0,200,255,0.08)", color: "#00C8FF", border: "1px solid rgba(0,200,255,0.15)" }}>{s}</span>
                      ))}
                    </div>
                  </div>
                  {/* Cuentas conectadas */}
                  <div>
                    <p style={{ ...LABEL, marginBottom: "8px" }}>Cuentas publicitarias</p>
                    {selected.adAccounts.metaAccountId
                      ? <p style={{ fontSize: "12px", color: "var(--text-mid)" }}>Meta: <code style={{ color: "#00C8FF" }}>{selected.adAccounts.metaAccountId}</code></p>
                      : <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>Sin cuenta Meta conectada</p>
                    }
                    {selected.adAccounts.googleCustomerId
                      ? <p style={{ fontSize: "12px", color: "var(--text-mid)", marginTop: "4px" }}>Google: <code style={{ color: "#4285F4" }}>{selected.adAccounts.googleCustomerId}</code></p>
                      : <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>Sin cuenta Google conectada</p>
                    }
                  </div>

                  {/* Ripieno — links rápidos */}
                  {selected.id === 'ripieno-ibiza' && (
                    <div style={{ borderTop: "1px solid var(--border)", paddingTop: "16px" }}>
                      <p style={{ ...LABEL, marginBottom: "10px", color: "#C8920A" }}>Ripieno Ibiza · Links</p>
                      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        {[
                          { label: "🍝 Menú live", url: "https://ripieno.raxislab.com" },
                          { label: "🛍️ Shop placeholder", url: "https://ripieno.raxislab.com/shop" },
                          { label: "📸 Instagram", url: "https://instagram.com/ripienoibiza" },
                          { label: "⭐ Google Maps", url: "https://www.google.com/maps/search/Ripieno+Ibiza" },
                        ].map(({ label, url }) => (
                          <a key={label} href={url} target="_blank" rel="noopener noreferrer"
                             style={{ fontSize: "12px", color: "#00C8FF", padding: "7px 10px", borderRadius: "4px", background: "rgba(0,200,255,0.05)", border: "1px solid rgba(0,200,255,0.1)", textDecoration: "none", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            {label} <span style={{ color: "var(--text-muted)" }}>→</span>
                          </a>
                        ))}
                      </div>
                      <div style={{ marginTop: "10px", padding: "10px 12px", borderRadius: "6px", background: "rgba(200,146,10,0.05)", border: "1px solid rgba(200,146,10,0.15)" }}>
                        <p style={{ fontSize: "11px", color: "#C8920A", fontWeight: 600, marginBottom: "4px" }}>Estado del proyecto</p>
                        <p style={{ fontSize: "12px", color: "var(--text-muted)", lineHeight: 1.6 }}>
                          Menú digital · En desarrollo<br/>
                          Sistema de reservas · Pendiente SMTP<br/>
                          QR imprenta · Pendiente deploy<br/>
                          raxislab.com/clientes · Pendiente
                        </p>
                      </div>
                  {/* Evento fotografiado */}
                  {selected.evento && (
                    <div style={{ borderTop: "1px solid var(--border)", paddingTop: "16px" }}>
                      <p style={{ ...LABEL, marginBottom: "12px", color: "#C0392B" }}>Evento fotografiado</p>
                      {([
                        ["Tipo",   selected.evento.tipo],
                        ["Fecha",  selected.evento.fecha],
                        ["Estado prospecto", selected.evento.estado_prospecto],
                        ["Página pública", selected.evento.url_pagina || "—"],
                        ["URL galería", selected.evento.url_galeria || "Pendiente"],
                        ["Notas", selected.evento.notas || "—"],
                      ] as [string, string][]).map(([l, v]) => (
                        <div key={l} style={{ marginBottom: "10px" }}>
                          <p style={{ ...LABEL, marginBottom: "3px", fontSize: "10px" }}>{l}</p>
                          <p style={{ fontSize: "13px", color: "var(--text-mid)", wordBreak: "break-word" }}>{v}</p>
                        </div>
                      ))}
                      {selected.evento.url_pagina && (
                        <a
                          href={`https://${selected.evento.url_pagina}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ display: "inline-block", marginTop: "4px", padding: "6px 14px", borderRadius: "4px", background: "rgba(192,57,43,0.08)", color: "#E8A09A", border: "1px solid rgba(192,57,43,0.25)", fontSize: "12px", textDecoration: "none" }}
                        >
                          Ver página pública →
                        </a>
                      )}
                    </div>
                  )}
                    </div>
                  )}

                  {/* Onboarding */}
                  <div style={{ borderTop: "1px solid var(--border)", paddingTop: "16px" }}>
                    <p style={{ ...LABEL, marginBottom: "8px" }}>Onboarding</p>
                    <button onClick={generarOnboarding} disabled={onboardingLoading}
                      style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid rgba(0,200,255,0.2)", background: "rgba(0,200,255,0.06)", color: onboardingLoading ? "#2A3040" : "#00C8FF", fontSize: "13px", cursor: onboardingLoading ? "not-allowed" : "pointer", fontWeight: 500 }}>
                      {onboardingLoading ? "Generando..." : "✉ Generar email de accesos"}
                    </button>
                    {onboarding && (
                      <div style={{ marginTop: "10px", padding: "12px", borderRadius: "6px", border: "1px solid rgba(0,200,255,0.15)", background: "rgba(0,200,255,0.04)" }}>
                        <p style={{ ...LABEL, marginBottom: "4px", fontSize: "10px" }}>Asunto</p>
                        <p style={{ fontSize: "12px", color: "var(--text-mid)", marginBottom: "10px" }}>{onboarding.subject}</p>
                        <p style={{ ...LABEL, marginBottom: "4px", fontSize: "10px" }}>Cuerpo del email</p>
                        <pre style={{ fontSize: "11px", color: "var(--text-mid)", whiteSpace: "pre-wrap", lineHeight: 1.6, fontFamily: "inherit", maxHeight: "200px", overflowY: "auto" }}>{onboarding.body}</pre>
                        <button onClick={() => navigator.clipboard.writeText(`Asunto: ${onboarding.subject}\n\n${onboarding.body}`).then(() => alert("Copiado ✅"))}
                          style={{ marginTop: "8px", padding: "5px 12px", borderRadius: "4px", background: "rgba(0,200,255,0.1)", color: "#00C8FF", border: "1px solid rgba(0,200,255,0.2)", fontSize: "11px", cursor: "pointer" }}>
                          Copiar email completo
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Métricas */}
              {panelTab === "Métricas" && (() => {
                const hasMeta = !!selected.adAccounts.metaAccountId;
                const liveMetrics = metaMetrics[selected.id] as Record<string, string | number> | null | undefined;
                const staticM = METRICAS[selected.id];

                return (
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {/* KPIs */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                      {liveMetrics ? (
                        [
                          ["Inversión", liveMetrics.inversion ?? "—"],
                          ["CPL",       liveMetrics.cpl ?? "—"],
                          ["ROAS",      liveMetrics.roas ?? "—"],
                          ["Leads",     liveMetrics.leads ?? "—"],
                        ].map(([l, v]) => (
                          <div key={String(l)} style={{ ...CARD, padding: "14px" }}>
                            <p style={{ ...LABEL, marginBottom: "6px" }}>{l}</p>
                            <p style={{ fontFamily: "'Space Mono', monospace", fontWeight: 700, fontSize: "18px", color: "#00E676" }}>{String(v)}</p>
                          </div>
                        ))
                      ) : staticM ? (
                        [["CPL", staticM.cpl], ["ROAS", staticM.roas], ["Inversión semanal", staticM.inversion], ["Leads generados", staticM.leads]].map(([l, v]) => (
                          <div key={l} style={{ ...CARD, padding: "14px" }}>
                            <p style={{ ...LABEL, marginBottom: "6px" }}>{l}</p>
                            <p style={{ fontFamily: "'Space Mono', monospace", fontWeight: 700, fontSize: "20px", color: "var(--text)" }}>{v}</p>
                          </div>
                        ))
                      ) : null}
                    </div>

                    {/* Botón Meta real */}
                    {hasMeta ? (
                      <button
                        onClick={actualizarMetaMetics}
                        disabled={metaLoading}
                        style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid rgba(0,200,255,0.2)", background: "rgba(0,200,255,0.06)", color: metaLoading ? "#2A3040" : "#00C8FF", fontSize: "13px", cursor: metaLoading ? "not-allowed" : "pointer", fontWeight: 500 }}
                      >
                        {metaLoading ? "Obteniendo datos..." : "↻ Actualizar Meta Ads"}
                      </button>
                    ) : (
                      <div style={{ padding: "14px", borderRadius: "6px", border: "1px solid var(--border)", background: "var(--card)", textAlign: "center" }}>
                        <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "10px" }}>Sin cuenta Meta conectada</p>
                        <button
                          onClick={() => { setSelected(null); setShowModal(true); }}
                          style={{ padding: "7px 14px", borderRadius: "4px", background: "rgba(0,200,255,0.08)", color: "#00C8FF", border: "1px solid rgba(0,200,255,0.2)", fontSize: "12px", cursor: "pointer" }}
                        >Conectar ahora</button>
                      </div>
                    )}

                    {metaError && <p style={{ fontSize: "12px", color: "#FF5252", marginTop: "4px" }}>{metaError}</p>}

                    {/* ── Google Search Console ── */}
                    <div style={{ marginTop: "8px", borderTop: "1px solid var(--border)", paddingTop: "16px" }}>
                      <p style={{ ...LABEL, marginBottom: "8px", color: "#4285F4" }}>Search Console</p>
                      <div style={{ display: "flex", gap: "6px", marginBottom: "8px" }}>
                        <input
                          value={gscSiteUrl[selected.id] ?? ""}
                          onChange={e => setGscSiteUrl(prev => ({ ...prev, [selected.id]: e.target.value }))}
                          placeholder="https://raxislab.com/ o sc-domain:raxislab.com"
                          style={{ flex: 1, padding: "7px 10px", borderRadius: "4px", border: "1px solid var(--border)", background: "var(--card)", color: "var(--text)", fontSize: "12px", outline: "none" }}
                        />
                        <button onClick={obtenerGSC} disabled={gscLoading || !gscSiteUrl[selected.id]}
                          style={{ padding: "7px 12px", borderRadius: "4px", border: "1px solid rgba(66,133,244,0.3)", background: "rgba(66,133,244,0.08)", color: gscLoading || !gscSiteUrl[selected.id] ? "#2A3040" : "#4285F4", fontSize: "12px", cursor: gscLoading || !gscSiteUrl[selected.id] ? "not-allowed" : "pointer", whiteSpace: "nowrap", fontWeight: 600 }}>
                          {gscLoading ? "..." : "Obtener"}
                        </button>
                      </div>
                      {gscError && <p style={{ fontSize: "12px", color: "#FF5252" }}>{gscError}</p>}
                      {gscMetrics[selected.id] && (() => {
                        const m = gscMetrics[selected.id] as Record<string, unknown>;
                        return (
                          <div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "8px" }}>
                              {([["Clics", m.clics], ["Impresiones", m.impresiones], ["CTR", m.ctr], ["Posición media", m.posicionMedia]] as [string, unknown][]).map(([l, v]) => (
                                <div key={l} style={{ ...CARD, padding: "10px" }}>
                                  <p style={{ ...LABEL, marginBottom: "4px", fontSize: "10px" }}>{l}</p>
                                  <p style={{ fontFamily: "'Space Mono', monospace", fontWeight: 700, fontSize: "16px", color: "#4285F4" }}>{String(v)}</p>
                                </div>
                              ))}
                            </div>
                            {Array.isArray(m.keywords) && (m.keywords as { query: string; clics: number; posicion: string }[]).length > 0 && (
                              <div>
                                <p style={{ ...LABEL, marginBottom: "6px", fontSize: "10px" }}>Top keywords</p>
                                {(m.keywords as { query: string; clics: number; posicion: string }[]).slice(0, 5).map((kw, i) => (
                                  <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid rgba(255,255,255,0.04)", fontSize: "12px" }}>
                                    <span style={{ color: "var(--text-mid)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "160px" }}>{kw.query}</span>
                                    <div style={{ display: "flex", gap: "10px", flexShrink: 0 }}>
                                      <span style={{ color: "#4285F4", fontFamily: "'Space Mono', monospace", fontSize: "11px" }}>{kw.clics} clics</span>
                                      <span style={{ color: "var(--text-muted)", fontSize: "11px" }}>pos {kw.posicion}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>

                    {/* ── Google Analytics GA4 ── */}
                    <div style={{ borderTop: "1px solid var(--border)", paddingTop: "16px" }}>
                      <p style={{ ...LABEL, marginBottom: "8px", color: "#4285F4" }}>Analytics GA4</p>
                      <div style={{ display: "flex", gap: "6px", marginBottom: "8px" }}>
                        <input
                          value={ga4PropertyId[selected.id] ?? ""}
                          onChange={e => setGa4PropertyId(prev => ({ ...prev, [selected.id]: e.target.value }))}
                          placeholder="ID de propiedad GA4 (ej: 12345678)"
                          style={{ flex: 1, padding: "7px 10px", borderRadius: "4px", border: "1px solid var(--border)", background: "var(--card)", color: "var(--text)", fontSize: "12px", outline: "none" }}
                        />
                        <button onClick={obtenerGA4} disabled={ga4Loading || !ga4PropertyId[selected.id]}
                          style={{ padding: "7px 12px", borderRadius: "4px", border: "1px solid rgba(66,133,244,0.3)", background: "rgba(66,133,244,0.08)", color: ga4Loading || !ga4PropertyId[selected.id] ? "#2A3040" : "#4285F4", fontSize: "12px", cursor: ga4Loading || !ga4PropertyId[selected.id] ? "not-allowed" : "pointer", whiteSpace: "nowrap", fontWeight: 600 }}>
                          {ga4Loading ? "..." : "Obtener"}
                        </button>
                      </div>
                      {ga4Error && <p style={{ fontSize: "12px", color: "#FF5252" }}>{ga4Error}</p>}
                      {ga4Metrics[selected.id] && (() => {
                        const m = ga4Metrics[selected.id] as Record<string, unknown>;
                        return (
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                            {([["Sesiones", m.sesiones], ["Usuarios", m.usuarios], ["Pág. vistas", m.paginas_vistas], ["Fuente principal", m.fuente_principal]] as [string, unknown][]).map(([l, v]) => (
                              <div key={l} style={{ ...CARD, padding: "10px" }}>
                                <p style={{ ...LABEL, marginBottom: "4px", fontSize: "10px" }}>{l}</p>
                                <p style={{ fontFamily: "'Space Mono', monospace", fontWeight: 700, fontSize: "14px", color: "#4285F4" }}>{String(v)}</p>
                              </div>
                            ))}
                          </div>
                        );
                      })()}
                    </div>

                    {/* Crear campaña con IA */}
                    {selected.adAccounts.metaAccountId && (
                      <button
                        onClick={() => { setCampaignResult(null); setCampaignError(null); setShowCampaignModal(true); }}
                        style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid rgba(0,230,118,0.2)", background: "rgba(0,230,118,0.06)", color: "#00E676", fontSize: "13px", cursor: "pointer", fontWeight: 500 }}
                      >
                        Crear campaña con IA
                      </button>
                    )}
                  </div>
                );
              })()}

              {/* Tareas */}
              {panelTab === "Tareas" && (
                <div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "16px" }}>
                    {(tareas[selected.id] ?? []).map((t, i) => (
                      <div key={i} onClick={() => toggleTarea(i)} style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
                        <span style={{ width: "16px", height: "16px", borderRadius: "3px", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", border: `1.5px solid ${t.done ? "#00E676" : "#2A3040"}`, background: t.done ? "#00E676" : "transparent" }}>
                          {t.done && <span style={{ color: "#000", fontSize: "10px", fontWeight: 700 }}>✓</span>}
                        </span>
                        <span style={{ fontSize: "13px", color: t.done ? "var(--text-muted)" : "var(--text-mid)", textDecoration: t.done ? "line-through" : "none" }}>{t.texto}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <input value={nuevaTarea} onChange={e => setNuevaTarea(e.target.value)} onKeyDown={e => e.key === "Enter" && addTarea()} placeholder="Nueva tarea..." style={{ flex: 1, padding: "8px 12px", borderRadius: "4px", border: "1px solid var(--border)", background: "var(--card)", color: "var(--text)", fontSize: "12px", outline: "none" }} />
                    <button onClick={addTarea} style={{ padding: "8px 14px", borderRadius: "4px", background: "#00C8FF", color: "#000", fontSize: "12px", fontWeight: 600, border: "none", cursor: "pointer" }}>+</button>
                  </div>
                </div>
              )}

              {/* Contenido */}
              {panelTab === "Contenido" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <textarea value={reseñaInput} onChange={e => setReseñaInput(e.target.value)} placeholder="Pega aquí la reseña a responder (opcional)..." rows={2} style={{ padding: "8px 12px", borderRadius: "4px", border: "1px solid var(--border)", background: "var(--card)", color: "var(--text-mid)", fontSize: "12px", outline: "none", resize: "vertical", fontFamily: "inherit" }} />
                  {[["GBP Post", "Generar post Google Business"], ["Artículo Blog", "Generar artículo de blog"], ["Respuesta Reseña", "Responder reseña reciente"]].map(([tipo, label]) => (
                    <button key={tipo} onClick={() => generarContenido(tipo)} disabled={contenidoLoading} style={{ padding: "12px 16px", borderRadius: "6px", border: "1px solid var(--border)", background: "var(--card)", color: contenidoLoading ? "var(--text-muted)" : "var(--text-mid)", fontSize: "13px", textAlign: "left", cursor: contenidoLoading ? "not-allowed" : "pointer", fontWeight: 500 }}>
                      {contenidoLoading ? "Generando..." : `${label} →`}
                    </button>
                  ))}
                  {contenidoResult && (
                    <div style={{ marginTop: "8px", padding: "14px", borderRadius: "6px", border: "1px solid rgba(0,200,255,0.15)", background: "rgba(0,200,255,0.04)" }}>
                      <p style={{ ...LABEL, marginBottom: "8px" }}>{contenidoResult.tipo}</p>
                      <pre style={{ fontSize: "12px", color: "var(--text-mid)", whiteSpace: "pre-wrap", lineHeight: 1.6, fontFamily: "inherit" }}>{contenidoResult.texto}</pre>
                      <button onClick={() => navigator.clipboard.writeText(contenidoResult.texto).then(() => alert("Copiado ✅"))} style={{ marginTop: "10px", padding: "6px 12px", borderRadius: "4px", background: "rgba(0,200,255,0.1)", color: "#00C8FF", border: "1px solid rgba(0,200,255,0.2)", fontSize: "12px", cursor: "pointer" }}>Copiar</button>
                    </div>
                  )}
                </div>
              )}

              {/* Tendencias */}
              {panelTab === "Tendencias" && (
                <div>
                  <button onClick={buscarTendencias} disabled={tendenciasLoading} style={{ width: "100%", padding: "12px", borderRadius: "6px", border: "1px solid rgba(0,200,255,0.2)", background: "rgba(0,200,255,0.06)", color: tendenciasLoading ? "#2A3040" : "#00C8FF", fontSize: "13px", cursor: tendenciasLoading ? "not-allowed" : "pointer", fontWeight: 500, marginBottom: "16px" }}>
                    {tendenciasLoading ? "Buscando tendencias..." : `Buscar tendencias sector → ${selected.sector}`}
                  </button>
                  {tendencias[selected.id]?.map((t, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "10px", padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                      <span style={{ fontFamily: "'Space Mono', monospace", fontSize: "11px", color: "var(--text-muted)", width: "18px", flexShrink: 0 }}>{i + 1}</span>
                      <span style={{ fontSize: "13px", color: "var(--text-mid)" }}>{t}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* ── Reservas (Ripieno) ─────────────────────────────────────── */}
              {panelTab === "Reservas" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {/* Stats */}
                  {ripienoStats && (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px", marginBottom: "8px" }}>
                      {[
                        ["Este mes", ripienoStats.este_mes],
                        ["Total", ripienoStats.total],
                        ["Reviews", ripienoStats.reviews_enviados],
                      ].map(([l, v]) => (
                        <div key={String(l)} style={{ ...CARD, padding: "12px", textAlign: "center" }}>
                          <p style={{ fontFamily: "'Space Mono', monospace", fontWeight: 700, fontSize: "20px", color: "#00E676" }}>{String(v)}</p>
                          <p style={{ ...LABEL, marginTop: "4px", fontSize: "10px" }}>{l}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Links rápidos */}
                  <div style={{ display: "flex", gap: "8px" }}>
                    <a href="https://ripieno.raxislab.com" target="_blank" rel="noopener noreferrer"
                       style={{ flex: 1, padding: "8px", borderRadius: "6px", background: "rgba(200,146,10,0.08)", border: "1px solid rgba(200,146,10,0.2)", color: "#C8920A", fontSize: "12px", fontWeight: 600, textDecoration: "none", textAlign: "center" }}>
                      Ver menú →
                    </a>
                    <button onClick={cargarRipieno} disabled={ripienoLoading}
                      style={{ flex: 1, padding: "8px", borderRadius: "6px", background: "rgba(0,200,255,0.06)", border: "1px solid rgba(0,200,255,0.2)", color: ripienoLoading ? "#2A3040" : "#00C8FF", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>
                      {ripienoLoading ? "Cargando…" : "↻ Actualizar"}
                    </button>
                  </div>

                  {ripienoError && <p style={{ fontSize: "12px", color: "#FF5252" }}>{ripienoError}</p>}

                  {/* Filtro fecha */}
                  <input
                    type="date"
                    value={ripienoFiltro}
                    onChange={e => setRipienoFiltro(e.target.value)}
                    placeholder="Filtrar por fecha"
                    style={{ padding: "7px 10px", borderRadius: "4px", border: "1px solid rgba(255,255,255,0.08)", background: "#161616", color: "#FFF", fontSize: "12px", outline: "none" }}
                  />

                  {/* Lista reservas */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    {ripienoReservas
                      .filter(r => !ripienoFiltro || r.fecha === ripienoFiltro)
                      .map(r => {
                        const estadoColor = r.estado === 'confirmada' ? '#00E676' : r.estado === 'cancelada' ? '#FF5252' : '#FFB800';
                        return (
                          <div key={r.id} style={{ ...CARD, padding: "12px 14px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{ fontSize: "13px", fontWeight: 600, color: "#FFFFFF", marginBottom: "2px" }}>{r.nombre}</p>
                                <p style={{ fontSize: "11px", color: "#5A6470", fontFamily: "'Space Mono', monospace" }}>{r.fecha} · {r.hora} · {r.personas}p</p>
                                <p style={{ fontSize: "11px", color: "#5A6470", marginTop: "2px" }}>{r.email}{r.telefono ? ` · ${r.telefono}` : ''}</p>
                                {r.comentarios && <p style={{ fontSize: "11px", color: "#2A3040", marginTop: "3px", fontStyle: "italic" }}>{r.comentarios}</p>}
                              </div>
                              <div style={{ display: "flex", flexDirection: "column", gap: "4px", alignItems: "flex-end", flexShrink: 0 }}>
                                <span style={{ fontSize: "10px", fontWeight: 600, padding: "2px 7px", borderRadius: "3px", background: `${estadoColor}18`, color: estadoColor, border: `1px solid ${estadoColor}40` }}>
                                  {r.estado.toUpperCase()}
                                </span>
                                {r.estado === 'pendiente' && (
                                  <div style={{ display: "flex", gap: "4px" }}>
                                    <button onClick={() => cambiarEstadoReserva(r.id, 'confirmada')}
                                      style={{ padding: "3px 7px", borderRadius: "3px", border: "1px solid rgba(0,230,118,0.3)", background: "rgba(0,230,118,0.08)", color: "#00E676", fontSize: "10px", cursor: "pointer" }}>✓</button>
                                    <button onClick={() => cambiarEstadoReserva(r.id, 'cancelada')}
                                      style={{ padding: "3px 7px", borderRadius: "3px", border: "1px solid rgba(255,82,82,0.3)", background: "rgba(255,82,82,0.08)", color: "#FF5252", fontSize: "10px", cursor: "pointer" }}>✗</button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    }
                    {!ripienoLoading && ripienoReservas.filter(r => !ripienoFiltro || r.fecha === ripienoFiltro).length === 0 && (
                      <p style={{ fontSize: "13px", color: "#2A3040", textAlign: "center", padding: "20px 0" }}>
                        {ripienoFiltro ? "Sin reservas para esa fecha." : "No hay reservas aún."}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Documentos */}
              {panelTab === "Documentos" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {(DOCS[selected.id] ?? []).map(doc => (
                    <div key={doc} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "12px 14px", borderRadius: "6px", border: "1px solid var(--border)", background: "var(--card)" }}>
                      <span style={{ color: "var(--text-muted)", fontSize: "16px" }}>📄</span>
                      <span style={{ flex: 1, fontSize: "13px", color: "var(--text-mid)" }}>{doc}</span>
                      <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Google Drive</span>
                    </div>
                  ))}
                  {HISTORIAL[selected.id]?.map((h, i) => (
                    <div key={i} style={{ marginTop: "4px", display: "flex", gap: "10px", padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                      <span style={{ fontSize: "11px", fontWeight: 600, padding: "2px 6px", borderRadius: "3px", background: "rgba(0,200,255,0.08)", color: "#00C8FF", flexShrink: 0, height: "fit-content" }}>{h.tipo}</span>
                      <div>
                        <p style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "2px", fontFamily: "'Space Mono', monospace" }}>{h.fecha}</p>
                        <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>{h.nota}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* ── Modal Crear Campaña con IA ───────────────────────────────────────── */}
      {showCampaignModal && selected && (
        <>
          <div style={{ position: "fixed", inset: 0, zIndex: 80, background: "rgba(0,0,0,0.7)" }} onClick={() => setShowCampaignModal(false)} />
          <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: "540px", maxHeight: "90vh", overflowY: "auto", zIndex: 90, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "10px", padding: "28px 32px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
              <div>
                <h2 style={{ fontSize: "15px", fontWeight: 600, color: "var(--text)", margin: 0 }}>Crear campaña con IA</h2>
                <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "3px" }}>{selected.name} · {selected.adAccounts.metaAccountId}</p>
              </div>
              <button onClick={() => setShowCampaignModal(false)} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "20px" }}>×</button>
            </div>

            {!campaignResult ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div>
                  <label style={{ ...LABEL, display: "block", marginBottom: "6px" }}>Objetivo</label>
                  <select value={campaign.objetivo} onChange={e => setCampaign(c => ({ ...c, objetivo: e.target.value }))} style={SELECT_STYLE}>
                    <option value="leads">Generación de leads</option>
                    <option value="conversions">Conversiones</option>
                    <option value="reach">Alcance</option>
                    <option value="traffic">Tráfico</option>
                  </select>
                </div>
                <div>
                  <label style={{ ...LABEL, display: "block", marginBottom: "6px" }}>Presupuesto diario (€)</label>
                  <input type="number" value={campaign.presupuesto} onChange={e => setCampaign(c => ({ ...c, presupuesto: e.target.value }))} placeholder="Ej: 10" style={INPUT_STYLE} />
                </div>
                <div>
                  <label style={{ ...LABEL, display: "block", marginBottom: "6px" }}>Audiencia</label>
                  <textarea value={campaign.audiencia} onChange={e => setCampaign(c => ({ ...c, audiencia: e.target.value }))} placeholder="Ej: Mujeres 25-45 años, Valencia 20km, interesadas en belleza" rows={3} style={{ ...INPUT_STYLE, resize: "vertical", fontFamily: "inherit" }} />
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                    <label style={LABEL}>Texto del anuncio</label>
                    <button onClick={generarCopyIA} disabled={copyLoading || !campaign.audiencia} style={{ padding: "4px 10px", borderRadius: "4px", border: "1px solid rgba(0,200,255,0.2)", background: "rgba(0,200,255,0.06)", color: !campaign.audiencia ? "#2A3040" : "#00C8FF", fontSize: "11px", cursor: !campaign.audiencia ? "not-allowed" : "pointer" }}>
                      {copyLoading ? "Generando..." : "Generar con IA"}
                    </button>
                  </div>
                  <textarea value={campaign.textoAnuncio} onChange={e => setCampaign(c => ({ ...c, textoAnuncio: e.target.value }))} placeholder="El texto aparecerá aquí o escríbelo tú..." rows={4} style={{ ...INPUT_STYLE, resize: "vertical", fontFamily: "inherit" }} />
                </div>
                <div>
                  <label style={{ ...LABEL, display: "block", marginBottom: "6px" }}>CTA</label>
                  <select value={campaign.cta} onChange={e => setCampaign(c => ({ ...c, cta: e.target.value }))} style={SELECT_STYLE}>
                    <option>Reservar ahora</option>
                    <option>Más información</option>
                    <option>Llamar ahora</option>
                  </select>
                </div>

                {campaignError && <p style={{ fontSize: "12px", color: "#FF5252" }}>{campaignError}</p>}

                <button
                  onClick={crearCampanaMeta}
                  disabled={campaignLoading || !campaign.presupuesto}
                  style={{ padding: "12px", borderRadius: "6px", background: !campaign.presupuesto ? "rgba(0,200,255,0.15)" : "#00C8FF", color: !campaign.presupuesto ? "#2A3040" : "#000", fontSize: "13px", fontWeight: 600, border: "none", cursor: !campaign.presupuesto ? "not-allowed" : "pointer" }}
                >
                  {campaignLoading ? "Creando campaña..." : "Crear en Meta (borrador)"}
                </button>
                <p style={{ fontSize: "11px", color: "var(--text-muted)", textAlign: "center" }}>La campaña se crea siempre en estado PAUSADO. Revisa y activa manualmente en Meta Ads Manager.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px", alignItems: "center", textAlign: "center" }}>
                <p style={{ fontSize: "32px" }}>✅</p>
                <p style={{ fontSize: "14px", color: "var(--text)", fontWeight: 500 }}>Campaña creada en borrador</p>
                <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>Revisa y activa manualmente en Meta Ads Manager.</p>
                <a href={campaignResult.editUrl} target="_blank" rel="noopener noreferrer" style={{ padding: "10px 20px", borderRadius: "6px", background: "#00C8FF", color: "#000", fontSize: "13px", fontWeight: 600, textDecoration: "none" }}>
                  Abrir en Meta Ads Manager
                </a>
                <button onClick={() => setShowCampaignModal(false)} style={{ padding: "8px", borderRadius: "6px", border: "1px solid var(--border)", background: "transparent", color: "var(--text-muted)", fontSize: "12px", cursor: "pointer" }}>Cerrar</button>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── Modal Nuevo Cliente ───────────────────────────────────────────────── */}
      {showModal && (
        <>
          <div style={{ position: "fixed", inset: 0, zIndex: 60, background: "rgba(0,0,0,0.6)" }} onClick={resetModal} />
          <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: "520px", maxHeight: "90vh", overflowY: "auto", zIndex: 70, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "10px", padding: "28px 32px" }}>
            {/* Header modal */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
              <div>
                <h2 style={{ fontSize: "16px", fontWeight: 600, color: "var(--text)", margin: 0 }}>Nuevo Cliente</h2>
                <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>Paso {modalStep} de 3</p>
              </div>
              <button onClick={resetModal} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "20px" }}>×</button>
            </div>

            {/* Barra de progreso */}
            <div style={{ display: "flex", gap: "6px", marginBottom: "24px" }}>
              {[1, 2, 3].map(s => (
                <div key={s} style={{ flex: 1, height: "3px", borderRadius: "2px", background: s <= modalStep ? "#00C8FF" : "var(--border)" }} />
              ))}
            </div>

            {/* PASO 1 — Datos básicos */}
            {modalStep === 1 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div>
                  <label style={{ ...LABEL, display: "block", marginBottom: "6px" }}>Nombre del negocio *</label>
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ej: Beauty Studio Valencia" style={INPUT_STYLE} />
                </div>
                <div>
                  <label style={{ ...LABEL, display: "block", marginBottom: "6px" }}>Sector *</label>
                  <select value={form.sector} onChange={e => setForm(f => ({ ...f, sector: e.target.value }))} style={SELECT_STYLE}>
                    {SECTORES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ ...LABEL, display: "block", marginBottom: "6px" }}>MRR acordado (€)</label>
                  <input type="number" value={form.mrr} onChange={e => setForm(f => ({ ...f, mrr: e.target.value }))} placeholder="Ej: 550" style={INPUT_STYLE} />
                </div>
                <div>
                  <label style={{ ...LABEL, display: "block", marginBottom: "6px" }}>Contacto — Nombre *</label>
                  <input value={form.contactName} onChange={e => setForm(f => ({ ...f, contactName: e.target.value }))} placeholder="Nombre del contacto" style={INPUT_STYLE} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <div>
                    <label style={{ ...LABEL, display: "block", marginBottom: "6px" }}>Teléfono</label>
                    <input value={form.contactPhone} onChange={e => setForm(f => ({ ...f, contactPhone: e.target.value }))} placeholder="+34 600 000 000" style={INPUT_STYLE} />
                  </div>
                  <div>
                    <label style={{ ...LABEL, display: "block", marginBottom: "6px" }}>Email</label>
                    <input type="email" value={form.contactEmail} onChange={e => setForm(f => ({ ...f, contactEmail: e.target.value }))} placeholder="cliente@email.com" style={INPUT_STYLE} />
                  </div>
                </div>
                <div>
                  <label style={{ ...LABEL, display: "block", marginBottom: "8px" }}>Servicios contratados</label>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                    {SERVICIOS_OPTS.map(s => (
                      <button key={s} type="button" onClick={() => toggleService(s)} style={{ padding: "6px 12px", borderRadius: "4px", border: `1px solid ${form.services.includes(s) ? "rgba(0,200,255,0.4)" : "var(--border)"}`, background: form.services.includes(s) ? "rgba(0,200,255,0.1)" : "transparent", color: form.services.includes(s) ? "#00C8FF" : "#5A6470", fontSize: "12px", cursor: "pointer", fontWeight: form.services.includes(s) ? 600 : 400 }}>{s}</button>
                    ))}
                  </div>
                </div>
                <button onClick={() => form.name && form.contactName && setModalStep(2)} style={{ marginTop: "8px", padding: "12px", borderRadius: "6px", background: form.name && form.contactName ? "#00C8FF" : "rgba(0,200,255,0.2)", color: form.name && form.contactName ? "#000" : "#2A3040", fontSize: "13px", fontWeight: 600, border: "none", cursor: form.name && form.contactName ? "pointer" : "not-allowed" }}>
                  Siguiente →
                </button>
              </div>
            )}

            {/* PASO 2 — Meta Ads */}
            {modalStep === 2 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <p style={{ fontSize: "13px", color: "var(--text-muted)", lineHeight: 1.6 }}>Si gestionas Meta Ads para este cliente, introduce el Account ID. Lo encuentras en Business Manager → Cuentas publicitarias.</p>
                <div>
                  <label style={{ ...LABEL, display: "block", marginBottom: "6px" }}>Account ID</label>
                  <input value={form.metaAccountId} onChange={e => setForm(f => ({ ...f, metaAccountId: e.target.value, metaVerified: false, metaVerifyError: "", metaVerifiedName: "" }))} placeholder="act_123456789" style={INPUT_STYLE} />
                </div>
                {form.metaAccountId && (
                  <button onClick={verificarMeta} disabled={form.metaVerifying} style={{ padding: "10px", borderRadius: "6px", border: "1px solid rgba(0,200,255,0.2)", background: "rgba(0,200,255,0.06)", color: form.metaVerifying ? "#2A3040" : "#00C8FF", fontSize: "13px", cursor: form.metaVerifying ? "not-allowed" : "pointer" }}>
                    {form.metaVerifying ? "Verificando..." : "Verificar conexión"}
                  </button>
                )}
                {form.metaVerified && <p style={{ fontSize: "13px", color: "#00E676" }}>✓ {form.metaVerifiedName}</p>}
                {form.metaVerifyError && <p style={{ fontSize: "13px", color: "#FF5252" }}>{form.metaVerifyError}</p>}
                <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
                  <button onClick={() => setModalStep(1)} style={{ flex: 1, padding: "10px", borderRadius: "6px", border: "1px solid var(--border)", background: "transparent", color: "var(--text-muted)", fontSize: "13px", cursor: "pointer" }}>← Atrás</button>
                  <button onClick={() => setModalStep(3)} style={{ flex: 2, padding: "10px", borderRadius: "6px", background: "#00C8FF", color: "#000", fontSize: "13px", fontWeight: 600, border: "none", cursor: "pointer" }}>Siguiente →</button>
                </div>
                <button onClick={() => setModalStep(3)} style={{ padding: "8px", borderRadius: "6px", border: "none", background: "transparent", color: "var(--text-muted)", fontSize: "12px", cursor: "pointer" }}>Saltar este paso</button>
              </div>
            )}

            {/* PASO 3 — Google Ads */}
            {modalStep === 3 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <p style={{ fontSize: "13px", color: "var(--text-muted)", lineHeight: 1.6 }}>Si gestionas Google Ads para este cliente, introduce el Customer ID. Lo encuentras en Google Ads → Configuración de la cuenta.</p>
                <div>
                  <label style={{ ...LABEL, display: "block", marginBottom: "6px" }}>Customer ID</label>
                  <input value={form.googleCustomerId} onChange={e => setForm(f => ({ ...f, googleCustomerId: e.target.value, googleVerified: false, googleVerifyError: "", googleVerifiedName: "" }))} placeholder="123-456-7890" style={INPUT_STYLE} />
                </div>
                {form.googleCustomerId && (
                  <button onClick={verificarGoogle} disabled={form.googleVerifying} style={{ padding: "10px", borderRadius: "6px", border: "1px solid rgba(66,133,244,0.2)", background: "rgba(66,133,244,0.06)", color: form.googleVerifying ? "#2A3040" : "#4285F4", fontSize: "13px", cursor: form.googleVerifying ? "not-allowed" : "pointer" }}>
                    {form.googleVerifying ? "Verificando..." : "Verificar conexión"}
                  </button>
                )}
                {form.googleVerified && <p style={{ fontSize: "13px", color: "#00E676" }}>✓ {form.googleVerifiedName}</p>}
                {form.googleVerifyError && <p style={{ fontSize: "13px", color: "#FF5252" }}>{form.googleVerifyError}</p>}
                <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
                  <button onClick={() => setModalStep(2)} style={{ flex: 1, padding: "10px", borderRadius: "6px", border: "1px solid var(--border)", background: "transparent", color: "var(--text-muted)", fontSize: "13px", cursor: "pointer" }}>← Atrás</button>
                  <button onClick={() => guardarCliente(true)} style={{ flex: 2, padding: "10px", borderRadius: "6px", background: "#00C8FF", color: "#000", fontSize: "13px", fontWeight: 600, border: "none", cursor: "pointer" }}>Guardar Cliente</button>
                </div>
                <button onClick={() => guardarCliente(false)} style={{ padding: "8px", borderRadius: "6px", border: "1px solid var(--border)", background: "transparent", color: "var(--text-muted)", fontSize: "12px", cursor: "pointer" }}>Guardar y conectar después</button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
