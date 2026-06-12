"use client";

import { useState } from "react";

const PROJECTS = [
  {
    nombre: "OpsIQ SaaS",
    progreso: 25,
    estado: "EN DESARROLLO",
    color: "var(--accent)",
    bg: "var(--accent-dim)",
    proximo: "cliente piloto taller",
    acciones: ["Definir MVP features", "Montar landing page", "Captar cliente piloto taller"],
  },
  {
    nombre: "Curso Jorge",
    progreso: 5,
    estado: "PLANIFICANDO",
    color: "var(--amber)",
    bg: "var(--accent-dim)",
    proximo: "reunión con Jorge",
    acciones: ["Reunión con Jorge", "Definir temario", "Crear estructura módulos"],
  },
  {
    nombre: "Blog EN AdSense",
    progreso: 0,
    estado: "ARRANCAR",
    color: "var(--red)",
    bg: "var(--accent-dim)",
    proximo: "registrar dominio",
    acciones: ["Registrar dominio", "Instalar WordPress", "Publicar primer artículo"],
  },
  {
    nombre: "YouTube Auto",
    progreso: 0,
    estado: "PLANIFICANDO",
    color: "var(--amber)",
    bg: "var(--accent-dim)",
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
    <div style={{ padding: "32px 40px" }}>
      <h1 style={{ fontSize: "24px", fontWeight: 600, color: "var(--text)", marginBottom: "24px" }}>Proyectos</h1>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
        {PROJECTS.map(({ nombre, progreso, estado, color, proximo, acciones }) => (
          <div
            key={nombre}
            style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "12px", padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "8px" }}>
              <h3 style={{ fontSize: "15px", fontWeight: 600, color: "var(--text)" }}>{nombre}</h3>
              <span
                style={{ flexShrink: 0, fontSize: "11px", fontWeight: 600, padding: "3px 8px", borderRadius: "999px", color, background: "var(--accent-dim)", border: `1px solid var(--border-accent)` }}
              >
                {estado}
              </span>
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Progreso</span>
                <span style={{ fontSize: "12px", fontFamily: "'Space Mono', monospace", fontWeight: 500, color }}>{progreso}%</span>
              </div>
              <div style={{ height: "6px", borderRadius: "999px", overflow: "hidden", background: "var(--border)" }}>
                <div style={{ width: `${progreso}%`, height: "100%", borderRadius: "999px", background: color }} />
              </div>
            </div>

            <div>
              <p style={{ fontSize: "12px", marginBottom: "2px", color: "var(--text-muted)" }}>Próximo paso</p>
              <p style={{ fontSize: "12px", fontWeight: 500, color: "var(--text-mid)" }}>{proximo}</p>
            </div>

            <div>
              <p style={{ fontSize: "12px", fontWeight: 500, marginBottom: "10px", color: "var(--text-muted)" }}>Próximas acciones</p>
              <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "8px" }}>
                {acciones.map((accion, i) => {
                  const key = `${nombre}-${i}`;
                  const done = checked[key];
                  return (
                    <li
                      key={i}
                      style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", userSelect: "none" }}
                      onClick={() => toggle(key)}
                    >
                      <span
                        style={{
                          flexShrink: 0,
                          width: "16px",
                          height: "16px",
                          borderRadius: "4px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          background: done ? color : "transparent",
                          border: `1px solid ${done ? color : "var(--border)"}`,
                          transition: "all 0.15s",
                        }}
                      >
                        {done && (
                          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                            <path d="M1 4L3.5 6.5L9 1" stroke="var(--bg)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </span>
                      <span style={{ fontSize: "13px", color: done ? "var(--text-muted)" : "var(--text-mid)", textDecoration: done ? "line-through" : "none", transition: "all 0.15s" }}>
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
