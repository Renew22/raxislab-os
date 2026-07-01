"use client";

import { useState, useEffect } from "react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Proyecto {
  id: string;
  nombre: string;
  progreso: number;
  estado: "EN DESARROLLO" | "PLANIFICANDO" | "ARRANCAR" | "PAUSADO" | "COMPLETADO";
  proximo: string;
  acciones: string[];
  notas: string;
}

const ESTADO_COLOR: Record<string, string> = {
  "EN DESARROLLO": "var(--accent)",
  "PLANIFICANDO":  "var(--amber)",
  "ARRANCAR":      "var(--red)",
  "PAUSADO":       "var(--text-muted)",
  "COMPLETADO":    "var(--green)",
};

const STORAGE_KEY = "raxislab_proyectos_v2";

const DEFAULT_PROYECTOS: Proyecto[] = [
  {
    id: "opsiq",
    nombre: "OpsIQ SaaS",
    progreso: 25,
    estado: "EN DESARROLLO",
    proximo: "Definir MVP con cliente piloto taller",
    acciones: ["Definir MVP features", "Montar landing page", "Captar cliente piloto taller", "Onboarding primer cliente"],
    notas: "",
  },
  {
    id: "curso-jorge",
    nombre: "Curso Jorge",
    progreso: 5,
    estado: "PLANIFICANDO",
    proximo: "Reunión con Jorge — temario y formato",
    acciones: ["Reunión con Jorge", "Definir temario", "Crear estructura módulos", "Grabar módulo piloto"],
    notas: "",
  },
  {
    id: "blog-en",
    nombre: "Blog EN AdSense",
    progreso: 0,
    estado: "ARRANCAR",
    proximo: "Registrar dominio + instalar WordPress",
    acciones: ["Registrar dominio", "Instalar WordPress", "Configurar AdSense", "Publicar primer artículo", "Estrategia SEO en inglés"],
    notas: "",
  },
  {
    id: "youtube-auto",
    nombre: "YouTube Automation",
    progreso: 0,
    estado: "PLANIFICANDO",
    proximo: "Definir nicho con Claude + análisis competencia",
    acciones: ["Definir nicho", "Crear canal", "Guión primer video", "Grabar o generar con IA", "Publicar y analizar"],
    notas: "",
  },
];

const ESTADOS = ["EN DESARROLLO", "PLANIFICANDO", "ARRANCAR", "PAUSADO", "COMPLETADO"] as const;

// ── Estilos ───────────────────────────────────────────────────────────────────

const CARD: React.CSSProperties = { background: "var(--card)", border: "1px solid var(--border)", borderRadius: "12px", padding: "24px", display: "flex", flexDirection: "column", gap: "16px" };
const LABEL: React.CSSProperties = { fontSize: "11px", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: "var(--text-muted)" };
const INPUT: React.CSSProperties = { width: "100%", padding: "7px 11px", borderRadius: "6px", border: "1px solid var(--border)", background: "var(--bg)", color: "var(--text)", fontSize: "13px", outline: "none", boxSizing: "border-box" as const };

// ── Page ─────────────────────────────────────────────────────────────────────

export default function ProyectosPage() {
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [editing, setEditing]     = useState<string | null>(null);
  const [saved, setSaved]         = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      setProyectos(stored ? JSON.parse(stored) : DEFAULT_PROYECTOS);
    } catch { setProyectos(DEFAULT_PROYECTOS); }
  }, []);

  function save(ps: Proyecto[]) {
    setProyectos(ps);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ps));
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  }

  function update(id: string, patch: Partial<Proyecto>) {
    save(proyectos.map(p => p.id === id ? { ...p, ...patch } : p));
  }

  function toggleAccion(pid: string, idx: number) {
    const p = proyectos.find(x => x.id === pid);
    if (!p) return;
    const acc = [...p.acciones];
    // Toggle: prefix ✅ to mark done
    const done = acc[idx].startsWith("✅ ");
    acc[idx] = done ? acc[idx].slice(3) : `✅ ${acc[idx]}`;
    update(pid, { acciones: acc });
  }

  function addAccion(pid: string, text: string) {
    if (!text.trim()) return;
    const p = proyectos.find(x => x.id === pid);
    if (!p) return;
    update(pid, { acciones: [...p.acciones, text.trim()] });
  }

  function removeAccion(pid: string, idx: number) {
    const p = proyectos.find(x => x.id === pid);
    if (!p) return;
    update(pid, { acciones: p.acciones.filter((_, i) => i !== idx) });
  }

  const totalPct = proyectos.length ? Math.round(proyectos.reduce((s, p) => s + p.progreso, 0) / proyectos.length) : 0;
  const activos  = proyectos.filter(p => p.estado === "EN DESARROLLO").length;

  return (
    <div style={{ padding: "32px 40px" }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"24px" }}>
        <div>
          <h1 style={{ fontSize:"24px", fontWeight:600, color:"var(--text)", margin:0 }}>Proyectos</h1>
          <p style={{ fontSize:"13px", color:"var(--text-muted)", margin:"4px 0 0" }}>{activos} en desarrollo · {totalPct}% promedio</p>
        </div>
        {saved && <span style={{ fontSize:"12px", color:"var(--green)", fontWeight:600 }}>✓ Guardado</span>}
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"20px" }}>
        {proyectos.map(p => {
          const isEditing = editing === p.id;
          const color = ESTADO_COLOR[p.estado] ?? "var(--accent)";
          const done  = p.acciones.filter(a => a.startsWith("✅ ")).length;

          return (
            <div key={p.id} style={CARD}>
              {/* Header */}
              <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:"8px" }}>
                {isEditing ? (
                  <input value={p.nombre} onChange={e => update(p.id, { nombre: e.target.value })} style={{ ...INPUT, fontSize:"15px", fontWeight:600, flex:1 }}/>
                ) : (
                  <h3 style={{ fontSize:"15px", fontWeight:600, color:"var(--text)", margin:0 }}>{p.nombre}</h3>
                )}
                <div style={{ display:"flex", gap:"6px", alignItems:"center" }}>
                  {isEditing ? (
                    <select value={p.estado} onChange={e => update(p.id, { estado: e.target.value as Proyecto["estado"] })}
                      style={{ ...INPUT, width:"auto", fontSize:"11px", padding:"2px 6px", color }}>
                      {ESTADOS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  ) : (
                    <span style={{ flexShrink:0, fontSize:"11px", fontWeight:600, padding:"3px 9px", borderRadius:"999px", color, background:`${color}18`, border:`1px solid ${color}44` }}>{p.estado}</span>
                  )}
                  <button onClick={() => setEditing(isEditing ? null : p.id)}
                    style={{ background:"none", border:"none", cursor:"pointer", color:"var(--text-muted)", fontSize:"12px", padding:"2px 6px" }}>
                    {isEditing ? "✓" : "✎"}
                  </button>
                </div>
              </div>

              {/* Progreso */}
              <div>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"6px" }}>
                  <span style={{ fontSize:"12px", color:"var(--text-muted)" }}>Progreso</span>
                  <span style={{ fontSize:"12px", fontFamily:"monospace", fontWeight:600, color }}>{p.progreso}%</span>
                </div>
                {isEditing ? (
                  <input type="range" min={0} max={100} step={5} value={p.progreso} onChange={e => update(p.id, { progreso: Number(e.target.value) })} style={{ width:"100%" }}/>
                ) : (
                  <div style={{ height:"6px", borderRadius:"999px", overflow:"hidden", background:"var(--border)" }}>
                    <div style={{ width:`${p.progreso}%`, height:"100%", borderRadius:"999px", background:color, transition:"width 0.3s" }}/>
                  </div>
                )}
              </div>

              {/* Próximo hito */}
              <div>
                <p style={{ ...LABEL, margin:"0 0 5px" }}>Próximo hito</p>
                {isEditing ? (
                  <input value={p.proximo} onChange={e => update(p.id, { proximo: e.target.value })} style={INPUT} placeholder="Próximo paso..."/>
                ) : (
                  <p style={{ fontSize:"13px", color:"var(--text-mid)", margin:0, padding:"8px 12px", background:"var(--bg)", borderRadius:"5px", border:"1px solid var(--border)" }}>{p.proximo || "—"}</p>
                )}
              </div>

              {/* Acciones */}
              <div>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"8px" }}>
                  <p style={{ ...LABEL, margin:0 }}>Acciones ({done}/{p.acciones.length})</p>
                  {isEditing && (
                    <button onClick={() => {
                      const t = prompt("Nueva acción:");
                      if (t) addAccion(p.id, t);
                    }} style={{ background:"none", border:"none", cursor:"pointer", color:"var(--accent)", fontSize:"11px" }}>+ añadir</button>
                  )}
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:"5px" }}>
                  {p.acciones.map((a, i) => {
                    const isDone = a.startsWith("✅ ");
                    const text   = isDone ? a.slice(3) : a;
                    return (
                      <div key={i} style={{ display:"flex", gap:"8px", alignItems:"center" }}>
                        <span onClick={() => toggleAccion(p.id, i)} style={{ cursor:"pointer", fontSize:"14px", userSelect:"none" }}>
                          {isDone ? "✅" : "⬜"}
                        </span>
                        <span style={{ fontSize:"12px", color:isDone?"var(--text-muted)":"var(--text-mid)", textDecoration:isDone?"line-through":"none", flex:1, lineHeight:1.4 }}>{text}</span>
                        {isEditing && (
                          <button onClick={() => removeAccion(p.id, i)} style={{ background:"none", border:"none", cursor:"pointer", color:"var(--red)", fontSize:"12px", padding:0 }}>×</button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Notas */}
              {(isEditing || p.notas) && (
                <div>
                  <p style={{ ...LABEL, margin:"0 0 5px" }}>Notas</p>
                  <textarea value={p.notas} onChange={e => update(p.id, { notas: e.target.value })} rows={2}
                    style={{ ...INPUT, resize:"vertical" }} placeholder="Notas adicionales..."/>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
