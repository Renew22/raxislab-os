"use client";
import { useState, useEffect, useCallback } from "react";
import { TrendingUp, AlertTriangle, CheckCircle, Edit3, Save, X, FileText } from "lucide-react";

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
};
function badge(c: string): React.CSSProperties { return { fontSize: "9px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", padding: "2px 7px", borderRadius: "4px", background: `color-mix(in srgb, ${c} 9%, transparent)`, color: c, border: `1px solid color-mix(in srgb, ${c} 20%, transparent)` }; }

function eur(n: number) { return n.toLocaleString("es", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }); }
function eurD(n: number) { return n.toLocaleString("es", { style: "currency", currency: "EUR", minimumFractionDigits: 2, maximumFractionDigits: 2 }); }

/* ── Types ── */
interface Ingreso { id: string; cliente: string; concepto: string; importe: number; metodo: string; estado: "activo"|"prospecto"|"pendiente"; nota: string; paquete: string; confirmado: boolean }
interface Suscripcion { id: string; servicio: string; importe: number; frecuencia: "mensual"|"anual"|"variable"; metodo: string; confirmado: boolean; nota: string }
interface Editor { id: string; nombre: string; concepto: string; importes: number[]; moneda: "EUR"|"USD"; tarifa_variable: boolean; tarifa_nota: string }
interface Prospecto { id: string; nombre: string; tipo: string; paquete: string; estado: string; nota: string }
interface Personal { id: string; concepto: string; importe: number; esNegocio: boolean|null; nota: string }
interface JaggerCalc { nVideos: number; horas: number; valorHora: number; ayudante: number; desplaz: number; margen: number; costeEditor: number }
interface FinData { ingresos: Ingreso[]; suscripciones: Suscripcion[]; editores: Editor[]; prospectos: Prospecto[]; personales: Personal[]; jaggerCalc: JaggerCalc }

const STORAGE = "raxis_finanzas_v1";

const SEED: FinData = {
  ingresos: [
    { id:"i1", cliente:"Jorge DeSancho", concepto:"Agencia marketing completa (Workana) — todo incluido: web, Meta, Google, contenido", importe:637, metodo:"Workana → banco", estado:"activo", nota:"Promedio 4 meses: 635.44/636.27/639.59/640.43€. Paga por TODO el trabajo de agencia, no por vídeos sueltos. No cobrar por vídeo = ya va dentro.", paquete:"premium", confirmado:true },
  ],
  suscripciones: [
    { id:"s1",  servicio:"Canva Pro",          importe:12.00, frecuencia:"mensual",  metodo:"PayPal",         confirmado:true,  nota:"Confirmado banco (CANVAPTYLIM)" },
    { id:"s2",  servicio:"Freepik",            importe:9.68,  frecuencia:"mensual",  metodo:"PayPal",         confirmado:true,  nota:"Recibo domiciliado" },
    { id:"s3",  servicio:"ChatGPT Plus",       importe:8.00,  frecuencia:"mensual",  metodo:"PayPal",         confirmado:true,  nota:"Recurrente" },
    { id:"s4",  servicio:"OpenAI API",         importe:17.00, frecuencia:"variable", metodo:"Tarjeta directa",confirmado:true,  nota:"Variable: 10.88–23.99€/mes. Media estimada 17€" },
    { id:"s5",  servicio:"Anthropic / Claude", importe:21.53, frecuencia:"mensual",  metodo:"Tarjeta directa",confirmado:true,  nota:"Cargo visto 22/06/2026" },
    { id:"s6",  servicio:"Cloudflare",         importe:3.43,  frecuencia:"mensual",  metodo:"PayPal",         confirmado:false, nota:"⚠️ Visto 1 vez banco (20/04/2026, 3,43€) — pendiente confirmar si es recurrente mensual" },
    { id:"s7",  servicio:"Zoho Corp",          importe:59.87, frecuencia:"variable", metodo:"PayPal",         confirmado:false, nota:"⚠️ Visto 1 vez banco (19/06/2026, 59,87€) — pendiente aclarar: ¿CRM/email/otro? ¿mensual o pago único? ¿negocio o no?" },
    { id:"s8",  servicio:"Apple.com/bill (sin desglosar)", importe:0, frecuencia:"mensual", metodo:"Tarjeta directa", confirmado:false, nota:"⚠️ 215,83€ en 3 meses (múltiples suscripciones Apple). Desglosar desde iPhone Ajustes > Suscripciones" },
    { id:"s9",  servicio:"Hetzner (servidor)", importe:5,     frecuencia:"mensual",  metodo:"Por confirmar",  confirmado:true,  nota:"~5€/mes confirmado" },
    { id:"s10", servicio:"Windsor.ai",         importe:0,     frecuencia:"mensual",  metodo:"Tarjeta directa",confirmado:false, nota:"⚠️ CANCELAR — aparece en extracto banco 3 meses. Regla: usar Meta Ads API directa, no Windsor.ai" },
    { id:"s11", servicio:"Genspark",           importe:0,     frecuencia:"mensual",  metodo:"Tarjeta directa",confirmado:false, nota:"Aparece en extracto banco 3 meses — confirmar importe exacto y si sigue activo" },
    { id:"s12", servicio:"Renting Tec (equipo)", importe:0,   frecuencia:"mensual",  metodo:"Por confirmar",  confirmado:false, nota:"Aparece en extracto banco 3 meses — confirmar importe y si ya terminó el contrato" },
  ],
  editores: [
    { id:"e1", nombre:"Maitena Altesor",        concepto:"Edición vídeo / diseño redes",    importes:[40.62,111.99,66.34,100,59], moneda:"USD", tarifa_variable:true,  tarifa_nota:"Pagos variables. Media ~76€/lote. ⚠️ Confirmar tarifa real: ¿por vídeo, hora o proyecto?" },
    { id:"e2", nombre:"David Urrutia Ortiz",    concepto:"Editor vídeo profesional (Workana)",importes:[19.24],                     moneda:"EUR", tarifa_variable:true,  tarifa_nota:"⚠️ Solo depósito inicial 19.24€. Tarifa por vídeo sin confirmar — actualizar al cerrar" },
    { id:"e3", nombre:"Bryan Alexander Patiño", concepto:"Flyers digitales",                importes:[84],                          moneda:"USD", tarifa_variable:false, tarifa_nota:"Pago puntual PayPal" },
    { id:"e4", nombre:"Fernando Luis Gutierrez",concepto:"Flyers digitales",                importes:[50],                          moneda:"USD", tarifa_variable:false, tarifa_nota:"Pago puntual PayPal" },
    { id:"e5", nombre:"Francisco Jose Herrera", concepto:"Sin concepto especificado",       importes:[30],                          moneda:"USD", tarifa_variable:false, tarifa_nota:"Pago puntual PayPal" },
  ],
  prospectos: [
    { id:"p1", nombre:"Jagger Club",         tipo:"Discoteca / Venue",  paquete:"Básico (producción vídeo/foto)",       estado:"En negociación — primera noche muestra", nota:"Sin factura = cobro informal/efectivo. Precio real: 80–150€/noche para empezar. Ver calculadora." },
    { id:"p2", nombre:"David / Captura Más", tipo:"Contenido",          paquete:"Por definir",                           estado:"Pendiente alcance exacto",                nota:"¿Solo producción o también ads?" },
  ],
  personales: [
    // ── Extracto bancario completo 3 meses (abr–jul 2026) ──
    { id:"pp-nom", concepto:"⚠️ Nómina Recaba Inversiones (ya no activa desde jul 2026)", importe:0, esNegocio:false, nota:"Era ingreso personal (1.385–1.500€/mes). Contrato terminado. Ahora solo: paro + ingresos clientes Raxislab. Actualiza tus proyecciones de caja." },
    { id:"pp8",  concepto:"Apuestas: Bet365 + Pokerstars (3 meses)",         importe:632.00, esNegocio:false, nota:"Total 3 meses. Personal — no es gasto de negocio." },
    { id:"pp9",  concepto:"Transferencias/Bizum familia (3 meses)",          importe:1485.00,esNegocio:null,  nota:"Múltiples transferencias/Bizum a familia. ⚠️ Confirmar si son remesas, préstamos o algo más." },
    { id:"pp10", concepto:"Compras online / tiendas (3 meses)",              importe:1477.10,esNegocio:null,  nota:"Amazon + otras tiendas. ⚠️ ¿Hay algún equipo de negocio comprado aquí? Revisar." },
    { id:"pp11", concepto:"Restaurantes / bares / ocio nocturno (3 meses)", importe:360.74, esNegocio:null,  nota:"⚠️ ¿Alguna cena de trabajo o reunión con cliente?" },
    { id:"pp1",  concepto:"Interflora Italia",                               importe:51.96,  esNegocio:false, nota:"Florería — personal" },
    { id:"pp2",  concepto:"Trainline.com (tren)",                            importe:53.91,  esNegocio:null,  nota:"⚠️ ¿Viaje de trabajo / grabación fuera o personal?" },
    { id:"pp3",  concepto:"Booking.com",                                     importe:109.35, esNegocio:null,  nota:"⚠️ ¿Alojamiento de trabajo o vacaciones?" },
    { id:"pp4",  concepto:"Headout Europe (actividades turísticas)",         importe:76.98,  esNegocio:false, nota:"Turismo — personal" },
    { id:"pp5",  concepto:"Remitly (x2: 96.59 + 74.99)",                   importe:171.58, esNegocio:false, nota:"Envíos al extranjero — personal" },
    { id:"pp6",  concepto:"Xoom / Luis Benegas (varios pagos 200–550€)",   importe:0,      esNegocio:null,  nota:"⚠️ ¿Eres tú enviándote dinero a ti mismo, o remesas familia?" },
    { id:"pp7",  concepto:"Payoneer Europe",                                 importe:150.00, esNegocio:null,  nota:"⚠️ ¿Cobro de cliente externo, transferencia propia o comisión?" },
  ],
  jaggerCalc: { nVideos:3, horas:4, valorHora:25, ayudante:0, desplaz:10, margen:0.4, costeEditor:15 },
};

// Inventario real del Excel inventario_equipo.xlsx
const EQUIPO = [
  { cat:"Cámaras",       item:"Sony ZV-E10 (mirrorless APS-C)",           v:650   },
  { cat:"Cámaras",       item:"Sony α7S II (full-frame)",                  v:1000  },
  { cat:"Cámaras",       item:"Canon EOS 1300D + 18-55mm",                v:320   },
  { cat:"Objetivos",     item:"Sony FE 50mm f/1.8",                       v:200   },
  { cat:"Objetivos",     item:"Sony FE 28-70mm f/3.5-5.6",               v:180   },
  { cat:"Objetivos",     item:"Sony E 18-105mm f/4 G PZ",                v:600   },
  { cat:"Objetivos",     item:"Sony E 16-50mm f/3.5-5.6",                v:150   },
  { cat:"Estabilización",item:"DJI RS3 Mini",                              v:260   },
  { cat:"Estabilización",item:"SmallRig cage + top/side handle",          v:110   },
  { cat:"Estabilización",item:"SmallRig 5285B tripode/monopié",           v:59.93 },
  { cat:"Audio",         item:"Hollyland Lark M2S (wireless dual)",       v:140   },
  { cat:"Iluminación",   item:"Photoolex B320S tubo LED RGB",              v:65.99 },
  { cat:"Iluminación",   item:"SmallRig P96L luz portátil RGB",           v:55    },
  { cat:"Iluminación",   item:"Soonpho 2-Pack kit focos fotografía",      v:109   },
  { cat:"Fondo",         item:"EMART fondo blanco 1.5×2.6m + soporte",   v:46.99 },
  { cat:"Almacenamiento",item:"SanDisk SD Extreme 128GB",                  v:25    },
  { cat:"Almacenamiento",item:"SanDisk microSD x3 + adaptador",           v:45    },
  { cat:"Almacenamiento",item:"Acer lector tarjetas USB-C",               v:10.99 },
  { cat:"Accesorios",    item:"iPad antigua (monitorización set)",         v:130   },
  { cat:"Accesorios",    item:"Filtro ND + limpieza + power bank",        v:73    },
  { cat:"Trabajo",       item:"Portátil Acer Nitro V15 (RTX, 144Hz)",    v:950   },
  { cat:"Trabajo",       item:"Monitor externo",                           v:150   },
  { cat:"Trabajo",       item:"KROM: teclado + ratón + alfombrilla",      v:90    },
  { cat:"Trabajo",       item:"Altavoz + auriculares + Hub USB",          v:120   },
];

function calcPL(d: FinData) {
  const ingresosMes  = d.ingresos.filter(i => i.estado === "activo").reduce((s, i) => s + i.importe, 0);
  const totalSusc    = d.suscripciones.filter(s => s.importe > 0).reduce((s, x) => s + x.importe, 0);
  const editoresEur  = d.editores.reduce((s, e) => {
    const tot = e.importes.reduce((a, b) => a + b, 0);
    return s + (e.moneda === "USD" ? tot * 0.92 : tot);
  }, 0);
  const neto         = ingresosMes - totalSusc - (editoresEur / 5); // editores historico/5 meses
  const margen       = ingresosMes > 0 ? (neto / ingresosMes) * 100 : 0;
  return { ingresosMes, totalSusc, editoresEur, neto, margen };
}

function calcJagger(j: JaggerCalc) {
  const costEdicion   = j.nVideos * j.costeEditor;
  const costTiempo    = j.horas * j.valorHora;
  const costTotal     = costEdicion + costTiempo + j.ayudante + j.desplaz;
  const precio        = Math.ceil(costTotal * (1 + j.margen) / 10) * 10;
  const precioVideo   = Math.ceil((precio / j.nVideos) / 5) * 5;
  const precioMensual = Math.ceil(precio * 4 * 0.9 / 10) * 10;
  const ganancia      = precio - costTotal;
  return { costEdicion, costTiempo, costTotal, precio, precioVideo, precioMensual, ganancia };
}

const TABS = ["Resumen P&L","Ingresos","Gastos","Equipo","Jagger Club","Personales"] as const;
type Tab = typeof TABS[number];

export default function FinanzasPage() {
  const [tab, setTab]             = useState<Tab>("Resumen P&L");
  const [data, setData]           = useState<FinData>(SEED);
  const [saved, setSaved]         = useState(false);
  const [editingJ, setEditingJ]   = useState(false);
  const [showProp, setShowProp]   = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE);
      if (!raw) return;
      const d = JSON.parse(raw);
      // version v2: reset if missing Windsor.ai (s10) — new subs added jul-19
      if (!d.suscripciones?.find((s: {id:string}) => s.id==="s10")) {
        localStorage.removeItem(STORAGE); return;
      }
      if (d.ingresos) setData(d);
    } catch {}
  }, []);

  const persist = useCallback((next: FinData) => {
    setData(next); localStorage.setItem(STORAGE, JSON.stringify(next));
    setSaved(true); setTimeout(() => setSaved(false), 1500);
  }, []);

  const pl   = calcPL(data);
  const jRes = calcJagger(data.jaggerCalc);
  const equipoFoto  = EQUIPO.filter(e => e.cat !== "Trabajo").reduce((s, e) => s + e.v, 0);
  const equipoTrab  = EQUIPO.filter(e => e.cat === "Trabajo").reduce((s, e) => s + e.v, 0);
  const equipoTotal = equipoFoto + equipoTrab;
  const equipoCats  = [...new Set(EQUIPO.map(e => e.cat))];

  const pendientes = [
    { txt:"Windsor.ai: CANCELAR — aparece en banco 3 meses. Regla: usar Meta API directa.", w:true },
    { txt:"Zoho Corp (59,87€): ¿qué servicio? ¿CRM, email, otro? ¿mensual o pago único?", w:true },
    { txt:"Apple.com/bill: desglosar desde iPhone Ajustes > Suscripciones (215,83€ en 3 meses)", w:true },
    { txt:"Cloudflare (3,43€): ¿cargo recurrente mensual o puntual?", w:false },
    { txt:"Genspark + Renting Tec: confirmar importe exacto y si siguen activos", w:true },
    { txt:"David Urrutia: tarifa por vídeo sin confirmar", w:true },
    { txt:"Maitena Altesor: ¿tarifa por vídeo, hora o proyecto?", w:false },
    { txt:"Xoom / Luis Benegas: ¿enviándote a ti mismo o remesas familia?", w:false },
    { txt:"Booking/Trainline/Headout: ¿viaje de trabajo o personal?", w:false },
    { txt:"Transferencias Bizum familia -1.485€: ¿remesas, préstamos o qué?", w:false },
    { txt:"Compras online -1.477€: ¿hay algún equipo de negocio aquí?", w:false },
    { txt:"Workana: ¿cuánto has retirado al banco en estos 3 meses? Cruzar con P&L.", w:true },
  ];

  return (
    <div style={{ background:C.bg, minHeight:"100vh", padding:"28px 36px", fontFamily:"'Space Grotesk', sans-serif", color:C.text }}>
      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"22px" }}>
        <div>
          <h1 style={{ fontSize:"22px", fontWeight:700, margin:0 }}>Finanzas Raxislab</h1>
          <p style={{ fontSize:"12px", color:C.muted, margin:"4px 0 0" }}>Datos reales banco Santander + Workana hasta 17/07/2026</p>
        </div>
        <div style={{ display:"flex", gap:"16px", alignItems:"center" }}>
          {saved && <span style={{ fontSize:"11px", color:C.green }}>✓ Guardado</span>}
          <div style={{ textAlign:"right" }}>
            <div style={{ fontSize:"10px", color:C.muted }}>Beneficio neto / mes</div>
            <div style={{ ...S.mono, fontSize:"20px", fontWeight:800, color:pl.neto>=0?C.green:C.red }}>{eurD(pl.neto)}</div>
          </div>
          <div style={{ textAlign:"right" }}>
            <div style={{ fontSize:"10px", color:C.muted }}>Margen</div>
            <div style={{ ...S.mono, fontSize:"20px", fontWeight:800, color:pl.margen>=40?C.green:C.amber }}>{pl.margen.toFixed(0)}%</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:"flex", gap:"2px", marginBottom:"20px", borderBottom:`1px solid ${C.border}` }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding:"8px 14px", fontSize:"12px", fontWeight:tab===t?600:400, cursor:"pointer",
            border:"1px solid transparent", borderBottom:tab===t?`1px solid ${C.card}`:"transparent",
            borderRadius:"6px 6px 0 0", background:tab===t?C.card:"transparent",
            color:tab===t?C.accent:C.muted, fontFamily:"'Space Grotesk', sans-serif", marginBottom:tab===t?"-1px":0,
          }}>{t}</button>
        ))}
      </div>

      {/* ══ RESUMEN P&L ══ */}
      {tab === "Resumen P&L" && (
        <div style={{ display:"flex", flexDirection:"column", gap:"14px" }}>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(5, 1fr)", gap:"12px" }}>
            {[
              { l:"Ingresos / mes",       v:eurD(pl.ingresosMes),    c:C.green, sub:`${data.ingresos.filter(i=>i.estado==="activo").length} cliente activo` },
              { l:"Suscripciones / mes",  v:eurD(pl.totalSusc),      c:C.amber, sub:"Algunas pendientes confirmar" },
              { l:"Editores (media/mes)", v:eurD(pl.editoresEur/5),  c:C.blue,  sub:"Total histórico ÷ 5 meses" },
              { l:"Gastos totales / mes", v:eurD(pl.totalSusc + pl.editoresEur/5), c:C.red, sub:"Susc + editores" },
              { l:"Neto real / mes",      v:eurD(pl.neto),           c:pl.neto>=0?C.green:C.red, sub:`Margen ${pl.margen.toFixed(0)}%` },
            ].map(({ l,v,c,sub }) => (
              <div key={l} style={S.card}>
                <div style={{ fontSize:"10px", color:C.muted, marginBottom:"4px" }}>{l}</div>
                <div style={{ ...S.mono, fontSize:"17px", fontWeight:800, color:c }}>{v}</div>
                <div style={{ fontSize:"10px", color:C.muted, marginTop:"3px" }}>{sub}</div>
              </div>
            ))}
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"14px" }}>
            <div style={S.card}>
              <h3 style={{ fontSize:"13px", fontWeight:600, color:C.green, margin:"0 0 12px" }}>↑ Ingresos</h3>
              {data.ingresos.map(i => (
                <div key={i.id} style={{ display:"flex", justifyContent:"space-between", padding:"7px 0", borderBottom:`1px solid ${C.border}` }}>
                  <div>
                    <span style={{ fontSize:"12px", fontWeight:600 }}>{i.cliente}</span>
                    <span style={{ ...badge(C.green), marginLeft:"8px" }}>{i.estado}</span>
                  </div>
                  <span style={{ ...S.mono, fontSize:"13px", color:C.green, fontWeight:700 }}>{eurD(i.importe)}</span>
                </div>
              ))}
              {data.prospectos.map(p => (
                <div key={p.id} style={{ display:"flex", justifyContent:"space-between", padding:"7px 0", borderBottom:`1px solid ${C.border}`, opacity:0.55 }}>
                  <div>
                    <span style={{ fontSize:"12px", color:C.mid }}>{p.nombre}</span>
                    <span style={{ ...badge(C.muted), marginLeft:"8px" }}>prospecto</span>
                  </div>
                  <span style={{ ...S.mono, fontSize:"12px", color:C.muted }}>—</span>
                </div>
              ))}
              <div style={{ display:"flex", justifyContent:"space-between", padding:"10px 0 0", fontWeight:700 }}>
                <span style={{ color:C.mid, fontSize:"12px" }}>TOTAL INGRESOS / MES</span>
                <span style={{ ...S.mono, color:C.green, fontSize:"15px" }}>{eurD(pl.ingresosMes)}</span>
              </div>
            </div>

            <div style={S.card}>
              <h3 style={{ fontSize:"13px", fontWeight:600, color:C.red, margin:"0 0 12px" }}>↓ Gastos</h3>
              <div style={{ fontSize:"10px", color:C.muted, fontWeight:700, marginBottom:"6px" }}>SUSCRIPCIONES</div>
              {data.suscripciones.filter(s => s.importe > 0).map(s => (
                <div key={s.id} style={{ display:"flex", justifyContent:"space-between", padding:"5px 0", borderBottom:"1px solid var(--border)" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:"5px" }}>
                    <span style={{ fontSize:"11px", color:s.confirmado?C.mid:C.amber }}>{s.servicio}</span>
                    {!s.confirmado && <span style={{ fontSize:"9px" }}>⚠️</span>}
                  </div>
                  <span style={{ ...S.mono, fontSize:"11px", color:s.confirmado?C.text:C.amber }}>{eurD(s.importe)}</span>
                </div>
              ))}
              <div style={{ display:"flex", justifyContent:"space-between", padding:"6px 0", marginBottom:"8px" }}>
                <span style={{ fontSize:"11px", color:C.muted }}>Subtotal suscripciones</span>
                <span style={{ ...S.mono, fontSize:"12px", color:C.amber }}>{eurD(pl.totalSusc)}</span>
              </div>
              <div style={{ fontSize:"10px", color:C.muted, fontWeight:700, marginBottom:"6px" }}>EDITORES (media/mes)</div>
              {data.editores.map(e => {
                const tot = e.importes.reduce((a,b)=>a+b,0) * (e.moneda==="USD"?0.92:1);
                return (
                  <div key={e.id} style={{ display:"flex", justifyContent:"space-between", padding:"5px 0", borderBottom:"1px solid var(--border)" }}>
                    <span style={{ fontSize:"11px", color:C.mid }}>{e.nombre.split(" ")[0]}</span>
                    <span style={{ ...S.mono, fontSize:"11px" }}>{eurD(tot/5)}/mes</span>
                  </div>
                );
              })}
              <div style={{ display:"flex", justifyContent:"space-between", padding:"10px 0 0", fontWeight:700 }}>
                <span style={{ color:C.mid, fontSize:"12px" }}>TOTAL GASTOS / MES</span>
                <span style={{ ...S.mono, color:C.red, fontSize:"15px" }}>{eurD(pl.totalSusc + pl.editoresEur/5)}</span>
              </div>
            </div>
          </div>

          <div style={{ ...S.card, border:`1px solid ${pl.neto>=0?C.green:C.red}44`, background:`${pl.neto>=0?C.green:C.red}08` }}>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(4, 1fr)", gap:"16px" }}>
              {[
                { l:"Beneficio neto / mes",  v:eurD(pl.neto),      c:pl.neto>=0?C.green:C.red },
                { l:"Margen real",            v:`${pl.margen.toFixed(1)}%`, c:C.accent },
                { l:"Proyección anual",       v:eur(pl.neto*12),    c:C.text },
                { l:"Equipo total invertido", v:eur(equipoTotal),   c:C.mid },
              ].map(({ l,v,c }) => (
                <div key={l}>
                  <div style={{ fontSize:"11px", color:C.muted, marginBottom:"4px" }}>{l}</div>
                  <div style={{ ...S.mono, fontSize:"22px", fontWeight:900, color:c }}>{v}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Extracto bancario 3 meses */}
          <div style={{ ...S.card, border:`1px solid ${C.blue}33`, background:`${C.blue}06` }}>
            <h3 style={{ fontSize:"12px", fontWeight:700, color:C.blue, margin:"0 0 12px" }}>Extracto banco confirmado — 3 meses (abr–jul 2026)</h3>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"10px", marginBottom:"10px" }}>
              {[
                { l:"Ingresos negocio en banco",  v:"0 €",          c:C.amber, note:"Workana retenido — no retirado al banco aún" },
                { l:"Ingresos Workana (estimado)", v:"~1.911 €",    c:C.green, note:"637€/mes × 3 — pendiente verificar retiradas" },
                { l:"Gastos negocio confirmados",  v:"-791,49 €",   c:C.red,   note:"Susc. -318,82€ + Editores -472,67€" },
                { l:"Neto 3 meses (estimado)",     v:"~1.119 €",    c:C.green, note:"Si Workana se retira. ~373€/mes" },
              ].map(({l,v,c,note})=>(
                <div key={l} style={{ background:C.bg, borderRadius:"7px", padding:"10px 12px", border:`1px solid ${C.border}` }}>
                  <div style={{ fontSize:"10px", color:C.muted, marginBottom:"3px" }}>{l}</div>
                  <div style={{ ...S.mono, fontSize:"15px", fontWeight:800, color:c }}>{v}</div>
                  <div style={{ fontSize:"10px", color:C.muted, marginTop:"3px", lineHeight:1.4 }}>{note}</div>
                </div>
              ))}
            </div>
            <div style={{ fontSize:"11px", color:C.amber, lineHeight:1.6 }}>
              ⚠️ <strong>El banco muestra 0€ de ingresos de Raxislab</strong> porque Jorge DeSancho paga vía Workana y el dinero se queda en Workana/PayPal sin retirar al banco todavía. Confirma cuánto has retirado de Workana en este periodo para cruzar los datos.
            </div>
            <div style={{ marginTop:"8px", fontSize:"11px", color:C.red, lineHeight:1.6, padding:"7px 10px", background:`color-mix(in srgb, ${C.red} 6%, transparent)`, borderRadius:"6px" }}>
              🚨 <strong>Recaba Inversiones: contrato terminado julio 2026</strong> — ya no hay nómina. Ingresos actuales = paro + clientes Raxislab. Prioridad: cerrar nuevos clientes para compensar.
            </div>
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"14px" }}>
            <div style={S.card}>
              <h3 style={{ fontSize:"12px", fontWeight:700, color:C.amber, margin:"0 0 10px", display:"flex", alignItems:"center", gap:"6px" }}><AlertTriangle size={13}/>Pendiente aclarar</h3>
              {pendientes.map((p,i) => (
                <div key={i} style={{ fontSize:"11px", color:p.w?C.amber:C.mid, display:"flex", gap:"6px", marginBottom:"5px", lineHeight:1.5 }}>
                  <span style={{ flexShrink:0 }}>{p.w?"⚠️":"ℹ️"}</span>{p.txt}
                </div>
              ))}
            </div>
            <div style={S.card}>
              <h3 style={{ fontSize:"12px", fontWeight:700, color:C.green, margin:"0 0 10px", display:"flex", alignItems:"center", gap:"6px" }}><TrendingUp size={13}/>Crecimiento</h3>
              {[
                { t:`1 cliente como Jorge (637€) = ${eurD(pl.neto)}/mes neto. Con 2 clientes → ${eurD(pl.neto*2)}/mes (suscripciones ya pagadas).`, c:C.green },
                { t:`Jagger Club a 800€/mes → ingresos 1.437€, neto sube a ~950€/mes, margen 66%.`, c:C.accent },
                { t:"Zoho 59.87€: si no lo usas activamente, cancelar = +60€/mes neto.", c:C.amber },
                { t:"Confirmar tarifa real editor (Maitena vs David) antes de comprometer proyectos.", c:C.mid },
                { t:"1 cliente agencia más → ingresos × 2 con el mismo sistema sin costos extra.", c:C.green },
              ].map(({ t,c },i) => (
                <div key={i} style={{ fontSize:"11px", color:c, lineHeight:1.5, display:"flex", gap:"6px", marginBottom:"6px" }}>
                  <span style={{ flexShrink:0 }}>→</span>{t}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ══ INGRESOS ══ */}
      {tab === "Ingresos" && (
        <div style={{ display:"flex", flexDirection:"column", gap:"14px" }}>
          <div style={S.card}>
            <h3 style={{ fontSize:"13px", fontWeight:600, margin:"0 0 14px" }}>Clientes activos</h3>
            {data.ingresos.map(i => (
              <div key={i.id} style={{ padding:"12px 0", borderBottom:`1px solid ${C.border}`, display:"grid", gridTemplateColumns:"2fr 1fr 1fr 1fr 2fr", gap:"12px", alignItems:"center" }}>
                <div>
                  <div style={{ fontWeight:700, fontSize:"13px" }}>{i.cliente}</div>
                  <div style={{ fontSize:"11px", color:C.muted }}>{i.concepto}</div>
                </div>
                <div style={{ ...S.mono, fontSize:"15px", fontWeight:700, color:C.green }}>{eurD(i.importe)}<span style={{ fontSize:"10px", color:C.muted }}>/mes</span></div>
                <span style={{ ...badge(C.green) }}>{i.estado}</span>
                <span style={{ ...badge(C.blue) }}>{i.paquete || "—"}</span>
                <div style={{ fontSize:"11px", color:C.muted, lineHeight:1.5 }}>{i.nota}</div>
              </div>
            ))}
          </div>
          <div style={S.card}>
            <h3 style={{ fontSize:"13px", fontWeight:600, color:C.amber, margin:"0 0 12px" }}>Paquetes de servicio</h3>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"10px", marginBottom:"14px" }}>
              {[
                { l:"Básico",    d:"Solo producción vídeo/foto. René graba y entrega. No publica en redes del cliente.",      p:"250–600€",     c:C.mid   },
                { l:"Estándar", d:"Producción + gestión Meta Ads. Entrega contenido Y gestiona anuncios. Sin publicación orgánica.", p:"800–1.200€",   c:C.amber },
                { l:"Premium",  d:"Producción + Meta Ads + Google Ads. Pendiente: ¿gestiona René o subcontrata?",              p:"1.200–2.000€", c:C.accent },
              ].map(({ l,d,p,c }) => (
                <div key={l} style={{ padding:"12px", background:C.bg, borderRadius:"8px", border:`1px solid ${c}33` }}>
                  <div style={{ fontWeight:700, color:c, fontSize:"13px", marginBottom:"4px" }}>Paquete {l}</div>
                  <div style={{ fontSize:"11px", color:C.muted, lineHeight:1.5, marginBottom:"6px" }}>{d}</div>
                  <div style={{ ...S.mono, fontSize:"13px", color:c }}>{p}/mes</div>
                </div>
              ))}
            </div>
            <h3 style={{ fontSize:"12px", fontWeight:600, color:C.amber, margin:"0 0 10px" }}>Prospectos en pipeline</h3>
            {data.prospectos.map(p => (
              <div key={p.id} style={{ padding:"10px 12px", background:C.bg, borderRadius:"7px", border:`1px solid ${C.border}`, display:"grid", gridTemplateColumns:"1fr 1fr 1.5fr 2fr", gap:"10px", alignItems:"center", marginBottom:"7px" }}>
                <span style={{ fontWeight:600, fontSize:"12px" }}>{p.nombre}</span>
                <span style={{ fontSize:"11px", color:C.mid }}>{p.tipo}</span>
                <span style={{ ...badge(C.amber) }}>{p.paquete}</span>
                <span style={{ fontSize:"11px", color:C.muted }}>{p.estado}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══ GASTOS ══ */}
      {tab === "Gastos" && (
        <div style={{ display:"flex", flexDirection:"column", gap:"14px" }}>
          <div style={{ ...S.card, padding:0, overflow:"hidden" }}>
            <div style={{ padding:"14px 18px", borderBottom:`1px solid ${C.border}`, display:"flex", justifyContent:"space-between" }}>
              <h3 style={{ fontSize:"13px", fontWeight:600, margin:0 }}>Suscripciones mensuales</h3>
              <span style={{ ...S.mono, fontSize:"12px", color:C.amber }}>{eurD(pl.totalSusc)}/mes confirmado</span>
            </div>
            <table style={{ width:"100%", borderCollapse:"collapse", fontSize:"11px" }}>
              <thead><tr style={{ borderBottom:`1px solid ${C.border}` }}>
                {["Servicio","Importe","Frecuencia","Método","Estado","Nota"].map(h => (
                  <th key={h} style={{ padding:"8px 14px", textAlign:"left", color:C.muted, fontWeight:600, fontSize:"10px", textTransform:"uppercase", letterSpacing:"0.07em" }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {data.suscripciones.map(s => (
                  <tr key={s.id} style={{ borderBottom:"1px solid var(--border)" }}>
                    <td style={{ padding:"8px 14px", fontWeight:600, color:C.text }}>{s.servicio}</td>
                    <td style={{ padding:"8px 14px", ...S.mono, color:s.importe?C.text:C.muted }}>{s.importe?eurD(s.importe):"?"}</td>
                    <td style={{ padding:"8px 14px", color:C.mid }}>{s.frecuencia}</td>
                    <td style={{ padding:"8px 14px", color:C.mid }}>{s.metodo}</td>
                    <td style={{ padding:"8px 14px" }}>
                      {s.confirmado
                        ? <span style={{ ...badge(C.green), display:"inline-flex", alignItems:"center", gap:"4px" }}><CheckCircle size={9}/>OK</span>
                        : <span style={{ ...badge(C.amber), display:"inline-flex", alignItems:"center", gap:"4px" }}><AlertTriangle size={9}/>Pendiente</span>
                      }
                    </td>
                    <td style={{ padding:"8px 14px", color:C.muted, fontSize:"10px" }}>{s.nota}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ ...S.card, padding:0, overflow:"hidden" }}>
            <div style={{ padding:"14px 18px", borderBottom:`1px solid ${C.border}` }}>
              <h3 style={{ fontSize:"13px", fontWeight:600, margin:0 }}>Editores / Colaboradores (pagos históricos)</h3>
            </div>
            {data.editores.map(e => {
              const tot = e.importes.reduce((a,b)=>a+b,0) * (e.moneda==="USD"?0.92:1);
              return (
                <div key={e.id} style={{ padding:"12px 18px", borderBottom:"1px solid var(--border)" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"3px" }}>
                    <span style={{ fontWeight:700, fontSize:"12px" }}>{e.nombre}</span>
                    <span style={{ ...S.mono, fontSize:"12px", fontWeight:700 }}>{eurD(tot)}</span>
                  </div>
                  <div style={{ fontSize:"11px", color:C.muted, marginBottom:"4px" }}>{e.concepto} — {e.moneda === "USD" ? "USD" : ""} {e.importes.join(" · ")} {e.moneda}</div>
                  <div style={{ fontSize:"10px", padding:"4px 8px", borderRadius:"4px", background:`${e.tarifa_variable?C.amber:C.green}0A`, border:`1px solid ${e.tarifa_variable?C.amber:C.green}22`, color:e.tarifa_variable?C.amber:C.mid }}>
                    {e.tarifa_nota}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ══ EQUIPO ══ */}
      {tab === "Equipo" && (
        <div style={{ display:"flex", flexDirection:"column", gap:"14px" }}>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"12px" }}>
            {[
              { l:"Equipo foto/vídeo",  v:eur(equipoFoto),  c:C.accent },
              { l:"Equipo de trabajo",  v:eur(equipoTrab),  c:C.blue   },
              { l:"TOTAL INVENTARIO",   v:eur(equipoTotal), c:C.green  },
            ].map(({ l,v,c }) => (
              <div key={l} style={S.card}>
                <div style={{ fontSize:"10px", color:C.muted, marginBottom:"4px" }}>{l}</div>
                <div style={{ ...S.mono, fontSize:"20px", fontWeight:800, color:c }}>{v}</div>
              </div>
            ))}
          </div>
          <div style={{ ...S.card, padding:0, overflow:"hidden" }}>
            <table style={{ width:"100%", borderCollapse:"collapse", fontSize:"12px" }}>
              <thead><tr style={{ borderBottom:`1px solid ${C.border}` }}>
                {["Categoría","Item","Valor"].map(h=><th key={h} style={{ padding:"9px 16px", textAlign:"left", color:C.muted, fontWeight:600, fontSize:"10px", textTransform:"uppercase", letterSpacing:"0.07em" }}>{h}</th>)}
              </tr></thead>
              <tbody>
                {equipoCats.flatMap(cat => EQUIPO.filter(e=>e.cat===cat).map((e,j) => (
                  <tr key={e.item} style={{ borderBottom:"1px solid var(--border)" }}>
                    {j===0 && <td rowSpan={EQUIPO.filter(x=>x.cat===cat).length} style={{ padding:"9px 16px", verticalAlign:"top" }}>
                      <span style={{ ...badge(cat==="Trabajo"?C.blue:C.accent) }}>{cat}</span>
                    </td>}
                    <td style={{ padding:"9px 16px", color:C.text }}>{e.item}</td>
                    <td style={{ padding:"9px 16px", ...S.mono, color:C.mid }}>{eurD(e.v)}</td>
                  </tr>
                )))}
              </tbody>
            </table>
          </div>
          <div style={{ fontSize:"11px", color:C.muted, padding:"8px 12px", background:`${C.amber}06`, borderRadius:"7px", border:`1px solid ${C.amber}22` }}>
            ⚠️ Precios orientativos (mercado usado + capturas Amazon). Actualizar con tickets reales cuando los tengas. Los precios en azul en el Excel original eran confirmados.
          </div>
        </div>
      )}

      {/* ══ JAGGER CLUB ══ */}
      {tab === "Jagger Club" && (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"18px" }}>
          <div style={{ display:"flex", flexDirection:"column", gap:"14px" }}>
            <div style={S.card}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"14px" }}>
                <h3 style={{ fontSize:"14px", fontWeight:600, margin:0 }}>Calculadora de precio</h3>
                <button onClick={()=>setEditingJ(!editingJ)} style={{ ...S.ghost, color:editingJ?C.accent:C.mid }}>
                  {editingJ?<><Save size={11}/>Listo</>:<><Edit3 size={11}/>Editar</>}
                </button>
              </div>
              {([
                { l:"Nº vídeos a entregar",               k:"nVideos"    as const, min:1,  max:20,  step:1   },
                { l:"Horas grabación (incl. desplaz.)",   k:"horas"      as const, min:1,  max:12,  step:0.5 },
                { l:"Tu tarifa/hora (€)",                 k:"valorHora"  as const, min:20, max:150, step:5   },
                { l:"Coste editor / vídeo (€)",           k:"costeEditor"as const, min:0,  max:100, step:5   },
                { l:"Ayudante / cámara extra (€)",        k:"ayudante"   as const, min:0,  max:200, step:10  },
                { l:"Desplazamiento / parking (€)",       k:"desplaz"    as const, min:0,  max:50,  step:5   },
              ] as const).map(({ l,k,min,max,step }) => (
                <div key={k} style={{ marginBottom:"10px" }}>
                  <span style={S.lbl}>{l}</span>
                  {editingJ
                    ? <div style={{ display:"flex", gap:"10px", alignItems:"center" }}>
                        <input type="range" min={min} max={max} step={step} value={data.jaggerCalc[k]}
                          onChange={e=>persist({ ...data, jaggerCalc:{ ...data.jaggerCalc, [k]:Number(e.target.value) } })}
                          style={{ flex:1 }} />
                        <span style={{ ...S.mono, color:C.accent, minWidth:"44px", textAlign:"right", fontSize:"13px", fontWeight:700 }}>{data.jaggerCalc[k]}</span>
                      </div>
                    : <span style={{ ...S.mono, color:C.text, fontSize:"13px" }}>{data.jaggerCalc[k]}€</span>
                  }
                </div>
              ))}
              <div style={{ marginBottom:"10px" }}>
                <span style={S.lbl}>Margen de beneficio (%)</span>
                {editingJ
                  ? <div style={{ display:"flex", gap:"10px", alignItems:"center" }}>
                      <input type="range" min={10} max={200} step={5} value={Math.round(data.jaggerCalc.margen*100)}
                        onChange={e=>persist({ ...data, jaggerCalc:{ ...data.jaggerCalc, margen:Number(e.target.value)/100 } })}
                        style={{ flex:1 }} />
                      <span style={{ ...S.mono, color:C.accent, minWidth:"44px", textAlign:"right", fontSize:"13px", fontWeight:700 }}>{Math.round(data.jaggerCalc.margen*100)}%</span>
                    </div>
                  : <span style={{ ...S.mono, color:C.text, fontSize:"13px" }}>{Math.round(data.jaggerCalc.margen*100)}%</span>
                }
              </div>
            </div>
          </div>

          <div style={{ display:"flex", flexDirection:"column", gap:"14px" }}>
            <div style={S.card}>
              <h3 style={{ fontSize:"14px", fontWeight:600, margin:"0 0 12px" }}>Desglose de costos</h3>
              {[
                { l:`Edición (${data.jaggerCalc.nVideos}×${data.jaggerCalc.costeEditor}€)`, v:jRes.costEdicion },
                { l:`Tu tiempo (${data.jaggerCalc.horas}h×${data.jaggerCalc.valorHora}€)`,   v:jRes.costTiempo  },
                { l:"Ayudante",       v:data.jaggerCalc.ayudante, hide:!data.jaggerCalc.ayudante },
                { l:"Desplazamiento", v:data.jaggerCalc.desplaz,  hide:!data.jaggerCalc.desplaz  },
              ].filter(x=>!x.hide).map(({ l,v }) => (
                <div key={l} style={{ display:"flex", justifyContent:"space-between", padding:"6px 10px", background:C.bg, borderRadius:"5px", marginBottom:"4px", border:`1px solid ${C.border}` }}>
                  <span style={{ fontSize:"12px", color:C.mid }}>{l}</span>
                  <span style={{ ...S.mono, fontSize:"12px" }}>{eurD(v)}</span>
                </div>
              ))}
              <div style={{ display:"flex", justifyContent:"space-between", padding:"8px 10px", background:`${C.red}0A`, borderRadius:"5px", marginBottom:"12px", border:`1px solid ${C.red}33` }}>
                <span style={{ fontSize:"12px", color:C.mid, fontWeight:700 }}>COSTO TOTAL</span>
                <span style={{ ...S.mono, fontSize:"13px", color:C.red, fontWeight:700 }}>{eurD(jRes.costTotal)}</span>
              </div>
              {[
                { l:"Por sesión / noche",        v:jRes.precio,        sub:`Tu ganancia: ${eurD(jRes.ganancia)}`, c:C.accent, big:true },
                { l:"Por vídeo individual",       v:jRes.precioVideo,   sub:"Si venden reels sueltos",            c:C.amber,  big:false },
                { l:"Pack mensual (4 noches -10%)", v:jRes.precioMensual, sub:"Recurrente, más estable",         c:C.green,  big:false },
              ].map(({ l,v,sub,c,big }) => (
                <div key={l} style={{ padding:"10px 12px", background:C.bg, borderRadius:"7px", border:`1px solid ${c}22`, marginBottom:"7px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <div>
                    <div style={{ fontSize:"12px", color:C.mid, marginBottom:"2px" }}>{l}</div>
                    <div style={{ fontSize:"10px", color:C.muted }}>{sub}</div>
                  </div>
                  <div style={{ ...S.mono, fontSize:big?"22px":"16px", fontWeight:800, color:c }}>{eur(v)}</div>
                </div>
              ))}
            </div>

            <div style={{ ...S.card, border:`1px solid ${C.accent}33`, background:`${C.accent}05` }}>
              <h3 style={{ fontSize:"12px", fontWeight:700, color:C.accent, margin:"0 0 10px" }}>Estrategia Jagger Club (realista)</h3>
              <div style={{ fontSize:"11px", color:C.mid, lineHeight:1.9 }}>
                <div>• <strong style={{ color:C.amber }}>Sin factura</strong> = cobro en efectivo/Bizum. Normal para empezar con un club.</div>
                <div>• <strong style={{ color:C.text }}>Hoy gratis:</strong> primera noche → 3 reels en 24h → muestras lo que puedes hacer</div>
                <div>• <strong style={{ color:C.text }}>Precio real mercado:</strong> 80–120€/noche para arrancar. Subir cuando vean valor.</div>
                <div>• <strong style={{ color:C.text }}>Semana siguiente:</strong> propuesta informal — "50€/noche o 150€ los 4 viernes del mes"</div>
                <div>• <strong style={{ color:C.text }}>Escalar:</strong> cuando haya confianza, subir precio y plantear factura / empresa</div>
              </div>
              <button onClick={()=>setShowProp(true)} style={{ ...S.btn, marginTop:"12px", width:"100%", justifyContent:"center" }}>
                <FileText size={13}/> Ver propuesta (imprimir / PDF)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ PERSONALES ══ */}
      {tab === "Personales" && (
        <div style={{ display:"flex", flexDirection:"column", gap:"14px" }}>
          <div style={{ ...S.card, background:`${C.amber}05`, border:`1px solid ${C.amber}22`, fontSize:"12px", color:C.mid, lineHeight:1.7 }}>
            <strong style={{ color:C.amber }}>Gastos a revisar:</strong> movimientos del banco que parecen personales. No están en el P&L. Si alguno es de negocio (viaje de trabajo, etc.) márcalo y se sumará a los gastos.
          </div>
          <div style={{ ...S.card, padding:0, overflow:"hidden" }}>
            <table style={{ width:"100%", borderCollapse:"collapse", fontSize:"12px" }}>
              <thead><tr style={{ borderBottom:`1px solid ${C.border}` }}>
                {["Concepto","Importe","¿Negocio?","Nota"].map(h=><th key={h} style={{ padding:"9px 16px", textAlign:"left", color:C.muted, fontWeight:600, fontSize:"10px", textTransform:"uppercase", letterSpacing:"0.07em" }}>{h}</th>)}
              </tr></thead>
              <tbody>
                {data.personales.map(p => {
                  const esIngreso = p.importe < 0;
                  return (
                    <tr key={p.id} style={{ borderBottom:"1px solid var(--border)", background:esIngreso?`${C.green}06`:undefined }}>
                      <td style={{ padding:"9px 16px", fontWeight:600, color:esIngreso?C.green:C.text }}>{p.concepto}</td>
                      <td style={{ padding:"9px 16px", ...S.mono, color:esIngreso?C.green:p.importe?C.text:C.muted }}>
                        {esIngreso ? `+${eurD(Math.abs(p.importe))}` : p.importe ? eurD(p.importe) : "?"}
                      </td>
                      <td style={{ padding:"9px 16px" }}>
                        {esIngreso
                          ? <span style={{ fontSize:"10px", color:C.green, fontWeight:700 }}>INGRESO</span>
                          : <div style={{ display:"flex", gap:"8px" }}>
                              {([true,false,null] as const).map(v=>(
                                <label key={String(v)} style={{ display:"flex", alignItems:"center", gap:"4px", cursor:"pointer", fontSize:"11px", color:p.esNegocio===v?C.accent:C.muted }}>
                                  <input type="radio" checked={p.esNegocio===v}
                                    onChange={()=>persist({ ...data, personales:data.personales.map(x=>x.id===p.id?{...x,esNegocio:v}:x) })}
                                    style={{ accentColor:C.accent }} />
                                  {v===true?"Sí":v===false?"No":"?"}
                                </label>
                              ))}
                            </div>
                        }
                      </td>
                      <td style={{ padding:"9px 16px", color:C.muted, fontSize:"11px" }}>{p.nota}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div style={{ fontSize:"11px", color:C.mid }}>
            Gastos marcados como negocio: <strong style={{ color:C.text, ...S.mono }}>{eurD(data.personales.filter(p=>p.esNegocio===true && p.importe>0).reduce((s,p)=>s+p.importe,0))}</strong> — se añadirán al P&L cuando los confirmes.
          </div>
        </div>
      )}

      {/* ══ MODAL PROPUESTA ══ */}
      {showProp && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.85)", zIndex:100, display:"flex", alignItems:"center", justifyContent:"center" }}>
          <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:"14px", width:"660px", maxHeight:"85vh", overflowY:"auto", padding:"28px" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"20px" }}>
              <h2 style={{ fontSize:"16px", fontWeight:700, margin:0 }}>Propuesta — Jagger Club</h2>
              <div style={{ display:"flex", gap:"8px" }}>
                <button onClick={()=>window.print()} style={S.btn}><FileText size={12}/>Imprimir / PDF</button>
                <button onClick={()=>setShowProp(false)} style={S.ghost}><X size={12}/></button>
              </div>
            </div>
            <div style={{ lineHeight:1.7, color:C.text }}>
              <div style={{ textAlign:"center", marginBottom:"20px", paddingBottom:"18px", borderBottom:`1px solid ${C.border}` }}>
                <div style={{ fontSize:"22px", fontWeight:900, color:C.accent, letterSpacing:"0.12em" }}>RAXISLAB</div>
                <div style={{ fontSize:"11px", color:C.mid }}>Marketing & Creación de Contenido · raxislab.com · +34 654 835 593</div>
              </div>
              <h3 style={{ fontSize:"15px", margin:"0 0 4px" }}>Propuesta de Contenido Profesional</h3>
              <p style={{ fontSize:"12px", color:C.muted, margin:"0 0 18px" }}>Para: Jagger Club · Fecha: {new Date().toLocaleDateString("es")}</p>
              <p style={{ fontSize:"12px", color:C.mid, margin:"0 0 16px" }}>
                Hola,<br/><br/>
                Gracias por la oportunidad de trabajar juntos. Adjunto nuestra propuesta de creación de contenido profesional para vuestro local.
              </p>
              {[
                { nom:"Sesión Suelta",         precio:eur(jRes.precio),        desc:`${data.jaggerCalc.nVideos} reels verticales (Reels/TikTok) · ${data.jaggerCalc.horas}h de grabación · Edición profesional · Entrega en 48h`, tag:"" },
                { nom:"Pack Mensual (×4)",     precio:eur(jRes.precioMensual), desc:`4 sesiones/mes · ${data.jaggerCalc.nVideos*4}+ reels editados · Precio preferente (-10%) · Prioridad de entrega`, tag:"Recomendado" },
                { nom:"Estándar + Meta Ads",   precio:"Consultar",             desc:"Contenido + gestión campañas Meta Ads para atraer más gente al local. Segmentación, creativos, reporting mensual.", tag:"" },
              ].map(({ nom,precio,desc,tag }) => (
                <div key={nom} style={{ padding:"12px 14px", border:`1px solid ${C.border}`, borderRadius:"7px", marginBottom:"8px" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"4px" }}>
                    <span style={{ fontWeight:700, color:C.text, fontSize:"13px" }}>{nom} {tag&&<span style={{ ...badge(C.accent), marginLeft:"8px" }}>{tag}</span>}</span>
                    <span style={{ ...S.mono, color:C.accent, fontWeight:800, fontSize:"14px" }}>{precio}</span>
                  </div>
                  <div style={{ fontSize:"11px", color:C.muted }}>{desc}</div>
                </div>
              ))}
              <div style={{ marginTop:"16px", fontSize:"11px", color:C.muted, lineHeight:1.8, borderTop:`1px solid ${C.border}`, paddingTop:"14px" }}>
                <strong style={{ color:C.mid }}>✓ Incluye:</strong> grabación profesional, edición, formato optimizado Reels/TikTok<br/>
                <strong style={{ color:C.mid }}>✗ No incluye:</strong> publicación en redes sociales del cliente (el material se entrega listo para publicar)<br/><br/>
                <strong style={{ color:C.accent }}>René Benegas</strong> · raxislab.com · renebenegas.rb@gmail.com · +34 654 835 593
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
