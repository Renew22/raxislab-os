"use client";
import { useState, useEffect, useCallback } from "react";
import { Camera, Package, Calculator, FileText, Plus, Trash2, Save } from "lucide-react";

/* ── Design tokens ── */
const C = {
  bg: "#0A0A0F", card: "#13131A", border: "#1E1E2E",
  accent: "#C8F542", green: "#00C864", red: "#FF3232", amber: "#FFAA00",
  text: "#E8E8F0", mid: "#9898B0", muted: "#5A5A70",
};
const S: Record<string, React.CSSProperties> = {
  card:  { background: C.card, border: `1px solid ${C.border}`, borderRadius: "12px", padding: "20px" },
  input: { width: "100%", padding: "9px 12px", background: C.bg, border: `1px solid ${C.border}`, borderRadius: "7px", color: C.text, fontSize: "13px", outline: "none", boxSizing: "border-box" as const },
  btn:   { padding: "9px 18px", borderRadius: "7px", border: "none", background: C.accent, color: "#000", fontSize: "13px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" },
  lbl:   { fontSize: "10px", fontWeight: 700, letterSpacing: "0.09em", textTransform: "uppercase" as const, color: C.muted, marginBottom: "5px", display: "block" },
  mono:  { fontFamily: "'Space Mono', monospace" },
  ghost: { padding: "7px 13px", borderRadius: "6px", border: `1px solid ${C.border}`, background: "transparent", color: C.mid, fontSize: "12px", cursor: "pointer", display: "flex", alignItems: "center", gap: "5px" },
};

/* ── Types ── */
interface Equipo { id: string; nombre: string; valor: number; vida_util: number; categoria: string }
interface Sesion { id: string; fecha: string; cliente: string; tipo: string; horas: number; ayudante: boolean; edicion_ext: boolean; nota: string }

const STORAGE = "raxis_filmmaking_v1";

const EQUIPO_DEFAULT: Equipo[] = [
  { id: "c1",  nombre: "Cámara principal",         valor: 2200, vida_util: 5, categoria: "Cámara"       },
  { id: "c2",  nombre: "Cámara secundaria/backup",  valor: 1200, vida_util: 5, categoria: "Cámara"       },
  { id: "l1",  nombre: "Lente 24-70mm f/2.8",       valor: 900,  vida_util: 8, categoria: "Óptica"       },
  { id: "l2",  nombre: "Lente 85mm f/1.8 (retrato)", valor: 500,  vida_util: 8, categoria: "Óptica"       },
  { id: "l3",  nombre: "Lente gran angular",         valor: 600,  vida_util: 8, categoria: "Óptica"       },
  { id: "g1",  nombre: "Estabilizador / Gimbal",     valor: 700,  vida_util: 4, categoria: "Movimiento"   },
  { id: "a1",  nombre: "Micrófono",                  valor: 300,  vida_util: 6, categoria: "Audio"        },
  { id: "lu1", nombre: "Kit iluminación fondo blanco", valor: 600, vida_util: 6, categoria: "Iluminación" },
  { id: "ac1", nombre: "Tarjetas, baterías, tripodes", valor: 350, vida_util: 3, categoria: "Accesorios"  },
];

const CATEGORIAS = ["Cámara","Óptica","Movimiento","Audio","Iluminación","Accesorios","Otro"];
const TIPOS_SESION = ["Discoteca / Evento nocturno","Reels / Contenido redes","Foto producto / Estudio","Entrevista / Corporativo","Boda / Celebración","Videoclip","Otro"];

function euro(n: number) { return n.toLocaleString("es", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }); }
function today() { return new Date().toISOString().slice(0, 10); }

/* ═════════════════════════════════════════════════════ */
export default function FilmmakingPage() {
  const [tab, setTab] = useState<"inventario" | "calc" | "sesiones" | "propuesta">("inventario");
  const [equipo,   setEquipo]   = useState<Equipo[]>(EQUIPO_DEFAULT);
  const [sesiones, setSesiones] = useState<Sesion[]>([]);
  const [saved, setSaved]       = useState(false);

  /* ── Calc state ── */
  const [cTipo,     setCTipo]     = useState(TIPOS_SESION[0]);
  const [cHoras,    setCHoras]    = useState(5);
  const [cAyudante, setCAyudante] = useState(true);
  const [cEdicion,  setCEdicion]  = useState(true);
  const [cEntregas, setCEntregas] = useState(3);
  const [cDesplaz,  setCDesplaz]  = useState(15);

  /* ── Sesion form ── */
  const [showForm, setShowForm]   = useState(false);
  const [form, setForm]           = useState<Partial<Sesion>>({ fecha: today(), tipo: TIPOS_SESION[0], horas: 5, ayudante: true, edicion_ext: true });

  /* ── Equipo form ── */
  const [showEqForm, setShowEqForm] = useState(false);
  const [eqForm, setEqForm]         = useState<Partial<Equipo>>({ categoria: "Cámara", vida_util: 5 });

  const persist = useCallback((eq: Equipo[], ses: Sesion[]) => {
    localStorage.setItem(STORAGE, JSON.stringify({ eq, ses }));
    setSaved(true); setTimeout(() => setSaved(false), 1600);
  }, []);

  useEffect(() => {
    try {
      const d = JSON.parse(localStorage.getItem(STORAGE) || "{}");
      if (d.eq?.length) setEquipo(d.eq);
      if (d.ses) setSesiones(d.ses);
    } catch {}
  }, []);

  /* ── Cálculos inventario ── */
  const totalInversion  = equipo.reduce((s, e) => s + e.valor, 0);
  const amortAnual      = equipo.reduce((s, e) => s + e.valor / e.vida_util, 0);
  const amortMes        = amortAnual / 12;
  const amortDia        = amortAnual / 365;

  /* ── Calculadora de precio ── */
  const TARIFA_HORA     = 65;   // €/hora tu tiempo
  const AYUDANTE_NOCHE  = 100;  // €/noche ayudante sin edición
  const EDICION_REEL    = 40;   // €/reel edición subcontratada
  const costeTiempo     = cHoras * TARIFA_HORA;
  const costeAyudante   = cAyudante ? AYUDANTE_NOCHE : 0;
  const costeEdicion    = cEdicion ? cEntregas * EDICION_REEL : 0;
  const costeAmort      = amortDia * (cHoras / 8);
  const costeDesplaz    = cDesplaz;
  const costeTOTAL      = costeTiempo + costeAyudante + costeEdicion + costeAmort + costeDesplaz;
  const precioMin       = Math.ceil(costeTOTAL * 1.5 / 10) * 10;   // margen 50%
  const precioRec       = Math.ceil(costeTOTAL * 2.2 / 10) * 10;   // margen 120%
  const precioTop       = Math.ceil(costeTOTAL * 3.0 / 10) * 10;   // margen 200%
  const gananciaRec     = precioRec - costeTOTAL;

  /* ── Sesiones ── */
  const totalFacturado  = sesiones.reduce((s, x) => s + calcSesionPrecio(x), 0);
  const totalSesiones   = sesiones.length;

  function calcSesionPrecio(s: Sesion) {
    return Math.ceil(
      (s.horas * TARIFA_HORA + (s.ayudante ? AYUDANTE_NOCHE : 0) + (s.edicion_ext ? EDICION_REEL * 3 : 0) + costeDesplaz) * 2.2 / 10
    ) * 10;
  }

  function addEquipo() {
    if (!eqForm.nombre || !eqForm.valor) return;
    const e: Equipo = { id: Date.now().toString(), nombre: eqForm.nombre, valor: Number(eqForm.valor), vida_util: Number(eqForm.vida_util || 5), categoria: eqForm.categoria || "Otro" };
    const next = [...equipo, e]; setEquipo(next); persist(next, sesiones);
    setEqForm({ categoria: "Cámara", vida_util: 5 }); setShowEqForm(false);
  }
  function delEquipo(id: string) { const next = equipo.filter(e => e.id !== id); setEquipo(next); persist(next, sesiones); }

  function addSesion() {
    if (!form.cliente || !form.fecha) return;
    const s: Sesion = { id: Date.now().toString(), fecha: form.fecha!, cliente: form.cliente!, tipo: form.tipo || TIPOS_SESION[0], horas: Number(form.horas || 5), ayudante: !!form.ayudante, edicion_ext: !!form.edicion_ext, nota: form.nota || "" };
    const next = [s, ...sesiones]; setSesiones(next); persist(equipo, next);
    setForm({ fecha: today(), tipo: TIPOS_SESION[0], horas: 5, ayudante: true, edicion_ext: true }); setShowForm(false);
  }
  function delSesion(id: string) { const next = sesiones.filter(s => s.id !== id); setSesiones(next); persist(equipo, next); }

  const TABS = [
    { id: "inventario", label: "Inventario", Icon: Package },
    { id: "calc",       label: "Calculadora", Icon: Calculator },
    { id: "sesiones",   label: "Sesiones",    Icon: Camera },
    { id: "propuesta",  label: "Propuesta Discoteca", Icon: FileText },
  ] as const;

  return (
    <div style={{ background: C.bg, minHeight: "100vh", padding: "32px 40px", fontFamily: "'Space Grotesk', sans-serif", color: C.text }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "28px" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: 700, margin: 0 }}>Filmmaking</h1>
          <p style={{ fontSize: "13px", color: C.muted, margin: "5px 0 0" }}>Inventario · Costos reales · Qué cobrar · Control de sesiones</p>
        </div>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          {saved && <span style={{ fontSize: "12px", color: C.green, fontWeight: 600 }}>✓ Guardado</span>}
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "11px", color: C.muted }}>Inversión total</div>
            <div style={{ ...S.mono, fontSize: "18px", fontWeight: 800, color: C.accent }}>{euro(totalInversion)}</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "2px", marginBottom: "24px", borderBottom: `1px solid ${C.border}` }}>
        {TABS.map(({ id, label, Icon }) => (
          <button key={id} onClick={() => setTab(id)} style={{
            display: "flex", alignItems: "center", gap: "7px", padding: "9px 16px",
            borderRadius: "6px 6px 0 0", border: "1px solid transparent",
            borderBottom: tab === id ? `1px solid ${C.card}` : "transparent",
            background: tab === id ? C.card : "transparent",
            color: tab === id ? C.accent : C.muted,
            fontSize: "12px", fontWeight: tab === id ? 600 : 400, cursor: "pointer",
            fontFamily: "'Space Grotesk', sans-serif", marginBottom: tab === id ? "-1px" : 0,
          }}>
            <Icon size={13} />{label}
          </button>
        ))}
      </div>

      {/* ══ INVENTARIO ══ */}
      {tab === "inventario" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Resumen */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "14px" }}>
            {[
              { l: "Inversión total", v: euro(totalInversion), c: C.accent },
              { l: "Amortización / año", v: euro(amortAnual),  c: C.amber  },
              { l: "Amortización / mes", v: euro(amortMes),    c: C.mid    },
              { l: "Coste equipo / día", v: euro(amortDia),    c: C.muted  },
            ].map(({ l, v, c }) => (
              <div key={l} style={S.card}>
                <div style={{ fontSize: "11px", color: C.muted, marginBottom: "5px" }}>{l}</div>
                <div style={{ ...S.mono, fontSize: "20px", fontWeight: 800, color: c }}>{v}</div>
              </div>
            ))}
          </div>

          {/* Nota */}
          <div style={{ ...S.card, background: `${C.green}06`, border: `1px solid ${C.green}22`, fontSize: "12px", color: C.mid, lineHeight: 1.7 }}>
            <strong style={{ color: C.green }}>Como todo el equipo es tuyo:</strong> el costo de equipo por sesión es solo la amortización diaria (<strong style={{ color: C.text }}>{euro(amortDia)}/día</strong>). No hay alquiler. Cada sesión que facturas recupera inversión y genera beneficio neto desde el primer euro.
          </div>

          {/* Tabla */}
          <div style={{ ...S.card, padding: 0, overflow: "hidden" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 18px", borderBottom: `1px solid ${C.border}` }}>
              <span style={{ fontSize: "13px", fontWeight: 600 }}>Equipo ({equipo.length} items)</span>
              <button onClick={() => setShowEqForm(!showEqForm)} style={S.btn}>
                <Plus size={13} /> Añadir equipo
              </button>
            </div>
            {showEqForm && (
              <div style={{ padding: "16px 18px", borderBottom: `1px solid ${C.border}`, background: `${C.accent}04` }}>
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: "10px", marginBottom: "10px" }}>
                  <div><span style={S.lbl}>Nombre</span><input style={S.input} placeholder="DJI Ronin S3" value={eqForm.nombre || ""} onChange={e => setEqForm(p => ({ ...p, nombre: e.target.value }))} /></div>
                  <div><span style={S.lbl}>Valor €</span><input type="number" style={S.input} placeholder="800" value={eqForm.valor || ""} onChange={e => setEqForm(p => ({ ...p, valor: Number(e.target.value) }))} /></div>
                  <div><span style={S.lbl}>Vida útil (años)</span><input type="number" style={S.input} placeholder="5" value={eqForm.vida_util || ""} onChange={e => setEqForm(p => ({ ...p, vida_util: Number(e.target.value) }))} /></div>
                  <div><span style={S.lbl}>Categoría</span>
                    <select style={S.input} value={eqForm.categoria} onChange={e => setEqForm(p => ({ ...p, categoria: e.target.value }))}>
                      {CATEGORIAS.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button onClick={addEquipo} style={S.btn}><Save size={12} /> Guardar</button>
                  <button onClick={() => setShowEqForm(false)} style={S.ghost}>Cancelar</button>
                </div>
              </div>
            )}
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                  {["Equipo", "Categoría", "Valor", "Vida útil", "Amort/año", "Amort/día", ""].map(h => (
                    <th key={h} style={{ padding: "9px 14px", textAlign: "left", color: C.muted, fontWeight: 600, fontSize: "10px", letterSpacing: "0.07em", textTransform: "uppercase" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {equipo.map(e => (
                  <tr key={e.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                    <td style={{ padding: "9px 14px", fontWeight: 600, color: C.text }}>{e.nombre}</td>
                    <td style={{ padding: "9px 14px" }}>
                      <span style={{ fontSize: "10px", padding: "2px 8px", borderRadius: "4px", background: `${C.accent}12`, color: C.accent, fontWeight: 700 }}>{e.categoria}</span>
                    </td>
                    <td style={{ padding: "9px 14px", ...S.mono, color: C.text }}>{euro(e.valor)}</td>
                    <td style={{ padding: "9px 14px", color: C.mid }}>{e.vida_util} años</td>
                    <td style={{ padding: "9px 14px", ...S.mono, color: C.amber }}>{euro(e.valor / e.vida_util)}</td>
                    <td style={{ padding: "9px 14px", ...S.mono, color: C.muted }}>{(e.valor / e.vida_util / 365).toFixed(2)}€</td>
                    <td style={{ padding: "9px 10px" }}>
                      <button onClick={() => delEquipo(e.id)} style={{ background: "none", border: "none", cursor: "pointer", color: C.muted, padding: "2px" }}>
                        <Trash2 size={12} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ══ CALCULADORA ══ */}
      {tab === "calc" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
          {/* Inputs */}
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div style={S.card}>
              <h3 style={{ fontSize: "14px", fontWeight: 600, margin: "0 0 14px" }}>Parámetros del trabajo</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div>
                  <span style={S.lbl}>Tipo de trabajo</span>
                  <select style={S.input} value={cTipo} onChange={e => setCTipo(e.target.value)}>
                    {TIPOS_SESION.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <span style={S.lbl}>Horas en el trabajo (incluyendo montaje/desmontaje)</span>
                  <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                    <input type="range" min={1} max={12} value={cHoras} onChange={e => setCHoras(Number(e.target.value))} style={{ flex: 1 }} />
                    <span style={{ ...S.mono, fontSize: "16px", fontWeight: 700, color: C.accent, minWidth: "30px" }}>{cHoras}h</span>
                  </div>
                </div>
                <div>
                  <span style={S.lbl}>Entregas (reels/fotos editadas)</span>
                  <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                    <input type="range" min={1} max={15} value={cEntregas} onChange={e => setCEntregas(Number(e.target.value))} style={{ flex: 1 }} />
                    <span style={{ ...S.mono, fontSize: "16px", fontWeight: 700, color: C.accent, minWidth: "30px" }}>{cEntregas}</span>
                  </div>
                </div>
                <div>
                  <span style={S.lbl}>Desplazamiento (€ ida+vuelta)</span>
                  <input type="number" style={S.input} value={cDesplaz} onChange={e => setCDesplaz(Number(e.target.value))} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {[
                    { l: "Llevo ayudante (no edita)", s: cAyudante, set: setCAyudante, precio: `${euro(AYUDANTE_NOCHE)}/noche` },
                    { l: "Edición subcontratada", s: cEdicion, set: setCEdicion, precio: `${euro(EDICION_REEL)}/entrega` },
                  ].map(({ l, s, set, precio }) => (
                    <div key={l} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", background: C.bg, borderRadius: "7px", border: `1px solid ${C.border}` }}>
                      <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "13px", color: C.text }}>
                        <input type="checkbox" checked={s} onChange={e => set(e.target.checked)} style={{ width: "14px", height: "14px", accentColor: C.accent }} />
                        {l}
                      </label>
                      <span style={{ fontSize: "11px", color: C.muted }}>{precio}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Desglose */}
            <div style={S.card}>
              <h3 style={{ fontSize: "13px", fontWeight: 600, margin: "0 0 12px" }}>Desglose de costos</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "5px", fontSize: "12px" }}>
                {[
                  { l: `Tu tiempo (${cHoras}h × ${TARIFA_HORA}€)`, v: costeTiempo },
                  { l: `Ayudante noche`, v: costeAyudante, hide: !cAyudante },
                  { l: `Edición (${cEntregas} × ${EDICION_REEL}€)`, v: costeEdicion, hide: !cEdicion },
                  { l: `Amort. equipo (${cHoras}h)`, v: costeAmort },
                  { l: `Desplazamiento`, v: costeDesplaz },
                ].filter(x => !x.hide).map(({ l, v }) => (
                  <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "6px 9px", background: C.bg, borderRadius: "5px", border: `1px solid ${C.border}` }}>
                    <span style={{ color: C.mid }}>{l}</span>
                    <span style={{ ...S.mono, color: C.text, fontWeight: 600 }}>{euro(v)}</span>
                  </div>
                ))}
                <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 9px", background: `${C.red}0A`, borderRadius: "5px", border: `1px solid ${C.red}30`, fontWeight: 700 }}>
                  <span style={{ color: C.mid }}>COSTO TOTAL REAL</span>
                  <span style={{ ...S.mono, color: C.red }}>{euro(costeTOTAL)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Precios recomendados */}
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div style={S.card}>
              <h3 style={{ fontSize: "14px", fontWeight: 600, margin: "0 0 4px" }}>Qué cobrar</h3>
              <p style={{ fontSize: "12px", color: C.muted, margin: "0 0 16px" }}>{cTipo} · {cHoras}h · {cEntregas} entregas</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {[
                  { l: "Precio mínimo",     v: precioMin,  sub: "Margen 50% — úsalo solo para primeros clientes", c: C.muted   },
                  { l: "Precio recomendado", v: precioRec, sub: `Ganancia neta ~${euro(gananciaRec)} — precio de mercado`, c: C.accent  },
                  { l: "Precio premium",    v: precioTop,  sub: "Para clientes recurrentes o contratos largos", c: C.amber  },
                ].map(({ l, v, sub, c }) => (
                  <div key={l} style={{ padding: "14px 16px", background: C.bg, borderRadius: "8px", border: `1px solid ${c}33`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontSize: "12px", fontWeight: 600, color: C.mid, marginBottom: "3px" }}>{l}</div>
                      <div style={{ fontSize: "11px", color: C.muted }}>{sub}</div>
                    </div>
                    <div style={{ ...S.mono, fontSize: "22px", fontWeight: 800, color: c }}>{euro(v)}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={S.card}>
              <h3 style={{ fontSize: "13px", fontWeight: 600, margin: "0 0 12px" }}>Cuánto pagar al ayudante</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "12px" }}>
                {[
                  { l: "Fijo por noche (no edita)", v: "80–120€", rec: true,  d: "Lo más limpio. Le pagas por presencia y ayuda en set." },
                  { l: "% sobre lo cobrado (15%)", v: euro(precioRec * 0.15), rec: false, d: "Si el cliente no paga, él tampoco cobra. Más riesgo para él." },
                  { l: "% sobre lo cobrado (20%)", v: euro(precioRec * 0.20), rec: false, d: "Para alguien con más rol / responsabilidad en el set." },
                ].map(({ l, v, rec, d }) => (
                  <div key={l} style={{ padding: "9px 12px", background: C.bg, borderRadius: "6px", border: `1px solid ${rec ? C.accent : C.border}`, display: "flex", gap: "10px" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, color: rec ? C.accent : C.text, marginBottom: "2px" }}>{l} {rec && "← recomendado"}</div>
                      <div style={{ color: C.muted }}>{d}</div>
                    </div>
                    <div style={{ ...S.mono, fontSize: "16px", fontWeight: 700, color: rec ? C.accent : C.mid, alignSelf: "center" }}>{v}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: "10px", padding: "10px 12px", background: `${C.accent}06`, borderRadius: "6px", border: `1px solid ${C.accent}22`, fontSize: "12px", color: C.mid, lineHeight: 1.7 }}>
                <strong style={{ color: C.accent }}>Regla simple para esta noche:</strong> págale <strong style={{ color: C.text }}>100€ fijo</strong> si vas a cobrar más de 300€ al cliente. Si la noche es de prueba y no cobras, acordad que es práctica para él también.
              </div>
            </div>

            <div style={S.card}>
              <h3 style={{ fontSize: "13px", fontWeight: 600, margin: "0 0 10px" }}>Si editas tú vs subcontratas</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", fontSize: "12px" }}>
                <div style={{ padding: "12px", background: C.bg, borderRadius: "7px", border: `1px solid ${C.border}` }}>
                  <div style={{ fontWeight: 600, color: C.text, marginBottom: "6px" }}>Editas tú</div>
                  <div style={{ color: C.muted, lineHeight: 1.6 }}>+{euro(costeEdicion)} de ganancia extra<br />−{cEntregas * 2}h de tu tiempo<br />Costo 0€ adicional</div>
                </div>
                <div style={{ padding: "12px", background: C.bg, borderRadius: "7px", border: `1px solid ${C.green}22` }}>
                  <div style={{ fontWeight: 600, color: C.green, marginBottom: "6px" }}>Subcontratas → recomendado</div>
                  <div style={{ color: C.muted, lineHeight: 1.6 }}>Costo {euro(costeEdicion)}<br />Liberas {cEntregas * 2}h para más clientes<br />Escala sin límite de tiempo</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══ SESIONES ══ */}
      {tab === "sesiones" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "14px" }}>
            {[
              { l: "Sesiones totales", v: String(totalSesiones), c: C.accent },
              { l: "Facturado estimado", v: euro(totalFacturado), c: C.green },
              { l: "Media por sesión", v: totalSesiones ? euro(totalFacturado / totalSesiones) : "—", c: C.amber },
            ].map(({ l, v, c }) => (
              <div key={l} style={S.card}>
                <div style={{ fontSize: "11px", color: C.muted, marginBottom: "5px" }}>{l}</div>
                <div style={{ ...S.mono, fontSize: "20px", fontWeight: 800, color: c }}>{v}</div>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: "13px", color: C.muted }}>{sesiones.length} sesiones registradas</span>
            <button onClick={() => setShowForm(!showForm)} style={S.btn}><Plus size={13} /> Nueva sesión</button>
          </div>

          {showForm && (
            <div style={{ ...S.card, border: `1px solid ${C.accent}44` }}>
              <h3 style={{ fontSize: "13px", fontWeight: 600, margin: "0 0 14px" }}>Registrar sesión</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", marginBottom: "10px" }}>
                <div><span style={S.lbl}>Fecha</span><input type="date" style={S.input} value={form.fecha} onChange={e => setForm(p => ({ ...p, fecha: e.target.value }))} /></div>
                <div><span style={S.lbl}>Cliente</span><input style={S.input} placeholder="Discoteca X" value={form.cliente || ""} onChange={e => setForm(p => ({ ...p, cliente: e.target.value }))} /></div>
                <div><span style={S.lbl}>Tipo</span>
                  <select style={S.input} value={form.tipo} onChange={e => setForm(p => ({ ...p, tipo: e.target.value }))}>
                    {TIPOS_SESION.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", marginBottom: "12px" }}>
                <div><span style={S.lbl}>Horas</span><input type="number" style={S.input} value={form.horas} onChange={e => setForm(p => ({ ...p, horas: Number(e.target.value) }))} /></div>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px", justifyContent: "flex-end" }}>
                  {[{ l: "Con ayudante", k: "ayudante" as const }, { l: "Edición externa", k: "edicion_ext" as const }].map(({ l, k }) => (
                    <label key={k} style={{ display: "flex", gap: "7px", alignItems: "center", fontSize: "12px", cursor: "pointer", color: C.text }}>
                      <input type="checkbox" checked={!!form[k]} onChange={e => setForm(p => ({ ...p, [k]: e.target.checked }))} style={{ accentColor: C.accent }} />
                      {l}
                    </label>
                  ))}
                </div>
                <div><span style={S.lbl}>Notas</span><input style={S.input} placeholder="Ambiente, detalles..." value={form.nota || ""} onChange={e => setForm(p => ({ ...p, nota: e.target.value }))} /></div>
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <button onClick={addSesion} style={S.btn}><Save size={12} /> Guardar</button>
                <button onClick={() => setShowForm(false)} style={S.ghost}>Cancelar</button>
              </div>
            </div>
          )}

          {sesiones.length === 0 && !showForm && (
            <div style={{ ...S.card, textAlign: "center", padding: "48px 20px" }}>
              <Camera size={36} color={C.muted} style={{ marginBottom: "10px", opacity: 0.4 }} />
              <p style={{ color: C.muted, margin: 0 }}>Sin sesiones registradas — añade la de hoy cuando termines</p>
            </div>
          )}

          {sesiones.length > 0 && (
            <div style={{ ...S.card, padding: 0, overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                    {["Fecha", "Cliente", "Tipo", "Horas", "Ayudante", "Edición", "Precio est.", ""].map(h => (
                      <th key={h} style={{ padding: "9px 14px", textAlign: "left", color: C.muted, fontWeight: 600, fontSize: "10px", letterSpacing: "0.06em", textTransform: "uppercase" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sesiones.map(s => (
                    <tr key={s.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                      <td style={{ padding: "9px 14px", color: C.mid }}>{s.fecha}</td>
                      <td style={{ padding: "9px 14px", fontWeight: 600, color: C.text }}>{s.cliente}</td>
                      <td style={{ padding: "9px 14px", color: C.mid }}>{s.tipo.split("/")[0].trim()}</td>
                      <td style={{ padding: "9px 14px", ...S.mono }}>{s.horas}h</td>
                      <td style={{ padding: "9px 14px", color: s.ayudante ? C.green : C.muted }}>{s.ayudante ? "✅" : "—"}</td>
                      <td style={{ padding: "9px 14px", color: s.edicion_ext ? C.amber : C.muted }}>{s.edicion_ext ? "Externa" : "—"}</td>
                      <td style={{ padding: "9px 14px", ...S.mono, fontWeight: 700, color: C.accent }}>{euro(calcSesionPrecio(s))}</td>
                      <td style={{ padding: "9px 10px" }}>
                        <button onClick={() => delSesion(s.id)} style={{ background: "none", border: "none", cursor: "pointer", color: C.muted, padding: "2px" }}><Trash2 size={12} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ══ PROPUESTA DISCOTECA ══ */}
      {tab === "propuesta" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div style={S.card}>
              <h3 style={{ fontSize: "14px", fontWeight: 600, margin: "0 0 14px", color: C.accent }}>Servicios para discoteca</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {[
                  { s: "Noche suelta", d: "Cobertura 1 noche · 3-5 reels entregados en 48h · formato vertical", p: "250–350€", r: false },
                  { s: "Pack mensual básico", d: "4 noches/mes · 12 reels · stories · 1 foto pack", p: "700–900€/mes", r: true },
                  { s: "Pack mensual pro", d: "8 noches/mes · 30+ reels + fotos · Reels stories + feed · gestión IG", p: "1.400–1.800€/mes", r: false },
                  { s: "Vídeo promo sala (1 vez)", d: "Grabación en horario, montaje cinematic, música licenciada, 60-90 seg", p: "600–1.200€", r: false },
                  { s: "Campañas Meta Ads", d: "Creativo + gestión de anuncios para eventos y noches especiales", p: "+350€/mes", r: false },
                ].map(({ s, d, p, r }) => (
                  <div key={s} style={{ padding: "12px 14px", background: C.bg, borderRadius: "8px", border: `1px solid ${r ? C.accent : C.border}` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                      <span style={{ fontWeight: 700, color: r ? C.accent : C.text, fontSize: "13px" }}>{s} {r && "← empezar aquí"}</span>
                      <span style={{ ...S.mono, fontWeight: 800, color: r ? C.accent : C.amber, fontSize: "13px" }}>{p}</span>
                    </div>
                    <p style={{ fontSize: "12px", color: C.muted, margin: 0, lineHeight: 1.5 }}>{d}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div style={S.card}>
              <h3 style={{ fontSize: "13px", fontWeight: 600, margin: "0 0 12px" }}>Cómo cerrar el contrato</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "12px" }}>
                {[
                  { n: "1", t: "Primera noche gratis (esta noche)", d: "Grabas, entregas 2-3 reels de muestra. El dueño ve la calidad sin riesgo. Así cierras el contrato siguiente semana." },
                  { n: "2", t: "Entrega rápida = arma diferencial", d: "Reels entregados antes de las 24h de la noche. Cuando el cliente los ve viral ya no puede decir que no." },
                  { n: "3", t: "Propuesta escrita en WhatsApp", d: "\"Te preparo 4 noches/mes con 12 reels + gestión por 800€/mes. ¿Empezamos el viernes?\" Simple y concreto." },
                  { n: "4", t: "Escalado: añade Meta Ads", d: "En 2-3 meses: \"Con tus reels como creativos podemos hacer anuncios. Más gente en la sala.\" Sube ticket a 1.100€/mes." },
                ].map(({ n, t, d }) => (
                  <div key={n} style={{ display: "flex", gap: "10px", padding: "9px 12px", background: C.bg, borderRadius: "6px", border: `1px solid ${C.border}` }}>
                    <span style={{ width: "20px", height: "20px", borderRadius: "50%", background: `${C.accent}18`, color: C.accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 700, flexShrink: 0 }}>{n}</span>
                    <div><span style={{ color: C.text, fontWeight: 600 }}>{t}: </span><span style={{ color: C.muted }}>{d}</span></div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ ...S.card, border: `1px solid ${C.amber}33`, background: `${C.amber}05` }}>
              <h3 style={{ fontSize: "13px", fontWeight: 600, color: C.amber, margin: "0 0 10px" }}>Para esta noche específicamente</h3>
              <div style={{ fontSize: "12px", color: C.mid, lineHeight: 1.8 }}>
                <div>🎬 <strong style={{ color: C.text }}>Llevas:</strong> cámara principal + estabilizador + 1-2 lentes versátiles + micro</div>
                <div>👤 <strong style={{ color: C.text }}>Al chico:</strong> 100€ fijo — le explicas que lleve el segundo cuerpo o te ayude con el estabilizador</div>
                <div>📱 <strong style={{ color: C.text }}>Formato:</strong> 80% vertical (Reels/TikTok) · 20% horizontal (feed/promo)</div>
                <div>🎵 <strong style={{ color: C.text }}>Audio:</strong> graba el ambiente + usa el micro para testimonios o detalles</div>
                <div>📦 <strong style={{ color: C.text }}>Entrega:</strong> 3 reels de muestra en 24-48h máximo</div>
                <div>💰 <strong style={{ color: C.text }}>Esta noche es inversión</strong> — el contrato se cierra la semana siguiente</div>
              </div>
            </div>

            <div style={{ ...S.card, background: `${C.green}06`, border: `1px solid ${C.green}22` }}>
              <h3 style={{ fontSize: "13px", fontWeight: 600, color: C.green, margin: "0 0 8px" }}>Potencial de ingresos filmmaking</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "5px", fontSize: "12px", color: C.mid }}>
                <div>1 discoteca mensual: <strong style={{ color: C.text }}>800€/mes</strong></div>
                <div>2 discotecas: <strong style={{ color: C.text }}>1.600€/mes</strong></div>
                <div>2 discotecas + 4 reels sueltos: <strong style={{ color: C.text }}>2.400€/mes</strong></div>
                <div style={{ marginTop: "4px", color: C.muted }}>+ 0 costo de equipo (ya es tuyo) + escala con el editor subcontratado</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
