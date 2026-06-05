"use client";

import { useState } from "react";

type Category = "personal" | "agencia" | "trading" | "proyectos";

const CAT: Record<Category, { bg: string; color: string; label: string }> = {
  personal: { bg: "rgba(239,68,68,0.15)", color: "#f87171", label: "personal" },
  agencia: { bg: "rgba(99,102,241,0.15)", color: "#a5b4fc", label: "agencia" },
  trading: { bg: "rgba(59,130,246,0.15)", color: "#60a5fa", label: "trading" },
  proyectos: { bg: "rgba(16,185,129,0.15)", color: "#34d399", label: "proyectos" },
};

const DAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

const TASKS: { day: number; time: string; label: string; cat: Category }[] = [
  { day: 0, time: "07:00", label: "Gym", cat: "personal" },
  { day: 0, time: "09:00", label: "Montar Flow n8n reportes", cat: "agencia" },
  { day: 1, time: "07:00", label: "Gym", cat: "personal" },
  { day: 1, time: "09:00", label: "Flow GBP automático", cat: "agencia" },
  { day: 2, time: "07:00", label: "Gym", cat: "personal" },
  { day: 2, time: "15:00", label: "Grabar video #1", cat: "proyectos" },
  { day: 3, time: "07:00", label: "Gym", cat: "personal" },
  { day: 3, time: "09:00", label: "Flow Blog EN", cat: "agencia" },
  { day: 4, time: "07:00", label: "Gym", cat: "personal" },
  { day: 4, time: "18:00", label: "Review trading semanal", cat: "trading" },
];

export default function WeeklyCalendar() {
  const [expanded, setExpanded] = useState<number | null>(null);

  return (
    <div className="rounded-xl p-6" style={{ background: "#111120", border: "1px solid #1a1a2e" }}>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#475569" }}>
          Semana actual
        </h2>
        <div className="flex gap-4">
          {(Object.entries(CAT) as [Category, (typeof CAT)[Category]][]).map(([, s]) => (
            <div key={s.label} className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.color }} />
              <span className="text-xs capitalize" style={{ color: "#475569" }}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {DAYS.map((day, idx) => {
          const dayTasks = TASKS.filter((t) => t.day === idx);
          const isOpen = expanded === idx;
          return (
            <div key={day} className="flex flex-col gap-2">
              <button
                onClick={() => setExpanded(isOpen ? null : idx)}
                className="w-full rounded-lg py-2.5 px-1 transition-all"
                style={{
                  background: isOpen ? "rgba(99,102,241,0.12)" : "rgba(255,255,255,0.02)",
                  border: `1px solid ${isOpen ? "rgba(99,102,241,0.3)" : "#1a1a2e"}`,
                }}
              >
                <p
                  className="text-xs font-medium text-center"
                  style={{ color: isOpen ? "#818cf8" : "#475569" }}
                >
                  {day}
                </p>
                <div className="flex justify-center gap-0.5 mt-2 flex-wrap min-h-[10px]">
                  {dayTasks.map((t, i) => (
                    <span
                      key={i}
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ background: CAT[t.cat].color }}
                    />
                  ))}
                </div>
              </button>

              {isOpen && (
                <div className="flex flex-col gap-1.5">
                  {dayTasks.length === 0 ? (
                    <p className="text-xs text-center py-3" style={{ color: "#1e293b" }}>libre</p>
                  ) : (
                    dayTasks.map((t, i) => (
                      <div
                        key={i}
                        className="rounded-md px-2 py-2"
                        style={{ background: CAT[t.cat].bg }}
                      >
                        <p className="text-xs font-mono" style={{ color: "#475569" }}>{t.time}</p>
                        <p className="text-xs leading-tight mt-0.5" style={{ color: CAT[t.cat].color }}>
                          {t.label}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
