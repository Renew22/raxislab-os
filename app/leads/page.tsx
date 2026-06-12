"use client";
import { useState } from "react";

type Estado = "Sin contactar" | "Email 1" | "Email 2" | "Email 3" | "Reunión" | "Cerrado" | "Descartado";
type Sector = "Taller" | "Rent a Car" | "Clínica" | "Restaurante" | "Peluquería";

type Lead = {
  id: string;
  nombre: string;
  sector: Sector;
  ciudad: string;
  tieneWeb: boolean;
  tieneGMB: boolean;
  tieneMetaAds: boolean;
  tieneResenas: boolean;
  estado: Estado;
};

function calcScore(l: Lead): number {
  let s = 4;
  if (l.tieneWeb) s += 2;
  if (l.tieneGMB) s += 2;
  if (!l.tieneMetaAds) s += 1;
  if (l.tieneResenas) s += 1;
  return Math.min(s, 10);
}

const LEADS_INITIAL: Lead[] = [
  { id: "1", nombre: "Taller García",           sector: "Taller",      ciudad: "Valencia", tieneWeb: true,  tieneGMB: true,  tieneMetaAds: false, tieneResenas: true,  estado: "Sin contactar" },
  { id: "2", nombre: "Rent-a-Car Sol",           sector: "Rent a Car",  ciudad: "Valencia", tieneWeb: true,  tieneGMB: true,  tieneMetaAds: false, tieneResenas: false, estado: "Email 1" },
  { id: "3", nombre: "Clínica Estética Luna",    sector: "Clínica",     ciudad: "Madrid",   tieneWeb: false, tieneGMB: true,  tieneMetaAds: false, tieneResenas: true,  estado: "Sin contactar" },
  { id: "4", nombre: "Restaurante El Palmeral",  sector: "Restaurante", ciudad: "Valencia", tieneWeb: true,  tieneGMB: false, tieneMetaAds: false, tieneResenas: true,  estado: "Email 2" },
  { id: "5", nombre: "Peluquería Noa",           sector: "Peluquería",  ciudad: "Valencia", tieneWeb: false, tieneGMB: true,  tieneMetaAds: false, tieneResenas: true,  estado: "Sin contactar" },
  { id: "6", nombre: "Taller Martínez Pro",      sector: "Taller",      ciudad: "Alicante", tieneWeb: true,  tieneGMB: true,  tieneMetaAds: true,  tieneResenas: true,  estado: "Reunión" },
  { id: "7", nombre: "Rent & Go Valencia",       sector: "Rent a Car",  ciudad: "Valencia", tieneWeb: false, tieneGMB: false, tieneMetaAds: false, tieneResenas: false, estado: "Descartado" },
];

const ESTADOS: Estado[] = ["Sin contactar", "Email 1", "Email 2", "Email 3", "Reunión", "Cerrado", "Descartado"];
const SECTORES: Sector[] = ["Taller", "Rent a Car", "Clínica", "Restaurante", "Peluquería"];

const ESTADO_COLOR: Record<Estado, string> = {
  "Sin contactar": "var(--text-muted)",
  "Email 1": "var(--accent)",
  "Email 2": "var(--accent)",
  "Email 3": "var(--accent)",
  "Reunión": "var(--amber)",
  "Cerrado": "var(--green)",
  "Descartado": "var(--text-muted)",
};

function generarEmail(l: Lead): string {
  const lineas: string[] = [];
  if (!l.tieneMetaAds) lineas.push("No aparecéis en Meta Ads, dejando pasar clientes que os buscan activamente.");
  if (!l.tieneWeb) lineas.push("No tenéis web propia, lo que dificulta que nuevos clientes os encuentren.");
  if (!l.tieneGMB) lineas.push("Sin perfil en Google My Business perdéis visibilidad local crítica.");

  return `Asunto: ¿Te ayudo a conseguir más clientes para ${l.nombre}?

Hola,

He revisado la presencia online de ${l.nombre} en ${l.ciudad} y veo una oportunidad clara para atraer más clientes.

${lineas.join("\n")}${l.tieneGMB ? "\nTenéis perfil en Google My Business — buen punto de partida para escalar." : ""}

En Raxislab ayudamos a negocios como el vuestro a generar leads de calidad con Meta Ads y Google, con resultados medibles desde la primera semana.

¿Tienes 15 minutos esta semana para una llamada rápida?

Saludos,
Rene — Raxislab`;
}

function generarWA(l: Lead): string {
  return `Hola, soy Rene de Raxislab 👋

He visto ${l.nombre} en ${l.ciudad} y creo que puedo ayudaros a conseguir más clientes con publicidad en Meta/Google.

¿Te parece si te cuento cómo en 5 minutos?`;
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>(LEADS_INITIAL);
  const [sectorFiltro, setSectorFiltro] = useState<Sector | "Todos">("Todos");
  const [modal, setModal] = useState<{ lead: Lead; tipo: "email" | "wa"; content: string | null; loading: boolean } | null>(null);

  function cambiarEstado(id: string, estado: Estado) {
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, estado } : l)));
  }

  async function openModal(lead: Lead, tipo: "email" | "wa") {
    if (tipo === "wa") {
      setModal({ lead, tipo, content: generarWA(lead), loading: false });
      return;
    }
    setModal({ lead, tipo, content: null, loading: true });
    try {
      const res = await fetch('/api/claude/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'email_lead', data: { empresa: lead.nombre, sector: lead.sector } }),
      });
      const json = await res.json();
      setModal(prev => prev ? { ...prev, content: json.content, loading: false } : null);
    } catch {
      setModal(prev => prev ? { ...prev, content: generarEmail(lead), loading: false } : null);
    }
  }

  const filtered = sectorFiltro === "Todos" ? leads : leads.filter((l) => l.sector === sectorFiltro);

  return (
    <div style={{ padding: "32px 40px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: 600, color: "var(--text)" }}>Leads — Prospecting System</h1>
        <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>{filtered.length} leads</span>
      </div>

      {/* Filtros por sector */}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "20px" }}>
        {(["Todos", ...SECTORES] as const).map((s) => (
          <button
            key={s}
            onClick={() => setSectorFiltro(s)}
            style={{
              fontSize: "12px",
              padding: "6px 12px",
              borderRadius: "8px",
              fontWeight: 500,
              cursor: "pointer",
              border: `1px solid ${sectorFiltro === s ? "transparent" : "var(--border)"}`,
              background: sectorFiltro === s ? "var(--accent)" : "var(--card)",
              color: sectorFiltro === s ? "#fff" : "var(--text-muted)",
            }}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Lista de leads */}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {filtered.map((lead) => {
          const score = calcScore(lead);
          const scoreColor = score >= 8 ? "var(--green)" : score >= 6 ? "var(--amber)" : "var(--red)";
          return (
            <div
              key={lead.id}
              style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "12px", padding: "20px" }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", gap: "16px" }}>
                {/* Score circle */}
                <div
                  style={{ flexShrink: 0, width: "48px", height: "48px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", fontWeight: 700, background: "var(--accent-dim)", color: scoreColor, border: `2px solid var(--border-accent)` }}
                >
                  {score}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px", flexWrap: "wrap" }}>
                    <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--text)" }}>{lead.nombre}</span>
                    <span style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "999px", background: "var(--accent-dim)", color: "var(--accent)" }}>{lead.sector}</span>
                    <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>{lead.ciudad}</span>
                  </div>

                  {/* Señales de scoring */}
                  <div style={{ display: "flex", gap: "8px", marginBottom: "12px", flexWrap: "wrap" }}>
                    {[
                      { label: "Web",       val: lead.tieneWeb },
                      { label: "GMB",       val: lead.tieneGMB },
                      { label: "Meta Ads",  val: lead.tieneMetaAds },
                      { label: "Reseñas",   val: lead.tieneResenas },
                    ].map(({ label, val }) => (
                      <span
                        key={label}
                        style={{
                          fontSize: "11px",
                          padding: "2px 8px",
                          borderRadius: "4px",
                          background: val ? "rgba(0,230,118,0.08)" : "rgba(255,61,113,0.08)",
                          color: val ? "var(--green)" : "var(--red)",
                        }}
                      >
                        {val ? "✓" : "✗"} {label}
                      </span>
                    ))}
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                    <select
                      value={lead.estado}
                      onChange={(e) => cambiarEstado(lead.id, e.target.value as Estado)}
                      style={{ fontSize: "12px", padding: "6px 8px", borderRadius: "6px", outline: "none", cursor: "pointer", background: "var(--card-hover)", color: ESTADO_COLOR[lead.estado], border: "1px solid var(--border)" }}
                    >
                      {ESTADOS.map((e) => <option key={e} value={e}>{e}</option>)}
                    </select>

                    <button
                      onClick={() => openModal(lead, "email")}
                      style={{ fontSize: "12px", padding: "6px 12px", borderRadius: "6px", fontWeight: 500, cursor: "pointer", background: "var(--accent-dim)", color: "var(--accent)", border: "1px solid var(--border-accent)" }}
                    >
                      ✉ Email personalizado
                    </button>
                    <button
                      onClick={() => openModal(lead, "wa")}
                      style={{ fontSize: "12px", padding: "6px 12px", borderRadius: "6px", fontWeight: 500, cursor: "pointer", background: "rgba(0,230,118,0.08)", color: "var(--green)", border: "1px solid rgba(0,230,118,0.2)" }}
                    >
                      💬 WhatsApp
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal mensaje generado */}
      {modal && (
        <div
          style={{ position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: "16px", background: "rgba(0,0,0,0.75)" }}
          onClick={() => setModal(null)}
        >
          <div
            style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px", padding: "24px", width: "100%", maxWidth: "520px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
              <h3 style={{ fontSize: "14px", fontWeight: 700, color: "var(--text)" }}>
                {modal.tipo === "email" ? "Email personalizado" : "Mensaje WhatsApp"} — {modal.lead.nombre}
              </h3>
              <button onClick={() => setModal(null)} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "18px" }}>✕</button>
            </div>
            <pre
              style={{ fontSize: "12px", lineHeight: 1.6, whiteSpace: "pre-wrap", padding: "16px", borderRadius: "8px", overflow: "auto", background: "var(--card-hover)", color: "var(--text-mid)", border: "1px solid var(--border)", maxHeight: "320px" }}
            >
              {modal.loading ? "Generando mensaje con IA..." : (modal.content ?? "")}
            </pre>
            <button
              onClick={() => {
                const txt = modal.content ?? "";
                navigator.clipboard.writeText(txt).then(() => alert("Copiado al portapapeles ✅"));
              }}
              disabled={modal.loading}
              style={{ marginTop: "16px", width: "100%", padding: "10px", borderRadius: "8px", fontSize: "14px", fontWeight: 500, cursor: modal.loading ? "not-allowed" : "pointer", background: modal.loading ? "var(--border)" : "var(--accent)", color: "#fff", border: "none" }}
            >
              {modal.loading ? "Generando..." : "Copiar al portapapeles"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
