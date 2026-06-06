"use client";

import { useState } from "react";

type Cliente = {
  nombre: string; precio: string; estado: string;
  color: string; bg: string; sector: string;
  fechaInicio: string; servicios: string[]; proximaTarea: string;
};

const clientes: Cliente[] = [
  { nombre: "Identity Peluqueros",   precio: "550€", estado: "ACTIVO",   color: "#00E676", bg: "rgba(0,230,118,0.08)",   sector: "Peluquería",    fechaInicio: "Ene 2025", servicios: ["Meta Ads","Google Ads","Google Business"], proximaTarea: "Revisar creatividades junio" },
  { nombre: "Desancho Estilistas",   precio: "550€", estado: "ACTIVO",   color: "#00E676", bg: "rgba(0,230,118,0.08)",   sector: "Peluquería",    fechaInicio: "Mar 2025", servicios: ["Meta Ads","Google Business"],               proximaTarea: "Actualizar fotos GMB" },
  { nombre: "Last Mile Distribution",precio: "TBD",  estado: "EN CURSO", color: "#FFB800", bg: "rgba(255,184,0,0.08)",   sector: "Logística",     fechaInicio: "Jun 2025", servicios: ["Propuesta en preparación"],                 proximaTarea: "Enviar propuesta formal" },
  { nombre: "Malvarrosa CF",         precio: "300€", estado: "ACTIVO",   color: "#00E676", bg: "rgba(0,230,118,0.08)",   sector: "Deporte",       fechaInicio: "Feb 2025", servicios: ["Meta Ads","Contenido redes"],                proximaTarea: "Creatividades torneo" },
  { nombre: "Matías Benegas Tattoo", precio: "300€", estado: "ACTIVO",   color: "#00E676", bg: "rgba(0,230,118,0.08)",   sector: "Estudio Tattoo",fechaInicio: "Abr 2025", servicios: ["Meta Ads","Google Business","Contenido"],    proximaTarea: "Post de portfolio" },
];

const METRICAS: Record<string, { cpl: string; roas: string; inversion: string; leads: string }> = {
  "Identity Peluqueros":   { cpl: "4.80€", roas: "5.2x", inversion: "220€/sem", leads: "46/mes" },
  "Desancho Estilistas":   { cpl: "5.40€", roas: "4.8x", inversion: "180€/sem", leads: "33/mes" },
  "Last Mile Distribution":{ cpl: "—",     roas: "—",    inversion: "—",         leads: "—" },
  "Malvarrosa CF":         { cpl: "2.10€", roas: "3.1x", inversion: "90€/sem",   leads: "22/mes" },
  "Matías Benegas Tattoo": { cpl: "3.60€", roas: "4.2x", inversion: "110€/sem",  leads: "28/mes" },
};

const TAREAS_BASE: Record<string, string[]> = {
  "Identity Peluqueros":   ["Revisar creatividades junio","Enviar reporte semanal","Reunión mensual"],
  "Desancho Estilistas":   ["Actualizar fotos GMB","Responder reseñas","Enviar reporte semanal"],
  "Last Mile Distribution":["Enviar propuesta formal","Reunión briefing"],
  "Malvarrosa CF":         ["Creatividades torneo verano","Enviar reporte semanal"],
  "Matías Benegas Tattoo": ["Post de portfolio","Optimizar campaña booking","Enviar reporte semanal"],
};

const HISTORIAL: Record<string, { fecha: string; tipo: string; nota: string }[]> = {
  "Identity Peluqueros":   [{ fecha:"2026-06-01",tipo:"Reunión",nota:"Resultados mayo. Cliente muy satisfecho, renueva." },{ fecha:"2026-05-15",tipo:"Email",nota:"Reporte mensual con métricas enviado." }],
  "Desancho Estilistas":   [{ fecha:"2026-05-28",tipo:"Email",nota:"Reporte mensual enviado." },{ fecha:"2026-05-10",tipo:"Call",nota:"Feedback creatividades nuevas." }],
  "Last Mile Distribution":[{ fecha:"2026-06-03",tipo:"Reunión",nota:"Primera reunión descubrimiento. Muy interesados." }],
  "Malvarrosa CF":         [{ fecha:"2026-06-02",tipo:"Email",nota:"Campaña torneo verano iniciada." }],
  "Matías Benegas Tattoo": [{ fecha:"2026-05-30",tipo:"WhatsApp",nota:"Solicitud contenido booking adicional." }],
};


const DOCS: Record<string, string[]> = {
  "Identity Peluqueros":   ["Contrato firmado","Propuesta inicial","Brief servicio"],
  "Desancho Estilistas":   ["Contrato firmado","Propuesta inicial"],
  "Last Mile Distribution":["Propuesta borrador"],
  "Malvarrosa CF":         ["Contrato firmado","Brief servicio"],
  "Matías Benegas Tattoo": ["Contrato firmado","Propuesta inicial","Brief contenido"],
};

type PanelTab = "Resumen"|"Métricas"|"Tareas"|"Contenido"|"Tendencias"|"Documentos";
const PANEL_TABS: PanelTab[] = ["Resumen","Métricas","Tareas","Contenido","Tendencias","Documentos"];

const CARD  = { background: "#111111", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "6px" } as React.CSSProperties;
const LABEL = { fontSize: "11px", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: "#5A6470" };

export default function ClientesPage() {
  const [selected, setSelected] = useState<Cliente | null>(null);
  const [panelTab, setPanelTab] = useState<PanelTab>("Resumen");
  const [tareas, setTareas] = useState<Record<string, { texto: string; done: boolean }[]>>(() =>
    Object.fromEntries(Object.entries(TAREAS_BASE).map(([k, v]) => [k, v.map(t => ({ texto: t, done: false }))]))
  );
  const [nuevaTarea, setNuevaTarea] = useState("");
  const [tendencias, setTendencias] = useState<Record<string, string[] | null>>({});
  const [contenidoResult, setContenidoResult] = useState<{ tipo: string; texto: string } | null>(null);
  const [contenidoLoading, setContenidoLoading] = useState(false);
  const [tendenciasLoading, setTendenciasLoading] = useState(false);
  const [reseñaInput, setReseñaInput] = useState("");

  function abrirPanel(c: Cliente) {
    setSelected(c);
    setPanelTab("Resumen");
    setContenidoResult(null);
  }

  function toggleTarea(idx: number) {
    if (!selected) return;
    setTareas(prev => ({
      ...prev,
      [selected.nombre]: prev[selected.nombre].map((t, i) => i === idx ? { ...t, done: !t.done } : t),
    }));
  }

  function addTarea() {
    if (!selected || !nuevaTarea.trim()) return;
    setTareas(prev => ({
      ...prev,
      [selected.nombre]: [...prev[selected.nombre], { texto: nuevaTarea.trim(), done: false }],
    }));
    setNuevaTarea("");
  }

  async function buscarTendencias() {
    if (!selected) return;
    setTendenciasLoading(true);
    try {
      const res = await fetch('/api/claude/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'tendencias', data: { sector: selected.sector } }),
      });
      const json = await res.json();
      const lines = json.content.split('\n').filter((l: string) => l.trim()).slice(0, 8);
      setTendencias(prev => ({ ...prev, [selected.nombre]: lines }));
    } catch {
      setTendencias(prev => ({ ...prev, [selected.nombre]: ['Error al cargar tendencias.'] }));
    } finally {
      setTendenciasLoading(false);
    }
  }

  async function generarContenido(tipo: string) {
    if (!selected) return;
    setContenidoLoading(true);
    setContenidoResult(null);
    const typeMap: Record<string, string> = {
      "GBP Post": "gbp_post",
      "Artículo Blog": "blog_article",
      "Respuesta Reseña": "review_response",
    };
    const dataMap: Record<string, object> = {
      "GBP Post": { cliente: selected.nombre, sector: selected.sector },
      "Artículo Blog": { topic: `${selected.sector} en Valencia`, keyword: selected.sector },
      "Respuesta Reseña": { cliente: selected.nombre, review: reseñaInput || "Excelente servicio, muy satisfecho con los resultados" },
    };
    try {
      const res = await fetch('/api/claude/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

  return (
    <div style={{ padding: "32px 40px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: 600, color: "#FFFFFF" }}>Clientes</h1>
        <span style={{ fontSize: "12px", color: "#5A6470" }}>{clientes.length} clientes · MRR 1.700€</span>
      </div>

      {/* Table */}
      <div style={{ ...CARD, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              {["Cliente","Sector","MRR","Estado","Próxima tarea"].map(h => (
                <th key={h} style={{ ...LABEL, padding: "12px 16px", textAlign: "left" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {clientes.map(c => (
              <tr
                key={c.nombre}
                onClick={() => abrirPanel(c)}
                style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", cursor: "pointer", transition: "background 0.12s" }}
                onMouseEnter={e => (e.currentTarget.style.background = "#161616")}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
              >
                <td style={{ padding: "14px 16px", fontSize: "13px", fontWeight: 500, color: "#FFFFFF" }}>{c.nombre}</td>
                <td style={{ padding: "14px 16px", fontSize: "12px", color: "#5A6470" }}>{c.sector}</td>
                <td style={{ padding: "14px 16px", fontSize: "13px", fontFamily: "'Space Mono', monospace", fontWeight: 700, color: "#FFFFFF" }}>{c.precio}</td>
                <td style={{ padding: "14px 16px" }}>
                  <span style={{ fontSize: "11px", fontWeight: 600, padding: "3px 8px", borderRadius: "4px", color: c.color, background: c.bg }}>{c.estado}</span>
                </td>
                <td style={{ padding: "14px 16px", fontSize: "12px", color: "#5A6470" }}>{c.proximaTarea}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Side panel overlay */}
      {selected && (
        <>
          <div
            style={{ position: "fixed", inset: 0, zIndex: 40, background: "rgba(0,0,0,0.4)" }}
            onClick={() => setSelected(null)}
          />
          <div style={{
            position: "fixed", right: 0, top: 0, bottom: 0, width: "480px", zIndex: 50,
            background: "#0a0a0a", borderLeft: "1px solid rgba(255,255,255,0.06)",
            display: "flex", flexDirection: "column", overflow: "hidden",
          }}>
            {/* Panel header */}
            <div style={{ padding: "20px 24px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: "12px" }}>
              <button
                onClick={() => setSelected(null)}
                style={{ background: "none", border: "none", color: "#5A6470", cursor: "pointer", fontSize: "18px", lineHeight: 1, padding: "0 4px" }}
              >×</button>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "14px", fontWeight: 600, color: "#FFFFFF" }}>{selected.nombre}</div>
                <div style={{ fontSize: "12px", color: "#5A6470", marginTop: "2px" }}>{selected.sector}</div>
              </div>
              <span style={{ fontSize: "11px", fontWeight: 600, padding: "3px 8px", borderRadius: "4px", color: selected.color, background: selected.bg }}>{selected.estado}</span>
            </div>

            {/* Tab bar */}
            <div style={{ display: "flex", gap: "2px", padding: "10px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)", overflowX: "auto" }}>
              {PANEL_TABS.map(t => (
                <button
                  key={t}
                  onClick={() => { setPanelTab(t); setContenidoResult(null); }}
                  style={{
                    padding: "6px 12px", borderRadius: "4px", border: "none", cursor: "pointer",
                    fontSize: "12px", fontWeight: panelTab === t ? 600 : 400, whiteSpace: "nowrap",
                    background: panelTab === t ? "rgba(0,200,255,0.1)" : "transparent",
                    color: panelTab === t ? "#00C8FF" : "#5A6470",
                    outline: panelTab === t ? "1px solid rgba(0,200,255,0.2)" : "none",
                  }}
                >{t}</button>
              ))}
            </div>

            {/* Panel content */}
            <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>

              {/* Resumen */}
              {panelTab === "Resumen" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {[
                    { label: "Sector",       value: selected.sector },
                    { label: "Precio",        value: selected.precio },
                    { label: "Fecha inicio",  value: selected.fechaInicio },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <p style={{ ...LABEL, marginBottom: "4px" }}>{label}</p>
                      <p style={{ fontSize: "14px", color: "#FFFFFF" }}>{value}</p>
                    </div>
                  ))}
                  <div>
                    <p style={{ ...LABEL, marginBottom: "8px" }}>Servicios activos</p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                      {selected.servicios.map(s => (
                        <span key={s} style={{ fontSize: "12px", padding: "4px 10px", borderRadius: "4px", background: "rgba(0,200,255,0.08)", color: "#00C8FF", border: "1px solid rgba(0,200,255,0.15)" }}>{s}</span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Métricas */}
              {panelTab === "Métricas" && (() => {
                const m = METRICAS[selected.nombre];
                return (
                  <div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "16px" }}>
                      {[["CPL",m.cpl],["ROAS",m.roas],["Inversión semanal",m.inversion],["Leads generados",m.leads]].map(([l,v]) => (
                        <div key={l} style={{ ...CARD, padding: "14px" }}>
                          <p style={{ ...LABEL, marginBottom: "6px" }}>{l}</p>
                          <p style={{ fontFamily: "'Space Mono', monospace", fontWeight: 700, fontSize: "20px", color: "#FFFFFF" }}>{v}</p>
                        </div>
                      ))}
                    </div>
                    <button style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid rgba(0,200,255,0.2)", background: "rgba(0,200,255,0.06)", color: "#00C8FF", fontSize: "13px", cursor: "pointer", fontWeight: 500 }}>
                      ↻ Actualizar métricas
                    </button>
                  </div>
                );
              })()}

              {/* Tareas */}
              {panelTab === "Tareas" && (
                <div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "16px" }}>
                    {(tareas[selected.nombre] ?? []).map((t, i) => (
                      <div key={i} onClick={() => toggleTarea(i)} style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
                        <span style={{ width: "16px", height: "16px", borderRadius: "3px", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", border: `1.5px solid ${t.done ? "#00E676" : "#2A3040"}`, background: t.done ? "#00E676" : "transparent" }}>
                          {t.done && <span style={{ color: "#000", fontSize: "10px", fontWeight: 700 }}>✓</span>}
                        </span>
                        <span style={{ fontSize: "13px", color: t.done ? "#2A3040" : "#9AA3AD", textDecoration: t.done ? "line-through" : "none" }}>{t.texto}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <input
                      value={nuevaTarea}
                      onChange={e => setNuevaTarea(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && addTarea()}
                      placeholder="Nueva tarea..."
                      style={{ flex: 1, padding: "8px 12px", borderRadius: "4px", border: "1px solid rgba(255,255,255,0.06)", background: "#161616", color: "#FFFFFF", fontSize: "12px", outline: "none" }}
                    />
                    <button onClick={addTarea} style={{ padding: "8px 14px", borderRadius: "4px", background: "#00C8FF", color: "#000", fontSize: "12px", fontWeight: 600, border: "none", cursor: "pointer" }}>+</button>
                  </div>
                </div>
              )}

              {/* Contenido */}
              {panelTab === "Contenido" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <textarea
                    value={reseñaInput}
                    onChange={e => setReseñaInput(e.target.value)}
                    placeholder="Pega aquí la reseña a responder (opcional)..."
                    rows={2}
                    style={{ padding: "8px 12px", borderRadius: "4px", border: "1px solid rgba(255,255,255,0.06)", background: "#161616", color: "#9AA3AD", fontSize: "12px", outline: "none", resize: "vertical", fontFamily: "inherit" }}
                  />
                  {[["GBP Post","Generar post Google Business"],["Artículo Blog","Generar artículo de blog"],["Respuesta Reseña","Responder reseña reciente"]].map(([tipo, label]) => (
                    <button key={tipo} onClick={() => generarContenido(tipo)} disabled={contenidoLoading} style={{ padding: "12px 16px", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.06)", background: "#161616", color: contenidoLoading ? "#2A3040" : "#9AA3AD", fontSize: "13px", textAlign: "left", cursor: contenidoLoading ? "not-allowed" : "pointer", fontWeight: 500 }}>
                      {contenidoLoading ? "Generando..." : `${label} →`}
                    </button>
                  ))}
                  {contenidoResult && (
                    <div style={{ marginTop: "8px", padding: "14px", borderRadius: "6px", border: "1px solid rgba(0,200,255,0.15)", background: "rgba(0,200,255,0.04)" }}>
                      <p style={{ ...LABEL, marginBottom: "8px" }}>{contenidoResult.tipo}</p>
                      <pre style={{ fontSize: "12px", color: "#9AA3AD", whiteSpace: "pre-wrap", lineHeight: 1.6, fontFamily: "inherit" }}>{contenidoResult.texto}</pre>
                      <button onClick={() => navigator.clipboard.writeText(contenidoResult.texto).then(() => alert("Copiado ✅"))} style={{ marginTop: "10px", padding: "6px 12px", borderRadius: "4px", background: "rgba(0,200,255,0.1)", color: "#00C8FF", border: "1px solid rgba(0,200,255,0.2)", fontSize: "12px", cursor: "pointer" }}>Copiar</button>
                    </div>
                  )}
                </div>
              )}

              {/* Tendencias */}
              {panelTab === "Tendencias" && (
                <div>
                  <button
                    onClick={buscarTendencias}
                    disabled={tendenciasLoading}
                    style={{ width: "100%", padding: "12px", borderRadius: "6px", border: "1px solid rgba(0,200,255,0.2)", background: "rgba(0,200,255,0.06)", color: tendenciasLoading ? "#2A3040" : "#00C8FF", fontSize: "13px", cursor: tendenciasLoading ? "not-allowed" : "pointer", fontWeight: 500, marginBottom: "16px" }}
                  >
                    {tendenciasLoading ? "Buscando tendencias..." : `Buscar tendencias sector → ${selected.sector}`}
                  </button>
                  {tendencias[selected.nombre]?.map((t, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "10px", padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                      <span style={{ fontFamily: "'Space Mono', monospace", fontSize: "11px", color: "#5A6470", width: "18px", flexShrink: 0 }}>{i+1}</span>
                      <span style={{ fontSize: "13px", color: "#9AA3AD" }}>{t}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Documentos */}
              {panelTab === "Documentos" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {(DOCS[selected.nombre] ?? []).map(doc => (
                    <div key={doc} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "12px 14px", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.06)", background: "#161616" }}>
                      <span style={{ color: "#5A6470", fontSize: "16px" }}>📄</span>
                      <span style={{ flex: 1, fontSize: "13px", color: "#9AA3AD" }}>{doc}</span>
                      <span style={{ fontSize: "11px", color: "#2A3040" }}>Google Drive</span>
                    </div>
                  ))}
                  {HISTORIAL[selected.nombre]?.map((h, i) => (
                    <div key={i} style={{ marginTop: "4px", display: "flex", gap: "10px", padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                      <span style={{ fontSize: "11px", fontWeight: 600, padding: "2px 6px", borderRadius: "3px", background: "rgba(0,200,255,0.08)", color: "#00C8FF", flexShrink: 0, height: "fit-content" }}>{h.tipo}</span>
                      <div>
                        <p style={{ fontSize: "11px", color: "#2A3040", marginBottom: "2px", fontFamily: "'Space Mono', monospace" }}>{h.fecha}</p>
                        <p style={{ fontSize: "12px", color: "#5A6470" }}>{h.nota}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

            </div>
          </div>
        </>
      )}
    </div>
  );
}
