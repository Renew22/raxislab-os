"use client";
import { useState, useEffect } from "react";

type EstadoLead = "Nuevo" | "Contactado" | "Convertido" | "Perdido";
type Fuente     = "Meta" | "Google" | "Orgánico" | "Referido";

type Lead = {
  id:               string;
  nombre:           string;
  telefono:         string;
  interes:          string;
  fuente:           Fuente;
  clienteAsociado:  string;
  estado:           EstadoLead;
  fecha:            string;
};

type ModalState = {
  open:            boolean;
  nombre:          string;
  telefono:        string;
  interes:         string;
  fuente:          Fuente;
  clienteAsociado: string;
};

const LEADS_KEY = "raxislab_leads_v1";

const CLIENTES: string[] = [
  "Identity Peluqueros",
  "Desancho Estilistas",
  "Malvarrosa CF",
  "Matías Benegas Tattoo",
  "Sin asignar",
];

const ESTADOS: EstadoLead[] = ["Nuevo", "Contactado", "Convertido", "Perdido"];
const FUENTES: Fuente[]     = ["Meta", "Google", "Orgánico", "Referido"];

const ESTADO_STYLE: Record<EstadoLead, { bg: string; color: string }> = {
  "Nuevo":      { bg: "rgba(0,188,255,0.12)",  color: "#00bcff" },
  "Contactado": { bg: "rgba(255,171,0,0.12)",  color: "var(--amber)" },
  "Convertido": { bg: "rgba(0,230,118,0.12)",  color: "var(--green)" },
  "Perdido":    { bg: "rgba(255,61,113,0.12)", color: "var(--red)" },
};

const INITIAL_LEADS: Lead[] = [
  { id: "1", nombre: "María García",   telefono: "612 345 678", interes: "Coloración completa",   fuente: "Meta",     clienteAsociado: "Identity Peluqueros", estado: "Nuevo",      fecha: "2026-06-10" },
  { id: "2", nombre: "Carlos Ruiz",    telefono: "634 567 890", interes: "Corte y peinado boda",  fuente: "Google",   clienteAsociado: "Desancho Estilistas",  estado: "Contactado", fecha: "2026-06-08" },
  { id: "3", nombre: "Ana López",      telefono: "698 123 456", interes: "Tratamiento keratina",  fuente: "Orgánico", clienteAsociado: "Identity Peluqueros", estado: "Convertido", fecha: "2026-06-05" },
  { id: "4", nombre: "Pedro Martínez", telefono: "623 456 789", interes: "Baño y corte perro",    fuente: "Meta",     clienteAsociado: "Desancho Estilistas",  estado: "Perdido",    fecha: "2026-06-03" },
  { id: "5", nombre: "Laura Sánchez",  telefono: "657 890 123", interes: "Consultoría marketing", fuente: "Referido", clienteAsociado: "Sin asignar",          estado: "Nuevo",      fecha: "2026-06-12" },
];

function loadLeads(): Lead[] {
  if (typeof window === "undefined") return INITIAL_LEADS;
  try {
    const s = localStorage.getItem(LEADS_KEY);
    return s ? JSON.parse(s) : INITIAL_LEADS;
  } catch { return INITIAL_LEADS; }
}
function saveLeads(leads: Lead[]) {
  localStorage.setItem(LEADS_KEY, JSON.stringify(leads));
}
function newId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

const EMPTY_MODAL: ModalState = { open: false, nombre: "", telefono: "", interes: "", fuente: "Meta", clienteAsociado: "Sin asignar" };

const INPUT: React.CSSProperties  = { width: "100%", padding: "9px 12px", borderRadius: "6px", border: "1px solid var(--border)", background: "var(--bg)", color: "var(--text)", fontSize: "13px", outline: "none", boxSizing: "border-box" };
const SELECT: React.CSSProperties = { ...INPUT, cursor: "pointer" };
const TH: React.CSSProperties     = { textAlign: "left", padding: "10px 16px", fontSize: "11px", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-muted)", whiteSpace: "nowrap" };
const TD: React.CSSProperties     = { padding: "12px 16px", verticalAlign: "middle" };

export default function LeadsPage() {
  const [leads, setLeads]                 = useState<Lead[]>([]);
  const [hydrated, setHydrated]           = useState(false);
  const [modal, setModal]                 = useState<ModalState>(EMPTY_MODAL);
  const [filtroCliente, setFiltroCliente] = useState<string>("Todos");
  const [filtroEstado, setFiltroEstado]   = useState<EstadoLead | "Todos">("Todos");

  useEffect(() => {
    setLeads(loadLeads());
    setHydrated(true);
  }, []);

  function addLead() {
    if (!modal.nombre.trim()) return;
    const lead: Lead = {
      id:              newId(),
      nombre:          modal.nombre.trim(),
      telefono:        modal.telefono.trim(),
      interes:         modal.interes.trim(),
      fuente:          modal.fuente,
      clienteAsociado: modal.clienteAsociado,
      estado:          "Nuevo",
      fecha:           new Date().toISOString().slice(0, 10),
    };
    const updated = [lead, ...leads];
    setLeads(updated);
    saveLeads(updated);
    setModal(EMPTY_MODAL);
  }

  function updateEstado(id: string, estado: EstadoLead) {
    const updated = leads.map(l => l.id === id ? { ...l, estado } : l);
    setLeads(updated);
    saveLeads(updated);
  }

  function deleteLead(id: string) {
    const updated = leads.filter(l => l.id !== id);
    setLeads(updated);
    saveLeads(updated);
  }

  // Stats — leads this calendar month
  const now       = new Date();
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const leadsEsteMes = leads.filter(l => l.fecha.startsWith(thisMonth));
  const convertidos  = leadsEsteMes.filter(l => l.estado === "Convertido").length;
  const conversion   = leadsEsteMes.length > 0 ? Math.round((convertidos / leadsEsteMes.length) * 100) : 0;

  // Filtered view
  const filtered = leads.filter(l => {
    if (filtroCliente !== "Todos" && l.clienteAsociado !== filtroCliente) return false;
    if (filtroEstado  !== "Todos" && l.estado !== filtroEstado)           return false;
    return true;
  });

  function shortCliente(c: string) {
    if (c === "Sin asignar") return "—";
    return c.split(" ")[0];
  }

  return (
    <div style={{ padding: "32px 40px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "20px" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: 600, color: "var(--text)", marginBottom: "6px" }}>Leads</h1>
          <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>
            <span style={{ color: "var(--accent)", fontWeight: 600 }}>{leadsEsteMes.length} leads</span> este mes
            {" · "}
            <span style={{ color: "var(--green)", fontWeight: 600 }}>{conversion}% conversión</span>
          </p>
        </div>
        <button
          onClick={() => setModal({ ...EMPTY_MODAL, open: true })}
          style={{ padding: "9px 18px", borderRadius: "8px", background: "var(--accent)", color: "#fff", fontSize: "13px", fontWeight: 600, border: "none", cursor: "pointer" }}
        >
          + Nuevo Lead
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "18px", flexWrap: "wrap", alignItems: "center" }}>
        {["Todos", ...CLIENTES].map(c => (
          <button
            key={c}
            onClick={() => setFiltroCliente(c)}
            style={{
              fontSize: "12px", padding: "5px 12px", borderRadius: "6px", cursor: "pointer",
              border:    `1px solid ${filtroCliente === c ? "var(--border-accent)" : "var(--border)"}`,
              background: filtroCliente === c ? "var(--accent-dim)" : "var(--card)",
              color:      filtroCliente === c ? "var(--accent)"     : "var(--text-muted)",
              fontWeight: filtroCliente === c ? 600 : 400,
            }}
          >
            {c === "Todos" ? "Todos" : shortCliente(c)}
          </button>
        ))}

        <div style={{ width: "1px", height: "22px", background: "var(--border)", margin: "0 4px" }} />

        {(["Todos", ...ESTADOS] as const).map(e => (
          <button
            key={e}
            onClick={() => setFiltroEstado(e as EstadoLead | "Todos")}
            style={{
              fontSize: "12px", padding: "5px 12px", borderRadius: "6px", cursor: "pointer",
              border:    `1px solid ${filtroEstado === e ? "var(--border-accent)" : "var(--border)"}`,
              background: filtroEstado === e ? "var(--accent-dim)" : "var(--card)",
              color:      filtroEstado === e ? "var(--accent)"     : "var(--text-muted)",
              fontWeight: filtroEstado === e ? 600 : 400,
            }}
          >
            {e}
          </button>
        ))}
      </div>

      {/* Table */}
      {hydrated && (
        <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "10px", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)", background: "var(--surface)" }}>
                <th style={TH}>Nombre</th>
                <th style={TH}>Cliente</th>
                <th style={TH}>Fuente</th>
                <th style={TH}>Interés</th>
                <th style={TH}>Estado</th>
                <th style={TH}>Fecha</th>
                <th style={{ ...TH, width: "40px" }}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: "48px", textAlign: "center", fontSize: "13px", color: "var(--text-muted)" }}>
                    No hay leads con los filtros seleccionados.
                  </td>
                </tr>
              ) : filtered.map((lead, i) => {
                const ec = ESTADO_STYLE[lead.estado];
                return (
                  <tr key={lead.id} style={{ borderBottom: i < filtered.length - 1 ? "1px solid var(--border)" : "none" }}>
                    <td style={TD}>
                      <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)" }}>{lead.nombre}</div>
                      {lead.telefono && (
                        <div style={{ fontSize: "11px", color: "var(--text-muted)", fontFamily: "'Space Mono', monospace", marginTop: "2px" }}>{lead.telefono}</div>
                      )}
                    </td>
                    <td style={{ ...TD, fontSize: "12px", color: "var(--text-muted)" }}>
                      {shortCliente(lead.clienteAsociado)}
                    </td>
                    <td style={TD}>
                      <span style={{ fontSize: "11px", padding: "3px 9px", borderRadius: "4px", background: "var(--accent-dim)", color: "var(--accent)", fontWeight: 600 }}>
                        {lead.fuente}
                      </span>
                    </td>
                    <td style={{ ...TD, fontSize: "12px", color: "var(--text-mid)", maxWidth: "200px" }}>
                      {lead.interes || "—"}
                    </td>
                    <td style={TD}>
                      <select
                        value={lead.estado}
                        onChange={e => updateEstado(lead.id, e.target.value as EstadoLead)}
                        style={{ fontSize: "11px", padding: "4px 8px", borderRadius: "4px", border: "none", background: ec.bg, color: ec.color, fontWeight: 600, cursor: "pointer", outline: "none" }}
                      >
                        {ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}
                      </select>
                    </td>
                    <td style={{ ...TD, fontSize: "11px", color: "var(--text-muted)", fontFamily: "'Space Mono', monospace", whiteSpace: "nowrap" }}>
                      {new Date(lead.fecha + "T00:00:00").toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit" })}
                    </td>
                    <td style={TD}>
                      <button
                        onClick={() => deleteLead(lead.id)}
                        style={{ fontSize: "11px", padding: "4px 8px", borderRadius: "4px", background: "transparent", color: "var(--text-muted)", border: "1px solid var(--border)", cursor: "pointer" }}
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal: Nuevo Lead */}
      {modal.open && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: "16px" }}
          onClick={() => setModal(EMPTY_MODAL)}
        >
          <div
            style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px", padding: "28px", width: "100%", maxWidth: "460px" }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "22px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 600, color: "var(--text)" }}>Nuevo Lead</h3>
              <button onClick={() => setModal(EMPTY_MODAL)} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "18px" }}>✕</button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ fontSize: "12px", color: "var(--text-muted)", display: "block", marginBottom: "6px" }}>Nombre *</label>
                <input
                  value={modal.nombre}
                  onChange={e => setModal(m => ({ ...m, nombre: e.target.value }))}
                  placeholder="Nombre del lead"
                  style={INPUT}
                  autoFocus
                />
              </div>
              <div>
                <label style={{ fontSize: "12px", color: "var(--text-muted)", display: "block", marginBottom: "6px" }}>Teléfono</label>
                <input
                  value={modal.telefono}
                  onChange={e => setModal(m => ({ ...m, telefono: e.target.value }))}
                  placeholder="6XX XXX XXX"
                  style={INPUT}
                />
              </div>
              <div>
                <label style={{ fontSize: "12px", color: "var(--text-muted)", display: "block", marginBottom: "6px" }}>Interés / Servicio</label>
                <input
                  value={modal.interes}
                  onChange={e => setModal(m => ({ ...m, interes: e.target.value }))}
                  placeholder="Ej: Coloración, consultoría Meta Ads..."
                  style={INPUT}
                />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "12px", color: "var(--text-muted)", display: "block", marginBottom: "6px" }}>Fuente</label>
                  <select value={modal.fuente} onChange={e => setModal(m => ({ ...m, fuente: e.target.value as Fuente }))} style={SELECT}>
                    {FUENTES.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: "12px", color: "var(--text-muted)", display: "block", marginBottom: "6px" }}>Cliente asociado</label>
                  <select value={modal.clienteAsociado} onChange={e => setModal(m => ({ ...m, clienteAsociado: e.target.value }))} style={SELECT}>
                    {CLIENTES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: "10px", marginTop: "24px" }}>
              <button
                onClick={() => setModal(EMPTY_MODAL)}
                style={{ flex: 1, padding: "10px", borderRadius: "8px", background: "transparent", color: "var(--text-muted)", border: "1px solid var(--border)", fontSize: "13px", cursor: "pointer" }}
              >
                Cancelar
              </button>
              <button
                onClick={addLead}
                disabled={!modal.nombre.trim()}
                style={{
                  flex: 2, padding: "10px", borderRadius: "8px", fontSize: "13px", fontWeight: 600, border: "none",
                  background: modal.nombre.trim() ? "var(--accent)" : "var(--border)",
                  color:      modal.nombre.trim() ? "#fff"          : "var(--text-muted)",
                  cursor:     modal.nombre.trim() ? "pointer"       : "not-allowed",
                }}
              >
                Añadir lead
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
