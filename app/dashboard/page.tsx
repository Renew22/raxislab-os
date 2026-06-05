import WeeklyCalendar from "./weekly-calendar";

const stats = [
  { label: "MRR", value: "1.100€", color: "#10b981", bg: "rgba(16,185,129,0.08)", border: "rgba(16,185,129,0.2)" },
  { label: "P&L hoy", value: "+127€", color: "#3b82f6", bg: "rgba(59,130,246,0.08)", border: "rgba(59,130,246,0.2)" },
  { label: "Leads calientes", value: "3", color: "#f59e0b", bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.2)" },
  { label: "Tareas urgentes", value: "4", color: "#ef4444", bg: "rgba(239,68,68,0.08)", border: "rgba(239,68,68,0.2)" },
];

const agenda = [
  { time: "07:00", task: "Gym" },
  { time: "09:00", task: "Deep Work n8n" },
  { time: "12:00", task: "Revisar Identity" },
  { time: "15:00", task: "Grabar video" },
  { time: "18:30", task: "Review trading" },
];

const alertas = [
  { text: "Identity nueva reseña sin responder", color: "#f59e0b" },
  { text: "Desancho CPL subió 40%", color: "#ef4444" },
  { text: "IBKR SHLS +3.2%", color: "#10b981" },
];

export default function DashboardPage() {
  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-semibold" style={{ color: "#e2e8f0" }}>Dashboard</h1>

      <div className="grid grid-cols-4 gap-4">
        {stats.map(({ label, value, color, bg, border }) => (
          <div key={label} className="rounded-xl p-5" style={{ background: bg, border: `1px solid ${border}` }}>
            <p className="text-xs uppercase tracking-wider mb-2" style={{ color: "#475569" }}>{label}</p>
            <p className="text-3xl font-bold" style={{ color }}>{value}</p>
          </div>
        ))}
      </div>

      <WeeklyCalendar />

      <div className="grid grid-cols-2 gap-6">
        <div className="rounded-xl p-6" style={{ background: "#111120", border: "1px solid #1a1a2e" }}>
          <h2 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: "#475569" }}>
            Agenda hoy
          </h2>
          <ul className="space-y-3">
            {agenda.map(({ time, task }) => (
              <li key={time} className="flex items-center gap-4">
                <span className="text-xs font-mono w-12 flex-shrink-0" style={{ color: "#475569" }}>{time}</span>
                <span className="text-sm" style={{ color: "#cbd5e1" }}>{task}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl p-6" style={{ background: "#111120", border: "1px solid #1a1a2e" }}>
          <h2 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: "#475569" }}>
            Alertas
          </h2>
          <ul className="space-y-3">
            {alertas.map(({ text, color }) => (
              <li key={text} className="flex items-start gap-3">
                <span className="mt-1.5 h-2 w-2 rounded-full flex-shrink-0" style={{ background: color }} />
                <span className="text-sm" style={{ color }}>{text}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
