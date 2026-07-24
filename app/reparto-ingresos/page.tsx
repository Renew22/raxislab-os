"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { Users, Plus, Trash2, Save, FileText, X, AlertTriangle, TrendingUp, TrendingDown, Euro } from "lucide-react";

const C = {
  bg: "var(--bg)", card: "var(--card)", border: "var(--border)",
  accent: "#1E9BF0", green: "#00E676", red: "#FF3D71", amber: "#FFB800", blue: "#4499FF",
  text: "var(--text)", mid: "var(--text-mid)", muted: "var(--text-muted)",
};
const S: Record<string, React.CSSProperties> = {
  card:  { background: C.card, border: `1px solid ${C.border}`, borderRadius: "12px", padding: "20px" },
  input: { width: "100%", padding: "7px 10px", background: C.bg, border: `1px solid ${C.border}`, borderRadius: "6px", color: C.text, fontSize: "12px", outline: "none", boxSizing: "border-box" as const },
  btn:   { padding: "8px 16px", borderRadius: "7px", border: "none", background: C.accent, color: "#000", fontSize: "12px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" },
  lbl:   { fontSize: "10px", fontWeight: 700, letterSpacing: "0.09em", textTransform: "uppercase" as const, color: C.muted, marginBottom: "4px", display: "block" },
  mono:  { fontFamily: "'Space Mono', monospace" },
  ghost: { padding: "6px 12px", borderRadius: "6px", border: `1px solid ${C.border}`, background: "transparent", color: C.mid, fontSize: "11px", cursor: "pointer", display: "flex", alignItems: "center", gap: "5px" },
  danger:{ padding: "6px 10px", borderRadius: "6px", border: `1px solid ${C.red}33`, background: `${C.red}0A`, color: C.red, fontSize: "11px", cursor: "pointer", display: "flex", alignItems: "center", gap: "5px" },
};
function badge(c: string): React.CSSProperties {
  return { fontSize: "9px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", padding: "2px 7px", borderRadius: "4px", background: `color-mix(in srgb, ${c} 9%, transparent)`, color: c, border: `1px solid color-mix(in srgb, ${c} 20%, transparent)` };
}
function eur(n: number) { return n.toLocaleString("es", { style: "currency", currency: "EUR", minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function pct(n: number) { return `${n.toFixed(1)}%`; }

function iid() { return Math.random().toString(36).slice(2, 9); }

function esMes(fecha: string, año: number, mes: number) {
  const d = new Date(fecha);
  return d.getFullYear() === año && d.getMonth() === mes;
}

function añosMesDesde(fecha: string) {
  const d = new Date(fecha);
  const ahora = new Date();
  return (ahora.getFullYear() - d.getFullYear()) * 12 + (ahora.getMonth() - d.getMonth());
}

const NOMBRES_MESES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

interface Colaboradora {
  id: string; nombre: string; porcentaje_gestion: number; porcentaje_retencion: number;
  fecha_alta: string; nueva_autonoma: boolean; colegiada_sanitaria: boolean;
}
interface GastoFijo { id: string; concepto: string; importe: number; pagado: boolean; }
interface Ingreso {
  id: string; colaboradora_id: string; fecha: string; importe_bruto: number; sesiones: number;
  cuota_gestion: number; retencion: number; neto_clinica: number; neto_colaboradora: number;
}
interface RepartoData {
  colaboradoras: Colaboradora[]; gastos_fijos: GastoFijo[]; ingresos: Ingreso[];
  provision_impuestos: number; ingresos_directos: number;
}

const SEED: RepartoData = {
  colaboradoras: [
    { id: "c1", nombre: "Ana García", porcentaje_gestion: 40, porcentaje_retencion: 15, fecha_alta: "2022-03-01", nueva_autonoma: false, colegiada_sanitaria: true },
    { id: "c2", nombre: "Laura Martínez", porcentaje_gestion: 40, porcentaje_retencion: 7, fecha_alta: "2025-01-15", nueva_autonoma: true, colegiada_sanitaria: false },
  ],
  gastos_fijos: [
    { id: "g1", concepto: "Alquiler", importe: 800, pagado: true },
    { id: "g2", concepto: "Seguro responsabilidad civil", importe: 45, pagado: false },
    { id: "g3", concepto: "Software gestión", importe: 29, pagado: true },
    { id: "g4", concepto: "Suministros (luz+agua)", importe: 120, pagado: false },
  ],
  ingresos: [],
  provision_impuestos: 25,
  ingresos_directos: 0,
};

const STORAGE = "raxis_reparto_v1";
const TABS = ["Mi Dinero", "Configuración", "Registro", "Resumen", "Liquidación"] as const;
type Tab = typeof TABS[number];

export default function RepartoIngresosPage() {
  const [tab, setTab] = useState<Tab>("Mi Dinero");
  const [data, setData] = useState<RepartoData>(SEED);
  const [saved, setSaved] = useState(false);
  const [showLiqModal, setShowLiqModal] = useState<string | null>(null);
  const [rango, setRango] = useState<"semana"|"mes"|"trimestre">("mes");

  // Form nueva colaboradora
  const [newColForm, setNewColForm] = useState({ nombre: "", porcentaje_gestion: 40, porcentaje_retencion: 15, fecha_alta: "", nueva_autonoma: false, colegiada_sanitaria: false });
  // Form nuevo ingreso
  const [newIngresoForm, setNewIngresoForm] = useState({ colaboradora_id: "", fecha: new Date().toISOString().slice(0,10), importe_bruto: "", sesiones: "" });
  // Form nuevo gasto fijo
  const [newGastoForm, setNewGastoForm] = useState({ concepto: "", importe: "" });

  useEffect(() => {
    try { const raw = localStorage.getItem(STORAGE); if (raw) setData(JSON.parse(raw)); } catch {}
  }, []);

  const persist = useCallback((next: RepartoData) => {
    setData(next); localStorage.setItem(STORAGE, JSON.stringify(next));
    setSaved(true); setTimeout(() => setSaved(false), 1500);
  }, []);

  // Cálculos
  const ahora = new Date();
  const mesActual = ahora.getMonth();
  const añoActual = ahora.getFullYear();

  const ingresosEsteMes = data.ingresos.filter(i => esMes(i.fecha, añoActual, mesActual));
  const totalNeto = ingresosEsteMes.reduce((s, i) => s + i.neto_clinica, 0) + data.ingresos_directos;
  const totalGastosFijos = data.gastos_fijos.reduce((s, g) => s + g.importe, 0);
  const gastosPendientes = data.gastos_fijos.filter(g => !g.pagado).reduce((s, g) => s + g.importe, 0);
  const provision = totalNeto * (data.provision_impuestos / 100);
  const disponible = totalNeto - totalGastosFijos - provision;

  // Últimos 6 meses para gráfico
  const ultimos6 = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(añoActual, mesActual - (5 - i), 1);
    const m = d.getMonth(); const a = d.getFullYear();
    const ingresosMes = data.ingresos.filter(x => esMes(x.fecha, a, m));
    const netoMes = ingresosMes.reduce((s, x) => s + x.neto_clinica, 0);
    const gastos = data.gastos_fijos.reduce((s, g) => s + g.importe, 0);
    const provMes = netoMes * (data.provision_impuestos / 100);
    const libre = Math.max(0, netoMes - gastos - provMes);
    return { label: NOMBRES_MESES[m], neto: netoMes, libre };
  });
  const maxGrafico = Math.max(...ultimos6.map(x => x.neto), 1);

  // Selector de rango para resumen
  function fechaInicio() {
    const d = new Date();
    if (rango === "semana") { d.setDate(d.getDate() - 7); }
    else if (rango === "mes") { d.setDate(1); }
    else { d.setMonth(d.getMonth() - 2); d.setDate(1); }
    return d;
  }
  const ingresosPeriodo = data.ingresos.filter(i => new Date(i.fecha) >= fechaInicio());

  function calcIngreso(bruto: number, pctGestion: number, pctRetencion: number) {
    const cuota = bruto * (pctGestion / 100);
    const ret = cuota * (pctRetencion / 100);
    return { cuota, retencion: ret, neto_clinica: cuota - ret, neto_colaboradora: bruto - cuota };
  }

  function addColaboradora() {
    if (!newColForm.nombre || !newColForm.fecha_alta) return;
    const mesDesdeAlta = añosMesDesde(newColForm.fecha_alta);
    const nueva_autonoma = mesDesdeAlta < 36;
    const col: Colaboradora = {
      id: iid(), ...newColForm, nueva_autonoma,
      porcentaje_retencion: nueva_autonoma ? 7 : newColForm.porcentaje_retencion,
    };
    persist({ ...data, colaboradoras: [...data.colaboradoras, col] });
    setNewColForm({ nombre: "", porcentaje_gestion: 40, porcentaje_retencion: 15, fecha_alta: "", nueva_autonoma: false, colegiada_sanitaria: false });
  }

  function removeColaboradora(id: string) {
    persist({ ...data, colaboradoras: data.colaboradoras.filter(c => c.id !== id) });
  }

  function updateColaboradora(id: string, campo: keyof Colaboradora, valor: string | number | boolean) {
    let updates: Partial<Colaboradora> = { [campo]: valor };
    if (campo === "fecha_alta") {
      const meses = añosMesDesde(valor as string);
      const nueva = meses < 36;
      updates = { ...updates, nueva_autonoma: nueva, porcentaje_retencion: nueva ? 7 : 15 };
    }
    if (campo === "nueva_autonoma") {
      updates = { ...updates, porcentaje_retencion: (valor as boolean) ? 7 : 15 };
    }
    persist({ ...data, colaboradoras: data.colaboradoras.map(c => c.id === id ? { ...c, ...updates } : c) });
  }

  function addIngreso() {
    const col = data.colaboradoras.find(c => c.id === newIngresoForm.colaboradora_id);
    if (!col || !newIngresoForm.importe_bruto || !newIngresoForm.fecha) return;
    const bruto = parseFloat(newIngresoForm.importe_bruto as string);
    const { cuota, retencion, neto_clinica, neto_colaboradora } = calcIngreso(bruto, col.porcentaje_gestion, col.porcentaje_retencion);
    const ingreso: Ingreso = {
      id: iid(), colaboradora_id: col.id, fecha: newIngresoForm.fecha,
      importe_bruto: bruto, sesiones: parseInt(newIngresoForm.sesiones as string) || 0,
      cuota_gestion: cuota, retencion, neto_clinica, neto_colaboradora,
    };
    persist({ ...data, ingresos: [...data.ingresos, ingreso] });
    setNewIngresoForm({ colaboradora_id: newIngresoForm.colaboradora_id, fecha: new Date().toISOString().slice(0,10), importe_bruto: "", sesiones: "" });
  }

  function removeIngreso(id: string) {
    persist({ ...data, ingresos: data.ingresos.filter(i => i.id !== id) });
  }

  function addGasto() {
    if (!newGastoForm.concepto || !newGastoForm.importe) return;
    persist({ ...data, gastos_fijos: [...data.gastos_fijos, { id: iid(), concepto: newGastoForm.concepto, importe: parseFloat(newGastoForm.importe), pagado: false }] });
    setNewGastoForm({ concepto: "", importe: "" });
  }

  function toggleGastoPagado(id: string) {
    persist({ ...data, gastos_fijos: data.gastos_fijos.map(g => g.id === id ? { ...g, pagado: !g.pagado } : g) });
  }

  function removeGasto(id: string) {
    persist({ ...data, gastos_fijos: data.gastos_fijos.filter(g => g.id !== id) });
  }

  const colLiq = showLiqModal ? data.colaboradoras.find(c => c.id === showLiqModal) : null;
  const ingresosLiq = showLiqModal ? data.ingresos.filter(i => i.colaboradora_id === showLiqModal && esMes(i.fecha, añoActual, mesActual)) : [];
  const printRef = useRef<HTMLDivElement>(null);

  return (
    <div style={{ background: C.bg, minHeight: "100vh", padding: "28px 36px", fontFamily: "'Space Grotesk', sans-serif", color: C.text }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "22px" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 700, margin: 0 }}>Reparto de Ingresos</h1>
          <p style={{ fontSize: "12px", color: C.muted, margin: "4px 0 0" }}>Gestión de clínica con colaboradoras autónomas</p>
        </div>
        <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
          {saved && <span style={{ fontSize: "11px", color: C.green }}>✓ Guardado</span>}
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "10px", color: C.muted }}>Neto clínica este mes</div>
            <div style={{ ...S.mono, fontSize: "20px", fontWeight: 800, color: totalNeto >= 0 ? C.green : C.red }}>{eur(totalNeto)}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "10px", color: C.muted }}>Disponible</div>
            <div style={{ ...S.mono, fontSize: "20px", fontWeight: 800, color: disponible >= 0 ? C.accent : C.red }}>{eur(disponible)}</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "2px", marginBottom: "20px", borderBottom: `1px solid ${C.border}` }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: "8px 14px", fontSize: "12px", fontWeight: tab === t ? 600 : 400, cursor: "pointer",
            border: "1px solid transparent", borderBottom: tab === t ? `1px solid ${C.card}` : "transparent",
            borderRadius: "6px 6px 0 0", background: tab === t ? C.card : "transparent",
            color: tab === t ? C.accent : C.muted, fontFamily: "'Space Grotesk', sans-serif", marginBottom: tab === t ? "-1px" : 0,
          }}>{t}</button>
        ))}
      </div>

      {/* ══ MI DINERO ══ */}
      {tab === "Mi Dinero" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Stat grande */}
          <div style={{ ...S.card, border: `2px solid ${C.accent}44`, background: `${C.accent}08`, textAlign: "center", padding: "28px" }}>
            <div style={{ fontSize: "13px", fontWeight: 600, color: C.mid, marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Esto es lo que es TUYO de verdad este mes
            </div>
            <div style={{ ...S.mono, fontSize: "48px", fontWeight: 900, color: totalNeto >= 0 ? C.green : C.red, lineHeight: 1 }}>{eur(totalNeto)}</div>
            <div style={{ fontSize: "12px", color: C.muted, marginTop: "8px" }}>
              Clínica: {eur(ingresosEsteMes.reduce((s, i) => s + i.neto_clinica, 0))} + Directo: {eur(data.ingresos_directos)}
            </div>
          </div>

          {/* 3 cajas */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "14px" }}>
            <div style={{ ...S.card, border: `1px solid ${C.green}44`, background: `${C.green}06` }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
                <TrendingUp size={16} color={C.green} />
                <span style={{ fontSize: "12px", fontWeight: 700, color: C.green }}>Disponible para gastar</span>
              </div>
              <div style={{ ...S.mono, fontSize: "28px", fontWeight: 900, color: disponible >= 0 ? C.green : C.red }}>{eur(disponible)}</div>
              <div style={{ fontSize: "11px", color: C.muted, marginTop: "6px", lineHeight: 1.6 }}>
                {eur(totalNeto)} neto<br />
                - {eur(totalGastosFijos)} gastos fijos<br />
                - {eur(provision)} reserva impuestos
              </div>
            </div>

            <div style={{ ...S.card, border: `1px solid ${C.amber}44`, background: `${C.amber}06` }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
                <AlertTriangle size={16} color={C.amber} />
                <span style={{ fontSize: "12px", fontWeight: 700, color: C.amber }}>Reservado para impuestos</span>
              </div>
              <div style={{ ...S.mono, fontSize: "28px", fontWeight: 900, color: C.amber }}>{eur(provision)}</div>
              <div style={{ fontSize: "11px", color: C.muted, marginTop: "6px", lineHeight: 1.6 }}>
                {data.provision_impuestos}% del neto<br />
                <span style={{ color: C.amber }}>Este dinero NO se toca</span>
              </div>
            </div>

            <div style={{ ...S.card, border: `1px solid ${gastosPendientes > 0 ? C.red : C.border}44`, background: gastosPendientes > 0 ? `${C.red}06` : undefined }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
                <TrendingDown size={16} color={gastosPendientes > 0 ? C.red : C.mid} />
                <span style={{ fontSize: "12px", fontWeight: 700, color: gastosPendientes > 0 ? C.red : C.mid }}>Gastos pendientes de pagar</span>
              </div>
              <div style={{ ...S.mono, fontSize: "28px", fontWeight: 900, color: gastosPendientes > 0 ? C.red : C.green }}>{eur(gastosPendientes)}</div>
              <div style={{ fontSize: "11px", color: C.muted, marginTop: "6px", lineHeight: 1.6 }}>
                {data.gastos_fijos.filter(g => !g.pagado).length} gasto(s) sin pagar<br />
                Total fijos: {eur(totalGastosFijos)}/mes
              </div>
            </div>
          </div>

          {/* Alerta si disponible < 0 */}
          {disponible < 0 && (
            <div style={{ padding: "14px 18px", background: `${C.red}10`, border: `1px solid ${C.red}44`, borderRadius: "10px", display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "18px" }}>⚠️</span>
              <span style={{ fontSize: "13px", color: C.red, fontWeight: 600 }}>Este mes estás gastando más de lo que puedes — revisa antes de sacar dinero</span>
            </div>
          )}

          {/* Gráfico 6 meses */}
          <div style={S.card}>
            <h3 style={{ fontSize: "13px", fontWeight: 600, margin: "0 0 16px" }}>Últimos 6 meses — Neto vs Dinero libre</h3>
            <div style={{ display: "flex", alignItems: "flex-end", gap: "10px", height: "120px" }}>
              {ultimos6.map((mes, i) => (
                <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", height: "100%" }}>
                  <div style={{ flex: 1, width: "100%", display: "flex", flexDirection: "column", justifyContent: "flex-end", gap: "2px" }}>
                    <div style={{ width: "100%", height: `${(mes.neto / maxGrafico) * 100}%`, background: `${C.accent}33`, borderRadius: "4px 4px 0 0", minHeight: mes.neto > 0 ? "4px" : "0", position: "relative" }}>
                      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: `${mes.neto > 0 ? (mes.libre / mes.neto) * 100 : 0}%`, background: C.green, borderRadius: "4px 4px 0 0", minHeight: mes.libre > 0 ? "4px" : "0" }} />
                    </div>
                  </div>
                  <div style={{ fontSize: "10px", color: C.muted }}>{mes.label}</div>
                  <div style={{ ...S.mono, fontSize: "9px", color: C.mid }}>{eur(mes.neto)}</div>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: "16px", marginTop: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <div style={{ width: "10px", height: "10px", background: `${C.accent}33`, borderRadius: "2px" }} />
                <span style={{ fontSize: "11px", color: C.muted }}>Neto clínica</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <div style={{ width: "10px", height: "10px", background: C.green, borderRadius: "2px" }} />
                <span style={{ fontSize: "11px", color: C.muted }}>Dinero libre</span>
              </div>
            </div>
          </div>

          {/* Ingresos directos */}
          <div style={S.card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
              <h3 style={{ fontSize: "13px", fontWeight: 600, margin: 0 }}>Mis ingresos directos este mes</h3>
              <span style={{ fontSize: "11px", color: C.muted }}>Si yo también atiendo pacientes</span>
            </div>
            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <input
                type="number" min="0" step="10"
                value={data.ingresos_directos || ""}
                onChange={e => persist({ ...data, ingresos_directos: parseFloat(e.target.value) || 0 })}
                style={{ ...S.input, maxWidth: "160px", ...S.mono, fontSize: "16px" }}
                placeholder="0.00"
              />
              <span style={{ fontSize: "12px", color: C.muted }}>€ — mis propias sesiones como terapeuta</span>
            </div>
          </div>
        </div>
      )}

      {/* ══ CONFIGURACIÓN ══ */}
      {tab === "Configuración" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Colaboradoras */}
          <div style={S.card}>
            <h3 style={{ fontSize: "13px", fontWeight: 600, margin: "0 0 16px", display: "flex", alignItems: "center", gap: "8px" }}>
              <Users size={14} /> Colaboradoras autónomas
            </h3>
            {data.colaboradoras.map(col => (
              <div key={col.id} style={{ padding: "14px", background: C.bg, borderRadius: "8px", border: `1px solid ${C.border}`, marginBottom: "10px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr auto", gap: "12px", alignItems: "end" }}>
                  <div>
                    <span style={S.lbl}>Nombre</span>
                    <input style={S.input} value={col.nombre} onChange={e => updateColaboradora(col.id, "nombre", e.target.value)} />
                  </div>
                  <div>
                    <span style={S.lbl}>% Gestión clínica</span>
                    <input type="number" min="0" max="100" style={S.input} value={col.porcentaje_gestion} onChange={e => updateColaboradora(col.id, "porcentaje_gestion", parseFloat(e.target.value))} />
                  </div>
                  <div>
                    <span style={S.lbl}>% IRPF retención</span>
                    <input type="number" min="0" max="100" style={{ ...S.input, color: col.nueva_autonoma ? C.amber : C.text }} value={col.porcentaje_retencion} onChange={e => updateColaboradora(col.id, "porcentaje_retencion", parseFloat(e.target.value))} />
                  </div>
                  <div>
                    <span style={S.lbl}>Fecha de alta autónoma</span>
                    <input type="date" style={S.input} value={col.fecha_alta} onChange={e => updateColaboradora(col.id, "fecha_alta", e.target.value)} />
                  </div>
                  <button onClick={() => removeColaboradora(col.id)} style={{ ...S.danger, padding: "7px 10px" }}>
                    <Trash2 size={12} />
                  </button>
                </div>
                <div style={{ display: "flex", gap: "20px", marginTop: "12px" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", fontSize: "12px" }}>
                    <input type="checkbox" checked={col.nueva_autonoma} onChange={e => updateColaboradora(col.id, "nueva_autonoma", e.target.checked)} style={{ accentColor: C.amber }} />
                    <span style={{ color: col.nueva_autonoma ? C.amber : C.muted }}>Nueva autónoma (alta &lt;3 años → IRPF 7%)</span>
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", fontSize: "12px" }}>
                    <input type="checkbox" checked={col.colegiada_sanitaria} onChange={e => updateColaboradora(col.id, "colegiada_sanitaria", e.target.checked)} style={{ accentColor: C.green }} />
                    <span style={{ color: col.colegiada_sanitaria ? C.green : C.muted }}>Colegiada sanitaria (sin IVA)</span>
                  </label>
                </div>
                <div style={{ display: "flex", gap: "6px", marginTop: "8px" }}>
                  {col.nueva_autonoma && <span style={badge(C.amber)}>IRPF 7%</span>}
                  {col.colegiada_sanitaria && <span style={badge(C.green)}>Sin IVA</span>}
                  <span style={badge(C.accent)}>{col.porcentaje_gestion}% gestión</span>
                </div>
              </div>
            ))}

            {/* Añadir colaboradora */}
            <div style={{ padding: "14px", background: `${C.accent}06`, borderRadius: "8px", border: `1px dashed ${C.accent}33` }}>
              <div style={{ fontSize: "11px", fontWeight: 600, color: C.accent, marginBottom: "10px" }}>+ Nueva colaboradora</div>
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr auto", gap: "10px", alignItems: "end" }}>
                <div>
                  <span style={S.lbl}>Nombre</span>
                  <input style={S.input} value={newColForm.nombre} onChange={e => setNewColForm(f => ({ ...f, nombre: e.target.value }))} placeholder="María Sánchez" />
                </div>
                <div>
                  <span style={S.lbl}>% Gestión</span>
                  <input type="number" style={S.input} value={newColForm.porcentaje_gestion} onChange={e => setNewColForm(f => ({ ...f, porcentaje_gestion: parseFloat(e.target.value) }))} />
                </div>
                <div>
                  <span style={S.lbl}>% IRPF</span>
                  <input type="number" style={S.input} value={newColForm.porcentaje_retencion} onChange={e => setNewColForm(f => ({ ...f, porcentaje_retencion: parseFloat(e.target.value) }))} />
                </div>
                <div>
                  <span style={S.lbl}>Fecha alta</span>
                  <input type="date" style={S.input} value={newColForm.fecha_alta} onChange={e => setNewColForm(f => ({ ...f, fecha_alta: e.target.value }))} />
                </div>
                <button onClick={addColaboradora} style={S.btn}><Plus size={13} />Añadir</button>
              </div>
              <div style={{ display: "flex", gap: "16px", marginTop: "10px" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", fontSize: "12px" }}>
                  <input type="checkbox" checked={newColForm.nueva_autonoma} onChange={e => setNewColForm(f => ({ ...f, nueva_autonoma: e.target.checked }))} style={{ accentColor: C.amber }} />
                  <span style={{ color: C.muted }}>Nueva autónoma (&lt;3 años)</span>
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", fontSize: "12px" }}>
                  <input type="checkbox" checked={newColForm.colegiada_sanitaria} onChange={e => setNewColForm(f => ({ ...f, colegiada_sanitaria: e.target.checked }))} style={{ accentColor: C.green }} />
                  <span style={{ color: C.muted }}>Colegiada sanitaria</span>
                </label>
              </div>
            </div>
          </div>

          {/* Gastos fijos */}
          <div style={S.card}>
            <h3 style={{ fontSize: "13px", fontWeight: 600, margin: "0 0 16px", display: "flex", alignItems: "center", gap: "8px" }}>
              <Euro size={14} /> Gastos fijos de la clínica
            </h3>
            {data.gastos_fijos.map(g => (
              <div key={g.id} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 0", borderBottom: `1px solid ${C.border}` }}>
                <input type="checkbox" checked={g.pagado} onChange={() => toggleGastoPagado(g.id)} style={{ accentColor: C.green }} />
                <span style={{ flex: 1, fontSize: "12px", color: g.pagado ? C.muted : C.text, textDecoration: g.pagado ? "line-through" : "none" }}>{g.concepto}</span>
                <span style={{ ...S.mono, fontSize: "13px", color: g.pagado ? C.muted : C.amber }}>{eur(g.importe)}</span>
                <span style={{ ...badge(g.pagado ? C.green : C.amber), marginLeft: "4px" }}>{g.pagado ? "PAGADO" : "PENDIENTE"}</span>
                <button onClick={() => removeGasto(g.id)} style={{ ...S.danger, padding: "4px 8px" }}><Trash2 size={11} /></button>
              </div>
            ))}
            <div style={{ display: "flex", gap: "10px", marginTop: "14px", alignItems: "flex-end" }}>
              <div style={{ flex: 2 }}>
                <span style={S.lbl}>Concepto</span>
                <input style={S.input} value={newGastoForm.concepto} onChange={e => setNewGastoForm(f => ({ ...f, concepto: e.target.value }))} placeholder="Alquiler, seguros, software..." />
              </div>
              <div style={{ flex: 1 }}>
                <span style={S.lbl}>Importe (€/mes)</span>
                <input type="number" style={S.input} value={newGastoForm.importe} onChange={e => setNewGastoForm(f => ({ ...f, importe: e.target.value }))} placeholder="0.00" />
              </div>
              <button onClick={addGasto} style={S.btn}><Plus size={13} />Añadir</button>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "10px", fontWeight: 700, fontSize: "13px" }}>
              <span style={{ color: C.muted, marginRight: "12px" }}>Total gastos fijos / mes:</span>
              <span style={{ ...S.mono, color: C.red }}>{eur(totalGastosFijos)}</span>
            </div>
          </div>

          {/* Provisión impuestos */}
          <div style={S.card}>
            <h3 style={{ fontSize: "13px", fontWeight: 600, margin: "0 0 12px" }}>Provisión para impuestos</h3>
            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              <div>
                <span style={S.lbl}>% a reservar del neto (recomendado: 25%)</span>
                <input type="number" min="0" max="50" style={{ ...S.input, maxWidth: "100px" }} value={data.provision_impuestos} onChange={e => persist({ ...data, provision_impuestos: parseFloat(e.target.value) || 0 })} />
              </div>
              <div style={{ fontSize: "12px", color: C.muted, marginTop: "14px" }}>
                → Reservas este mes: <strong style={{ color: C.amber, ...S.mono }}>{eur(provision)}</strong>
                <span style={{ color: C.muted }}> — confirma el % con tu gestoría</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══ REGISTRO ══ */}
      {tab === "Registro" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Formulario */}
          <div style={{ ...S.card, border: `1px solid ${C.accent}33` }}>
            <h3 style={{ fontSize: "13px", fontWeight: 600, margin: "0 0 14px" }}>Registrar ingreso</h3>
            {data.colaboradoras.length === 0 ? (
              <div style={{ fontSize: "12px", color: C.muted, textAlign: "center", padding: "20px" }}>
                Añade colaboradoras primero en la pestaña Configuración
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr auto", gap: "12px", alignItems: "end" }}>
                <div>
                  <span style={S.lbl}>Colaboradora</span>
                  <select style={{ ...S.input }} value={newIngresoForm.colaboradora_id} onChange={e => setNewIngresoForm(f => ({ ...f, colaboradora_id: e.target.value }))}>
                    <option value="">Seleccionar...</option>
                    {data.colaboradoras.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                  </select>
                </div>
                <div>
                  <span style={S.lbl}>Fecha</span>
                  <input type="date" style={S.input} value={newIngresoForm.fecha} onChange={e => setNewIngresoForm(f => ({ ...f, fecha: e.target.value }))} />
                </div>
                <div>
                  <span style={S.lbl}>Importe facturado (€)</span>
                  <input type="number" min="0" style={S.input} value={newIngresoForm.importe_bruto} onChange={e => setNewIngresoForm(f => ({ ...f, importe_bruto: e.target.value }))} placeholder="0.00" />
                </div>
                <div>
                  <span style={S.lbl}>Nº sesiones (opcional)</span>
                  <input type="number" min="0" style={S.input} value={newIngresoForm.sesiones} onChange={e => setNewIngresoForm(f => ({ ...f, sesiones: e.target.value }))} placeholder="0" />
                </div>
                <button onClick={addIngreso} style={S.btn}><Save size={13} />Guardar</button>
              </div>
            )}

            {/* Preview cálculo */}
            {newIngresoForm.colaboradora_id && newIngresoForm.importe_bruto && (() => {
              const col = data.colaboradoras.find(c => c.id === newIngresoForm.colaboradora_id);
              if (!col) return null;
              const bruto = parseFloat(newIngresoForm.importe_bruto as string);
              const { cuota, retencion, neto_clinica, neto_colaboradora } = calcIngreso(bruto, col.porcentaje_gestion, col.porcentaje_retencion);
              return (
                <div style={{ marginTop: "14px", padding: "12px", background: C.bg, borderRadius: "8px", border: `1px solid ${C.border}` }}>
                  <div style={{ fontSize: "10px", color: C.muted, marginBottom: "8px", fontWeight: 700, letterSpacing: "0.08em" }}>CÁLCULO AUTOMÁTICO — {col.nombre}</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px" }}>
                    {[
                      { l: "Bruto facturado", v: eur(bruto), c: C.text },
                      { l: `Cuota gestión (${col.porcentaje_gestion}%)`, v: eur(cuota), c: C.accent },
                      { l: `Retención IRPF (${col.porcentaje_retencion}%)`, v: eur(retencion), c: C.amber },
                      { l: "Neto clínica", v: eur(neto_clinica), c: C.green },
                    ].map(({ l, v, c }) => (
                      <div key={l} style={{ padding: "8px 10px", background: C.card, borderRadius: "6px" }}>
                        <div style={{ fontSize: "10px", color: C.muted, marginBottom: "3px" }}>{l}</div>
                        <div style={{ ...S.mono, fontSize: "14px", fontWeight: 700, color: c }}>{v}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: "8px", fontSize: "11px", color: C.mid }}>
                    → {col.nombre} se queda: <strong style={{ color: C.text, ...S.mono }}>{eur(neto_colaboradora)}</strong>
                    {col.colegiada_sanitaria && <span style={{ ...badge(C.green), marginLeft: "8px" }}>Sin IVA</span>}
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Historial */}
          <div style={{ ...S.card, padding: 0, overflow: "hidden" }}>
            <div style={{ padding: "14px 18px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between" }}>
              <h3 style={{ fontSize: "13px", fontWeight: 600, margin: 0 }}>Historial de ingresos</h3>
              <span style={{ ...S.mono, fontSize: "12px", color: C.green }}>{data.ingresos.length} registros</span>
            </div>
            {data.ingresos.length === 0 ? (
              <div style={{ padding: "24px", textAlign: "center", fontSize: "12px", color: C.muted }}>No hay registros aún</div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px" }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                    {["Colaboradora", "Fecha", "Bruto", "Cuota gestión", "IRPF", "Neto clínica", "Neto colaboradora", "Sesiones", ""].map(h => (
                      <th key={h} style={{ padding: "8px 12px", textAlign: "left", color: C.muted, fontWeight: 600, fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.07em" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...data.ingresos].reverse().map(i => {
                    const col = data.colaboradoras.find(c => c.id === i.colaboradora_id);
                    return (
                      <tr key={i.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                        <td style={{ padding: "8px 12px", fontWeight: 600 }}>{col?.nombre ?? "—"}</td>
                        <td style={{ padding: "8px 12px", color: C.mid }}>{new Date(i.fecha).toLocaleDateString("es")}</td>
                        <td style={{ padding: "8px 12px", ...S.mono }}>{eur(i.importe_bruto)}</td>
                        <td style={{ padding: "8px 12px", ...S.mono, color: C.accent }}>{eur(i.cuota_gestion)}</td>
                        <td style={{ padding: "8px 12px", ...S.mono, color: C.amber }}>{eur(i.retencion)}</td>
                        <td style={{ padding: "8px 12px", ...S.mono, color: C.green, fontWeight: 700 }}>{eur(i.neto_clinica)}</td>
                        <td style={{ padding: "8px 12px", ...S.mono }}>{eur(i.neto_colaboradora)}</td>
                        <td style={{ padding: "8px 12px", color: C.muted }}>{i.sesiones || "—"}</td>
                        <td style={{ padding: "8px 12px" }}>
                          <button onClick={() => removeIngreso(i.id)} style={{ ...S.danger, padding: "3px 8px" }}><Trash2 size={11} /></button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ══ RESUMEN ══ */}
      {tab === "Resumen" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Selector rango */}
          <div style={{ display: "flex", gap: "6px" }}>
            {(["semana", "mes", "trimestre"] as const).map(r => (
              <button key={r} onClick={() => setRango(r)} style={{
                padding: "6px 14px", borderRadius: "6px", fontSize: "12px", fontWeight: rango === r ? 700 : 400,
                border: `1px solid ${rango === r ? C.accent : C.border}`, background: rango === r ? `${C.accent}15` : "transparent",
                color: rango === r ? C.accent : C.mid, cursor: "pointer",
              }}>
                {r.charAt(0).toUpperCase() + r.slice(1)}
              </button>
            ))}
          </div>

          {/* Stat cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
            {[
              { l: "Total neto clínica", v: eur(ingresosPeriodo.reduce((s, i) => s + i.neto_clinica, 0)), c: C.green },
              { l: "Total retenciones (Mod. 111)", v: eur(ingresosPeriodo.reduce((s, i) => s + i.retencion, 0)), c: C.amber },
              { l: "Sesiones totales", v: `${ingresosPeriodo.reduce((s, i) => s + (i.sesiones || 0), 0)}`, c: C.accent },
            ].map(({ l, v, c }) => (
              <div key={l} style={S.card}>
                <div style={{ fontSize: "10px", color: C.muted, marginBottom: "4px" }}>{l}</div>
                <div style={{ ...S.mono, fontSize: "22px", fontWeight: 800, color: c }}>{v}</div>
              </div>
            ))}
          </div>

          {/* Tabla por colaboradora */}
          <div style={{ ...S.card, padding: 0, overflow: "hidden" }}>
            <div style={{ padding: "14px 18px", borderBottom: `1px solid ${C.border}` }}>
              <h3 style={{ fontSize: "13px", fontWeight: 600, margin: 0 }}>Detalle por colaboradora</h3>
            </div>
            {data.colaboradoras.length === 0 ? (
              <div style={{ padding: "24px", textAlign: "center", fontSize: "12px", color: C.muted }}>No hay colaboradoras configuradas</div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px" }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                    {["Colaboradora", "Nº sesiones", "Total facturado", "Cuota gestión", "Retención", "Neto clínica", "Neto colaboradora", "Ticket medio"].map(h => (
                      <th key={h} style={{ padding: "8px 14px", textAlign: "left", color: C.muted, fontWeight: 600, fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.07em" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.colaboradoras.map(col => {
                    const rows = ingresosPeriodo.filter(i => i.colaboradora_id === col.id);
                    const totBruto = rows.reduce((s, i) => s + i.importe_bruto, 0);
                    const totGestion = rows.reduce((s, i) => s + i.cuota_gestion, 0);
                    const totRet = rows.reduce((s, i) => s + i.retencion, 0);
                    const totNeto = rows.reduce((s, i) => s + i.neto_clinica, 0);
                    const totNetoCola = rows.reduce((s, i) => s + i.neto_colaboradora, 0);
                    const totSesiones = rows.reduce((s, i) => s + (i.sesiones || 0), 0);
                    const ticket = totSesiones > 0 ? totBruto / totSesiones : 0;
                    return (
                      <tr key={col.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                        <td style={{ padding: "10px 14px", fontWeight: 600 }}>
                          {col.nombre}
                          <div style={{ display: "flex", gap: "4px", marginTop: "3px" }}>
                            {col.nueva_autonoma && <span style={badge(C.amber)}>7% IRPF</span>}
                            {col.colegiada_sanitaria && <span style={badge(C.green)}>Sin IVA</span>}
                          </div>
                        </td>
                        <td style={{ padding: "10px 14px", ...S.mono, color: C.mid }}>{totSesiones || "—"}</td>
                        <td style={{ padding: "10px 14px", ...S.mono }}>{eur(totBruto)}</td>
                        <td style={{ padding: "10px 14px", ...S.mono, color: C.accent }}>{eur(totGestion)}</td>
                        <td style={{ padding: "10px 14px", ...S.mono, color: C.amber }}>{eur(totRet)}</td>
                        <td style={{ padding: "10px 14px", ...S.mono, color: C.green, fontWeight: 700 }}>{eur(totNeto)}</td>
                        <td style={{ padding: "10px 14px", ...S.mono }}>{eur(totNetoCola)}</td>
                        <td style={{ padding: "10px 14px", ...S.mono, color: C.mid }}>{ticket > 0 ? eur(ticket) : "—"}</td>
                      </tr>
                    );
                  })}
                  {/* Fila total */}
                  <tr style={{ background: `${C.accent}08`, borderTop: `2px solid ${C.border}` }}>
                    <td style={{ padding: "10px 14px", fontWeight: 700, color: C.accent }}>TOTAL</td>
                    <td style={{ padding: "10px 14px", ...S.mono }}>{ingresosPeriodo.reduce((s, i) => s + (i.sesiones || 0), 0) || "—"}</td>
                    <td style={{ padding: "10px 14px", ...S.mono, fontWeight: 700 }}>{eur(ingresosPeriodo.reduce((s, i) => s + i.importe_bruto, 0))}</td>
                    <td style={{ padding: "10px 14px", ...S.mono, color: C.accent, fontWeight: 700 }}>{eur(ingresosPeriodo.reduce((s, i) => s + i.cuota_gestion, 0))}</td>
                    <td style={{ padding: "10px 14px", ...S.mono, color: C.amber, fontWeight: 700 }}>{eur(ingresosPeriodo.reduce((s, i) => s + i.retencion, 0))}</td>
                    <td style={{ padding: "10px 14px", ...S.mono, color: C.green, fontWeight: 900 }}>{eur(ingresosPeriodo.reduce((s, i) => s + i.neto_clinica, 0))}</td>
                    <td style={{ padding: "10px 14px", ...S.mono, fontWeight: 700 }}>{eur(ingresosPeriodo.reduce((s, i) => s + i.neto_colaboradora, 0))}</td>
                    <td />
                  </tr>
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ══ LIQUIDACIÓN ══ */}
      {tab === "Liquidación" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div style={{ fontSize: "13px", color: C.muted }}>
            Genera un justificante de liquidación para cada colaboradora — mes actual ({NOMBRES_MESES[mesActual]} {añoActual}).
          </div>
          {data.colaboradoras.length === 0 ? (
            <div style={{ ...S.card, textAlign: "center", color: C.muted, fontSize: "12px" }}>No hay colaboradoras configuradas</div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              {data.colaboradoras.map(col => {
                const rows = data.ingresos.filter(i => i.colaboradora_id === col.id && esMes(i.fecha, añoActual, mesActual));
                const totBruto = rows.reduce((s, i) => s + i.importe_bruto, 0);
                const totGestion = rows.reduce((s, i) => s + i.cuota_gestion, 0);
                const totRet = rows.reduce((s, i) => s + i.retencion, 0);
                const totNeto = rows.reduce((s, i) => s + i.neto_clinica, 0);
                const totNetoCola = rows.reduce((s, i) => s + i.neto_colaboradora, 0);
                return (
                  <div key={col.id} style={S.card}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: "14px" }}>{col.nombre}</div>
                        <div style={{ fontSize: "11px", color: C.muted, marginTop: "2px" }}>{rows.length} registros · {NOMBRES_MESES[mesActual]} {añoActual}</div>
                      </div>
                      <div style={{ display: "flex", gap: "4px" }}>
                        {col.nueva_autonoma && <span style={badge(C.amber)}>7% IRPF</span>}
                        {col.colegiada_sanitaria && <span style={badge(C.green)}>Sin IVA</span>}
                      </div>
                    </div>
                    {[
                      { l: "Bruto facturado", v: eur(totBruto), c: C.text },
                      { l: `Cuota gestión (${col.porcentaje_gestion}%)`, v: eur(totGestion), c: C.accent },
                      { l: `Retención IRPF (${col.porcentaje_retencion}%)`, v: `- ${eur(totRet)}`, c: C.amber },
                      { l: "Neto que percibe la colaboradora", v: eur(totNetoCola), c: C.green },
                    ].map(({ l, v, c }) => (
                      <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: `1px solid ${C.border}` }}>
                        <span style={{ fontSize: "12px", color: C.mid }}>{l}</span>
                        <span style={{ ...S.mono, fontSize: "13px", color: c, fontWeight: 600 }}>{v}</span>
                      </div>
                    ))}
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0 0", fontWeight: 700 }}>
                      <span style={{ fontSize: "12px", color: C.muted }}>Neto clínica este mes</span>
                      <span style={{ ...S.mono, color: C.accent, fontSize: "15px" }}>{eur(totNeto)}</span>
                    </div>
                    <button
                      onClick={() => setShowLiqModal(col.id)}
                      style={{ ...S.btn, width: "100%", justifyContent: "center", marginTop: "12px" }}
                    >
                      <FileText size={13} /> Generar liquidación PDF
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ══ MODAL LIQUIDACIÓN PDF ══ */}
      {showLiqModal && colLiq && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "14px", width: "620px", maxHeight: "85vh", overflowY: "auto", padding: "28px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h2 style={{ fontSize: "16px", fontWeight: 700, margin: 0 }}>Liquidación — {colLiq.nombre}</h2>
              <div style={{ display: "flex", gap: "8px" }}>
                <button onClick={() => window.print()} style={S.btn}><FileText size={12} />Imprimir / PDF</button>
                <button onClick={() => setShowLiqModal(null)} style={S.ghost}><X size={12} /></button>
              </div>
            </div>
            <div ref={printRef} style={{ lineHeight: 1.7 }}>
              <div style={{ textAlign: "center", marginBottom: "20px", paddingBottom: "16px", borderBottom: `1px solid ${C.border}` }}>
                <div style={{ fontSize: "20px", fontWeight: 900, color: C.accent, letterSpacing: "0.1em" }}>LIQUIDACIÓN DE HONORARIOS</div>
                <div style={{ fontSize: "12px", color: C.mid }}>{NOMBRES_MESES[mesActual]} {añoActual}</div>
              </div>
              <div style={{ marginBottom: "16px" }}>
                <strong style={{ fontSize: "13px" }}>{colLiq.nombre}</strong>
                <div style={{ fontSize: "12px", color: C.muted }}>
                  Alta como autónoma: {new Date(colLiq.fecha_alta).toLocaleDateString("es")} ·
                  {colLiq.nueva_autonoma ? " Tipo reducido 7% IRPF" : ` IRPF ${colLiq.porcentaje_retencion}%`} ·
                  {colLiq.colegiada_sanitaria ? " Operaciones exentas IVA (sanitaria colegiada)" : " Sujeto a IVA"}
                </div>
              </div>
              {ingresosLiq.length === 0 ? (
                <div style={{ fontSize: "12px", color: C.muted, textAlign: "center", padding: "20px" }}>No hay registros para este mes</div>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", marginBottom: "16px" }}>
                  <thead>
                    <tr style={{ borderBottom: `2px solid ${C.border}` }}>
                      {["Fecha", "Bruto", "Cuota gestión", "IRPF", "Neto colaboradora"].map(h => (
                        <th key={h} style={{ padding: "6px 8px", textAlign: "left", color: C.muted, fontSize: "10px", textTransform: "uppercase" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {ingresosLiq.map(i => (
                      <tr key={i.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                        <td style={{ padding: "6px 8px" }}>{new Date(i.fecha).toLocaleDateString("es")}</td>
                        <td style={{ padding: "6px 8px", ...S.mono }}>{eur(i.importe_bruto)}</td>
                        <td style={{ padding: "6px 8px", ...S.mono, color: C.accent }}>{eur(i.cuota_gestion)}</td>
                        <td style={{ padding: "6px 8px", ...S.mono, color: C.amber }}>- {eur(i.retencion)}</td>
                        <td style={{ padding: "6px 8px", ...S.mono, color: C.green, fontWeight: 700 }}>{eur(i.neto_colaboradora)}</td>
                      </tr>
                    ))}
                    <tr style={{ borderTop: `2px solid ${C.border}`, fontWeight: 700 }}>
                      <td style={{ padding: "8px" }}>TOTAL</td>
                      <td style={{ padding: "8px", ...S.mono }}>{eur(ingresosLiq.reduce((s, i) => s + i.importe_bruto, 0))}</td>
                      <td style={{ padding: "8px", ...S.mono, color: C.accent }}>{eur(ingresosLiq.reduce((s, i) => s + i.cuota_gestion, 0))}</td>
                      <td style={{ padding: "8px", ...S.mono, color: C.amber }}>- {eur(ingresosLiq.reduce((s, i) => s + i.retencion, 0))}</td>
                      <td style={{ padding: "8px", ...S.mono, color: C.green, fontSize: "15px" }}>{eur(ingresosLiq.reduce((s, i) => s + i.neto_colaboradora, 0))}</td>
                    </tr>
                  </tbody>
                </table>
              )}
              <div style={{ marginTop: "16px", fontSize: "11px", color: C.muted, borderTop: `1px solid ${C.border}`, paddingTop: "12px", lineHeight: 1.9 }}>
                <div>La clínica retendrá e ingresará a la AEAT la cantidad correspondiente al IRPF mediante el <strong>Modelo 111</strong>.</div>
                <div>Este documento tiene carácter informativo y debe conservarse como justificante de liquidación.</div>
                <div style={{ marginTop: "8px", color: C.mid }}>
                  Firmado: _________________________ Fecha: {new Date().toLocaleDateString("es")}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
