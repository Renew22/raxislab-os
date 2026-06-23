"use client";

import { useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { Pencil, Plus, X, Check } from "lucide-react";
import SparkLine from "../components/spark-line";
import { useTheme } from "../components/theme-provider";

// ─── TYPES ────────────────────────────────────────────────────────────────────

type Tab             = "Resumen" | "GastosFijos" | "Calendario" | "Ingresos";
type EstadoGasto     = "activo" | "cancelar" | "cancelado";
type EstadoIngreso   = "activo" | "verificar";

type GastoFijo = {
  id: number; servicio: string; importe: number;
  dia: number; categoria: string; estado: EstadoGasto;
};
type Ingreso = {
  id: number; fuente: string; importe: number;
  dia: number; frecuencia: string; estado: EstadoIngreso;
};

// ─── DATA ─────────────────────────────────────────────────────────────────────

const SPARK = {
  gastos:   [1050, 1080, 1100, 1130, 1110, 1120, 1130],
  margen:   [1150, 1320, 1400, 1570, 1640, 1780, 1870],
  cobro:    [30,   25,   20,   14,   10,   7,    5   ],
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

const INGRESOS_INITIAL: Ingreso[] = [
  { id:1, fuente:"Recaba Inversiones (trabajo)", importe:1400, dia:25, frecuencia:"Mensual",  estado:"activo"   },
  { id:2, fuente:"Identity Peluqueros",           importe:550,  dia:5,  frecuencia:"Mensual",  estado:"verificar"},
  { id:3, fuente:"Desancho Estilistas",            importe:550,  dia:5,  frecuencia:"Mensual",  estado:"verificar"},
  { id:4, fuente:"Last Mile Distribution",         importe:100,  dia:0,  frecuencia:"Variable", estado:"activo"   },
  { id:5, fuente:"Matías (envíos)",                importe:400,  dia:0,  frecuencia:"Variable", estado:"activo"   },
];

const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const DOW   = ["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"];

// ─── STYLES ───────────────────────────────────────────────────────────────────

const CARD:    React.CSSProperties = { background:"var(--card)", border:"1px solid var(--border)", borderRadius:"6px", padding:"20px" };
const LABEL = { fontSize:"11px", fontWeight:600, letterSpacing:"0.08em", textTransform:"uppercase" as const, color:"var(--text-muted)", marginBottom:"8px" };
const NUM:     React.CSSProperties = { fontFamily:"'Space Mono', monospace", fontWeight:700, fontSize:"26px", lineHeight:1, marginBottom:"6px" };
const TH    = { padding:"10px 14px", textAlign:"left" as const, fontSize:"11px", fontWeight:600, letterSpacing:"0.06em", color:"var(--text-muted)", borderBottom:"1px solid var(--border)" };
const TD    = { padding:"11px 14px", borderBottom:"1px solid var(--border)", fontSize:"13px" };
const INPUT_S: React.CSSProperties = { padding:"8px 10px", borderRadius:"4px", border:"1px solid var(--border)", background:"var(--card-hover)", color:"var(--text)", fontSize:"13px", outline:"none", width:"100%", boxSizing:"border-box" };

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function nextCobro(gastos: GastoFijo[]) {
  const d = new Date().getDate();
  const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
  return gastos
    .filter(g => g.estado === "activo")
    .map(g => ({ ...g, daysLeft: g.dia >= d ? g.dia - d : daysInMonth - d + g.dia }))
    .sort((a, b) => a.daysLeft - b.daysLeft)[0] ?? null;
}

// ─── SUB-COMPONENT: CALENDARIO ───────────────────────────────────────────────

function CalendarioTab({ gastos, ingresos }: { gastos: GastoFijo[]; ingresos: Ingreso[] }) {
  const [hovered, setHovered] = useState<string | null>(null);

  const today       = new Date();
  const todayDay    = today.getDate();
  const year        = today.getFullYear();
  const month       = today.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const offset      = (new Date(year, month, 1).getDay() + 6) % 7;

  const cells: (number | null)[] = [...Array(offset).fill(null)];
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const gastosByDay: Record<number, GastoFijo[]> = {};
  gastos.filter(g => g.estado !== "cancelado").forEach(g => {
    gastosByDay[g.dia] = [...(gastosByDay[g.dia] ?? []), g];
  });

  const ingresosByDay: Record<number, Ingreso[]> = {};
  ingresos.filter(i => i.dia > 0 && i.frecuencia === "Mensual").forEach(i => {
    ingresosByDay[i.dia] = [...(ingresosByDay[i.dia] ?? []), i];
  });

  const proximos7 = gastos
    .filter(g => g.estado === "activo")
    .map(g => {
      const dl = g.dia >= todayDay ? g.dia - todayDay : daysInMonth - todayDay + g.dia;
      return { ...g, daysLeft: dl };
    })
    .filter(g => g.daysLeft <= 7)
    .sort((a, b) => a.daysLeft - b.daysLeft);

  const ingresosEsperados = ingresos.filter(i => i.estado === "activo" || i.estado === "verificar");

  return (
    <div style={{ display:"flex", gap:"20px", alignItems:"flex-start" }}>

      {/* ── Grid ── */}
      <div style={{ flex:1 }}>
        <p style={{ ...LABEL, marginBottom:"14px" }}>{MESES[month]} {year}</p>

        <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:"2px", marginBottom:"2px" }}>
          {DOW.map(d => (
            <div key={d} style={{ padding:"6px 4px", textAlign:"center", fontSize:"11px", fontWeight:600, color:"var(--text-muted)", letterSpacing:"0.05em" }}>{d}</div>
          ))}
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:"2px" }}>
          {cells.map((day, i) => {
            const isToday  = day === todayDay;
            const gItems   = day ? (gastosByDay[day] ?? [])   : [];
            const iItems   = day ? (ingresosByDay[day] ?? []) : [];
            return (
              <div
                key={i}
                style={{
                  minHeight:"70px", padding:"5px", borderRadius:"4px",
                  border:     isToday ? "1px solid var(--border-accent)" : "1px solid var(--border)",
                  background: isToday ? "var(--accent-dim)" : day ? "var(--card)" : "transparent",
                }}
              >
                {day && (
                  <>
                    <span style={{ display:"block", fontSize:"11px", fontWeight: isToday ? 700 : 400, color: isToday ? "var(--accent)" : "var(--text-muted)", marginBottom:"3px" }}>
                      {day}
                    </span>
                    <div style={{ display:"flex", flexDirection:"column", gap:"2px" }}>
                      {/* Gastos en rojo */}
                      {gItems.map(g => {
                        const key = `g-${day}-${g.id}`;
                        return (
                          <div key={g.id} style={{ position:"relative" }}
                            onMouseEnter={() => setHovered(key)} onMouseLeave={() => setHovered(null)}>
                            <div style={{ fontSize:"10px", fontWeight:600, padding:"2px 4px", borderRadius:"3px",
                              background: g.estado === "cancelar" ? "rgba(255,61,113,0.06)" : "rgba(255,61,113,0.15)",
                              color: g.estado === "cancelar" ? "var(--text-muted)" : "var(--red)",
                              whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis",
                              opacity: g.estado === "cancelar" ? 0.5 : 1, cursor:"default",
                            }}>
                              {g.servicio.split(" ")[0]}
                            </div>
                            {hovered === key && (
                              <div style={{ position:"absolute", bottom:"calc(100% + 4px)", left:0,
                                background:"var(--card)", border:"1px solid var(--border)", borderRadius:"6px",
                                padding:"6px 10px", fontSize:"11px", color:"var(--text)",
                                whiteSpace:"nowrap", zIndex:50, pointerEvents:"none", boxShadow:"0 4px 12px rgba(0,0,0,0.22)" }}>
                                <span style={{ fontWeight:600 }}>{g.servicio}</span><br />
                                <span style={{ color:"var(--red)", fontFamily:"'Space Mono', monospace" }}>{g.importe.toFixed(2)}€</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                      {/* Ingresos en verde */}
                      {iItems.map(ing => {
                        const key = `i-${day}-${ing.id}`;
                        return (
                          <div key={ing.id} style={{ position:"relative" }}
                            onMouseEnter={() => setHovered(key)} onMouseLeave={() => setHovered(null)}>
                            <div style={{ fontSize:"10px", fontWeight:600, padding:"2px 4px", borderRadius:"3px",
                              background:"rgba(0,230,118,0.12)", color:"var(--green)",
                              whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis", cursor:"default",
                              opacity: ing.estado === "verificar" ? 0.6 : 1,
                            }}>
                              {ing.fuente.split(" ")[0]}
                            </div>
                            {hovered === key && (
                              <div style={{ position:"absolute", bottom:"calc(100% + 4px)", left:0,
                                background:"var(--card)", border:"1px solid var(--border)", borderRadius:"6px",
                                padding:"6px 10px", fontSize:"11px", color:"var(--text)",
                                whiteSpace:"nowrap", zIndex:50, pointerEvents:"none", boxShadow:"0 4px 12px rgba(0,0,0,0.22)" }}>
                                <span style={{ fontWeight:600 }}>{ing.fuente}</span><br />
                                <span style={{ color:"var(--green)", fontFamily:"'Space Mono', monospace" }}>+{ing.importe.toLocaleString("es-ES")}€</span>
                                {ing.estado === "verificar" && <span style={{ color:"var(--amber)", marginLeft:"6px" }}>· pendiente verificar</span>}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Panel lateral ── */}
      <div style={{ width:"224px", flexShrink:0, display:"flex", flexDirection:"column", gap:"16px" }}>
        {/* Próximos 7 días — gastos */}
        <div>
          <p style={{ ...LABEL, marginBottom:"12px" }}>Próximos 7 días</p>
          <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
            {proximos7.length === 0 ? (
              <p style={{ fontSize:"12px", color:"var(--text-muted)" }}>Sin cobros pendientes</p>
            ) : proximos7.map(g => (
              <div key={`prox-${g.id}`} style={{ background:"var(--card)", border:"1px solid var(--border)", borderRadius:"6px", padding:"10px 12px" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"2px" }}>
                  <span style={{ fontSize:"12px", fontWeight:500, color:"var(--text)" }}>{g.servicio}</span>
                  <span style={{ fontFamily:"'Space Mono', monospace", fontSize:"12px", fontWeight:700, color:"var(--red)" }}>{g.importe.toFixed(2)}€</span>
                </div>
                <span style={{ fontSize:"11px", color:"var(--text-muted)" }}>
                  {g.daysLeft === 0 ? "Hoy" : g.daysLeft === 1 ? "Mañana" : `En ${g.daysLeft} días`}
                  {" · día "}{g.dia}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Ingresos esperados este mes */}
        <div>
          <p style={{ ...LABEL, marginBottom:"12px" }}>Ingresos del mes</p>
          <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
            {ingresosEsperados.map(ing => (
              <div key={`ing-${ing.id}`} style={{ background:"var(--card)", border:"1px solid var(--border)", borderRadius:"6px", padding:"10px 12px" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"2px" }}>
                  <span style={{ fontSize:"11px", fontWeight:500, color:"var(--text)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth:"120px" }}>{ing.fuente}</span>
                  <span style={{ fontFamily:"'Space Mono', monospace", fontSize:"12px", fontWeight:700, color:"var(--green)", flexShrink:0 }}>+{ing.importe.toLocaleString("es-ES")}€</span>
                </div>
                <span style={{ fontSize:"10px", color: ing.estado === "verificar" ? "var(--amber)" : "var(--text-muted)" }}>
                  {ing.estado === "verificar" ? "Por verificar" : ing.frecuencia}
                  {ing.dia > 0 ? ` · día ${ing.dia}` : ""}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── SUB-COMPONENT: INGRESOS ─────────────────────────────────────────────────

function IngresosTab({ ingresos, setIngresos }: { ingresos: Ingreso[]; setIngresos: React.Dispatch<React.SetStateAction<Ingreso[]>> }) {
  const [showAdd, setShowAdd]       = useState(false);
  const [addForm, setAddForm]       = useState({ fuente:"", importe:"", dia:"", frecuencia:"Mensual", estado:"activo" as EstadoIngreso });
  const [badgeHover, setBadgeHover] = useState<number | null>(null);

  const total = ingresos.reduce((s, i) => s + i.importe, 0);

  function addIngreso() {
    if (!addForm.fuente || !addForm.importe) return;
    const newId = Math.max(...ingresos.map(i => i.id), 0) + 1;
    setIngresos(prev => [...prev, { id:newId, fuente:addForm.fuente, importe:parseFloat(addForm.importe)||0, dia:parseInt(addForm.dia)||0, frecuencia:addForm.frecuencia, estado:addForm.estado }]);
    setAddForm({ fuente:"", importe:"", dia:"", frecuencia:"Mensual", estado:"activo" });
    setShowAdd(false);
  }

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:"16px" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <p style={{ ...LABEL, margin:0 }}>{ingresos.length} fuentes · {total.toLocaleString("es-ES")}€/mes</p>
        <button onClick={() => setShowAdd(true)}
          style={{ display:"flex", alignItems:"center", gap:"6px", padding:"8px 14px", borderRadius:"6px", background:"var(--accent)", color:"var(--bg)", border:"none", cursor:"pointer", fontSize:"13px", fontWeight:600 }}>
          <Plus size={14} /> Añadir ingreso
        </button>
      </div>

      <div style={{ background:"var(--card)", border:"1px solid var(--border)", borderRadius:"6px", overflow:"hidden" }}>
        <table style={{ width:"100%", borderCollapse:"collapse" }}>
          <thead>
            <tr>{["Fuente","Importe","Día","Frecuencia","Estado"].map(h => <th key={h} style={TH}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {ingresos.map(ing => (
              <tr key={ing.id}>
                <td style={{ ...TD, fontWeight:500, color:"var(--text)" }}>{ing.fuente}</td>
                <td style={{ ...TD, fontFamily:"'Space Mono', monospace", fontWeight:700, color:"var(--green)" }}>
                  {ing.importe.toLocaleString("es-ES")}€
                </td>
                <td style={{ ...TD, color:"var(--text-muted)", fontSize:"12px" }}>
                  {ing.dia > 0 ? `día ${ing.dia}` : "—"}
                </td>
                <td style={{ ...TD, color:"var(--text-muted)", fontSize:"12px" }}>{ing.frecuencia}</td>
                <td style={{ ...TD }}>
                  {ing.estado === "activo" ? (
                    <span style={{ fontSize:"11px", fontWeight:700, padding:"2px 8px", borderRadius:"4px", background:"rgba(0,230,118,0.1)", color:"var(--green)", border:"1px solid rgba(0,230,118,0.25)" }}>
                      Activo
                    </span>
                  ) : (
                    <div style={{ position:"relative", display:"inline-block" }}
                      onMouseEnter={() => setBadgeHover(ing.id)} onMouseLeave={() => setBadgeHover(null)}>
                      <span style={{ fontSize:"11px", fontWeight:700, padding:"2px 8px", borderRadius:"4px", background:"rgba(255,184,0,0.12)", color:"var(--amber)", border:"1px solid rgba(255,184,0,0.3)", cursor:"help" }}>
                        Verificar
                      </span>
                      {badgeHover === ing.id && (
                        <div style={{ position:"absolute", bottom:"calc(100% + 6px)", left:"50%", transform:"translateX(-50%)",
                          background:"var(--card)", border:"1px solid var(--border)", borderRadius:"6px",
                          padding:"6px 10px", fontSize:"11px", color:"var(--text-muted)",
                          whiteSpace:"nowrap", zIndex:50, pointerEvents:"none", boxShadow:"0 4px 12px rgba(0,0,0,0.2)" }}>
                          No detectado en últimos movimientos
                        </div>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            ))}
            <tr style={{ background:"var(--accent-dim)" }}>
              <td style={{ ...TD, fontWeight:700, color:"var(--text)", borderBottom:"none" }}>TOTAL</td>
              <td style={{ ...TD, fontFamily:"'Space Mono', monospace", fontWeight:700, color:"var(--green)", borderBottom:"none" }}>
                {total.toLocaleString("es-ES")}€
              </td>
              <td colSpan={3} style={{ borderBottom:"none" }} />
            </tr>
          </tbody>
        </table>
      </div>

      {showAdd && (
        <div onClick={() => setShowAdd(false)} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.75)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center" }}>
          <div onClick={e => e.stopPropagation()} style={{ background:"var(--card)", border:"1px solid var(--border)", borderRadius:"10px", padding:"28px", width:"420px" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"20px" }}>
              <h3 style={{ color:"var(--text)", margin:0, fontSize:"15px", fontWeight:600 }}>Añadir ingreso</h3>
              <button onClick={() => setShowAdd(false)} style={{ background:"none", border:"none", color:"var(--text-muted)", cursor:"pointer", padding:"2px" }}><X size={18} /></button>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:"12px" }}>
              <div>
                <p style={{ fontSize:"11px", color:"var(--text-muted)", marginBottom:"4px" }}>Fuente</p>
                <input value={addForm.fuente} onChange={e => setAddForm(f => ({ ...f, fuente:e.target.value }))} style={INPUT_S} />
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:"10px" }}>
                <div>
                  <p style={{ fontSize:"11px", color:"var(--text-muted)", marginBottom:"4px" }}>Importe (€)</p>
                  <input value={addForm.importe} onChange={e => setAddForm(f => ({ ...f, importe:e.target.value }))} style={INPUT_S} type="number" />
                </div>
                <div>
                  <p style={{ fontSize:"11px", color:"var(--text-muted)", marginBottom:"4px" }}>Día cobro</p>
                  <input value={addForm.dia} onChange={e => setAddForm(f => ({ ...f, dia:e.target.value }))} style={INPUT_S} type="number" placeholder="0=variable" />
                </div>
                <div>
                  <p style={{ fontSize:"11px", color:"var(--text-muted)", marginBottom:"4px" }}>Frecuencia</p>
                  <select value={addForm.frecuencia} onChange={e => setAddForm(f => ({ ...f, frecuencia:e.target.value }))} style={INPUT_S}>
                    <option>Mensual</option><option>Variable</option><option>Anual</option>
                  </select>
                </div>
                <div>
                  <p style={{ fontSize:"11px", color:"var(--text-muted)", marginBottom:"4px" }}>Estado</p>
                  <select value={addForm.estado} onChange={e => setAddForm(f => ({ ...f, estado:e.target.value as EstadoIngreso }))} style={INPUT_S}>
                    <option value="activo">Activo</option>
                    <option value="verificar">Verificar</option>
                  </select>
                </div>
              </div>
            </div>
            <div style={{ display:"flex", gap:"8px", marginTop:"20px" }}>
              <button onClick={() => setShowAdd(false)} style={{ flex:1, padding:"9px", borderRadius:"5px", border:"1px solid var(--border)", background:"transparent", color:"var(--text-muted)", cursor:"pointer", fontSize:"13px" }}>Cancelar</button>
              <button onClick={addIngreso} style={{ flex:1, padding:"9px", borderRadius:"5px", border:"none", background:"var(--accent)", color:"var(--bg)", cursor:"pointer", fontSize:"13px", fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center", gap:"6px" }}>
                <Plus size={14} /> Añadir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

const TABS: [Tab, string][] = [
  ["Resumen",    "Resumen mensual"],
  ["GastosFijos","Gastos fijos"   ],
  ["Calendario", "Calendario"     ],
  ["Ingresos",   "Ingresos"       ],
];

export default function FinanzasPage() {
  const [tab, setTab]         = useState<Tab>("Resumen");
  const [gastos, setGastos]   = useState<GastoFijo[]>(GASTOS_INITIAL);
  const [ingresos, setIngresos] = useState<Ingreso[]>(INGRESOS_INITIAL);
  const [editId, setEditId]   = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ importe:"", dia:"" });
  const [showAdd, setShowAdd]   = useState(false);
  const [addForm, setAddForm]   = useState({ servicio:"", importe:"", dia:"", categoria:"", estado:"activo" as EstadoGasto });
  const [cancelConfirmId, setCancelConfirmId] = useState<number | null>(null);
  const { theme } = useTheme();

  const greenColor   = theme === "dark" ? "#00E676" : "#00A152";
  const redColor     = theme === "dark" ? "#FF3D71" : "#E5394B";

  const gastosActivos   = gastos.filter(g => g.estado !== "cancelado");
  const gastoCancelados = gastos.filter(g => g.estado === "cancelado");
  const totalGastos     = gastosActivos.filter(g => g.estado === "activo").reduce((s, g) => s + g.importe, 0);
  const totalIngresos   = ingresos.reduce((s, i) => s + i.importe, 0);
  const margen          = totalIngresos - totalGastos;
  const ahorroMensual   = gastos.filter(g => g.estado !== "activo").reduce((s, g) => s + g.importe, 0);
  const next            = nextCobro(gastos);

  // Últimos 4 meses para el gráfico (aproximado con datos actuales)
  const barData = [
    { mes:"Mar", Ingresos: Math.round(totalIngresos * 0.88), Gastos: Math.round(totalGastos * 0.97) },
    { mes:"Abr", Ingresos: Math.round(totalIngresos * 0.92), Gastos: Math.round(totalGastos * 0.99) },
    { mes:"May", Ingresos: Math.round(totalIngresos * 0.97), Gastos: Math.round(totalGastos * 0.99) },
    { mes:"Jun", Ingresos: totalIngresos,                    Gastos: Math.round(totalGastos)         },
  ];

  function confirmCancel() {
    if (cancelConfirmId === null) return;
    setGastos(prev => prev.map(g => g.id === cancelConfirmId ? { ...g, estado: "cancelado" as EstadoGasto } : g));
    setCancelConfirmId(null);
  }
  function reactivar(id: number) {
    setGastos(prev => prev.map(g => g.id === id ? { ...g, estado: "activo" as EstadoGasto } : g));
  }
  function openEdit(g: GastoFijo) {
    setEditId(g.id);
    setEditForm({ importe:String(g.importe), dia:String(g.dia) });
  }
  function saveEdit() {
    setGastos(prev => prev.map(g => g.id === editId ? { ...g, importe:parseFloat(editForm.importe)||g.importe, dia:parseInt(editForm.dia)||g.dia } : g));
    setEditId(null);
  }
  function addGasto() {
    if (!addForm.servicio || !addForm.importe) return;
    const newId = Math.max(...gastos.map(g => g.id)) + 1;
    setGastos(prev => [...prev, { id:newId, servicio:addForm.servicio, importe:parseFloat(addForm.importe)||0, dia:parseInt(addForm.dia)||1, categoria:addForm.categoria||"Otros", estado:addForm.estado }]);
    setAddForm({ servicio:"", importe:"", dia:"", categoria:"", estado:"activo" });
    setShowAdd(false);
  }

  const tooltipStyle: React.CSSProperties = { background:"var(--card)", border:"1px solid var(--border)", borderRadius:"6px", color:"var(--text)", fontSize:"12px" };

  return (
    <div style={{ padding:"32px 40px" }}>
      <h1 style={{ fontSize:"24px", fontWeight:600, color:"var(--text)", marginBottom:"24px" }}>Finanzas</h1>

      {/* ── Tab bar ── */}
      <div style={{ display:"inline-flex", gap:"4px", padding:"4px", background:"var(--surface)", border:"1px solid var(--border)", borderRadius:"8px", marginBottom:"24px" }}>
        {TABS.map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)} style={{ padding:"7px 16px", borderRadius:"5px", border:"none", cursor:"pointer", fontSize:"13px", fontWeight:tab===key?600:400, background:tab===key?"var(--accent-dim)":"transparent", color:tab===key?"var(--accent)":"var(--text-muted)", outline:tab===key?"1px solid var(--border-accent)":"none", whiteSpace:"nowrap" }}>
            {label}
          </button>
        ))}
      </div>

      {/* ════════ TAB 1: RESUMEN ════════ */}
      {tab === "Resumen" && (
        <div style={{ display:"flex", flexDirection:"column", gap:"20px" }}>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:"12px" }}>
            <div style={CARD}>
              <p style={LABEL}>Ingresos del mes</p>
              <p style={{ ...NUM, color:"var(--green)" }}>{totalIngresos.toLocaleString("es-ES")}€</p>
              <p style={{ fontSize:"12px", color:"var(--text-muted)", marginBottom:"8px" }}>{ingresos.length} fuentes activas</p>
              <SparkLine data={[...ingresos.map(i => i.importe).slice(0,6), totalIngresos]} id="fin-ing" />
            </div>
            <div style={CARD}>
              <p style={LABEL}>Gastos fijos</p>
              <p style={{ ...NUM, color:"var(--red)" }}>{totalGastos.toFixed(0)}€</p>
              <p style={{ fontSize:"12px", color:"var(--text-muted)", marginBottom:"8px" }}>{gastosActivos.filter(g => g.estado === "activo").length} servicios activos</p>
              <SparkLine data={SPARK.gastos} id="fin-gas" />
            </div>
            <div style={CARD}>
              <p style={LABEL}>Margen disponible</p>
              <p style={{ ...NUM, color: margen >= 0 ? "var(--accent)" : "var(--red)" }}>{margen.toFixed(0)}€</p>
              <p style={{ fontSize:"12px", color:"var(--text-muted)", marginBottom:"8px" }}>Para invertir o ahorrar</p>
              <SparkLine data={SPARK.margen} id="fin-mar" />
            </div>
            <div style={CARD}>
              <p style={LABEL}>Próximo cobro</p>
              <p style={{ ...NUM, color:"var(--amber)" }}>en {next?.daysLeft ?? "—"} días</p>
              <p style={{ fontSize:"12px", color:"var(--text-muted)", marginBottom:"8px" }}>
                {next ? `${next.servicio} — ${next.importe.toFixed(2)}€` : "—"}
              </p>
              <SparkLine data={SPARK.cobro} id="fin-cob" />
            </div>
            <div style={CARD}>
              <p style={LABEL}>Ahorro mensual</p>
              <p style={{ ...NUM, color: ahorroMensual > 0 ? "var(--green)" : "var(--text-muted)" }}>
                {ahorroMensual > 0 ? `${ahorroMensual.toFixed(2)}€` : "—"}
              </p>
              <p style={{ fontSize:"12px", color:"var(--text-muted)", marginBottom:"10px" }}>
                {ahorroMensual > 0 ? "Servicios cancelados o por cancelar" : "Sin cancelaciones pendientes"}
              </p>
              {gastos.filter(g => g.estado !== "activo").map(g => (
                <div key={g.id} style={{ display:"flex", justifyContent:"space-between", fontSize:"11px", color:"var(--text-muted)", marginBottom:"2px" }}>
                  <span style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth:"120px" }}>{g.servicio}</span>
                  <span style={{ fontFamily:"'Space Mono', monospace", color:"var(--green)", flexShrink:0 }}>+{g.importe.toFixed(2)}€</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ ...CARD, padding:"24px" }}>
            <p style={{ ...LABEL, marginBottom:"20px" }}>Ingresos vs Gastos — últimos 4 meses</p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={barData} barGap={4} barCategoryGap="32%">
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="mes" tick={{ fill:"var(--text-muted)", fontSize:11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill:"var(--text-muted)", fontSize:11 }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `${(v/1000).toFixed(1)}k`} width={36} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill:"var(--accent-dim)" }} formatter={(v) => [`${Number(v ?? 0).toLocaleString("es-ES")}€`]} />
                <Legend wrapperStyle={{ fontSize:"12px", paddingTop:"12px", color:"var(--text-muted)" }} />
                <Bar dataKey="Ingresos" fill={greenColor} radius={[4,4,0,0]} maxBarSize={48} />
                <Bar dataKey="Gastos"   fill={redColor}   radius={[4,4,0,0]} maxBarSize={48} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ════════ TAB 2: GASTOS FIJOS ════════ */}
      {tab === "GastosFijos" && (
        <div style={{ display:"flex", flexDirection:"column", gap:"16px" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <p style={{ ...LABEL, margin:0 }}>{gastosActivos.length} servicios activos · {totalGastos.toFixed(2)}€/mes</p>
            <button onClick={() => setShowAdd(true)} style={{ display:"flex", alignItems:"center", gap:"6px", padding:"8px 14px", borderRadius:"6px", background:"var(--accent)", color:"var(--bg)", border:"none", cursor:"pointer", fontSize:"13px", fontWeight:600 }}>
              <Plus size={14} /> Añadir gasto fijo
            </button>
          </div>

          <div style={{ background:"var(--card)", border:"1px solid var(--border)", borderRadius:"6px", overflow:"hidden" }}>
            <table style={{ width:"100%", borderCollapse:"collapse" }}>
              <thead><tr>{["Servicio","Importe","Día","Categoría","Estado","Acciones"].map(h => <th key={h} style={TH}>{h}</th>)}</tr></thead>
              <tbody>
                {gastosActivos.map(g => (
                  <tr key={g.id} style={{ background:g.estado==="cancelar"?"rgba(255,61,113,0.03)":"transparent" }}>
                    <td style={{ ...TD, fontWeight:500, color:"var(--text)" }}>{g.servicio}</td>
                    <td style={{ ...TD, fontFamily:"'Space Mono', monospace", fontWeight:700, color:g.estado==="cancelar"?"var(--text-muted)":"var(--text)" }}>{g.importe.toFixed(2)}€</td>
                    <td style={{ ...TD, color:"var(--text-mid)" }}>día {g.dia}</td>
                    <td style={{ ...TD }}><span style={{ fontSize:"11px", padding:"2px 8px", borderRadius:"4px", background:"var(--accent-dim)", color:"var(--text-mid)", fontWeight:500 }}>{g.categoria}</span></td>
                    <td style={{ ...TD }}>
                      {g.estado==="activo"
                        ? <span style={{ fontSize:"11px", fontWeight:700, padding:"2px 8px", borderRadius:"4px", background:"var(--accent-dim)", color:"var(--accent)", border:"1px solid var(--border-accent)" }}>Activo</span>
                        : (
                          <button onClick={() => setCancelConfirmId(g.id)} title="Confirmar cancelación"
                            style={{ fontSize:"11px", fontWeight:700, padding:"2px 8px", borderRadius:"4px", background:"rgba(255,61,113,0.12)", color:"var(--red)", border:"1px solid rgba(255,61,113,0.25)", cursor:"pointer" }}>
                            Cancelar ↗
                          </button>
                        )
                      }
                    </td>
                    <td style={{ ...TD }}>
                      <button onClick={() => openEdit(g)} style={{ display:"flex", alignItems:"center", gap:"4px", padding:"5px 10px", borderRadius:"4px", border:"1px solid var(--border)", background:"transparent", color:"var(--text-muted)", cursor:"pointer", fontSize:"11px" }}>
                        <Pencil size={12} /> Editar
                      </button>
                    </td>
                  </tr>
                ))}
                <tr style={{ background:"var(--accent-dim)" }}>
                  <td style={{ ...TD, fontWeight:700, color:"var(--text)", borderBottom:"none" }}>TOTAL</td>
                  <td style={{ ...TD, fontFamily:"'Space Mono', monospace", fontWeight:700, color:"var(--text)", borderBottom:"none" }}>{totalGastos.toFixed(2)}€</td>
                  <td colSpan={4} style={{ borderBottom:"none" }} />
                </tr>
              </tbody>
            </table>
          </div>

          {gastoCancelados.length > 0 && (
            <div style={{ opacity:0.65 }}>
              <p style={{ ...LABEL, marginBottom:"10px", display:"flex", alignItems:"center", gap:"8px" }}>
                Cancelados / Pausados
                <span style={{ fontFamily:"'Space Mono', monospace", fontSize:"11px", color:"var(--green)", fontWeight:700, textTransform:"none", letterSpacing:0 }}>
                  +{gastoCancelados.reduce((s,g)=>s+g.importe,0).toFixed(2)}€/mes ahorrados
                </span>
              </p>
              <div style={{ background:"var(--card)", border:"1px solid var(--border)", borderRadius:"6px", overflow:"hidden" }}>
                <table style={{ width:"100%", borderCollapse:"collapse" }}>
                  <tbody>
                    {gastoCancelados.map(g => (
                      <tr key={g.id}>
                        <td style={{ ...TD, color:"var(--text-muted)", textDecoration:"line-through", fontWeight:500 }}>{g.servicio}</td>
                        <td style={{ ...TD, fontFamily:"'Space Mono', monospace", color:"var(--text-muted)", textDecoration:"line-through" }}>{g.importe.toFixed(2)}€</td>
                        <td style={{ ...TD, color:"var(--text-muted)", fontSize:"11px" }}>{g.categoria}</td>
                        <td style={{ ...TD }}><span style={{ fontSize:"11px", color:"var(--green)", fontWeight:600 }}>Ahorro: {g.importe.toFixed(2)}€/mes</span></td>
                        <td style={{ ...TD, borderBottom:"none" }}>
                          <button onClick={() => reactivar(g.id)} style={{ fontSize:"11px", padding:"4px 10px", borderRadius:"4px", border:"1px solid var(--border)", background:"transparent", color:"var(--text-muted)", cursor:"pointer" }}>
                            Reactivar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ════════ TAB 3: CALENDARIO ════════ */}
      {tab === "Calendario" && <CalendarioTab gastos={gastos} ingresos={ingresos} />}

      {/* ════════ TAB 4: INGRESOS ════════ */}
      {tab === "Ingresos" && <IngresosTab ingresos={ingresos} setIngresos={setIngresos} />}

      {/* ── Edit modal ── */}
      {editId !== null && (
        <div onClick={() => setEditId(null)} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.75)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center" }}>
          <div onClick={e => e.stopPropagation()} style={{ background:"var(--card)", border:"1px solid var(--border)", borderRadius:"10px", padding:"28px", width:"360px" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"20px" }}>
              <h3 style={{ color:"var(--text)", margin:0, fontSize:"15px", fontWeight:600 }}>Editar — {gastos.find(g=>g.id===editId)?.servicio}</h3>
              <button onClick={() => setEditId(null)} style={{ background:"none", border:"none", color:"var(--text-muted)", cursor:"pointer", padding:"2px" }}><X size={18} /></button>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:"12px" }}>
              <div>
                <p style={{ fontSize:"11px", color:"var(--text-muted)", marginBottom:"4px" }}>Importe (€)</p>
                <input value={editForm.importe} onChange={e => setEditForm(f=>({...f,importe:e.target.value}))} style={INPUT_S} type="number" step="0.01" />
              </div>
              <div>
                <p style={{ fontSize:"11px", color:"var(--text-muted)", marginBottom:"4px" }}>Día del mes</p>
                <input value={editForm.dia} onChange={e => setEditForm(f=>({...f,dia:e.target.value}))} style={INPUT_S} type="number" min="1" max="31" />
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

      {/* ── Confirm cancel modal ── */}
      {cancelConfirmId !== null && (() => {
        const g = gastos.find(x => x.id === cancelConfirmId);
        if (!g) return null;
        return (
          <div onClick={() => setCancelConfirmId(null)} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.75)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center" }}>
            <div onClick={e => e.stopPropagation()} style={{ background:"var(--card)", border:"1px solid rgba(255,61,113,0.35)", borderRadius:"10px", padding:"28px", width:"400px" }}>
              <h3 style={{ color:"var(--text)", margin:"0 0 10px", fontSize:"16px", fontWeight:600 }}>¿Confirmar cancelación?</h3>
              <p style={{ fontSize:"13px", color:"var(--text-muted)", margin:"0 0 6px" }}>
                Servicio: <strong style={{ color:"var(--text)" }}>{g.servicio}</strong>
              </p>
              <p style={{ fontSize:"13px", color:"var(--text-muted)", margin:"0 0 18px" }}>
                Dejarás de pagar <span style={{ fontFamily:"'Space Mono', monospace", color:"var(--green)", fontWeight:700 }}>{g.importe.toFixed(2)}€/mes</span>.
              </p>
              <div style={{ display:"flex", gap:"8px" }}>
                <button onClick={() => setCancelConfirmId(null)} style={{ flex:1, padding:"9px", borderRadius:"5px", border:"1px solid var(--border)", background:"transparent", color:"var(--text-muted)", cursor:"pointer", fontSize:"13px" }}>
                  Mantener activo
                </button>
                <button onClick={confirmCancel} style={{ flex:1, padding:"9px", borderRadius:"5px", border:"1px solid rgba(255,61,113,0.4)", background:"rgba(255,61,113,0.12)", color:"var(--red)", cursor:"pointer", fontSize:"13px", fontWeight:700 }}>
                  Sí, cancelar
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Add gasto modal ── */}
      {showAdd && (
        <div onClick={() => setShowAdd(false)} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.75)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center" }}>
          <div onClick={e => e.stopPropagation()} style={{ background:"var(--card)", border:"1px solid var(--border)", borderRadius:"10px", padding:"28px", width:"420px" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"20px" }}>
              <h3 style={{ color:"var(--text)", margin:0, fontSize:"15px", fontWeight:600 }}>Añadir gasto fijo</h3>
              <button onClick={() => setShowAdd(false)} style={{ background:"none", border:"none", color:"var(--text-muted)", cursor:"pointer", padding:"2px" }}><X size={18} /></button>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px", marginBottom:"12px" }}>
              {([ ["servicio","Servicio"],["categoria","Categoría"] ] as [string,string][]).map(([k,l]) => (
                <div key={k}>
                  <p style={{ fontSize:"11px", color:"var(--text-muted)", marginBottom:"4px" }}>{l}</p>
                  <input value={(addForm as Record<string,string>)[k]} onChange={e => setAddForm(f=>({...f,[k]:e.target.value}))} style={INPUT_S} />
                </div>
              ))}
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"12px", marginBottom:"12px" }}>
              <div>
                <p style={{ fontSize:"11px", color:"var(--text-muted)", marginBottom:"4px" }}>Importe (€)</p>
                <input value={addForm.importe} onChange={e => setAddForm(f=>({...f,importe:e.target.value}))} style={INPUT_S} type="number" step="0.01" />
              </div>
              <div>
                <p style={{ fontSize:"11px", color:"var(--text-muted)", marginBottom:"4px" }}>Día del mes</p>
                <input value={addForm.dia} onChange={e => setAddForm(f=>({...f,dia:e.target.value}))} style={INPUT_S} type="number" min="1" max="31" />
              </div>
              <div>
                <p style={{ fontSize:"11px", color:"var(--text-muted)", marginBottom:"4px" }}>Estado</p>
                <select value={addForm.estado} onChange={e => setAddForm(f=>({...f,estado:e.target.value as EstadoGasto}))} style={INPUT_S}>
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
