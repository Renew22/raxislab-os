"use client";

import { useState } from "react";

type Flow = {
  id:               number;
  nombre:           string;
  descripcion:      string;
  stack:            string;
  frecuencia:       string;
  ultimaEjecucion:  string | null;
  proximaEjecucion: string | null;
  activo:           boolean;
  apiPath?:         string;
  apiBody?:         Record<string, unknown>;
};

type ModalState = { open: boolean; nombre: string; frecuencia: string; accion: string };
type ResultState = { flowId: number; content: string; error?: boolean } | null;

// Genera fechas relativas reales en lugar de hardcodear "9 Jun"
function nextWeekday(day: number, hour: string): string {
  // day: 0=Dom, 1=Lun... 6=Sab
  const now   = new Date();
  const d     = new Date(now);
  const diff  = (day - now.getDay() + 7) % 7 || 7;
  d.setDate(now.getDate() + diff);
  const days  = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];
  return `${days[d.getDay()]} ${d.getDate()} ${d.toLocaleDateString("es-ES",{month:"short"})} · ${hour}`;
}
function yesterday(hour: string) { return `Ayer · ${hour}`; }
function today(hour: string)     { return `Hoy · ${hour}`; }

const INITIAL_FLOWS: Flow[] = [
  // ── ACTIVOS EN HETZNER ───────────────────────────────────────────────────
  {
    id: 20, nombre: "Briefing diario · 07:00 UTC",
    descripcion: "Resumen de cartera + Meta + tareas críticas Notion → Telegram cada mañana L-V",
    stack: "Finnhub + Meta API + Notion + Telegram", frecuencia: "Diario L-V · 07:00 UTC",
    ultimaEjecucion: today("07:00"), proximaEjecucion: "Mañana · 07:00", activo: true,
  },
  {
    id: 21, nombre: "M15 Pre-señales · cada 5 min",
    descripcion: "Detecta pre-señales técnicas (vol, RSI, SMA200, EMA cruce) en cartera → Telegram 🔮",
    stack: "Polygon + Hetzner Scanner", frecuencia: "Cada 5 min · L-V 15:00-22:00",
    ultimaEjecucion: today("última ventana"), proximaEjecucion: "Próxima apertura", activo: true,
  },
  {
    id: 22, nombre: "Noticias por ticker · c/30 min",
    descripcion: "Finnhub company-news para CRCL/RCUS/KEEL/MO/AAOI/SWKS/INTC/BE → Telegram si hay nueva",
    stack: "Finnhub + Hetzner + Telegram", frecuencia: "L-V · 0min y 30min",
    ultimaEjecucion: today("última hora"), proximaEjecucion: "Próxima media hora", activo: true,
  },
  {
    id: 23, nombre: "Catalizadores semanales · Lun 08:00",
    descripcion: "Earnings Finnhub + eventos macro por sector para toda la semana → Telegram resumen",
    stack: "Finnhub + Hetzner + Telegram", frecuencia: "Semanal · Lun 08:00 Madrid",
    ultimaEjecucion: nextWeekday(1, "08:00"), proximaEjecucion: nextWeekday(1, "08:00"), activo: true,
  },
  // ── FLOWS EJECUTABLES DESDE OS ───────────────────────────────────────────
  {
    id: 10, nombre: "Recordatorio plan domingo",
    descripcion: "Cada domingo a las 20:00 envía Telegram con el plan de la semana y tareas críticas",
    stack: "Telegram", frecuencia: "Semanal · Dom 20:00",
    ultimaEjecucion: nextWeekday(0, "20:00"), proximaEjecucion: nextWeekday(0, "20:00"), activo: true,
    apiPath: "/api/telegram/send",
    apiBody: { text: "📅 <b>Plan semanal RaxisLab</b>\n\n🔵 <b>Deep Work (mañanas)</b>\n• Desarrollo RaxisLab OS\n• Contenido clientes\n• Captación nuevos leads\n\n🟡 <b>Clientes</b>\n• Identity Peluqueros — revisar métricas\n• Desancho — reseñas pendientes\n\n🔴 <b>Urgente</b>\n• Ver tareas en OS → Calendario Notion\n\n¡Buena semana! 💪" },
  },
  {
    id: 11, nombre: "Notificación cobros del día",
    descripcion: "Alerta manual con recordatorio de cobros programados para hoy",
    stack: "Telegram", frecuencia: "Manual / Diario 20:00",
    ultimaEjecucion: yesterday("20:00"), proximaEjecucion: today("20:00"), activo: true,
    apiPath: "/api/telegram/send",
    apiBody: { text: "💳 <b>Recordatorio cobros</b>\n\nRevisa tu cuenta bancaria — puede haber cargos programados hoy.\nVe a /finanzas para ver el detalle completo." },
  },
  {
    id: 2, nombre: "GBP Post Semanal",
    descripcion: "Claude redacta post para Google Business Profile del cliente seleccionado",
    stack: "Claude + Google Business", frecuencia: "Semanal · Mié 10:00",
    ultimaEjecucion: null, proximaEjecucion: nextWeekday(3, "10:00"), activo: false,
    apiPath: "/api/flows/blog",
    apiBody: { topic: "Novedades y promociones del negocio", sector: "estética/peluquería" },
  },
  {
    id: 3, nombre: "Respuesta Reseñas Google",
    descripcion: "Genera respuesta personalizada para reseña → copia lista para publicar en GBP",
    stack: "Claude + Google Business", frecuencia: "Tiempo real",
    ultimaEjecucion: null, proximaEjecucion: "Al recibir reseña", activo: false,
    apiPath: "/api/flows/reviews",
    apiBody: { reviewText: "Muy buen servicio, el personal muy atento y el resultado excelente. Volveré sin duda.", reviewerName: "María García", rating: 5, clientName: "Identity Peluqueros", sector: "Peluquería" },
  },
  {
    id: 5, nombre: "Blog artículo EN (AdSense)",
    descripcion: "Claude redacta artículo SEO en inglés para Blog AdSense → borrador listo para publicar",
    stack: "Claude", frecuencia: "Semanal · Vie 15:00",
    ultimaEjecucion: null, proximaEjecucion: nextWeekday(5, "15:00"), activo: false,
    apiPath: "/api/flows/blog",
    apiBody: { topic: "How to grow your local business with Meta Ads in 2025", keyword: "local business marketing", sector: "digital marketing" },
  },
  {
    id: 6, nombre: "Guión YouTube",
    descripcion: "Claude genera guión estructurado de 8-10 min para canal YouTube automation",
    stack: "Claude + Telegram", frecuencia: "Semanal · Vie 16:00",
    ultimaEjecucion: null, proximaEjecucion: nextWeekday(5, "16:00"), activo: false,
    apiPath: "/api/flows/youtube-script",
    apiBody: { topic: "Cómo conseguir más clientes para tu negocio local con Meta Ads", duracion: "8-10 minutos" },
  },
];

const EMPTY_MODAL: ModalState = { open: false, nombre: "", frecuencia: "Diario", accion: "" };
const FRECUENCIAS = ["Tiempo real", "Diario", "Semanal", "Mensual", "Manual"];

export default function AutomatizacionesPage() {
  const [flows, setFlows]     = useState<Flow[]>(INITIAL_FLOWS);
  const [modal, setModal]     = useState<ModalState>(EMPTY_MODAL);
  const [nextId, setNextId]   = useState(20);
  const [running, setRunning] = useState<number | null>(null);
  const [result, setResult]   = useState<ResultState>(null);

  function toggleFlow(id: number) {
    setFlows(prev => prev.map(f =>
      f.id === id ? { ...f, activo: !f.activo, ultimaEjecucion: !f.activo ? "Ahora" : f.ultimaEjecucion } : f
    ));
  }

  function addFlow() {
    if (!modal.nombre.trim()) return;
    setFlows(prev => [{
      id: nextId, nombre: modal.nombre.trim(), descripcion: modal.accion.trim() || "—",
      stack: "Personalizado", frecuencia: modal.frecuencia,
      ultimaEjecucion: null, proximaEjecucion: "—", activo: false,
    }, ...prev]);
    setNextId(n => n + 1);
    setModal(EMPTY_MODAL);
  }

  async function ejecutarFlow(f: Flow) {
    if (!f.apiPath) return;
    setRunning(f.id);
    setResult(null);
    try {
      const res  = await fetch(f.apiPath, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(f.apiBody ?? {}),
      });
      const data = await res.json();

      const text = data.content ?? data.response ?? data.text ?? (data.success ? "✅ Enviado correctamente" : null) ?? data.error ?? JSON.stringify(data);
      setResult({ flowId: f.id, content: text, error: !!data.error });
      if (!data.error) {
        setFlows(prev => prev.map(x => x.id === f.id ? { ...x, ultimaEjecucion: "Ahora" } : x));
      }
    } catch (e) {
      setResult({ flowId: f.id, content: e instanceof Error ? e.message : "Error de red", error: true });
    } finally {
      setRunning(null);
    }
  }

  const activos    = flows.filter(f => f.activo).length;
  const personales = flows.filter(f => f.id >= 8 && f.id < 20);
  const n8nFlows   = flows.filter(f => f.id < 8 || f.id >= 20);

  const INPUT: React.CSSProperties = { width:"100%", padding:"9px 12px", borderRadius:"6px", border:"1px solid var(--border)", background:"var(--bg)", color:"var(--text)", fontSize:"13px", outline:"none", boxSizing:"border-box" };

  function FlowCard({ f }: { f: Flow }) {
    const isRunning  = running === f.id;
    const thisResult = result?.flowId === f.id ? result : null;

    return (
      <div style={{
        background: "var(--card)", border: `1px solid ${f.activo ? "var(--border-accent)" : "var(--border)"}`,
        borderRadius: "12px", padding: "20px", transition: "border-color 0.2s",
      }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: "18px" }}>
          {/* Toggle */}
          <button onClick={() => toggleFlow(f.id)}
            style={{ flexShrink:0, width:"44px", height:"24px", borderRadius:"999px", position:"relative",
              background: f.activo ? "var(--accent)" : "var(--border)", border:"none", cursor:"pointer",
              transition:"background 0.2s", marginTop:"2px", outline:"none" }}
            aria-label={f.activo ? "Desactivar" : "Activar"}>
            <span style={{ position:"absolute", top:"2px", width:"20px", height:"20px", borderRadius:"50%",
              background:"#ffffff", transition:"left 0.2s", left: f.activo ? "calc(100% - 22px)" : "2px" }} />
          </button>

          {/* Info */}
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ display:"flex", alignItems:"center", gap:"10px", marginBottom:"4px", flexWrap:"wrap" }}>
              <span style={{ fontSize:"14px", fontWeight:500, color:"var(--text)" }}>{f.nombre}</span>
              <span style={{ fontSize:"10px", fontWeight:700, padding:"2px 8px", borderRadius:"999px",
                color: f.activo ? "var(--green)" : "var(--text-muted)",
                background: f.activo ? "rgba(0,230,118,0.08)" : "var(--accent-dim)" }}>
                {f.activo ? "ACTIVA" : "PAUSADA"}
              </span>
            </div>
            <p style={{ fontSize:"12px", marginBottom:"8px", color:"var(--text-mid)", lineHeight:1.5 }}>{f.descripcion}</p>
            <div style={{ display:"flex", alignItems:"center", gap:"6px", flexWrap:"wrap" }}>
              {f.stack.split(" + ").map(s => (
                <span key={s} style={{ fontSize:"11px", padding:"2px 8px", borderRadius:"4px",
                  background:"var(--accent-dim)", color:"var(--accent)", border:"1px solid var(--border-accent)" }}>{s}</span>
              ))}
              <span style={{ fontSize:"10px", color:"var(--text-muted)", marginLeft:"4px", fontFamily:"'Space Mono', monospace" }}>{f.frecuencia}</span>
            </div>
          </div>

          {/* Ejecuciones + botón */}
          <div style={{ flexShrink:0, textAlign:"right", minWidth:"140px" }}>
            <div style={{ marginBottom:"8px" }}>
              <p style={{ fontSize:"10px", color:"var(--text-muted)", marginBottom:"2px", letterSpacing:"0.06em", textTransform:"uppercase", fontWeight:600 }}>Última</p>
              <p style={{ fontSize:"12px", fontWeight:500, color: f.ultimaEjecucion ? "var(--text-mid)" : "var(--border)" }}>
                {f.ultimaEjecucion ?? "Nunca"}
              </p>
            </div>
            <div style={{ marginBottom:"12px" }}>
              <p style={{ fontSize:"10px", color:"var(--text-muted)", marginBottom:"2px", letterSpacing:"0.06em", textTransform:"uppercase", fontWeight:600 }}>Próxima</p>
              <p style={{ fontSize:"12px", fontWeight:500, color: f.activo ? "var(--accent)" : "var(--text-muted)" }}>
                {f.proximaEjecucion ?? "—"}
              </p>
            </div>
            {f.apiPath && (
              <button
                onClick={() => ejecutarFlow(f)}
                disabled={isRunning}
                style={{ padding:"6px 14px", borderRadius:"5px", border:"1px solid var(--border-accent)",
                  background: isRunning ? "var(--accent-dim)" : "rgba(0,200,255,0.1)",
                  color: isRunning ? "var(--text-muted)" : "var(--accent)",
                  fontSize:"12px", fontWeight:600, cursor: isRunning ? "not-allowed" : "pointer", width:"100%" }}>
                {isRunning ? "Ejecutando..." : "▶ Ejecutar"}
              </button>
            )}
          </div>
        </div>

        {/* Resultado inline */}
        {thisResult && (
          <div style={{ marginTop:"16px", padding:"14px", borderRadius:"8px",
            border: `1px solid ${thisResult.error ? "rgba(255,61,113,0.2)" : "rgba(0,200,255,0.15)"}`,
            background: thisResult.error ? "rgba(255,61,113,0.04)" : "rgba(0,200,255,0.04)" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"8px" }}>
              <span style={{ fontSize:"11px", fontWeight:600, letterSpacing:"0.06em", textTransform:"uppercase",
                color: thisResult.error ? "var(--red)" : "var(--accent)" }}>
                {thisResult.error ? "Error" : "Resultado"}
              </span>
              <button onClick={() => setResult(null)} style={{ background:"none", border:"none", color:"var(--text-muted)", cursor:"pointer", fontSize:"16px", lineHeight:1 }}>×</button>
            </div>
            <pre style={{ fontSize:"12px", color:"var(--text-mid)", whiteSpace:"pre-wrap", lineHeight:1.6, fontFamily:"inherit", maxHeight:"300px", overflowY:"auto" }}>
              {thisResult.content}
            </pre>
            {!thisResult.error && (
              <button
                onClick={() => navigator.clipboard.writeText(thisResult.content).then(() => alert("Copiado ✅"))}
                style={{ marginTop:"10px", padding:"5px 12px", borderRadius:"4px", background:"rgba(0,200,255,0.1)",
                  color:"var(--accent)", border:"1px solid var(--border-accent)", fontSize:"11px", cursor:"pointer" }}>
                Copiar
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ padding:"32px 40px" }}>
      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"24px" }}>
        <div>
          <h1 style={{ fontSize:"24px", fontWeight:600, color:"var(--text)", marginBottom:"4px" }}>Automatizaciones</h1>
          <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
            <span style={{ width:"8px", height:"8px", borderRadius:"50%", background:"var(--green)", boxShadow:"0 0 6px var(--green)" }} />
            <span style={{ fontSize:"12px", color:"var(--text-muted)" }}>{activos} de {flows.length} activas</span>
          </div>
        </div>
        <div style={{ display:"flex", gap:"10px", alignItems:"center" }}>
          <a href="/api/auth/google" style={{ padding:"8px 14px", borderRadius:"6px", border:"1px solid rgba(66,133,244,0.3)", background:"rgba(66,133,244,0.06)", color:"#4285F4", fontSize:"12px", fontWeight:600, textDecoration:"none" }}>
            Conectar Google
          </a>
          <button onClick={() => setModal({ ...EMPTY_MODAL, open:true })}
            style={{ padding:"9px 18px", borderRadius:"8px", background:"var(--accent)", color:"#fff", fontSize:"13px", fontWeight:600, border:"none", cursor:"pointer" }}>
            + Nueva
          </button>
        </div>
      </div>

      {/* Notificaciones & Recordatorios */}
      <p style={{ fontSize:"11px", fontWeight:600, letterSpacing:"0.08em", textTransform:"uppercase", color:"var(--text-muted)", marginBottom:"12px" }}>
        Notificaciones &amp; Recordatorios
      </p>
      <div style={{ display:"flex", flexDirection:"column", gap:"10px", marginBottom:"24px" }}>
        {personales.map(f => <FlowCard key={f.id} f={f} />)}
      </div>

      {/* Flows n8n */}
      <p style={{ fontSize:"11px", fontWeight:600, letterSpacing:"0.08em", textTransform:"uppercase", color:"var(--text-muted)", marginBottom:"12px" }}>
        Flows de contenido y clientes
      </p>
      <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
        {n8nFlows.map(f => <FlowCard key={f.id} f={f} />)}
      </div>

      {/* Modal nueva automatización */}
      {modal.open && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.75)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:50, padding:"16px" }}
          onClick={() => setModal(EMPTY_MODAL)}>
          <div style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:"12px", padding:"28px", width:"100%", maxWidth:"440px" }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"22px" }}>
              <h3 style={{ fontSize:"16px", fontWeight:600, color:"var(--text)" }}>Nueva automatización</h3>
              <button onClick={() => setModal(EMPTY_MODAL)} style={{ background:"none", border:"none", color:"var(--text-muted)", cursor:"pointer", fontSize:"18px" }}>✕</button>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:"14px" }}>
              <div>
                <label style={{ fontSize:"12px", color:"var(--text-muted)", display:"block", marginBottom:"6px" }}>Nombre *</label>
                <input value={modal.nombre} onChange={e => setModal(m => ({ ...m, nombre:e.target.value }))}
                  placeholder="Ej: Reporte semanal Desancho" style={INPUT} autoFocus />
              </div>
              <div>
                <label style={{ fontSize:"12px", color:"var(--text-muted)", display:"block", marginBottom:"6px" }}>Frecuencia</label>
                <select value={modal.frecuencia} onChange={e => setModal(m => ({ ...m, frecuencia:e.target.value }))} style={{ ...INPUT, cursor:"pointer" }}>
                  {FRECUENCIAS.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize:"12px", color:"var(--text-muted)", display:"block", marginBottom:"6px" }}>Acción / Descripción</label>
                <input value={modal.accion} onChange={e => setModal(m => ({ ...m, accion:e.target.value }))}
                  placeholder="Ej: Enviar informe por Telegram" style={INPUT} />
              </div>
            </div>
            <div style={{ display:"flex", gap:"10px", marginTop:"24px" }}>
              <button onClick={() => setModal(EMPTY_MODAL)}
                style={{ flex:1, padding:"10px", borderRadius:"8px", background:"transparent", color:"var(--text-muted)", border:"1px solid var(--border)", fontSize:"13px", cursor:"pointer" }}>
                Cancelar
              </button>
              <button onClick={addFlow} disabled={!modal.nombre.trim()}
                style={{ flex:2, padding:"10px", borderRadius:"8px", fontSize:"13px", fontWeight:600, border:"none",
                  background: modal.nombre.trim() ? "var(--accent)" : "var(--border)",
                  color:      modal.nombre.trim() ? "#fff"          : "var(--text-muted)",
                  cursor:     modal.nombre.trim() ? "pointer"       : "not-allowed" }}>
                Crear automatización
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
