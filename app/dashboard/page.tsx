"use client";

import { useState, useEffect } from "react";

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
  { text: "Identity Peluqueros — reseña sin responder", color: "#FFB800" },
  { text: "Desancho Estilistas — CPL subió 40%",        color: "#FF3D71" },
  { text: "IBKR SHLS +3.2% — cerca de objetivo",        color: "#00E676" },
  { text: "Flow 04 Briefing — ejecutado hoy 08:45",     color: "#00C8FF" },
];

const CARD = { background: "#111111", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "6px", padding: "20px" } as React.CSSProperties;
const LABEL = { fontSize: "11px", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: "#5A6470", marginBottom: "8px" };
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
          <h1 style={{ fontSize: "24px", fontWeight: 600, color: "#FFFFFF", marginBottom: "4px" }}>{greeting}, Rene</h1>
          <p style={{ fontSize: "13px", color: "#5A6470" }}>{dateStr}</p>
        </div>
        <span style={{ fontFamily: "'Space Mono', monospace", fontSize: "22px", fontWeight: 700, color: "#00C8FF", letterSpacing: "0.05em" }}>
          {timeStr}
        </span>
      </div>

      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "12px", marginBottom: "24px" }}>
        {/* MRR */}
        <div style={CARD}>
          <p style={LABEL}>MRR</p>
          <p style={{ ...NUM, color: "#00E676" }}>1.100€</p>
          <p style={{ fontSize: "12px", color: "#5A6470", marginBottom: "12px" }}>meta 5.000€/mes</p>
          <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: "3px", height: "3px" }}>
            <div style={{ width: "22%", height: "100%", background: "#00E676", borderRadius: "3px" }} />
          </div>
          <p style={{ fontSize: "11px", color: "#00E676", marginTop: "4px", fontFamily: "'Space Mono', monospace" }}>22%</p>
        </div>

        {/* P&L HOY */}
        <div style={CARD}>
          <p style={LABEL}>P&L Hoy</p>
          <p style={{ ...NUM, color: "#00C8FF" }}>+127€</p>
          <p style={{ fontSize: "12px", color: "#5A6470" }}>Cartera: 12.822€</p>
        </div>

        {/* LEADS */}
        <div style={CARD}>
          <p style={LABEL}>Leads Activos</p>
          <p style={{ ...NUM, color: "#FFB800" }}>3</p>
          <p style={{ fontSize: "12px", color: "#5A6470" }}>Taller García · Rent-a-Car Sol</p>
        </div>

        {/* TAREAS */}
        <div style={CARD}>
          <p style={LABEL}>Tareas Urgentes</p>
          <p style={{ ...NUM, color: "#FF3D71" }}>4</p>
          <p style={{ fontSize: "12px", color: "#5A6470" }}>Identity · Desancho · Video · n8n</p>
        </div>
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
                  <span style={{ fontFamily: "'Space Mono', monospace", fontSize: "12px", width: "44px", flexShrink: 0, color: isPast ? "#2A3040" : isCurrent ? "#00C8FF" : "#5A6470" }}>{time}</span>
                  <span style={{ width: "5px", height: "5px", borderRadius: "50%", flexShrink: 0, background: isPast ? "#1a2030" : isCurrent ? "#00C8FF" : "#2A3040" }} />
                  <span style={{ fontSize: "13px", color: isPast ? "#2A3040" : isCurrent ? "#FFFFFF" : "#9AA3AD" }}>{label}</span>
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
                <span style={{ fontSize: "13px", color: "#9AA3AD" }}>{text}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
