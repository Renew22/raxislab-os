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
  "Sin contactar": "#475569",
  "Email 1": "#818cf8",
  "Email 2": "#a78bfa",
  "Email 3": "#c084fc",
  "Reunión": "#f59e0b",
  "Cerrado": "#10b981",
  "Descartado": "#334155",
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
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold" style={{ color: "#e2e8f0" }}>Leads — Prospecting System</h1>
        <span className="text-xs" style={{ color: "#475569" }}>{filtered.length} leads</span>
      </div>

      {/* Filtros por sector */}
      <div className="flex gap-2 flex-wrap">
        {(["Todos", ...SECTORES] as const).map((s) => (
          <button
            key={s}
            onClick={() => setSectorFiltro(s)}
            className="text-xs px-3 py-1.5 rounded-lg font-medium transition-all"
            style={{
              background: sectorFiltro === s ? "#6366f1" : "rgba(255,255,255,0.04)",
              color: sectorFiltro === s ? "#fff" : "#475569",
              border: `1px solid ${sectorFiltro === s ? "transparent" : "#1a1a2e"}`,
            }}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Lista de leads */}
      <div className="flex flex-col gap-3">
        {filtered.map((lead) => {
          const score = calcScore(lead);
          const scoreColor = score >= 8 ? "#10b981" : score >= 6 ? "#f59e0b" : "#ef4444";
          return (
            <div
              key={lead.id}
              className="rounded-xl p-5"
              style={{ background: "#111120", border: "1px solid #1a1a2e" }}
            >
              <div className="flex items-start gap-4">
                {/* Score circle */}
                <div
                  className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold"
                  style={{ background: `${scoreColor}15`, color: scoreColor, border: `2px solid ${scoreColor}40` }}
                >
                  {score}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <span className="text-sm font-bold" style={{ color: "#e2e8f0" }}>{lead.nombre}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(99,102,241,0.1)", color: "#818cf8" }}>{lead.sector}</span>
                    <span className="text-xs" style={{ color: "#475569" }}>{lead.ciudad}</span>
                  </div>

                  {/* Señales de scoring */}
                  <div className="flex gap-2 mb-3 flex-wrap">
                    {[
                      { label: "Web",       val: lead.tieneWeb },
                      { label: "GMB",       val: lead.tieneGMB },
                      { label: "Meta Ads",  val: lead.tieneMetaAds },
                      { label: "Reseñas",   val: lead.tieneResenas },
                    ].map(({ label, val }) => (
                      <span
                        key={label}
                        className="text-xs px-2 py-0.5 rounded"
                        style={{
                          background: val ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
                          color: val ? "#10b981" : "#ef4444",
                        }}
                      >
                        {val ? "✓" : "✗"} {label}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <select
                      value={lead.estado}
                      onChange={(e) => cambiarEstado(lead.id, e.target.value as Estado)}
                      className="text-xs px-2 py-1.5 rounded-md outline-none cursor-pointer"
                      style={{ background: "rgba(255,255,255,0.04)", color: ESTADO_COLOR[lead.estado], border: "1px solid #1a1a2e" }}
                    >
                      {ESTADOS.map((e) => <option key={e} value={e}>{e}</option>)}
                    </select>

                    <button
                      onClick={() => openModal(lead, "email")}
                      className="text-xs px-3 py-1.5 rounded-md font-medium transition-opacity hover:opacity-80"
                      style={{ background: "rgba(99,102,241,0.12)", color: "#818cf8", border: "1px solid rgba(99,102,241,0.2)" }}
                    >
                      ✉ Email personalizado
                    </button>
                    <button
                      onClick={() => openModal(lead, "wa")}
                      className="text-xs px-3 py-1.5 rounded-md font-medium transition-opacity hover:opacity-80"
                      style={{ background: "rgba(16,185,129,0.1)", color: "#10b981", border: "1px solid rgba(16,185,129,0.2)" }}
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
          className="fixed inset-0 flex items-center justify-center z-50 p-4"
          style={{ background: "rgba(0,0,0,0.85)" }}
          onClick={() => setModal(null)}
        >
          <div
            className="rounded-xl p-6 w-full max-w-lg"
            style={{ background: "#0a0a14", border: "1px solid #1a1a2e" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold" style={{ color: "#e2e8f0" }}>
                {modal.tipo === "email" ? "Email personalizado" : "Mensaje WhatsApp"} — {modal.lead.nombre}
              </h3>
              <button onClick={() => setModal(null)} style={{ color: "#475569" }}>✕</button>
            </div>
            <pre
              className="text-xs leading-relaxed whitespace-pre-wrap p-4 rounded-lg overflow-auto"
              style={{ background: "rgba(255,255,255,0.03)", color: "#94a3b8", border: "1px solid #1a1a2e", maxHeight: "320px" }}
            >
              {modal.loading ? "Generando mensaje con IA..." : (modal.content ?? "")}
            </pre>
            <button
              onClick={() => {
                const txt = modal.content ?? "";
                navigator.clipboard.writeText(txt).then(() => alert("Copiado al portapapeles ✅"));
              }}
              disabled={modal.loading}
              className="mt-4 w-full py-2 rounded-lg text-sm font-medium transition-opacity hover:opacity-80"
              style={{ background: modal.loading ? "#334155" : "#6366f1", color: "#fff" }}
            >
              {modal.loading ? "Generando..." : "Copiar al portapapeles"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
