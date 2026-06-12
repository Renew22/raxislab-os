"use client";

import { useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { Pencil, Plus, X, Check } from "lucide-react";
import SparkLine from "../components/spark-line";
import { useTheme } from "../components/theme-provider";

// ─── DATA ────────────────────────────────────────────────────────────────────

const BAR_DATA = [
  { mes: "Feb", Ingresos: 2400, Gastos: 1080 },
  { mes: "Mar", Ingresos: 2700, Gastos: 1130 },
  { mes: "Abr", Ingresos: 2800, Gastos: 1100 },
  { mes: "May", Ingresos: 3000, Gastos: 1130 },
];

const SPARK = {
  ingresos: [2200, 2400, 2500, 2700, 2750, 2900, 3000],
  gastos:   [1050, 1080, 1100, 1130, 1110, 1120, 1130],
  margen:   [1150, 1320, 1400, 1570, 1640, 1780, 1870],
  cobro:    [30,   25,   20,   14,   10,   7,    5   ],
};

type Estado = "activo" | "cancelar";
type GastoFijo = {
  id: number; servicio: string; importe: number;
  dia: number; categoria: string; estado: Estado;
};

const GASTOS_INITIAL: GastoFijo[] = [
  { id:1,  servicio:"Alquiler",             importe:650,    dia:1,  categoria:"Vivienda",        estado:"activo"  },
  { id:2,  servicio:"Coche",                importe:165,    dia:1,  categoria:"Transporte",      estado:"activo"  },
  { id:3,  servicio:"Pepephone",            importe:15,     dia:4,  categoria:"Telecom",         estado:"activo"  },
  { id:4,  servicio:"AXA Seguro mensual",   importe:27.46,  dia:5,  categoria:"Seguros",         estado:"activo"  },
  { id:5,  servicio:"Digi",                 importe:10,     dia:28, categoria:"Telecom",         estado:"activo"  },
  { id:6,  servicio:"Renting Tec",          importe:22.99,  dia:25, categoria:"Tecnología",      estado:"activo"  },
  { id:7,  servicio:"Canva Pro",            importe:12,     dia:22, categoria:"Herramientas",    estado:"activo"  },
  { id:8,  servicio:"Genspark",             importe:25,     dia:1,  categoria:"Herramientas IA", estado:"activo"  },
  { id:9,  servicio:"Apple servicios",      importe:15,     dia:5,  categoria:"Suscripciones",   estado:"activo"  },
  { id:10, servicio:"Cloudflare",           importe:3.5,    dia:17, categoria:"Tecnología",      estado:"activo"  },
  { id:11, servicio:"Windsor.ai",           importe:20,     dia:30, categoria:"Agencia",         estado:"cancelar"},
  { id:12, servicio:"AXA Hogar trimestral", importe:138.38, dia:5,  categoria:"Seguros",         estado:"activo"  },
];

// ─── STYLES ───────────────────────────────────────────────────────────────────

const CARD  = { background:"var(--card)", border:"1px solid var(--border)", borderRadius:"6px", padding:"20px" } as React.CSSProperties;
const LABEL = { fontSize:"11px", fontWeight:600, letterSpacing:"0.08em", textTransform:"uppercase" as const, color:"var(--text-muted)", marginBottom:"8px" };
const NUM   = { fontFamily:"'Space Mono', monospace", fontWeight:700, fontSize:"26px", lineHeight:1, marginBottom:"6px" } as React.CSSProperties;
const TH    = { padding:"10px 14px", textAlign:"left" as const, fontSize:"11px", fontWeight:600, letterSpacing:"0.06em", color:"var(--text-muted)", borderBottom:"1px solid var(--border)" };
const TD    = { padding:"11px 14px", borderBottom:"1px solid var(--border)", fontSize:"13px" };
const INPUT_S: React.CSSProperties = { padding:"8px 10px", borderRadius:"4px", border:"1px solid var(--border)", background:"var(--card-hover)", color:"var(--text)", fontSize:"13px", outline:"none", width:"100%", boxSizing:"border-box" };

type Tab = "Resumen" | "GastosFijos";

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function nextCobro(gastos: GastoFijo[]) {
  const today = new Date();
  const d = today.getDate();
  const withDays = gastos
    .filter(g => g.estado !== "cancelar")
    .map(g => ({ ...g, daysLeft: g.dia >= d ? g.dia - d : 30 - d + g.dia }))
    .sort((a, b) => a.daysLeft - b.daysLeft);
  return withDays[0] ?? null;
}

// ─── COMPONENT ────────────────────────────────────────────────────────────────

export default function FinanzasPage() {
  const [tab, setTab]       = useState<Tab>("Resumen");
  const [gastos, setGastos] = useState<GastoFijo[]>(GASTOS_INITIAL);
  const [editId, setEditId] = useState<number | null>(null);
  const [editForm, setEditForm]   = useState({ importe:"", dia:"" });
  const [showAdd, setShowAdd]     = useState(false);
  const [addForm, setAddForm]     = useState({ servicio:"", importe:"", dia:"", categoria:"", estado:"activo" as Estado });
  const { theme } = useTheme();

  const accentColor = theme === "dark" ? "#00C8FF" : "#0066FF";
  const greenColor  = theme === "dark" ? "#00E676" : "#00A152";
  const redColor    = theme === "dark" ? "#FF3D71" : "#E5394B";

  const total = gastos.reduce((s, g) => s + g.importe, 0);
  const next  = nextCobro(gastos);

  function openEdit(g: GastoFijo) {
    setEditId(g.id);
    setEditForm({ importe: String(g.importe), dia: String(g.dia) });
  }

  function saveEdit() {
    setGastos(prev => prev.map(g =>
      g.id === editId
        ? { ...g, importe: parseFloat(editForm.importe) || g.importe, dia: parseInt(editForm.dia) || g.dia }
        : g
    ));
    setEditId(null);
  }

  function addGasto() {
    if (!addForm.servicio || !addForm.importe) return;
    const newId = Math.max(...gastos.map(g => g.id)) + 1;
    setGastos(prev => [...prev, {
      id: newId,
      servicio: addForm.servicio,
      importe: parseFloat(addForm.importe) || 0,
      dia: parseInt(addForm.dia) || 1,
      categoria: addForm.categoria || "Otros",
      estado: addForm.estado,
    }]);
    setAddForm({ servicio:"", importe:"", dia:"", categoria:"", estado:"activo" });
    setShowAdd(false);
  }

  const tooltipStyle: React.CSSProperties = {
    background: "var(--card)",
    border: "1px solid var(--border)",
    borderRadius: "6px",
    color: "var(--text)",
    fontSize: "12px",
  };

  return (
    <div style={{ padding:"32px 40px" }}>
      <h1 style={{ fontSize:"24px", fontWeight:600, color:"var(--text)", marginBottom:"24px" }}>Finanzas</h1>

      {/* ── Tab bar ── */}
      <div style={{ display:"inline-flex", gap:"4px", padding:"4px", background:"var(--surface)", border:"1px solid var(--border)", borderRadius:"8px", marginBottom:"24px" }}>
        {([["Resumen","Resumen mensual"],["GastosFijos","Gastos fijos"]] as [Tab,string][]).map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)} style={{ padding:"7px 18px", borderRadius:"5px", border:"none", cursor:"pointer", fontSize:"13px", fontWeight: tab===key ? 600 : 400, background: tab===key ? "var(--accent-dim)" : "transparent", color: tab===key ? "var(--accent)" : "var(--text-muted)", outline: tab===key ? "1px solid var(--border-accent)" : "none" }}>
            {label}
          </button>
        ))}
      </div>

      {/* ════════ TAB 1: RESUMEN ════════ */}
      {tab === "Resumen" && (
        <div style={{ display:"flex", flexDirection:"column", gap:"20px" }}>

          {/* Stat cards */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"12px" }}>
            {/* Ingresos */}
            <div style={CARD}>
              <p style={LABEL}>Ingresos del mes</p>
              <p style={{ ...NUM, color:"var(--green)" }}>3.000€</p>
              <p style={{ fontSize:"12px", color:"var(--text-muted)", marginBottom:"8px" }}>Agencia + Trabajo + Otros</p>
              <SparkLine data={SPARK.ingresos} id="fin-ing" />
            </div>

            {/* Gastos */}
            <div style={CARD}>
              <p style={LABEL}>Gastos fijos</p>
              <p style={{ ...NUM, color:"var(--red)" }}>1.130€</p>
              <p style={{ fontSize:"12px", color:"var(--text-muted)", marginBottom:"8px" }}>Alquiler + Coche + Seguros + Tech</p>
              <SparkLine data={SPARK.gastos} id="fin-gas" />
            </div>

            {/* Margen */}
            <div style={CARD}>
              <p style={LABEL}>Margen disponible</p>
              <p style={{ ...NUM, color:"var(--accent)" }}>1.870€</p>
              <p style={{ fontSize:"12px", color:"var(--text-muted)", marginBottom:"8px" }}>Para invertir o ahorrar</p>
              <SparkLine data={SPARK.margen} id="fin-mar" />
            </div>

            {/* Próximo cobro */}
            <div style={CARD}>
              <p style={LABEL}>Próximo cobro</p>
              <p style={{ ...NUM, color:"var(--amber)" }}>
                en {next ? next.daysLeft : "—"} días
              </p>
              <p style={{ fontSize:"12px", color:"var(--text-muted)", marginBottom:"8px" }}>
                {next ? `${next.servicio} — ${next.importe.toFixed(2)}€` : "—"}
              </p>
              <SparkLine data={SPARK.cobro} id="fin-cob" />
            </div>
          </div>

          {/* Bar chart */}
          <div style={{ ...CARD, padding:"24px" }}>
            <p style={{ ...LABEL, marginBottom:"20px" }}>Ingresos vs Gastos — últimos 4 meses</p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={BAR_DATA} barGap={4} barCategoryGap="32%">
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis
                  dataKey="mes"
                  tick={{ fill:"var(--text-muted)", fontSize:11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill:"var(--text-muted)", fontSize:11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={v => `${(v/1000).toFixed(1)}k`}
                  width={36}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  cursor={{ fill:"var(--accent-dim)" }}
                  formatter={(v: number) => [`${v.toLocaleString("es-ES")}€`]}
                />
                <Legend
                  wrapperStyle={{ fontSize:"12px", paddingTop:"12px", color:"var(--text-muted)" }}
                />
                <Bar dataKey="Ingresos" fill={greenColor}  radius={[4,4,0,0]} maxBarSize={48} />
                <Bar dataKey="Gastos"   fill={redColor}    radius={[4,4,0,0]} maxBarSize={48} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ════════ TAB 2: GASTOS FIJOS ════════ */}
      {tab === "GastosFijos" && (
        <div style={{ display:"flex", flexDirection:"column", gap:"16px" }}>

          {/* Header row */}
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <p style={{ ...LABEL, margin:0 }}>{gastos.length} servicios · total mensual</p>
            <button
              onClick={() => setShowAdd(true)}
              style={{ display:"flex", alignItems:"center", gap:"6px", padding:"8px 14px", borderRadius:"6px", background:"var(--accent)", color:"var(--bg)", border:"none", cursor:"pointer", fontSize:"13px", fontWeight:600 }}
            >
              <Plus size={14} />
              Añadir gasto fijo
            </button>
          </div>

          {/* Table */}
          <div style={{ background:"var(--card)", border:"1px solid var(--border)", borderRadius:"6px", overflow:"hidden" }}>
            <table style={{ width:"100%", borderCollapse:"collapse" }}>
              <thead>
                <tr>
                  {["Servicio","Importe","Día","Categoría","Estado","Acciones"].map(h => (
                    <th key={h} style={TH}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {gastos.map(g => (
                  <tr key={g.id} style={{ background: g.estado === "cancelar" ? "rgba(255,61,113,0.03)" : "transparent" }}>
                    <td style={{ ...TD, fontWeight:500, color:"var(--text)" }}>{g.servicio}</td>
                    <td style={{ ...TD, fontFamily:"'Space Mono', monospace", fontWeight:700, color: g.estado === "cancelar" ? "var(--text-muted)" : "var(--text)" }}>
                      {g.importe.toFixed(2)}€
                    </td>
                    <td style={{ ...TD, color:"var(--text-mid)" }}>
                      día {g.dia}
                    </td>
                    <td style={{ ...TD }}>
                      <span style={{ fontSize:"11px", padding:"2px 8px", borderRadius:"4px", background:"var(--accent-dim)", color:"var(--text-mid)", fontWeight:500 }}>
                        {g.categoria}
                      </span>
                    </td>
                    <td style={{ ...TD }}>
                      {g.estado === "activo" ? (
                        <span style={{ fontSize:"11px", fontWeight:700, padding:"2px 8px", borderRadius:"4px", background:"var(--accent-dim)", color:"var(--accent)", border:"1px solid var(--border-accent)" }}>
                          Activo
                        </span>
                      ) : (
                        <span style={{ fontSize:"11px", fontWeight:700, padding:"2px 8px", borderRadius:"4px", background:"rgba(255,61,113,0.12)", color:"var(--red)", border:"1px solid rgba(255,61,113,0.25)" }}>
                          Cancelar
                        </span>
                      )}
                    </td>
                    <td style={{ ...TD }}>
                      <button
                        onClick={() => openEdit(g)}
                        style={{ display:"flex", alignItems:"center", gap:"4px", padding:"5px 10px", borderRadius:"4px", border:"1px solid var(--border)", background:"transparent", color:"var(--text-muted)", cursor:"pointer", fontSize:"11px" }}
                      >
                        <Pencil size={12} />
                        Editar
                      </button>
                    </td>
                  </tr>
                ))}

                {/* TOTAL */}
                <tr style={{ background:"var(--accent-dim)" }}>
                  <td style={{ ...TD, fontWeight:700, color:"var(--text)", borderBottom:"none" }}>TOTAL</td>
                  <td style={{ ...TD, fontFamily:"'Space Mono', monospace", fontWeight:700, color:"var(--text)", borderBottom:"none" }}>
                    {total.toFixed(2)}€
                  </td>
                  <td colSpan={4} style={{ borderBottom:"none" }} />
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Edit modal ── */}
      {editId !== null && (
        <div
          onClick={() => setEditId(null)}
          style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.75)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center" }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background:"var(--card)", border:"1px solid var(--border)", borderRadius:"10px", padding:"28px", width:"360px" }}
          >
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"20px" }}>
              <h3 style={{ color:"var(--text)", margin:0, fontSize:"15px", fontWeight:600 }}>
                Editar — {gastos.find(g => g.id === editId)?.servicio}
              </h3>
              <button onClick={() => setEditId(null)} style={{ background:"none", border:"none", color:"var(--text-muted)", cursor:"pointer", padding:"2px" }}><X size={18} /></button>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:"12px" }}>
              <div>
                <p style={{ fontSize:"11px", color:"var(--text-muted)", marginBottom:"4px" }}>Importe (€)</p>
                <input value={editForm.importe} onChange={e => setEditForm(f => ({ ...f, importe: e.target.value }))} style={INPUT_S} type="number" step="0.01" />
              </div>
              <div>
                <p style={{ fontSize:"11px", color:"var(--text-muted)", marginBottom:"4px" }}>Día del mes</p>
                <input value={editForm.dia} onChange={e => setEditForm(f => ({ ...f, dia: e.target.value }))} style={INPUT_S} type="number" min="1" max="31" />
              </div>
            </div>
            <div style={{ display:"flex", gap:"8px", marginTop:"20px" }}>
              <button onClick={() => setEditId(null)} style={{ flex:1, padding:"9px", borderRadius:"5px", border:"1px solid var(--border)", background:"transparent", color:"var(--text-muted)", cursor:"pointer", fontSize:"13px" }}>Cancelar</button>
              <button onClick={saveEdit} style={{ flex:1, padding:"9px", borderRadius:"5px", border:"none", background:"var(--accent)", color:"var(--bg)", cursor:"pointer", fontSize:"13px", fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center", gap:"6px" }}>
                <Check size={14} /> Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Add modal ── */}
      {showAdd && (
        <div
          onClick={() => setShowAdd(false)}
          style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.75)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center" }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background:"var(--card)", border:"1px solid var(--border)", borderRadius:"10px", padding:"28px", width:"420px" }}
          >
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"20px" }}>
              <h3 style={{ color:"var(--text)", margin:0, fontSize:"15px", fontWeight:600 }}>Añadir gasto fijo</h3>
              <button onClick={() => setShowAdd(false)} style={{ background:"none", border:"none", color:"var(--text-muted)", cursor:"pointer", padding:"2px" }}><X size={18} /></button>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px", marginBottom:"12px" }}>
              {([["servicio","Servicio"],["categoria","Categoría"]] as [string,string][]).map(([k,l]) => (
                <div key={k}>
                  <p style={{ fontSize:"11px", color:"var(--text-muted)", marginBottom:"4px" }}>{l}</p>
                  <input value={(addForm as Record<string,string>)[k]} onChange={e => setAddForm(f => ({ ...f, [k]: e.target.value }))} style={INPUT_S} />
                </div>
              ))}
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"12px", marginBottom:"12px" }}>
              <div>
                <p style={{ fontSize:"11px", color:"var(--text-muted)", marginBottom:"4px" }}>Importe (€)</p>
                <input value={addForm.importe} onChange={e => setAddForm(f => ({ ...f, importe: e.target.value }))} style={INPUT_S} type="number" step="0.01" />
              </div>
              <div>
                <p style={{ fontSize:"11px", color:"var(--text-muted)", marginBottom:"4px" }}>Día del mes</p>
                <input value={addForm.dia} onChange={e => setAddForm(f => ({ ...f, dia: e.target.value }))} style={INPUT_S} type="number" min="1" max="31" />
              </div>
              <div>
                <p style={{ fontSize:"11px", color:"var(--text-muted)", marginBottom:"4px" }}>Estado</p>
                <select value={addForm.estado} onChange={e => setAddForm(f => ({ ...f, estado: e.target.value as Estado }))} style={INPUT_S}>
                  <option value="activo">Activo</option>
                  <option value="cancelar">Cancelar</option>
                </select>
              </div>
            </div>
            <div style={{ display:"flex", gap:"8px", marginTop:"20px" }}>
              <button onClick={() => setShowAdd(false)} style={{ flex:1, padding:"9px", borderRadius:"5px", border:"1px solid var(--border)", background:"transparent", color:"var(--text-muted)", cursor:"pointer", fontSize:"13px" }}>Cancelar</button>
              <button onClick={addGasto} style={{ flex:1, padding:"9px", borderRadius:"5px", border:"none", background:"var(--accent)", color:"var(--bg)", cursor:"pointer", fontSize:"13px", fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center", gap:"6px" }}>
                <Plus size={14} /> Añadir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
