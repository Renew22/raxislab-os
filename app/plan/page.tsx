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
  { label:"MRR",               valor:"1.100€",  meta:"5.000€", pct:22,  color:"var(--green)" },
  { label:"Leads contactados", valor:"12",       meta:"20",     pct:60,  color:"var(--accent)" },
  { label:"Videos publicados", valor:"1",        meta:"2",      pct:50,  color:"var(--amber)" },
  { label:"Operaciones",       valor:"3",        meta:"—",      pct:100, color:"var(--text-mid)" },
];

const hitos = [
  { q:"Q1 2026", meta:"MRR 1.500€", estado:"EN PROGRESO", pct:73,  color:"var(--amber)" },
  { q:"Q2 2026", meta:"MRR 2.500€", estado:"PENDIENTE",   pct:0,   color:"var(--text-muted)" },
  { q:"Q3 2026", meta:"MRR 4.000€", estado:"PENDIENTE",   pct:0,   color:"var(--text-muted)" },
  { q:"Q4 2026", meta:"MRR 5.000€ — 100k anual", estado:"PENDIENTE", pct:0, color:"var(--text-muted)" },
];

type Tab = "Hoy"|"Semana"|"Objetivos";
const TABS: Tab[] = ["Hoy","Semana","Objetivos"];

const CARD  = { background:"var(--card)", border:"1px solid var(--border)", borderRadius:"6px" } as React.CSSProperties;
const LABEL = { fontSize:"11px", fontWeight:600, letterSpacing:"0.08em", textTransform:"uppercase" as const, color:"var(--text-muted)" };

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
      <h1 style={{ fontSize:"24px", fontWeight:600, color:"var(--text)", marginBottom:"24px" }}>Plan Personal</h1>

      {/* Tab bar */}
      <div style={{ display:"inline-flex", gap:"4px", padding:"4px", background:"var(--surface)", border:"1px solid var(--border)", borderRadius:"8px", marginBottom:"20px" }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding:"7px 20px", borderRadius:"5px", border:"none", cursor:"pointer", fontSize:"13px", fontWeight: tab===t ? 600 : 400, background: tab===t ? "var(--accent-dim)" : "transparent", color: tab===t ? "var(--accent)" : "var(--text-muted)", outline: tab===t ? "1px solid var(--border-accent)" : "none" }}>{t}</button>
        ))}
      </div>

      {/* HOY */}
      {tab === "Hoy" && (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"20px" }}>
          <div style={{ ...CARD, padding:"20px" }}>
            <p style={{ ...LABEL, marginBottom:"16px" }}>Bloques del día</p>
            <div style={{ display:"flex", flexDirection:"column", gap:"2px" }}>
              {bloques.map(({ time,label,icon }) => (
                <div key={time} style={{ display:"flex", alignItems:"center", gap:"14px", padding:"10px 12px", borderRadius:"5px", background:"var(--accent-dim)" }}>
                  <span style={{ fontFamily:"'Space Mono', monospace", fontSize:"12px", color:"var(--text-muted)", width:"44px", flexShrink:0 }}>{time}</span>
                  <span style={{ fontSize:"14px", width:"22px" }}>{icon}</span>
                  <span style={{ fontSize:"13px", color:"var(--text-mid)" }}>{label}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display:"flex", flexDirection:"column", gap:"14px" }}>
            <div style={{ ...CARD, padding:"20px" }}>
              <p style={{ ...LABEL, marginBottom:"10px" }}>Tarea #1 del día</p>
              <input
                value={tareaN1}
                onChange={e => setTareaN1(e.target.value)}
                placeholder="¿Cuál es tu tarea más importante hoy?"
                style={{ width:"100%", padding:"10px 12px", borderRadius:"5px", border:"1px solid var(--border-accent)", background:"var(--accent-dim)", color:"var(--text)", fontSize:"13px", outline:"none" }}
              />
            </div>
            <div style={{ ...CARD, padding:"20px", flex:1 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"14px" }}>
                <p style={LABEL}>Checklist diario</p>
                <span style={{ fontFamily:"'Space Mono', monospace", fontSize:"12px", color: done===tareas.length ? "var(--green)" : "var(--text-muted)" }}>{done}/{tareas.length}</span>
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
                {tareas.map((t, i) => (
                  <div key={i} onClick={() => toggleTarea(i)} style={{ display:"flex", alignItems:"center", gap:"10px", cursor:"pointer" }}>
                    <span style={{ width:"16px", height:"16px", borderRadius:"3px", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", border:`1.5px solid ${t.done ? "var(--green)" : "var(--border)"}`, background: t.done ? "var(--green)" : "transparent" }}>
                      {t.done && <span style={{ color:"#000", fontSize:"10px", fontWeight:700 }}>✓</span>}
                    </span>
                    <span style={{ fontSize:"13px", color: t.done ? "var(--text-muted)" : "var(--text-mid)", textDecoration: t.done ? "line-through" : "none" }}>{t.texto}</span>
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
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"12px" }}>
            {kpisSemanales.map(({ label,valor,meta,pct,color }) => (
              <div key={label} style={{ ...CARD, padding:"16px 18px" }}>
                <p style={{ ...LABEL, marginBottom:"8px" }}>{label}</p>
                <p style={{ fontFamily:"'Space Mono', monospace", fontWeight:700, fontSize:"22px", color, marginBottom:"4px" }}>{valor}</p>
                <p style={{ fontSize:"11px", color:"var(--text-muted)", marginBottom:"10px" }}>meta: {meta}</p>
                {meta !== "—" && (
                  <>
                    <div style={{ background:"var(--border)", borderRadius:"3px", height:"2px" }}>
                      <div style={{ width:`${Math.min(pct,100)}%`, height:"100%", background:color, borderRadius:"3px" }} />
                    </div>
                    <p style={{ fontSize:"11px", color, marginTop:"3px", fontFamily:"'Space Mono', monospace" }}>{pct}%</p>
                  </>
                )}
              </div>
            ))}
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:"8px" }}>
            {SEMANA.map(dia => (
              <div key={dia} style={{ ...CARD, padding:"12px 14px" }}>
                <p style={{ fontFamily:"'Space Mono', monospace", fontSize:"11px", fontWeight:700, color:"var(--text-muted)", marginBottom:"10px", textAlign:"center" as const }}>{dia}</p>
                <div style={{ display:"flex", flexDirection:"column", gap:"6px" }}>
                  {(semanaTareas[dia] ?? []).map(t => (
                    <p key={t} style={{ fontSize:"11px", color:"var(--text-mid)", lineHeight:1.4 }}>{t}</p>
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
          <div style={{ ...CARD, padding:"28px 32px" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"20px" }}>
              <div>
                <p style={{ ...LABEL, marginBottom:"6px" }}>Meta principal 2026</p>
                <h2 style={{ fontSize:"32px", fontWeight:700, fontFamily:"'Space Mono', monospace", color:"var(--text)", marginBottom:"4px" }}>100.000€</h2>
                <p style={{ fontSize:"13px", color:"var(--text-muted)" }}>neto anual — agencia + trading + proyectos</p>
              </div>
              <div style={{ textAlign:"right" as const }}>
                <p style={{ fontFamily:"'Space Mono', monospace", fontWeight:700, fontSize:"28px", color:"var(--accent)" }}>{pctMeta}%</p>
                <p style={{ fontSize:"12px", color:"var(--text-muted)" }}>~{totalAnualActual.toLocaleString("es-ES")}€ año actual</p>
              </div>
            </div>
            <div style={{ background:"var(--border)", borderRadius:"4px", height:"6px" }}>
              <div style={{ width:`${pctMeta}%`, height:"100%", background:"linear-gradient(90deg, var(--accent), var(--green))", borderRadius:"4px" }} />
            </div>
          </div>

          <div>
            <p style={{ ...LABEL, marginBottom:"14px" }}>Hitos trimestrales</p>
            <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
              {hitos.map(({ q,meta,estado,pct,color }) => (
                <div key={q} style={{ ...CARD, padding:"16px 20px" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:"16px", marginBottom: pct > 0 ? "10px" : "0" }}>
                    <span style={{ fontFamily:"'Space Mono', monospace", fontWeight:700, fontSize:"12px", color:"var(--text-muted)", width:"60px", flexShrink:0 }}>{q}</span>
                    <span style={{ flex:1, fontSize:"13px", color:"var(--text-mid)" }}>{meta}</span>
                    <span style={{ fontSize:"11px", fontWeight:600, padding:"3px 8px", borderRadius:"3px", color, background:`${color.includes("var") ? "var(--accent-dim)" : color}`, border:`1px solid var(--border-accent)`, whiteSpace:"nowrap" }}>{estado}</span>
                    {pct > 0 && <span style={{ fontFamily:"'Space Mono', monospace", fontSize:"12px", color, width:"36px", textAlign:"right" as const }}>{pct}%</span>}
                  </div>
                  {pct > 0 && (
                    <div style={{ background:"var(--border)", borderRadius:"3px", height:"2px" }}>
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
