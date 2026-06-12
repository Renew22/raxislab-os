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
    <div style={{ padding: "32px 40px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: 600, color: "var(--text)" }}>Automatizaciones</h1>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--green)", boxShadow: "0 0 6px var(--green)", flexShrink: 0 }} />
          <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>{activos} de {flows.length} activos</span>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {flows.map(({ id, nombre, descripcion, stack, activo, ultimaEjecucion }) => (
          <div
            key={id}
            style={{ background: "var(--card)", border: `1px solid ${activo ? "var(--border-accent)" : "var(--border)"}`, borderRadius: "12px", padding: "20px", display: "flex", alignItems: "flex-start", gap: "20px", transition: "border-color 0.2s" }}
          >
            {/* Toggle */}
            <button
              onClick={() => toggleFlow(id)}
              style={{ flexShrink: 0, width: "44px", height: "24px", borderRadius: "999px", position: "relative", background: activo ? "var(--accent)" : "var(--border)", border: "none", cursor: "pointer", transition: "background 0.2s", marginTop: "2px", outline: "none" }}
              aria-label={activo ? "Desactivar" : "Activar"}
            >
              <span
                style={{ position: "absolute", top: "2px", width: "20px", height: "20px", borderRadius: "50%", background: "#ffffff", transition: "left 0.2s", left: activo ? "calc(100% - 22px)" : "2px" }}
              />
            </button>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "4px", flexWrap: "wrap" }}>
                <span style={{ fontSize: "14px", fontWeight: 500, color: "var(--text)" }}>{nombre}</span>
                <span style={{ fontSize: "11px", fontWeight: 600, padding: "2px 8px", borderRadius: "999px", color: activo ? "var(--green)" : "var(--text-muted)", background: activo ? "rgba(0,230,118,0.08)" : "var(--accent-dim)" }}>
                  {activo ? "ACTIVO" : "INACTIVO"}
                </span>
              </div>
              <p style={{ fontSize: "12px", marginBottom: "8px", color: "var(--text-mid)" }}>{descripcion}</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                {stack.split(" + ").map((s) => (
                  <span
                    key={s}
                    style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "4px", background: "var(--accent-dim)", color: "var(--accent)", border: "1px solid var(--border-accent)" }}
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>

            {/* Última ejecución */}
            <div style={{ flexShrink: 0, textAlign: "right" }}>
              <p style={{ fontSize: "11px", color: "var(--text-muted)" }}>Última ejecución</p>
              <p style={{ fontSize: "12px", fontWeight: 500, marginTop: "2px", color: ultimaEjecucion ? "var(--text-mid)" : "var(--border)" }}>
                {ultimaEjecucion ?? "Nunca"}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
