"use client";

import { useState } from "react";

const carteraAcciones = [
  { ticker:"ENGI", nombre:"Engie SA",            pnlEur:"+152€",  pnlPct:"+24.9%", pos:true,  alerta:""            },
  { ticker:"AI",   nombre:"C3.ai Inc",            pnlEur:"+126€",  pnlPct:"+22.8%", pos:true,  alerta:""            },
  { ticker:"REP",  nombre:"Repsol SA",             pnlEur:"+98.6€", pnlPct:"+25.2%", pos:true,  alerta:""            },
  { ticker:"FLEX", nombre:"Flex Ltd",              pnlEur:"+68.8€", pnlPct:"+13.7%", pos:true,  alerta:""            },
  { ticker:"ENI",  nombre:"ENI SpA",               pnlEur:"+56.5€", pnlPct:"+9.9%",  pos:true,  alerta:""            },
  { ticker:"FGR",  nombre:"Ferroglobe PLC",        pnlEur:"+54.6€", pnlPct:"+35.9%", pos:true,  alerta:""            },
  { ticker:"LOG",  nombre:"Logitech Intl",         pnlEur:"+53.7€", pnlPct:"+17.3%", pos:true,  alerta:""            },
  { ticker:"PHM7", nombre:"PHM Corp",              pnlEur:"+48.9€", pnlPct:"+12.5%", pos:true,  alerta:""            },
  { ticker:"TBK",  nombre:"Triumph Bancorp",       pnlEur:"+29.2€", pnlPct:"+19.3%", pos:true,  alerta:""            },
  { ticker:"VEEV", nombre:"Veeva Systems",          pnlEur:"+15.3€", pnlPct:"+4.7%",  pos:true,  alerta:""            },
  { ticker:"BBVA", nombre:"Banco BBVA",             pnlEur:"+6.88€", pnlPct:"+1.8%",  pos:true,  alerta:""            },
  { ticker:"KTOS", nombre:"Kratos Defense",         pnlEur:"+4.76€", pnlPct:"+2.1%",  pos:true,  alerta:""            },
  { ticker:"CLSK", nombre:"CleanSpark Inc",         pnlEur:"-6.29€", pnlPct:"-3.6%",  pos:false, alerta:"VIGILAR"     },
  { ticker:"BRKR", nombre:"Bruker Corp",            pnlEur:"-20.3€", pnlPct:"-4.9%",  pos:false, alerta:"VIGILAR"     },
  { ticker:"HPE",  nombre:"HP Enterprise",          pnlEur:"-33.7€", pnlPct:"-12.3%", pos:false, alerta:"REVISAR STOP"},
  { ticker:"HIMS", nombre:"Hims & Hers Health",     pnlEur:"-35.1€", pnlPct:"-7.0%",  pos:false, alerta:"REVISAR STOP"},
  { ticker:"BBAI", nombre:"BigBear.ai Holdings",    pnlEur:"-74.2€", pnlPct:"-18.2%", pos:false, alerta:"STOP ACTIVO" },
  { ticker:"AVGO", nombre:"Broadcom Inc",            pnlEur:"-153€",  pnlPct:"-20.9%", pos:false, alerta:"VIGILAR"     },
];

const cartCrypto = [
  { ticker:"SOL", nombre:"Solana",   entrada:"120.00",actual:"165.20",valor:"1.850€",pnlEur:"+380€",pnlPct:"+20.5%",pos:true, target:"$500–800"  },
  { ticker:"ETH", nombre:"Ethereum", entrada:"2.800", actual:"3.120", valor:"2.100€",pnlEur:"+245€",pnlPct:"+11.7%",pos:true, target:"$8.000–12.000"},
  { ticker:"XRP", nombre:"Ripple",   entrada:"0.65",  actual:"0.58",  valor:"620€",  pnlEur:"-62€", pnlPct:"-9.1%", pos:false,target:"$5–10"     },
];

const dividendos = [
  { t:"TTE",  n:"TotalEnergies",            a:20, p:"55.00", y:"5.5%", ingreso:"60€"  },
  { t:"ENGI", n:"Engie",                    a:30, p:"14.20", y:"7.2%", ingreso:"30€"  },
  { t:"REP",  n:"Repsol",                   a:25, p:"12.40", y:"6.8%", ingreso:"21€"  },
  { t:"ELE",  n:"Endesa",                   a:15, p:"18.20", y:"7.5%", ingreso:"20€"  },
  { t:"ENI",  n:"ENI SpA",                  a:20, p:"13.80", y:"5.9%", ingreso:"16€"  },
  { t:"SHELL",n:"Shell",                    a:10, p:"32.50", y:"4.2%", ingreso:"14€"  },
  { t:"IBE",  n:"Iberdrola",                a:40, p:"10.60", y:"4.8%", ingreso:"20€"  },
  { t:"BBVA", n:"BBVA",                     a:50, p:"9.20",  y:"6.5%", ingreso:"30€"  },
  { t:"ASML", n:"ASML Holding",             a:2,  p:"780.00",y:"1.0%", ingreso:"16€"  },
  { t:"MO",   n:"Altria Group",             a:20, p:"41.20", y:"8.5%", ingreso:"70€"  },
  { t:"PEP",  n:"PepsiCo",                  a:10, p:"165.00",y:"3.3%", ingreso:"54€"  },
  { t:"KO",   n:"Coca-Cola",                a:20, p:"63.00", y:"3.1%", ingreso:"39€"  },
  { t:"O",    n:"Realty Income",            a:10, p:"52.00", y:"5.8%", ingreso:"30€"  },
  { t:"ARCC", n:"Ares Capital",             a:30, p:"19.50", y:"9.2%", ingreso:"54€"  },
  { t:"BTI",  n:"British American Tobacco", a:25, p:"32.00", y:"9.5%", ingreso:"76€"  },
  { t:"MAIN", n:"Main Street Capital",      a:20, p:"51.00", y:"6.0%", ingreso:"61€"  },
];

const diarioOps = [
  { fecha:"2026-06-06",ticker:"NVDA",tipo:"LONG",entrada:"109.40",salida:"112.10",resultado:"+€ 58",  ganancia:true  },
  { fecha:"2026-06-05",ticker:"ASTS",tipo:"LONG",entrada:"22.50", salida:"21.80", resultado:"-€ 35",  ganancia:false },
  { fecha:"2026-06-04",ticker:"SHLS",tipo:"LONG",entrada:"13.90", salida:"14.20", resultado:"+€ 45",  ganancia:true  },
  { fecha:"2026-06-03",ticker:"SOL", tipo:"LONG",entrada:"158.00",salida:"165.20",resultado:"+€ 120", ganancia:true  },
];

const setups = [
  { ticker:"SHLS",razon:"Breakout técnico sobre resistencia semanal con volumen", entrada:"14.20",stop:"13.40",objetivo:"16.50"},
  { ticker:"ASTS",razon:"Catalizador DoD pendiente + setup técnico limpio",       entrada:"22.50",stop:"21.00",objetivo:"26.00"},
  { ticker:"IONQ",razon:"Momentum sector quantum tras earnings IBM",               entrada:"8.90", stop:"8.20", objetivo:"10.80"},
  { ticker:"MSTR",razon:"Correlación BTC — acumulación institucional en OB",      entrada:"145.00",stop:"138.00",objetivo:"165.00"},
  { ticker:"RKLB",razon:"Post-lanzamiento exitoso — setup técnico convergente",   entrada:"11.30",stop:"10.60",objetivo:"13.50"},
];

const PROMPTS = [
  "Analiza [TICKER]: volumen vs media 20d, RSI, soporte clave, próximo catalizador",
  "Dame 5 small caps con momentum + volumen inusual hoy en NYSE/NASDAQ",
  "Busca earnings próxima semana en sector tecnología con cap <5B",
  "Analiza sector semiconductores: líderes, rezagados, correlación SOX",
  "Setup técnico [TICKER]: patrón, entrada, stop, objetivo R:R mín 3:1",
  "Screener: P/E <15, dividendo >4%, sector defensivo, cap >500M",
  "Análisis sentimiento [TICKER] últimas 24h: noticias, social, opciones",
  "3 acciones con alta correlación BTC en mercado tradicional",
  "Insider buying significativo últimas 2 semanas en small caps",
  "Gaps abiertos más relevantes del SP500 en zonas de soporte",
  "Flujo opciones inusuales destacadas para mañana: calls/puts",
  "Pre-market resumen: earnings, macro, setups destacados para hoy",
];

type Tab = "Acciones"|"Crypto"|"Dividendos"|"Diario"|"Setups";
const TABS: Tab[] = ["Acciones","Crypto","Dividendos","Diario","Setups"];

const CARD  = { background:"#111111", border:"1px solid rgba(255,255,255,0.06)", borderRadius:"6px" } as React.CSSProperties;
const LABEL = { fontSize:"11px", fontWeight:600, letterSpacing:"0.08em", textTransform:"uppercase" as const, color:"#5A6470" };
const TH    = { padding:"10px 14px", textAlign:"left" as const, fontSize:"11px", fontWeight:600, letterSpacing:"0.06em", color:"#5A6470", borderBottom:"1px solid rgba(255,255,255,0.06)" };
const TD    = { padding:"12px 14px", borderBottom:"1px solid rgba(255,255,255,0.04)" };

const statCards = [
  { label:"Capital",   value:"12.022,43€", color:"#FFFFFF"  },
  { label:"Efectivo",  value:"4.920,81€",  color:"#9AA3AD"  },
  { label:"PnL Total", value:"+357,90€",   color:"#00E676"  },
  { label:"PnL hoy",   value:"-204,70€",   color:"#FF3D71"  },
];

export default function TradingPage() {
  const [tab, setTab] = useState<Tab>("Acciones");
  const [newOp, setNewOp] = useState({ ticker:"", entrada:"", salida:"", tipo:"LONG" });
  const [ops, setOps] = useState(diarioOps);

  function addOp() {
    if (!newOp.ticker || !newOp.entrada || !newOp.salida) return;
    const diff = parseFloat(newOp.salida) - parseFloat(newOp.entrada);
    const ganancia = diff > 0;
    setOps(prev => [{ fecha: new Date().toISOString().slice(0,10), ticker: newOp.ticker.toUpperCase(), tipo: newOp.tipo, entrada: newOp.entrada, salida: newOp.salida, resultado: (ganancia ? "+" : "") + `€ ${Math.abs(diff * 10).toFixed(0)}`, ganancia }, ...prev]);
    setNewOp({ ticker:"", entrada:"", salida:"", tipo:"LONG" });
  }

  return (
    <div style={{ padding:"32px 40px" }}>
      <h1 style={{ fontSize:"24px", fontWeight:600, color:"#FFFFFF", marginBottom:"24px" }}>Trading</h1>

      {/* Tab bar */}
      <div style={{ display:"inline-flex", gap:"4px", padding:"4px", background:"#0a0a0a", border:"1px solid rgba(255,255,255,0.06)", borderRadius:"8px", marginBottom:"20px" }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding:"7px 16px", borderRadius:"5px", border:"none", cursor:"pointer", fontSize:"13px", fontWeight: tab===t ? 600 : 400, background: tab===t ? "rgba(0,200,255,0.1)" : "transparent", color: tab===t ? "#00C8FF" : "#5A6470", outline: tab===t ? "1px solid rgba(0,200,255,0.2)" : "none" }}>{t}</button>
        ))}
      </div>

      {/* Acciones */}
      {tab === "Acciones" && (
        <div style={{ display:"flex", flexDirection:"column", gap:"16px" }}>
          {/* Mini-cards MEXEM */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"12px" }}>
            {statCards.map(({ label, value, color }) => (
              <div key={label} style={{ ...CARD, padding:"18px 20px" }}>
                <p style={{ ...LABEL, marginBottom:"8px" }}>{label}</p>
                <p style={{ fontFamily:"'Space Mono', monospace", fontWeight:700, fontSize:"22px", color }}>{value}</p>
              </div>
            ))}
          </div>
          {/* Alertas activas */}
          <div style={{ display:"flex", alignItems:"center", gap:"8px", flexWrap:"wrap" }}>
            <span style={LABEL}>Alertas activas:</span>
            {carteraAcciones
              .filter(a => a.alerta === "STOP ACTIVO" || a.alerta === "REVISAR STOP")
              .map(a => (
                <span key={a.ticker} style={{
                  padding:"3px 10px", borderRadius:"3px", fontSize:"11px", fontWeight:700, letterSpacing:"0.04em",
                  background: a.alerta === "STOP ACTIVO" ? "rgba(255,61,113,0.15)" : "rgba(255,184,0,0.15)",
                  color:       a.alerta === "STOP ACTIVO" ? "#FF3D71" : "#FFB800",
                  border:`1px solid ${a.alerta === "STOP ACTIVO" ? "rgba(255,61,113,0.3)" : "rgba(255,184,0,0.3)"}`,
                }}>
                  {a.ticker} — {a.alerta}
                </span>
              ))
            }
          </div>
          {/* Tabla */}
          <div style={{ ...CARD, overflow:"hidden" }}>
            <div style={{ padding:"16px 20px", borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
              <p style={LABEL}>Cartera Acciones — MEXEM · 6 Jun 2026</p>
            </div>
            <table style={{ width:"100%", borderCollapse:"collapse" }}>
              <thead><tr>{["Ticker","Empresa","PnL €","PnL %","Estado"].map(h=><th key={h} style={TH}>{h}</th>)}</tr></thead>
              <tbody>
                {carteraAcciones.flatMap((item, idx) => {
                  const prevPos = idx > 0 ? carteraAcciones[idx - 1].pos : true;
                  const showSep = !item.pos && prevPos;
                  const rowBg = item.alerta === "STOP ACTIVO"  ? "rgba(255,61,113,0.05)"
                              : item.alerta === "REVISAR STOP" ? "rgba(255,184,0,0.04)"
                              : "transparent";
                  const rows: React.ReactElement[] = [];
                  if (showSep) rows.push(
                    <tr key={`sep-${item.ticker}`}>
                      <td colSpan={5} style={{ padding:"5px 14px", background:"rgba(255,255,255,0.015)", borderTop:"1px solid rgba(255,255,255,0.08)", borderBottom:"1px solid rgba(255,255,255,0.08)" }}>
                        <span style={{ fontSize:"10px", fontWeight:700, color:"#5A6470", letterSpacing:"0.12em" }}>── EN PÉRDIDAS ─────────────────────────────────</span>
                      </td>
                    </tr>
                  );
                  rows.push(
                    <tr key={item.ticker} style={{ background: rowBg }}>
                      <td style={{ ...TD, fontFamily:"'Space Mono', monospace", fontWeight:700, color:"#00C8FF" }}>{item.ticker}</td>
                      <td style={{ ...TD, fontSize:"13px", color:"#5A6470" }}>{item.nombre}</td>
                      <td style={{ ...TD, fontFamily:"'Space Mono', monospace", fontWeight:700, color: item.pos ? "#00E676" : "#FF3D71" }}>{item.pnlEur}</td>
                      <td style={{ ...TD, fontFamily:"'Space Mono', monospace", fontWeight:700, color: item.pos ? "#00E676" : "#FF3D71" }}>{item.pnlPct}</td>
                      <td style={{ ...TD }}>
                        {item.alerta && (
                          <span style={{
                            fontSize:"10px", fontWeight:700, padding:"2px 7px", borderRadius:"3px", letterSpacing:"0.04em",
                            background: item.alerta === "STOP ACTIVO" ? "rgba(255,61,113,0.15)" : item.alerta === "REVISAR STOP" ? "rgba(255,184,0,0.15)" : "rgba(90,100,112,0.12)",
                            color:       item.alerta === "STOP ACTIVO" ? "#FF3D71"              : item.alerta === "REVISAR STOP" ? "#FFB800"              : "#5A6470",
                            border:`1px solid ${item.alerta === "STOP ACTIVO" ? "rgba(255,61,113,0.3)" : item.alerta === "REVISAR STOP" ? "rgba(255,184,0,0.3)" : "rgba(90,100,112,0.25)"}`,
                          }}>{item.alerta}</span>
                        )}
                      </td>
                    </tr>
                  );
                  return rows;
                })}
                <tr>
                  <td colSpan={2} style={{ padding:"12px 14px", fontWeight:700, color:"#FFFFFF", fontSize:"13px", borderTop:"1px solid rgba(255,255,255,0.08)" }}>TOTAL · 18 posiciones</td>
                  <td style={{ padding:"12px 14px", fontFamily:"'Space Mono', monospace", fontWeight:700, color:"#00E676", borderTop:"1px solid rgba(255,255,255,0.08)" }}>+357,90€</td>
                  <td colSpan={2} style={{ padding:"12px 14px", fontFamily:"'Space Mono', monospace", fontSize:"12px", color:"#5A6470", borderTop:"1px solid rgba(255,255,255,0.08)" }}>Capital: 12.022,43€</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Crypto */}
      {tab === "Crypto" && (
        <div style={{ ...CARD, overflow:"hidden" }}>
          <div style={{ padding:"16px 20px", borderBottom:"1px solid rgba(255,255,255,0.06)" }}><p style={LABEL}>Cartera Crypto</p></div>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead><tr>{["Token","Nombre","Entrada","Actual","Valor","P&L €","P&L %","Target"].map(h=><th key={h} style={TH}>{h}</th>)}</tr></thead>
            <tbody>
              {cartCrypto.map(({ ticker,nombre,entrada,actual,valor,pnlEur,pnlPct,pos,target }) => (
                <tr key={ticker}>
                  <td style={{ ...TD, fontFamily:"'Space Mono', monospace", fontWeight:700, color:"#FFB800" }}>{ticker}</td>
                  <td style={{ ...TD, fontSize:"13px", color:"#5A6470" }}>{nombre}</td>
                  <td style={{ ...TD, fontFamily:"'Space Mono', monospace", fontSize:"12px", color:"#5A6470" }}>{entrada}</td>
                  <td style={{ ...TD, fontFamily:"'Space Mono', monospace", fontSize:"13px", color:"#FFFFFF" }}>{actual}</td>
                  <td style={{ ...TD, fontSize:"13px", color:"#9AA3AD" }}>{valor}</td>
                  <td style={{ ...TD, fontFamily:"'Space Mono', monospace", fontWeight:700, color: pos ? "#00E676" : "#FF3D71" }}>{pnlEur}</td>
                  <td style={{ ...TD, fontFamily:"'Space Mono', monospace", fontWeight:700, color: pos ? "#00E676" : "#FF3D71" }}>{pnlPct}</td>
                  <td style={{ ...TD, fontSize:"12px", color:"#00C8FF" }}>{target}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Dividendos */}
      {tab === "Dividendos" && (
        <div style={{ ...CARD, overflow:"hidden" }}>
          <div style={{ padding:"16px 20px", borderBottom:"1px solid rgba(255,255,255,0.06)" }}><p style={LABEL}>Cartera Dividendos — Yield anual estimado</p></div>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead><tr>{["Ticker","Nombre","Acciones","Precio","Yield","Ingreso Anual"].map(h=><th key={h} style={TH}>{h}</th>)}</tr></thead>
            <tbody>
              {dividendos.map(({ t,n,a,p,y,ingreso }) => (
                <tr key={t}>
                  <td style={{ ...TD, fontFamily:"'Space Mono', monospace", fontWeight:700, color:"#00E676" }}>{t}</td>
                  <td style={{ ...TD, fontSize:"12px", color:"#5A6470" }}>{n}</td>
                  <td style={{ ...TD, fontFamily:"'Space Mono', monospace", fontSize:"12px", color:"#9AA3AD" }}>{a}</td>
                  <td style={{ ...TD, fontFamily:"'Space Mono', monospace", fontSize:"12px", color:"#9AA3AD" }}>${p}</td>
                  <td style={{ ...TD, fontFamily:"'Space Mono', monospace", fontWeight:700, color:"#00E676" }}>{y}</td>
                  <td style={{ ...TD, fontFamily:"'Space Mono', monospace", fontWeight:700, color:"#FFFFFF" }}>{ingreso}</td>
                </tr>
              ))}
              <tr>
                <td colSpan={5} style={{ padding:"12px 14px", fontWeight:700, color:"#FFFFFF", fontSize:"13px", borderTop:"1px solid rgba(255,255,255,0.06)" }}>TOTAL ANUAL ESTIMADO</td>
                <td style={{ padding:"12px 14px", fontFamily:"'Space Mono', monospace", fontWeight:700, color:"#00E676", borderTop:"1px solid rgba(255,255,255,0.06)" }}>611€</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Diario */}
      {tab === "Diario" && (
        <div style={{ display:"flex", flexDirection:"column", gap:"16px" }}>
          {/* Formulario */}
          <div style={{ ...CARD, padding:"16px 20px" }}>
            <p style={{ ...LABEL, marginBottom:"14px" }}>Nueva operación</p>
            <div style={{ display:"flex", gap:"10px", flexWrap:"wrap", alignItems:"flex-end" }}>
              {[["Ticker","ticker","NVDA"],["Entrada","entrada","112.00"],["Salida","salida","115.50"]].map(([label, key, ph]) => (
                <div key={key}>
                  <p style={{ fontSize:"11px", color:"#5A6470", marginBottom:"4px" }}>{label}</p>
                  <input
                    value={(newOp as Record<string, string>)[key]}
                    onChange={e => setNewOp(prev => ({ ...prev, [key]: e.target.value }))}
                    placeholder={ph}
                    style={{ padding:"7px 10px", borderRadius:"4px", border:"1px solid rgba(255,255,255,0.06)", background:"#161616", color:"#FFFFFF", fontSize:"13px", width: key==="ticker" ? "90px" : "110px", outline:"none" }}
                  />
                </div>
              ))}
              <div>
                <p style={{ fontSize:"11px", color:"#5A6470", marginBottom:"4px" }}>Tipo</p>
                <select value={newOp.tipo} onChange={e => setNewOp(p=>({...p,tipo:e.target.value}))} style={{ padding:"7px 10px", borderRadius:"4px", border:"1px solid rgba(255,255,255,0.06)", background:"#161616", color:"#FFFFFF", fontSize:"13px", outline:"none" }}>
                  <option>LONG</option><option>SHORT</option>
                </select>
              </div>
              <button onClick={addOp} style={{ padding:"8px 16px", borderRadius:"4px", background:"#00C8FF", color:"#000", fontSize:"13px", fontWeight:600, border:"none", cursor:"pointer" }}>Añadir</button>
            </div>
          </div>
          {/* Log */}
          <div style={{ ...CARD, overflow:"hidden" }}>
            <table style={{ width:"100%", borderCollapse:"collapse" }}>
              <thead><tr>{["Fecha","Ticker","Tipo","Entrada","Salida","Resultado"].map(h=><th key={h} style={TH}>{h}</th>)}</tr></thead>
              <tbody>
                {ops.map((op,i) => (
                  <tr key={i}>
                    <td style={{ ...TD, fontFamily:"'Space Mono', monospace", fontSize:"11px", color:"#5A6470" }}>{op.fecha}</td>
                    <td style={{ ...TD, fontFamily:"'Space Mono', monospace", fontWeight:700, color:"#00C8FF" }}>{op.ticker}</td>
                    <td style={{ ...TD }}><span style={{ fontSize:"11px", fontWeight:600, padding:"2px 6px", borderRadius:"3px", background:"rgba(0,200,255,0.08)", color:"#00C8FF" }}>{op.tipo}</span></td>
                    <td style={{ ...TD, fontFamily:"'Space Mono', monospace", fontSize:"12px", color:"#9AA3AD" }}>{op.entrada}</td>
                    <td style={{ ...TD, fontFamily:"'Space Mono', monospace", fontSize:"12px", color:"#9AA3AD" }}>{op.salida}</td>
                    <td style={{ ...TD, fontFamily:"'Space Mono', monospace", fontWeight:700, color: op.ganancia ? "#00E676" : "#FF3D71" }}>{op.resultado}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Setups */}
      {tab === "Setups" && (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"20px" }}>
          <div>
            <p style={{ ...LABEL, marginBottom:"14px" }}>5 Candidatas del día</p>
            <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
              {setups.map(({ ticker,razon,entrada,stop,objetivo }) => (
                <div key={ticker} style={{ ...CARD, padding:"14px 16px" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"6px" }}>
                    <span style={{ fontFamily:"'Space Mono', monospace", fontWeight:700, color:"#00C8FF" }}>{ticker}</span>
                    <button onClick={() => alert(`${ticker} publicado en Telegram ✅`)} style={{ fontSize:"11px", padding:"3px 8px", borderRadius:"3px", background:"rgba(0,200,255,0.08)", color:"#00C8FF", border:"1px solid rgba(0,200,255,0.15)", cursor:"pointer" }}>Publicar Telegram</button>
                  </div>
                  <p style={{ fontSize:"12px", color:"#5A6470", marginBottom:"10px" }}>{razon}</p>
                  <div style={{ display:"flex", gap:"16px" }}>
                    {[["Entrada",entrada,"#FFFFFF"],["Stop",stop,"#FF3D71"],["Objetivo",objetivo,"#00E676"]].map(([l,v,c])=>(
                      <div key={l}><span style={{ fontSize:"11px", color:"#5A6470" }}>{l} </span><span style={{ fontFamily:"'Space Mono', monospace", fontSize:"12px", fontWeight:700, color:c }}>{v}</span></div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <p style={{ ...LABEL, marginBottom:"14px" }}>12 Prompts de Trading</p>
            <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
              {PROMPTS.map((p,i) => (
                <button
                  key={i}
                  onClick={() => navigator.clipboard.writeText(p).then(() => alert("Prompt copiado ✅"))}
                  style={{ textAlign:"left", padding:"10px 12px", borderRadius:"5px", border:"1px solid rgba(255,255,255,0.06)", background:"#161616", color:"#9AA3AD", fontSize:"12px", cursor:"pointer", lineHeight:1.4 }}
                  onMouseEnter={e=>(e.currentTarget.style.borderColor="rgba(0,200,255,0.2)")}
                  onMouseLeave={e=>(e.currentTarget.style.borderColor="rgba(255,255,255,0.06)")}
                >
                  <span style={{ fontFamily:"'Space Mono', monospace", color:"#5A6470", marginRight:"8px" }}>{String(i+1).padStart(2,"0")}</span>{p}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
