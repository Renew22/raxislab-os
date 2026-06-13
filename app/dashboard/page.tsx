"use client";

import { useState, useEffect } from "react";
import SparkLine from "../components/spark-line";
import AgendaDnD from "../components/agenda-dnd";

const SPARK = {
  mrr:    [820, 880, 900, 940, 970, 1050, 1100],
  pnl:    [42,  78, -18, 115,  62,   88,  127],
  leads:  [1,   1,   2,   2,   3,    3,    3],
  tareas: [2,   3,   4,   5,   5,    4,    4],
};

const DIAS  = ["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"];
const MESES = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];

const agenda = [
  { time: "07:00", label: "Gym" },
  { time: "09:00", label: "Deep Work" },
  { time: "12:00", label: "Clientes" },
  { time: "15:00", label: "Contenido" },
  { time: "17:00", label: "Proyecto" },
  { time: "18:30", label: "Trading" },
  { time: "19:00", label: "Cierre día" },
];

const alertas = [
  { text: "Identity Peluqueros — reseña sin responder", color: "var(--amber)" },
  { text: "Desancho Estilistas — CPL subió 40%",        color: "var(--red)" },
  { text: "IBKR SHLS +3.2% — cerca de objetivo",        color: "var(--green)" },
  { text: "Flow 04 Briefing — ejecutado hoy 08:45",     color: "var(--accent)" },
];

const CARD = { background: "var(--card)", border: "1px solid var(--border)", borderRadius: "6px", padding: "20px" } as React.CSSProperties;
const LABEL = { fontSize: "11px", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: "var(--text-muted)", marginBottom: "8px" };
const NUM   = { fontFamily: "'Space Mono', monospace", fontWeight: 700, fontSize: "28px", lineHeight: 1, marginBottom: "8px" };

export default function DashboardPage() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const h = now.getHours();
  const greeting = h < 12 ? "Buenos días" : h < 19 ? "Buenas tardes" : "Buenas noches";
  const timeStr = now.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const dateStr = `${DIAS[now.getDay()]}, ${now.getDate()} de ${MESES[now.getMonth()]} de ${now.getFullYear()}`;

  return (
    <div style={{ padding: "32px 40px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "32px" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: 600, color: "var(--text)", marginBottom: "4px" }}>{greeting}, Rene</h1>
          <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>{dateStr}</p>
        </div>
        <span style={{ fontFamily: "'Space Mono', monospace", fontSize: "22px", fontWeight: 700, color: "var(--accent)", letterSpacing: "0.05em" }}>
          {timeStr}
        </span>
      </div>

      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "12px", marginBottom: "24px" }}>
        {/* MRR */}
        <div style={CARD}>
          <p style={LABEL}>MRR</p>
          <p style={{ ...NUM, color: "var(--green)" }}>1.100€</p>
          <p style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "8px" }}>meta 5.000€/mes</p>
          <SparkLine data={SPARK.mrr} id="mrr" />
          <div style={{ background: "var(--border)", borderRadius: "3px", height: "3px", marginTop: "8px" }}>
            <div style={{ width: "22%", height: "100%", background: "var(--green)", borderRadius: "3px" }} />
          </div>
          <p style={{ fontSize: "11px", color: "var(--green)", marginTop: "4px", fontFamily: "'Space Mono', monospace" }}>22%</p>
        </div>

        {/* P&L HOY */}
        <div style={CARD}>
          <p style={LABEL}>P&L Hoy</p>
          <p style={{ ...NUM, color: "var(--accent)" }}>+127€</p>
          <p style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "8px" }}>Cartera: 12.822€</p>
          <SparkLine data={SPARK.pnl} id="pnl" />
        </div>

        {/* LEADS */}
        <div style={CARD}>
          <p style={LABEL}>Leads Activos</p>
          <p style={{ ...NUM, color: "var(--amber)" }}>3</p>
          <p style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "8px" }}>Taller García · Rent-a-Car Sol</p>
          <SparkLine data={SPARK.leads} id="leads" />
        </div>

        {/* TAREAS */}
        <div style={CARD}>
          <p style={LABEL}>Tareas Urgentes</p>
          <p style={{ ...NUM, color: "var(--red)" }}>4</p>
          <p style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "8px" }}>Identity · Desancho · Video · n8n</p>
          <SparkLine data={SPARK.tareas} id="tareas" />
        </div>
      </div>

      {/* Agenda del día — drag & drop */}
      <div style={{ ...CARD, marginBottom: "24px" }}>
        <p style={{ ...LABEL, marginBottom: "16px" }}>Agenda del día</p>
        <AgendaDnD />
      </div>

      {/* Agenda + Alertas */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
        <div style={CARD}>
          <p style={LABEL}>Agenda hoy</p>
          <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "12px" }}>
            {agenda.map(({ time, label }) => {
              const blockH = parseInt(time.split(":")[0]);
              const isPast    = h > blockH + 1;
              const isCurrent = h === blockH || h === blockH + 1;
              return (
                <li key={time} style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                  <span style={{ fontFamily: "'Space Mono', monospace", fontSize: "12px", width: "44px", flexShrink: 0, color: isPast ? "var(--text-muted)" : isCurrent ? "var(--accent)" : "var(--text-muted)", opacity: isPast ? 0.4 : 1 }}>{time}</span>
                  <span style={{ width: "5px", height: "5px", borderRadius: "50%", flexShrink: 0, background: isPast ? "var(--border)" : isCurrent ? "var(--accent)" : "var(--border)" }} />
                  <span style={{ fontSize: "13px", color: isPast ? "var(--text-muted)" : isCurrent ? "var(--text)" : "var(--text-mid)", opacity: isPast ? 0.4 : 1 }}>{label}</span>
                </li>
              );
            })}
          </ul>
        </div>

        <div style={CARD}>
          <p style={LABEL}>Alertas</p>
          <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "12px" }}>
            {alertas.map(({ text, color }) => (
              <li key={text} style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: color, flexShrink: 0, marginTop: "5px" }} />
                <span style={{ fontSize: "13px", color: "var(--text-mid)" }}>{text}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
