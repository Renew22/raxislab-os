"use client";

import { useState } from "react";

type Flow = {
  id: number;
  nombre: string;
  descripcion: string;
  stack: string;
  activo: boolean;
  ultimaEjecucion: string | null;
};

const INITIAL_FLOWS: Flow[] = [
  {
    id: 1,
    nombre: "Flow 01 — Reporte Semanal",
    descripcion: "Extrae métricas de Windsor.ai → Claude genera resumen narrativo → envía email al cliente",
    stack: "Windsor.ai + Claude + Gmail",
    activo: false,
    ultimaEjecucion: null,
  },
  {
    id: 2,
    nombre: "Flow 02 — GBP Post Semanal",
    descripcion: "Perplexity investiga tendencias locales → Claude redacta post → publica en Google Business Profile",
    stack: "Perplexity + Claude + Google Business",
    activo: false,
    ultimaEjecucion: null,
  },
  {
    id: 3,
    nombre: "Flow 03 — Respuesta Reseñas",
    descripcion: "Detecta nueva reseña → Claude genera respuesta personalizada → aprobación por Telegram → publica",
    stack: "Claude + Telegram + Google Business",
    activo: false,
    ultimaEjecucion: null,
  },
  {
    id: 4,
    nombre: "Flow 04 — Briefing Trading",
    descripcion: "IBKR obtiene posiciones → Perplexity busca noticias de mercado → Claude genera briefing → Telegram a las 08:45",
    stack: "IBKR + Perplexity + Claude + Telegram",
    activo: false,
    ultimaEjecucion: null,
  },
  {
    id: 5,
    nombre: "Flow 05 — Blog EN",
    descripcion: "Detecta tendencias de búsqueda → Claude redacta artículo en inglés → crea borrador en WordPress",
    stack: "Trends + Claude + WordPress",
    activo: false,
    ultimaEjecucion: null,
  },
  {
    id: 6,
    nombre: "Flow 06 — Guiones YouTube",
    descripcion: "Analiza temas trending del nicho → Claude genera guión estructurado → envía a Telegram cada viernes",
    stack: "YouTube Trends + Claude + Telegram",
    activo: false,
    ultimaEjecucion: null,
  },
  {
    id: 7,
    nombre: "Flow 07 — Cazador de Empresas",
    descripcion: "SEC EDGAR filtra empresas por criterios → Claude analiza y puntúa → alerta en Telegram y publica en X",
    stack: "SEC EDGAR + Claude + Telegram + X",
    activo: false,
    ultimaEjecucion: null,
  },
];

export default function AutomatizacionesPage() {
  const [flows, setFlows] = useState<Flow[]>(INITIAL_FLOWS);

  function toggleFlow(id: number) {
    setFlows((prev) =>
      prev.map((f) =>
        f.id === id
          ? { ...f, activo: !f.activo, ultimaEjecucion: !f.activo ? "Ahora" : f.ultimaEjecucion }
          : f
      )
    );
  }

  const activos = flows.filter((f) => f.activo).length;

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold" style={{ color: "#e2e8f0" }}>Automatizaciones</h1>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: "#10b981", boxShadow: "0 0 6px #10b981" }} />
          <span className="text-xs" style={{ color: "#475569" }}>{activos} de {flows.length} activos</span>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {flows.map(({ id, nombre, descripcion, stack, activo, ultimaEjecucion }) => (
          <div
            key={id}
            className="rounded-xl p-5 flex items-start gap-5 transition-all"
            style={{ background: "#111120", border: `1px solid ${activo ? "rgba(99,102,241,0.25)" : "#1a1a2e"}` }}
          >
            {/* Toggle */}
            <button
              onClick={() => toggleFlow(id)}
              className="flex-shrink-0 w-11 h-6 rounded-full relative transition-colors mt-0.5"
              style={{ background: activo ? "#6366f1" : "#1a1a2e" }}
              aria-label={activo ? "Desactivar" : "Activar"}
            >
              <span
                className="absolute top-0.5 w-5 h-5 rounded-full transition-all duration-200"
                style={{ left: activo ? "calc(100% - 22px)" : "2px", background: activo ? "#fff" : "#475569" }}
              />
            </button>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-1 flex-wrap">
                <span className="text-sm font-medium" style={{ color: "#e2e8f0" }}>{nombre}</span>
                <span
                  className="text-xs font-semibold px-2 py-0.5 rounded-full"
                  style={{
                    color: activo ? "#10b981" : "#475569",
                    background: activo ? "rgba(16,185,129,0.1)" : "rgba(71,85,105,0.1)",
                  }}
                >
                  {activo ? "ACTIVO" : "INACTIVO"}
                </span>
              </div>
              <p className="text-xs mb-2" style={{ color: "#94a3b8" }}>{descripcion}</p>
              <div className="flex flex-wrap gap-1">
                {stack.split(" + ").map((s) => (
                  <span
                    key={s}
                    className="text-xs px-2 py-0.5 rounded"
                    style={{ background: "rgba(99,102,241,0.08)", color: "#818cf8", border: "1px solid rgba(99,102,241,0.15)" }}
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>

            {/* Última ejecución */}
            <div className="flex-shrink-0 text-right">
              <p className="text-xs" style={{ color: "#475569" }}>Última ejecución</p>
              <p className="text-xs font-medium mt-0.5" style={{ color: ultimaEjecucion ? "#94a3b8" : "#1e293b" }}>
                {ultimaEjecucion ?? "Nunca"}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
