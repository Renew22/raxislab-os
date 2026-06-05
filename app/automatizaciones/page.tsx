"use client";

import { useState } from "react";

type Flow = {
  id: number;
  nombre: string;
  descripcion: string;
  activo: boolean;
  ultimaEjecucion: string | null;
};

const INITIAL_FLOWS: Flow[] = [
  { id: 1, nombre: "Flow 01 Reporte semanal", descripcion: "Genera reporte semanal de clientes y lo envía por Telegram", activo: false, ultimaEjecucion: null },
  { id: 2, nombre: "Flow 02 GBP posts", descripcion: "Publica posts automáticos en Google Business Profile", activo: false, ultimaEjecucion: null },
  { id: 3, nombre: "Flow 03 Reseñas", descripcion: "Monitoriza nuevas reseñas y alerta por Telegram", activo: false, ultimaEjecucion: null },
  { id: 4, nombre: "Flow 04 Briefing trading", descripcion: "Genera briefing diario de mercados al despertar", activo: false, ultimaEjecucion: null },
  { id: 5, nombre: "Flow 05 Blog EN", descripcion: "Automatiza publicación de artículos en blog en inglés", activo: false, ultimaEjecucion: null },
  { id: 6, nombre: "Flow 06 Guiones YouTube", descripcion: "Genera guiones para videos de YouTube automáticamente", activo: false, ultimaEjecucion: null },
  { id: 7, nombre: "Flow 07 Cazador Empresas", descripcion: "Identifica y califica empresas potenciales como leads", activo: false, ultimaEjecucion: null },
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
          <span
            className="w-2 h-2 rounded-full"
            style={{ background: "#10b981", boxShadow: "0 0 6px #10b981" }}
          />
          <span className="text-xs" style={{ color: "#475569" }}>
            {activos} de {flows.length} activos
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {flows.map(({ id, nombre, descripcion, activo, ultimaEjecucion }) => (
          <div
            key={id}
            className="rounded-xl p-5 flex items-center gap-5 transition-all"
            style={{
              background: "#111120",
              border: `1px solid ${activo ? "rgba(99,102,241,0.25)" : "#1a1a2e"}`,
            }}
          >
            {/* Toggle */}
            <button
              onClick={() => toggleFlow(id)}
              className="flex-shrink-0 w-11 h-6 rounded-full relative transition-colors"
              style={{ background: activo ? "#6366f1" : "#1a1a2e" }}
              aria-label={activo ? "Desactivar" : "Activar"}
            >
              <span
                className="absolute top-0.5 w-5 h-5 rounded-full transition-all duration-200"
                style={{
                  left: activo ? "calc(100% - 22px)" : "2px",
                  background: activo ? "#fff" : "#475569",
                }}
              />
            </button>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-1">
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
              <p className="text-xs truncate" style={{ color: "#475569" }}>{descripcion}</p>
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
