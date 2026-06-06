"use client";
import { useState } from "react";

type Cliente = {
  nombre: string;
  precio: string;
  estado: string;
  color: string;
  bg: string;
  sector: string;
  fechaInicio: string;
  servicios: string[];
};

const clientes: Cliente[] = [
  {
    nombre: "Identity Peluqueros", precio: "550€", estado: "ACTIVO", color: "#10b981", bg: "rgba(16,185,129,0.1)",
    sector: "Peluquería", fechaInicio: "Ene 2025", servicios: ["Meta Ads", "Google Ads", "Google Business"],
  },
  {
    nombre: "Desancho Estilistas", precio: "550€", estado: "ACTIVO", color: "#10b981", bg: "rgba(16,185,129,0.1)",
    sector: "Peluquería", fechaInicio: "Mar 2025", servicios: ["Meta Ads", "Google Business"],
  },
  {
    nombre: "Last Mile Distribution", precio: "TBD", estado: "EN CURSO", color: "#f59e0b", bg: "rgba(245,158,11,0.1)",
    sector: "Logística", fechaInicio: "Jun 2025", servicios: ["Propuesta en preparación"],
  },
  {
    nombre: "Malvarrosa CF", precio: "300€", estado: "ACTIVO", color: "#10b981", bg: "rgba(16,185,129,0.1)",
    sector: "Deporte", fechaInicio: "Feb 2025", servicios: ["Meta Ads", "Contenido redes"],
  },
  {
    nombre: "Matías Benegas Tattoo", precio: "300€", estado: "ACTIVO", color: "#10b981", bg: "rgba(16,185,129,0.1)",
    sector: "Estudio Tattoo", fechaInicio: "Abr 2025", servicios: ["Meta Ads", "Google Business", "Contenido"],
  },
];

const METRICAS: Record<string, { cpl: string; roas: string; inversion: string; leads: string }> = {
  "Identity Peluqueros":   { cpl: "4.80€", roas: "5.2x", inversion: "220€/sem", leads: "46/mes" },
  "Desancho Estilistas":   { cpl: "5.40€", roas: "4.8x", inversion: "180€/sem", leads: "33/mes" },
  "Last Mile Distribution":{ cpl: "—",     roas: "—",    inversion: "—",         leads: "—" },
  "Malvarrosa CF":         { cpl: "2.10€", roas: "3.1x", inversion: "90€/sem",   leads: "22/mes" },
  "Matías Benegas Tattoo": { cpl: "3.60€", roas: "4.2x", inversion: "110€/sem",  leads: "28/mes" },
};

const TAREAS_BASE: Record<string, { texto: string; done: boolean }[]> = {
  "Identity Peluqueros":   [{ texto: "Revisar creatividades junio", done: false }, { texto: "Enviar reporte semanal", done: true }, { texto: "Reunión mensual programada", done: false }],
  "Desancho Estilistas":   [{ texto: "Actualizar fotos de perfil GMB", done: false }, { texto: "Responder reseñas pendientes", done: false }, { texto: "Enviar reporte semanal", done: true }],
  "Last Mile Distribution":[{ texto: "Enviar propuesta formal", done: false }, { texto: "Reunión de briefing", done: false }],
  "Malvarrosa CF":         [{ texto: "Crear creatividades torneo verano", done: false }, { texto: "Enviar reporte semanal", done: true }],
  "Matías Benegas Tattoo": [{ texto: "Crear post de portfolio", done: false }, { texto: "Optimizar campaña booking", done: false }, { texto: "Enviar reporte semanal", done: true }],
};

const DOCUMENTOS: Record<string, { nombre: string }[]> = {
  "Identity Peluqueros":   [{ nombre: "Contrato firmado" }, { nombre: "Propuesta inicial" }, { nombre: "Brief servicio" }],
  "Desancho Estilistas":   [{ nombre: "Contrato firmado" }, { nombre: "Propuesta inicial" }],
  "Last Mile Distribution":[{ nombre: "Propuesta borrador" }],
  "Malvarrosa CF":         [{ nombre: "Contrato firmado" }, { nombre: "Brief servicio" }],
  "Matías Benegas Tattoo": [{ nombre: "Contrato firmado" }, { nombre: "Propuesta inicial" }, { nombre: "Brief contenido" }],
};

const HISTORIAL: Record<string, { fecha: string; tipo: string; nota: string }[]> = {
  "Identity Peluqueros":   [{ fecha: "2026-06-01", tipo: "Reunión", nota: "Revisión resultados mayo. Cliente satisfecho, renova." }, { fecha: "2026-05-15", tipo: "Email", nota: "Envío reporte mensual con métricas." }, { fecha: "2026-05-01", tipo: "Call", nota: "Briefing creatividades mayo." }],
  "Desancho Estilistas":   [{ fecha: "2026-05-28", tipo: "Email", nota: "Reporte mensual enviado." }, { fecha: "2026-05-10", tipo: "Call", nota: "Feedback sobre nuevas creatividades." }],
  "Last Mile Distribution":[{ fecha: "2026-06-03", tipo: "Reunión", nota: "Primera reunión de descubrimiento. Muy interesados." }],
  "Malvarrosa CF":         [{ fecha: "2026-06-02", tipo: "Email", nota: "Campaña torneo de verano iniciada." }, { fecha: "2026-05-20", tipo: "Call", nota: "Revisión campaña mensual." }],
  "Matías Benegas Tattoo": [{ fecha: "2026-05-30", tipo: "WhatsApp", nota: "Solicitud contenido adicional para campaña booking." }, { fecha: "2026-05-15", tipo: "Email", nota: "Reporte mensual enviado." }],
};

const FICHA_TABS = ["Resumen", "Métricas", "Tareas", "Documentos", "Historial"] as const;
type FichaTab = (typeof FICHA_TABS)[number];

export default function ClientesPage() {
  const [selected, setSelected] = useState<Cliente | null>(null);
  const [fichaTab, setFichaTab] = useState<FichaTab>("Resumen");
  const [tareas, setTareas] = useState(TAREAS_BASE);

  function toggleTarea(cliente: string, idx: number) {
    setTareas((prev) => ({
      ...prev,
      [cliente]: prev[cliente].map((t, i) => (i === idx ? { ...t, done: !t.done } : t)),
    }));
  }

  function abrirFicha(c: Cliente) {
    setSelected(c);
    setFichaTab("Resumen");
  }

  if (selected) {
    const metricas = METRICAS[selected.nombre];
    const docs = DOCUMENTOS[selected.nombre] ?? [];
    const historial = HISTORIAL[selected.nombre] ?? [];
    const tareasCliente = tareas[selected.nombre] ?? [];

    return (
      <div className="p-8 space-y-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSelected(null)}
            className="text-sm px-3 py-1.5 rounded-lg transition-opacity hover:opacity-80"
            style={{ background: "rgba(255,255,255,0.04)", color: "#475569", border: "1px solid #1a1a2e" }}
          >
            ← Volver
          </button>
          <h1 className="text-2xl font-semibold" style={{ color: "#e2e8f0" }}>{selected.nombre}</h1>
          <span
            className="text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{ color: selected.color, background: selected.bg, border: `1px solid ${selected.color}33` }}
          >
            {selected.estado}
          </span>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 p-1 rounded-lg" style={{ background: "#111120", border: "1px solid #1a1a2e", width: "fit-content" }}>
          {FICHA_TABS.map((t) => (
            <button
              key={t}
              onClick={() => setFichaTab(t)}
              className="px-4 py-2 rounded-md text-sm font-medium transition-all"
              style={{ background: fichaTab === t ? "#6366f1" : "transparent", color: fichaTab === t ? "#fff" : "#475569" }}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Resumen */}
        {fichaTab === "Resumen" && (
          <div className="rounded-xl p-6" style={{ background: "#111120", border: "1px solid #1a1a2e" }}>
            <div className="grid grid-cols-2 gap-6">
              {[
                { label: "Sector", value: selected.sector },
                { label: "Precio mensual", value: selected.precio },
                { label: "Fecha inicio", value: selected.fechaInicio },
                { label: "Servicios activos", value: selected.servicios.join(", ") },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-xs font-medium uppercase tracking-wider mb-1" style={{ color: "#475569" }}>{label}</p>
                  <p className="text-sm" style={{ color: "#e2e8f0" }}>{value}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Métricas */}
        {fichaTab === "Métricas" && (
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "CPL",               value: metricas.cpl },
              { label: "ROAS",              value: metricas.roas },
              { label: "Inversión semanal", value: metricas.inversion },
              { label: "Leads generados",   value: metricas.leads },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-xl p-5" style={{ background: "#111120", border: "1px solid #1a1a2e" }}>
                <p className="text-xs font-medium uppercase tracking-wider mb-2" style={{ color: "#475569" }}>{label}</p>
                <p className="text-2xl font-bold" style={{ color: "#e2e8f0" }}>{value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Tareas */}
        {fichaTab === "Tareas" && (
          <div className="rounded-xl p-6" style={{ background: "#111120", border: "1px solid #1a1a2e" }}>
            <h2 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: "#475569" }}>Tareas pendientes</h2>
            <div className="flex flex-col gap-3">
              {tareasCliente.map((t, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 cursor-pointer"
                  onClick={() => toggleTarea(selected.nombre, i)}
                >
                  <span
                    className="w-4 h-4 rounded flex-shrink-0 flex items-center justify-center"
                    style={{ border: `2px solid ${t.done ? "#10b981" : "#475569"}`, background: t.done ? "#10b981" : "transparent" }}
                  >
                    {t.done && <span style={{ color: "#000", fontSize: "10px" }}>✓</span>}
                  </span>
                  <span
                    className="text-sm"
                    style={{ color: t.done ? "#475569" : "#e2e8f0", textDecoration: t.done ? "line-through" : "none" }}
                  >
                    {t.texto}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Documentos */}
        {fichaTab === "Documentos" && (
          <div className="rounded-xl p-6" style={{ background: "#111120", border: "1px solid #1a1a2e" }}>
            <h2 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: "#475569" }}>Documentos</h2>
            <div className="flex flex-col gap-3">
              {docs.map(({ nombre }) => (
                <div
                  key={nombre}
                  className="flex items-center gap-3 p-3 rounded-lg"
                  style={{ background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.15)" }}
                >
                  <span style={{ color: "#818cf8" }}>📄</span>
                  <span className="text-sm" style={{ color: "#e2e8f0" }}>{nombre}</span>
                  <span className="ml-auto text-xs" style={{ color: "#334155" }}>Google Drive</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Historial */}
        {fichaTab === "Historial" && (
          <div className="rounded-xl p-6" style={{ background: "#111120", border: "1px solid #1a1a2e" }}>
            <h2 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: "#475569" }}>Historial de notas y reuniones</h2>
            <div className="flex flex-col gap-4">
              {historial.map(({ fecha, tipo, nota }, i) => (
                <div key={i} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5" style={{ background: "#6366f1" }} />
                    {i < historial.length - 1 && <div className="w-0.5 flex-1 mt-1" style={{ background: "#1a1a2e" }} />}
                  </div>
                  <div className="pb-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded" style={{ background: "rgba(99,102,241,0.1)", color: "#818cf8" }}>{tipo}</span>
                      <span className="text-xs font-mono" style={{ color: "#475569" }}>{fecha}</span>
                    </div>
                    <p className="text-sm" style={{ color: "#94a3b8" }}>{nota}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-semibold" style={{ color: "#e2e8f0" }}>Clientes</h1>
      <div className="grid grid-cols-3 gap-4">
        {clientes.map((c) => (
          <div
            key={c.nombre}
            onClick={() => abrirFicha(c)}
            className="rounded-xl p-6 flex flex-col gap-4 cursor-pointer transition-all"
            style={{ background: "#111120", border: "1px solid #1a1a2e" }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(99,102,241,0.3)")}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#1a1a2e")}
          >
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-sm font-medium leading-snug" style={{ color: "#e2e8f0" }}>{c.nombre}</h3>
              <span
                className="flex-shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{ color: c.color, background: c.bg, border: `1px solid ${c.color}33` }}
              >
                {c.estado}
              </span>
            </div>
            <div className="flex items-end justify-between">
              <p className="text-2xl font-bold" style={{ color: "#e2e8f0" }}>{c.precio}</p>
              <span className="text-xs" style={{ color: "#475569" }}>{c.sector}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
