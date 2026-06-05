"use client";

import { useState } from "react";

const PROJECTS = [
  {
    nombre: "OpsIQ SaaS",
    progreso: 25,
    estado: "EN DESARROLLO",
    color: "#3b82f6",
    bg: "rgba(59,130,246,0.1)",
    proximo: "cliente piloto taller",
    acciones: ["Definir MVP features", "Montar landing page", "Captar cliente piloto taller"],
  },
  {
    nombre: "Curso Jorge",
    progreso: 5,
    estado: "PLANIFICANDO",
    color: "#f59e0b",
    bg: "rgba(245,158,11,0.1)",
    proximo: "reunión con Jorge",
    acciones: ["Reunión con Jorge", "Definir temario", "Crear estructura módulos"],
  },
  {
    nombre: "Blog EN AdSense",
    progreso: 0,
    estado: "ARRANCAR",
    color: "#ef4444",
    bg: "rgba(239,68,68,0.1)",
    proximo: "registrar dominio",
    acciones: ["Registrar dominio", "Instalar WordPress", "Publicar primer artículo"],
  },
  {
    nombre: "YouTube Auto",
    progreso: 0,
    estado: "PLANIFICANDO",
    color: "#f59e0b",
    bg: "rgba(245,158,11,0.1)",
    proximo: "definir nicho",
    acciones: ["Definir nicho", "Crear canal", "Primer video guión"],
  },
];

export default function ProyectosPage() {
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  function toggle(key: string) {
    setChecked((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-semibold" style={{ color: "#e2e8f0" }}>Proyectos</h1>

      <div className="grid grid-cols-2 gap-5">
        {PROJECTS.map(({ nombre, progreso, estado, color, bg, proximo, acciones }) => (
          <div
            key={nombre}
            className="rounded-xl p-6 flex flex-col gap-4"
            style={{ background: "#111120", border: "1px solid #1a1a2e" }}
          >
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-base font-semibold" style={{ color: "#e2e8f0" }}>{nombre}</h3>
              <span
                className="flex-shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{ color, background: bg, border: `1px solid ${color}33` }}
              >
                {estado}
              </span>
            </div>

            <div>
              <div className="flex justify-between mb-1.5">
                <span className="text-xs" style={{ color: "#475569" }}>Progreso</span>
                <span className="text-xs font-mono font-medium" style={{ color }}>{progreso}%</span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "#1a1a2e" }}>
                <div
                  className="h-full rounded-full"
                  style={{ width: `${progreso}%`, background: color, minWidth: progreso > 0 ? "0" : "0" }}
                />
              </div>
            </div>

            <div>
              <p className="text-xs mb-0.5" style={{ color: "#475569" }}>Próximo paso</p>
              <p className="text-xs font-medium" style={{ color: "#94a3b8" }}>{proximo}</p>
            </div>

            <div>
              <p className="text-xs font-medium mb-2.5" style={{ color: "#475569" }}>Próximas acciones</p>
              <ul className="space-y-2">
                {acciones.map((accion, i) => {
                  const key = `${nombre}-${i}`;
                  const done = checked[key];
                  return (
                    <li
                      key={i}
                      className="flex items-center gap-2.5 cursor-pointer select-none"
                      onClick={() => toggle(key)}
                    >
                      <span
                        className="flex-shrink-0 w-4 h-4 rounded flex items-center justify-center transition-all"
                        style={{
                          background: done ? color : "transparent",
                          border: `1px solid ${done ? color : "#1a1a2e"}`,
                        }}
                      >
                        {done && (
                          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                            <path
                              d="M1 4L3.5 6.5L9 1"
                              stroke="#0a0a0f"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        )}
                      </span>
                      <span
                        className="text-sm transition-all"
                        style={{
                          color: done ? "#475569" : "#94a3b8",
                          textDecoration: done ? "line-through" : "none",
                        }}
                      >
                        {accion}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
