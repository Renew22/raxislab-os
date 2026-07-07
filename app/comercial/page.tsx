"use client";

import { useState, useEffect } from "react";

type LeadStatus = "nuevo" | "contactado" | "interesado" | "propuesta" | "cerrado";

interface Lead {
  id: string; nombre: string; empresa: string; email: string;
  whatsapp: string; pais: string; sector: string;
  status: LeadStatus; notas: string; fecha: string;
  interes: string; proximaAccion: string;
}

const STATUS_LABELS: Record<LeadStatus, string> = {
  nuevo: "Nuevo", contactado: "Contactado", interesado: "Interesado",
  propuesta: "Propuesta enviada", cerrado: "Cerrado ✅",
};
const STATUS_COLORS: Record<LeadStatus, string> = {
  nuevo: "#6b7280", contactado: "#3b82f6", interesado: "#f59e0b",
  propuesta: "#8b5cf6", cerrado: "#10b981",
};

export default function ComercialPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selected, setSelected] = useState<Lead | null>(null);
  const [filter, setFilter] = useState<LeadStatus | "all">("all");
  const [nota, setNota] = useState("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem("lm_leads");
      if (raw) setLeads(JSON.parse(raw));
    } catch {}
  }, []);

  const save = (updated: Lead[]) => {
    setLeads(updated);
    localStorage.setItem("lm_leads", JSON.stringify(updated));
  };

  const updateLead = (id: string, patch: Partial<Lead>) => {
    const updated = leads.map(l => l.id === id ? { ...l, ...patch } : l);
    save(updated);
    if (selected?.id === id) setSelected(updated.find(l => l.id === id) || null);
  };

  const addNota = (lead: Lead) => {
    if (!nota.trim()) return;
    const ts = new Date().toLocaleDateString("es-ES");
    updateLead(lead.id, { notas: lead.notas ? `${lead.notas}\n[${ts}] ${nota}` : `[${ts}] ${nota}` });
    setNota("");
  };

  const visible = filter === "all" ? leads : leads.filter(l => l.status === filter);

  return (
    <div style={{ fontFamily: "Space Grotesk, sans-serif", background: "#0f1117", minHeight: "100vh", color: "#e2e8f0" }}>
      {/* Header */}
      <div style={{ borderBottom: "1px solid #1e2530", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: "#1E9BF0", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14 }}>R</div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 15 }}>Last Mile Distribution — CRM</div>
            <div style={{ fontSize: 11, color: "#64748b" }}>Portal comercial</div>
          </div>
        </div>
        <div style={{ fontSize: 12, color: "#64748b" }}>{leads.length} contactos · {leads.filter(l => l.status === "cerrado").length} cerrados</div>
      </div>

      <div style={{ display: "flex", height: "calc(100vh - 65px)" }}>
        {/* Lista */}
        <div style={{ width: 320, borderRight: "1px solid #1e2530", display: "flex", flexDirection: "column" }}>
          {/* Filtros */}
          <div style={{ padding: "12px 16px", borderBottom: "1px solid #1e2530", display: "flex", gap: 6, flexWrap: "wrap" }}>
            {(["all", ...Object.keys(STATUS_LABELS)] as (LeadStatus | "all")[]).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                style={{ padding: "3px 10px", borderRadius: 12, border: "none", fontSize: 11, cursor: "pointer",
                  background: filter === f ? "#1E9BF0" : "#1e2530",
                  color: filter === f ? "#fff" : "#94a3b8" }}>
                {f === "all" ? "Todos" : STATUS_LABELS[f as LeadStatus]}
              </button>
            ))}
          </div>
          {/* Lista de leads */}
          <div style={{ flex: 1, overflowY: "auto" }}>
            {visible.length === 0 && (
              <div style={{ padding: 24, textAlign: "center", color: "#64748b", fontSize: 13 }}>Sin contactos</div>
            )}
            {visible.map(lead => (
              <div key={lead.id} onClick={() => setSelected(lead)}
                style={{ padding: "12px 16px", borderBottom: "1px solid #1e2530", cursor: "pointer",
                  background: selected?.id === lead.id ? "#1e2530" : "transparent" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{lead.nombre}</div>
                  <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 10, background: STATUS_COLORS[lead.status] + "22", color: STATUS_COLORS[lead.status] }}>
                    {STATUS_LABELS[lead.status]}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{lead.empresa} · {lead.pais}</div>
                {lead.proximaAccion && (
                  <div style={{ fontSize: 11, color: "#f59e0b", marginTop: 4 }}>→ {lead.proximaAccion}</div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Detalle */}
        <div style={{ flex: 1, overflowY: "auto", padding: 24 }}>
          {!selected ? (
            <div style={{ textAlign: "center", color: "#64748b", marginTop: 80, fontSize: 14 }}>
              Selecciona un contacto para ver el detalle
            </div>
          ) : (
            <div style={{ maxWidth: 600 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                <div>
                  <div style={{ fontSize: 20, fontWeight: 700 }}>{selected.nombre}</div>
                  <div style={{ fontSize: 13, color: "#64748b" }}>{selected.empresa} · {selected.sector} · {selected.pais}</div>
                </div>
                <select value={selected.status}
                  onChange={e => updateLead(selected.id, { status: e.target.value as LeadStatus })}
                  style={{ padding: "6px 12px", borderRadius: 6, border: "1px solid #1e2530", background: "#1e2530", color: "#e2e8f0", fontSize: 12, cursor: "pointer" }}>
                  {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>

              {/* Contacto */}
              <div style={{ background: "#1a1f2e", border: "1px solid #1e2530", borderRadius: 8, padding: 16, marginBottom: 16 }}>
                <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 10 }}>Contacto</div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  {selected.email && (
                    <a href={`mailto:${selected.email}`} style={{ padding: "6px 14px", borderRadius: 6, background: "#1e2530", color: "#e2e8f0", textDecoration: "none", fontSize: 12 }}>
                      ✉️ {selected.email}
                    </a>
                  )}
                  {selected.whatsapp && (
                    <a href={`https://wa.me/${selected.whatsapp.replace(/\D/g,"")}`} target="_blank"
                      style={{ padding: "6px 14px", borderRadius: 6, background: "#25d36622", color: "#25d366", textDecoration: "none", fontSize: 12 }}>
                      WhatsApp
                    </a>
                  )}
                </div>
              </div>

              {/* Interés */}
              {selected.interes && (
                <div style={{ background: "#1a1f2e", border: "1px solid #1e2530", borderRadius: 8, padding: 16, marginBottom: 16 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 6 }}>Interés</div>
                  <div style={{ fontSize: 13, color: "#94a3b8" }}>{selected.interes}</div>
                </div>
              )}

              {/* Próxima acción */}
              <div style={{ background: "#1a1f2e", border: "1px solid #1e2530", borderRadius: 8, padding: 16, marginBottom: 16 }}>
                <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 6 }}>Próxima acción</div>
                <input value={selected.proximaAccion || ""}
                  onChange={e => updateLead(selected.id, { proximaAccion: e.target.value })}
                  placeholder="Ej: Enviar muestra el lunes"
                  style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid #2d3748", background: "#0f1117", color: "#e2e8f0", fontSize: 13, boxSizing: "border-box" }} />
              </div>

              {/* Notas */}
              <div style={{ background: "#1a1f2e", border: "1px solid #1e2530", borderRadius: 8, padding: 16 }}>
                <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 10 }}>Notas</div>
                {selected.notas && (
                  <div style={{ fontSize: 12, color: "#94a3b8", whiteSpace: "pre-line", marginBottom: 12,
                    background: "#0f1117", padding: 10, borderRadius: 6 }}>
                    {selected.notas}
                  </div>
                )}
                <div style={{ display: "flex", gap: 8 }}>
                  <input value={nota} onChange={e => setNota(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && addNota(selected)}
                    placeholder="Añadir nota..."
                    style={{ flex: 1, padding: "8px 12px", borderRadius: 6, border: "1px solid #2d3748", background: "#0f1117", color: "#e2e8f0", fontSize: 13 }} />
                  <button onClick={() => addNota(selected)}
                    style={{ padding: "8px 16px", borderRadius: 6, border: "none", background: "#1E9BF0", color: "#fff", fontSize: 13, cursor: "pointer" }}>
                    Añadir
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
