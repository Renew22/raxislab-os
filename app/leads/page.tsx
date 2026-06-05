"use client";

import { useState } from "react";

type Columna = "hot" | "tibio" | "descartado";

type Lead = {
  id: string;
  nombre: string;
  puntos: number;
  columna: Columna;
};

const INITIAL_LEADS: Lead[] = [
  { id: "1", nombre: "Taller García", puntos: 9, columna: "hot" },
  { id: "2", nombre: "Rent-a-Car Sol", puntos: 8, columna: "hot" },
  { id: "3", nombre: "Bar Paco", puntos: 5, columna: "tibio" },
  { id: "4", nombre: "Clínica Estética", puntos: 6, columna: "tibio" },
];

const COLS: Record<Columna, { label: string; color: string; bg: string; border: string }> = {
  hot:        { label: "HOT 🔥", color: "#ef4444", bg: "rgba(239,68,68,0.07)", border: "rgba(239,68,68,0.15)" },
  tibio:      { label: "TIBIO",  color: "#f59e0b", bg: "rgba(245,158,11,0.07)", border: "rgba(245,158,11,0.15)" },
  descartado: { label: "DESCARTADO", color: "#475569", bg: "rgba(71,85,105,0.07)", border: "rgba(71,85,105,0.15)" },
};

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>(INITIAL_LEADS);
  const [showForm, setShowForm] = useState(false);
  const [nombre, setNombre] = useState("");
  const [puntos, setPuntos] = useState("5");

  function addLead() {
    if (!nombre.trim()) return;
    setLeads((prev) => [
      ...prev,
      { id: Date.now().toString(), nombre: nombre.trim(), puntos: parseInt(puntos) || 5, columna: "tibio" },
    ]);
    setNombre("");
    setPuntos("5");
    setShowForm(false);
  }

  function mover(id: string, col: Columna) {
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, columna: col } : l)));
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold" style={{ color: "#e2e8f0" }}>Leads</h1>
        <button
          onClick={() => setShowForm((p) => !p)}
          className="text-sm font-medium px-4 py-2 rounded-lg transition-opacity hover:opacity-80"
          style={{ background: "rgba(99,102,241,0.15)", color: "#818cf8", border: "1px solid rgba(99,102,241,0.25)" }}
        >
          + Añadir lead
        </button>
      </div>

      {showForm && (
        <div
          className="rounded-xl p-5 flex gap-4 items-end"
          style={{ background: "#111120", border: "1px solid #1a1a2e" }}
        >
          <div className="flex-1">
            <label className="text-xs block mb-1.5" style={{ color: "#475569" }}>Nombre del negocio</label>
            <input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addLead()}
              placeholder="Ej: Taller Martínez"
              className="w-full text-sm px-3 py-2 rounded-lg outline-none"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid #1a1a2e", color: "#e2e8f0" }}
            />
          </div>
          <div className="w-28">
            <label className="text-xs block mb-1.5" style={{ color: "#475569" }}>Puntos (1-10)</label>
            <input
              type="number"
              min="1"
              max="10"
              value={puntos}
              onChange={(e) => setPuntos(e.target.value)}
              className="w-full text-sm px-3 py-2 rounded-lg outline-none"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid #1a1a2e", color: "#e2e8f0" }}
            />
          </div>
          <button
            onClick={addLead}
            className="text-sm font-medium px-4 py-2 rounded-lg transition-opacity hover:opacity-80"
            style={{ background: "#6366f1", color: "#fff" }}
          >
            Añadir
          </button>
          <button
            onClick={() => setShowForm(false)}
            className="text-sm px-3 py-2 rounded-lg"
            style={{ color: "#475569" }}
          >
            Cancelar
          </button>
        </div>
      )}

      <div className="grid grid-cols-3 gap-5">
        {(["hot", "tibio", "descartado"] as Columna[]).map((col) => {
          const { label, color, bg, border } = COLS[col];
          const colLeads = leads.filter((l) => l.columna === col);
          return (
            <div key={col} className="rounded-xl p-4" style={{ background: bg, border: `1px solid ${border}` }}>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-wider" style={{ color }}>{label}</span>
                <span
                  className="text-xs font-medium w-5 h-5 rounded-full flex items-center justify-center"
                  style={{ background: `${color}20`, color }}
                >
                  {colLeads.length}
                </span>
              </div>
              <div className="flex flex-col gap-3">
                {colLeads.map((lead) => (
                  <div
                    key={lead.id}
                    className="rounded-lg p-4"
                    style={{ background: "#111120", border: "1px solid #1a1a2e" }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <span className="text-sm font-medium" style={{ color: "#e2e8f0" }}>{lead.nombre}</span>
                      <span
                        className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                        style={{ background: `${color}15`, color }}
                      >
                        {lead.puntos}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => alert(`🤖 Investigando ${lead.nombre}...\n\nAnálisis disponible en breve vía Telegram.`)}
                        className="flex-1 text-xs py-1.5 rounded-md font-medium transition-opacity hover:opacity-80"
                        style={{ background: "rgba(99,102,241,0.12)", color: "#818cf8", border: "1px solid rgba(99,102,241,0.2)" }}
                      >
                        🤖 Investigar IA
                      </button>
                      <select
                        value={lead.columna}
                        onChange={(e) => mover(lead.id, e.target.value as Columna)}
                        className="text-xs px-2 py-1.5 rounded-md outline-none cursor-pointer"
                        style={{ background: "rgba(255,255,255,0.04)", color: "#475569", border: "1px solid #1a1a2e" }}
                      >
                        <option value="hot">HOT</option>
                        <option value="tibio">Tibio</option>
                        <option value="descartado">Descartado</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
