"use client";

import { useState } from "react";

const bloques = [
  { time:"07:00", label:"Gym",        icon:"🏋️" },
  { time:"09:00", label:"Deep Work",  icon:"💻" },
  { time:"12:00", label:"Clientes",   icon:"📊" },
  { time:"15:00", label:"Contenido",  icon:"🎬" },
  { time:"17:00", label:"Proyecto",   icon:"🚀" },
  { time:"18:30", label:"Trading",    icon:"📈" },
  { time:"19:00", label:"Cierre día", icon:"✅" },
];

const SEMANA = ["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"];

const semanaTareas: Record<string, string[]> = {
  "Lun": ["Deep Work n8n","Reporte semanal clientes"],
  "Mar": ["Grabar vídeo","Revisar Identity Peluqueros"],
  "Mié": ["Prospecting 5 leads","Trading setup review"],
  "Jue": ["Reunión clientes","Publicar contenido"],
  "Vie": ["Revisión semana","Preparar semana siguiente"],
  "Sáb": ["Trading activo","Proyecto personal"],
  "Dom": ["Descanso / Lectura","Planificación semana"],
};

const kpisSemanales = [
  { label:"MRR",               valor:"1.100€",  meta:"5.000€", pct:22,  color:"#00E676" },
  { label:"Leads contactados", valor:"12",       meta:"20",     pct:60,  color:"#00C8FF" },
  { label:"Videos publicados", valor:"1",        meta:"2",      pct:50,  color:"#FFB800" },
  { label:"Operaciones",       valor:"3",        meta:"—",      pct:100, color:"#9AA3AD" },
];

const hitos = [
  { q:"Q1 2026", meta:"MRR 1.500€", estado:"EN PROGRESO", pct:73,  color:"#FFB800" },
  { q:"Q2 2026", meta:"MRR 2.500€", estado:"PENDIENTE",   pct:0,   color:"#5A6470" },
  { q:"Q3 2026", meta:"MRR 4.000€", estado:"PENDIENTE",   pct:0,   color:"#5A6470" },
  { q:"Q4 2026", meta:"MRR 5.000€ — 100k anual", estado:"PENDIENTE", pct:0, color:"#5A6470" },
];

type Tab = "Hoy"|"Semana"|"Objetivos";
const TABS: Tab[] = ["Hoy","Semana","Objetivos"];

const CARD  = { background:"#111111", border:"1px solid rgba(255,255,255,0.06)", borderRadius:"6px" } as React.CSSProperties;
const LABEL = { fontSize:"11px", fontWeight:600, letterSpacing:"0.08em", textTransform:"uppercase" as const, color:"#5A6470" };

export default function PlanPage() {
  const [tab, setTab] = useState<Tab>("Hoy");
  const [tareaN1, setTareaN1] = useState("");
  const [tareas, setTareas] = useState([
    { texto:"Enviar reporte Identity", done:false },
    { texto:"Publicar vídeo YouTube",  done:false },
    { texto:"Prospectar 3 leads",      done:false },
    { texto:"Review trading EOD",      done:false },
    { texto:"Planificación mañana",    done:false },
  ]);

  function toggleTarea(i: number) {
    setTareas(prev => prev.map((t, idx) => idx === i ? { ...t, done: !t.done } : t));
  }

  const done = tareas.filter(t => t.done).length;
  const totalAnualActual = 1100 * 12;
  const meta100k = 100000;
  const pctMeta = Math.round((totalAnualActual / meta100k) * 100);

  return (
    <div style={{ padding:"32px 40px" }}>
      <h1 style={{ fontSize:"24px", fontWeight:600, color:"#FFFFFF", marginBottom:"24px" }}>Plan Personal</h1>

      {/* Tab bar */}
      <div style={{ display:"inline-flex", gap:"4px", padding:"4px", background:"#0a0a0a", border:"1px solid rgba(255,255,255,0.06)", borderRadius:"8px", marginBottom:"20px" }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding:"7px 20px", borderRadius:"5px", border:"none", cursor:"pointer", fontSize:"13px", fontWeight: tab===t ? 600 : 400, background: tab===t ? "rgba(0,200,255,0.1)" : "transparent", color: tab===t ? "#00C8FF" : "#5A6470", outline: tab===t ? "1px solid rgba(0,200,255,0.2)" : "none" }}>{t}</button>
        ))}
      </div>

      {/* HOY */}
      {tab === "Hoy" && (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"20px" }}>
          {/* Bloques del día */}
          <div style={{ ...CARD, padding:"20px" }}>
            <p style={{ ...LABEL, marginBottom:"16px" }}>Bloques del día</p>
            <div style={{ display:"flex", flexDirection:"column", gap:"2px" }}>
              {bloques.map(({ time,label,icon }) => (
                <div key={time} style={{ display:"flex", alignItems:"center", gap:"14px", padding:"10px 12px", borderRadius:"5px", background:"rgba(255,255,255,0.02)" }}>
                  <span style={{ fontFamily:"'Space Mono', monospace", fontSize:"12px", color:"#5A6470", width:"44px", flexShrink:0 }}>{time}</span>
                  <span style={{ fontSize:"14px", width:"22px" }}>{icon}</span>
                  <span style={{ fontSize:"13px", color:"#9AA3AD" }}>{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Tarea #1 + checklist */}
          <div style={{ display:"flex", flexDirection:"column", gap:"14px" }}>
            <div style={{ ...CARD, padding:"20px" }}>
              <p style={{ ...LABEL, marginBottom:"10px" }}>Tarea #1 del día</p>
              <input
                value={tareaN1}
                onChange={e => setTareaN1(e.target.value)}
                placeholder="¿Cuál es tu tarea más importante hoy?"
                style={{ width:"100%", padding:"10px 12px", borderRadius:"5px", border:"1px solid rgba(0,200,255,0.2)", background:"rgba(0,200,255,0.04)", color:"#FFFFFF", fontSize:"13px", outline:"none" }}
              />
            </div>
            <div style={{ ...CARD, padding:"20px", flex:1 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"14px" }}>
                <p style={LABEL}>Checklist diario</p>
                <span style={{ fontFamily:"'Space Mono', monospace", fontSize:"12px", color: done===tareas.length ? "#00E676" : "#5A6470" }}>{done}/{tareas.length}</span>
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
                {tareas.map((t, i) => (
                  <div key={i} onClick={() => toggleTarea(i)} style={{ display:"flex", alignItems:"center", gap:"10px", cursor:"pointer" }}>
                    <span style={{ width:"16px", height:"16px", borderRadius:"3px", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", border:`1.5px solid ${t.done ? "#00E676" : "#2A3040"}`, background: t.done ? "#00E676" : "transparent" }}>
                      {t.done && <span style={{ color:"#000", fontSize:"10px", fontWeight:700 }}>✓</span>}
                    </span>
                    <span style={{ fontSize:"13px", color: t.done ? "#2A3040" : "#9AA3AD", textDecoration: t.done ? "line-through" : "none" }}>{t.texto}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SEMANA */}
      {tab === "Semana" && (
        <div style={{ display:"flex", flexDirection:"column", gap:"20px" }}>
          {/* KPIs */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"12px" }}>
            {kpisSemanales.map(({ label,valor,meta,pct,color }) => (
              <div key={label} style={{ ...CARD, padding:"16px 18px" }}>
                <p style={{ ...LABEL, marginBottom:"8px" }}>{label}</p>
                <p style={{ fontFamily:"'Space Mono', monospace", fontWeight:700, fontSize:"22px", color, marginBottom:"4px" }}>{valor}</p>
                <p style={{ fontSize:"11px", color:"#5A6470", marginBottom:"10px" }}>meta: {meta}</p>
                {meta !== "—" && (
                  <>
                    <div style={{ background:"rgba(255,255,255,0.06)", borderRadius:"3px", height:"2px" }}>
                      <div style={{ width:`${Math.min(pct,100)}%`, height:"100%", background:color, borderRadius:"3px" }} />
                    </div>
                    <p style={{ fontSize:"11px", color, marginTop:"3px", fontFamily:"'Space Mono', monospace" }}>{pct}%</p>
                  </>
                )}
              </div>
            ))}
          </div>

          {/* Vista semanal */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:"8px" }}>
            {SEMANA.map(dia => (
              <div key={dia} style={{ ...CARD, padding:"12px 14px" }}>
                <p style={{ fontFamily:"'Space Mono', monospace", fontSize:"11px", fontWeight:700, color:"#5A6470", marginBottom:"10px", textAlign:"center" as const }}>{dia}</p>
                <div style={{ display:"flex", flexDirection:"column", gap:"6px" }}>
                  {(semanaTareas[dia] ?? []).map(t => (
                    <p key={t} style={{ fontSize:"11px", color:"#9AA3AD", lineHeight:1.4 }}>{t}</p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* OBJETIVOS */}
      {tab === "Objetivos" && (
        <div style={{ display:"flex", flexDirection:"column", gap:"20px" }}>
          {/* Meta principal */}
          <div style={{ ...CARD, padding:"28px 32px" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"20px" }}>
              <div>
                <p style={{ ...LABEL, marginBottom:"6px" }}>Meta principal 2026</p>
                <h2 style={{ fontSize:"32px", fontWeight:700, fontFamily:"'Space Mono', monospace", color:"#FFFFFF", marginBottom:"4px" }}>100.000€</h2>
                <p style={{ fontSize:"13px", color:"#5A6470" }}>neto anual — agencia + trading + proyectos</p>
              </div>
              <div style={{ textAlign:"right" as const }}>
                <p style={{ fontFamily:"'Space Mono', monospace", fontWeight:700, fontSize:"28px", color:"#00C8FF" }}>{pctMeta}%</p>
                <p style={{ fontSize:"12px", color:"#5A6470" }}>~{totalAnualActual.toLocaleString("es-ES")}€ año actual</p>
              </div>
            </div>
            <div style={{ background:"rgba(255,255,255,0.06)", borderRadius:"4px", height:"6px" }}>
              <div style={{ width:`${pctMeta}%`, height:"100%", background:"linear-gradient(90deg, #00C8FF, #00E676)", borderRadius:"4px" }} />
            </div>
          </div>

          {/* Hitos trimestrales */}
          <div>
            <p style={{ ...LABEL, marginBottom:"14px" }}>Hitos trimestrales</p>
            <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
              {hitos.map(({ q,meta,estado,pct,color }) => (
                <div key={q} style={{ ...CARD, padding:"16px 20px" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:"16px", marginBottom: pct > 0 ? "10px" : "0" }}>
                    <span style={{ fontFamily:"'Space Mono', monospace", fontWeight:700, fontSize:"12px", color:"#5A6470", width:"60px", flexShrink:0 }}>{q}</span>
                    <span style={{ flex:1, fontSize:"13px", color:"#9AA3AD" }}>{meta}</span>
                    <span style={{ fontSize:"11px", fontWeight:600, padding:"3px 8px", borderRadius:"3px", color, background:`${color}12`, border:`1px solid ${color}25`, whiteSpace:"nowrap" }}>{estado}</span>
                    {pct > 0 && <span style={{ fontFamily:"'Space Mono', monospace", fontSize:"12px", color, width:"36px", textAlign:"right" as const }}>{pct}%</span>}
                  </div>
                  {pct > 0 && (
                    <div style={{ background:"rgba(255,255,255,0.06)", borderRadius:"3px", height:"2px" }}>
                      <div style={{ width:`${pct}%`, height:"100%", background:color, borderRadius:"3px" }} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
