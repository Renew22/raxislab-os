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

const carteraCrypto = [
  { coin:"SOL",  nombre:"Solana",    cantidad:10.22,   valor:644.99, pnl:-169.62, pnlPct:-20.8,  estado:"MANTENER",        target:"$500-800"      },
  { coin:"XRP",  nombre:"Ripple",    cantidad:406.11,  valor:445.50, pnl:-174.11, pnlPct:-28.1,  estado:"MANTENER",        target:"$5-10"         },
  { coin:"ETH",  nombre:"Ethereum",  cantidad:0.163,   valor:257.82, pnl:-64.07,  pnlPct:-19.9,  estado:"MANTENER",        target:"$8.000-12.000" },
  { coin:"USDT", nombre:"Tether",    cantidad:178.72,  valor:178.58, pnl:0,       pnlPct:0,      estado:"LIQUIDEZ",        target:"—"             },
  { coin:"DOGE", nombre:"Dogecoin",  cantidad:2079.12, valor:169.75, pnl:97.09,   pnlPct:134.2,  estado:"TOMAR PARCIALES", target:"—"             },
  { coin:"DOT",  nombre:"Polkadot",  cantidad:112.81,  valor:106.42, pnl:-77.13,  pnlPct:-42.0,  estado:"REVISAR TESIS",   target:"—"             },
  { coin:"LTC",  nombre:"Litecoin",  cantidad:1.71,    valor:73.48,  pnl:-25.85,  pnlPct:-26.0,  estado:"REVISAR TESIS",   target:"—"             },
  { coin:"ADA",  nombre:"Cardano",   cantidad:238.44,  valor:37.70,  pnl:-31.11,  pnlPct:-45.2,  estado:"REVISAR TESIS",   target:"—"             },
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

const TRADING_PROMPTS = [
  { id:"P1",  titulo:"Macro diario",
    prompt:`Eres mi analista macro senior. Dame el briefing completo de apertura de hoy:

1. FUTUROS Y APERTURA: Estado actual de futuros US (ES, NQ, RTY), Europa (DAX, IBEX) y Asia cerrada
2. MACRO DEL DÍA: Datos económicos publicados hoy y pendientes (hora, consenso, anterior)
3. NARRATIVA DOMINANTE: Qué está moviendo el mercado hoy y por qué
4. SECTORES: Top 3 sectores fuertes y top 3 débiles en la apertura
5. SETUPS DESTACADOS: 3-5 tickers con movimiento relevante pre-market y por qué
6. RIESGO DEL DÍA: Nivel de riesgo 1-10 y qué eventos podrían generar volatilidad

Formato: secciones numeradas, datos concretos, sin texto de relleno.` },
  { id:"P2",  titulo:"Empresa nueva",
    prompt:`Analiza esta empresa para decidir si entra en la cartera Raxis Investor:
Ticker: [TICKER]

1. TESIS EN UNA LÍNEA: Por qué podría ser una buena inversión
2. NEGOCIO: Qué hace, cómo gana dinero, moat, posición competitiva
3. FINANCIERO: Revenue growth YoY, márgenes (bruto/operativo/neto), deuda/equity, FCF
4. TÉCNICO: Tendencia principal, soporte/resistencia clave, volumen, RSI semanal
5. CATALIZADORES: 3-5 catalizadores concretos próximos 6-12 meses
6. RIESGOS: Top 3 riesgos que invalidarían la tesis
7. VALORACIÓN: P/E, P/S, EV/EBITDA vs sector. ¿Cara, justa o barata?
8. VEREDICTO: COMPRAR / VIGILAR / PASAR + nivel de convicción 1-10

Respuesta estructurada, datos actualizados, sin fluff.` },
  { id:"P3",  titulo:"Update posición",
    prompt:`Tengo esta posición abierta y necesito un update completo:
Ticker: [TICKER] | Entrada: [PRECIO] | Stop actual: [STOP] | Target: [TARGET]
Tesis original: [DESCRIBE LA TESIS EN 1-2 LÍNEAS]

1. QUÉ HA CAMBIADO: Noticias, earnings, sector desde mi entrada
2. TESIS VIGENTE: ¿Sigue intacta? ¿Fortalecida o debilitada? Justifica
3. TÉCNICO ACTUAL: Precio vs soporte/resistencia, tendencia, volumen
4. CATALIZADORES PRÓXIMOS: Qué eventos pueden mover el precio en 1-4 semanas
5. ESCENARIOS: A) Bull case: target y probabilidad | B) Bear case: invalidación
6. ACCIÓN RECOMENDADA: Mantener / Reducir / Añadir / Cerrar + por qué

Dame decisión clara y concisa. No repeats, no fluff.` },
  { id:"P4",  titulo:"Screener sector",
    prompt:`Haz un screener del sector [SECTOR] buscando las mejores oportunidades ahora:

FILTROS CUANTITATIVOS:
- Cap: preferiblemente $500M-$10B (small/mid cap con momentum)
- Revenue growth >20% YoY o aceleración reciente
- Márgenes mejorando o superiores al sector
- Deuda manejable (D/E <1 o con FCF positivo)

FILTROS TÉCNICOS:
- Precio sobre media 50d y 200d (o en proceso de recuperación)
- Volumen sobre media 20d en los últimos 5 días
- RSI 40-70 (no sobrecomprado ni en caída libre)

OUTPUT: Dame 5 nombres concretos con:
Ticker | Por qué destaca | Nivel de entrada sugerido | Stop | Target 6-12 meses
Ordena de mayor a menor convicción.` },
  { id:"P5",  titulo:"Validar spike",
    prompt:`El precio de [TICKER] acaba de moverse [X%] en [TIMEFRAME]. Necesito validación rápida:

1. CAUSA: ¿Qué desencadenó el movimiento? (news, earnings, upgrade, rumor, macro)
2. CALIDAD DEL MOVIMIENTO: ¿Volumen confirma? ¿Es sostenible o fade probable?
3. CONTEXTO TÉCNICO: ¿Rompe nivel clave? ¿Qué hay arriba/abajo como resistencia/soporte?
4. OPCIONES:
   A) Perseguir — riesgos y setup
   B) Esperar retroceso — niveles de entrada
   C) Ignorar — si es ruido
5. ACCIÓN: Recomendación concreta con entrada, stop y target si aplica

Respuesta en menos de 5 minutos de lectura. Solo lo relevante.` },
  { id:"P6",  titulo:"Semanal",
    prompt:`Genera el análisis semanal completo de la cartera Raxis Investor:

1. MERCADO LA SEMANA PASADA: SP500, Nasdaq, Russell — % cambio, narrativa, volumen
2. REVIEW CARTERA: Para cada posición — qué pasó, tesis status (verde/amarillo/rojo)
3. VIGILANCIA: Tickers en watchlist que tuvieron movimiento relevante esta semana
4. AGENDA PRÓXIMA SEMANA: Earnings relevantes, datos macro, eventos Fed/BCE
5. SETUPS PARA LA SEMANA: 3-5 ideas concretas con entrada, stop, target
6. ROTACIONES: ¿Qué sectores están recibiendo/perdiendo flujo? ¿Qué implica?

Cartera actual: [LISTA TUS POSICIONES AQUÍ]
Formato tabla donde aplique. Conciso y accionable.` },
  { id:"P7",  titulo:"Super Prompt 10 bloques",
    prompt:`Análisis COMPLETO para decisión de inversión. Ticker: [TICKER]
Genera los 10 bloques siguientes sin excepciones:

BLOQUE 1 — TESIS: Una frase. ¿Por qué esta empresa puede multiplicar?
BLOQUE 2 — NEGOCIO: Modelo de ingresos, ventaja competitiva, TAM, market share
BLOQUE 3 — FINANCIERO: últimos 4 trimestres — Revenue, EPS, Margen Bruto, FCF
BLOQUE 4 — VALORACIÓN: P/E, EV/EBITDA, P/S, DCF estimate vs precio actual
BLOQUE 5 — TÉCNICO: Timeframe semanal + diario, niveles clave, tendencia, RSI, MACD
BLOQUE 6 — CATALIZADORES: Lista con fecha estimada y impacto potencial %
BLOQUE 7 — SENTIMIENTO: Short interest %, insider activity, analyst ratings recientes
BLOQUE 8 — RIESGOS: Top 5 riesgos con probabilidad y severidad (matriz)
BLOQUE 9 — COMPARABLES: 3 empresas similares — múltiplos y crecimiento vs [TICKER]
BLOQUE 10 — PLAN: Entrada óptima | Stop | Target 1 (6m) | Target 2 (12m) | Tamaño %` },
  { id:"P8",  titulo:"Fundamentales profundos",
    prompt:`Análisis de fundamentales profundos para [TICKER]. Quiero el máximo detalle:

1. CALIDAD DEL NEGOCIO (1-10): ROIC, ROAE, retention rate, pricing power, switching costs
2. CRECIMIENTO: Revenue CAGR 3-5 años, aceleración o desaceleración, guidance management
3. BALANCE: Cash, deuda total, deuda neta/EBITDA, vencimientos, covenants relevantes
4. FREE CASH FLOW: FCF margin, conversión FCF/beneficio, uso del FCF (buybacks, dividendo, CAPEX)
5. VALORACIÓN HISTÓRICA: Rango P/E y EV/EBITDA últimos 5 años — ¿está barato vs histórico?
6. CALIDAD DEL MANAGEMENT: Track record, skin in the game (% ownership), capital allocation
7. ALERTAS: Red flags contables, dilución excesiva, guidance cuts, cambios de auditor
8. SCORE FINAL: /100 con desglose por categoría

Quiero datos, no opiniones. Fuentes: últimos earnings, 10-K/10-Q, presentaciones inversores.` },
  { id:"P9",  titulo:"SuperChart Pro (imagen)",
    prompt:`[ADJUNTA CAPTURA DEL GRÁFICO]
Analiza este gráfico como un trader profesional.
Ticker: [TICKER] | Timeframe: [1D / 1W / ...]

1. ESTRUCTURA DE MERCADO: Tendencia principal (alcista/bajista/lateral), HH/HL o LH/LL
2. NIVELES CLAVE: Soportes y resistencias más importantes. ¿Dónde está el precio ahora?
3. PATRONES: ¿Algún patrón en formación o completado? (flag, cup, H&S, wedge, triángulo...)
4. INDICADORES: Lee RSI, MACD, volumen — ¿confirman o divergen del precio?
5. ESCENARIOS:
   A) Alcista — condición necesaria + target
   B) Bajista — condición + nivel de invalidación
6. TRADE SETUP: Entrada óptima | Stop (con justificación técnica) | Target 1 | Target 2 | R:R ratio

Análisis técnico puro. No macro, no fundamentales. Solo lo que muestra el gráfico.` },
  { id:"P10", titulo:"Pepine nocturno",
    prompt:`Son las 22:00-23:00. Prepara el briefing nocturno para la sesión de mañana:

1. CIERRE DE HOY: SP500, Nasdaq, Russell — cierre, % cambio, volumen relativo, breadth
2. FUTUROS NOCHE: Movimiento actual de ES y NQ futuros + catalizador si hay
3. WATCHLIST MAÑANA: 5-7 tickers para vigilar con el setup específico de cada uno
4. RIESGO MACRO: Datos económicos mañana (hora ET, consenso, anterior, impacto esperado)
5. SESGO DEL DÍA: Alcista / Bajista / Neutral para mañana y por qué en 2 líneas
6. GESTIÓN CARTERA: ¿Alguna posición abierta que necesite revisión por lo ocurrido hoy?

Cartera abierta: [LISTA POSICIONES]
Respuesta concisa. Máximo 400 palabras. Solo lo accionable.` },
  { id:"P11", titulo:"Analizar captura Finviz",
    prompt:`[ADJUNTA CAPTURA DE FINVIZ DEL TICKER]
Eres un analista value/growth. Extrae todo lo relevante de esta ficha Finviz:

1. FUNDAMENTALES CLAVE: P/E, P/S, P/B, EV/EBITDA, Debt/Eq, ROE, ROI, Current Ratio
2. SEÑALES TÉCNICAS: Performance (semana/mes/año), SMA 20/50/200, RSI, volatilidad (ATR, Beta)
3. ANALISTAS: Precio objetivo consenso vs actual, % upside, recomendación, cambios recientes
4. EARNINGS: Próxima fecha, EPS surprise histórico, guidance
5. VALORACIÓN COMPARADA: ¿Caro o barato vs sector? Usa los múltiplos del Finviz
6. SCORING RÁPIDO:
   Fundamentales /10 | Técnico /10 | Valoración /10
   VEREDICTO: COMPRAR / VIGILAR / PASAR

Análisis objetivo basado en los datos del Finviz.` },
  { id:"P12", titulo:"Cripto CoinEx",
    prompt:`Analiza mi cartera crypto actual en CoinEx Spot (6 junio 2026):

POSICIONES:
- SOL:  10.22 unidades | Valor: $644.99  | PnL: -$169.62 (-20.8%)
- XRP:  406.11 unidades | Valor: $445.50  | PnL: -$174.11 (-28.1%)
- ETH:  0.163 unidades  | Valor: $257.82  | PnL: -$64.07  (-19.9%)
- USDT: 178.72 unidades | Valor: $178.58  (liquidez)
- DOGE: 2079.12 unidades| Valor: $169.75  | PnL: +$97.09  (+134.2%)
- DOT:  112.81 unidades | Valor: $106.42  | PnL: -$77.13  (-42.0%)
- LTC:  1.71 unidades   | Valor: $73.48   | PnL: -$25.85  (-26.0%)
- ADA:  238.44 unidades | Valor: $37.70   | PnL: -$31.11  (-45.2%)
TOTAL: $1.916 | PnL total: -$458 (-20.99%)

1. ESTADO DEL MERCADO CRYPTO HOY: Sentimiento general, BTC dominance, Fear & Greed
2. DECISIÓN POR MONEDA: Para cada posición — Mantener / Tomar parciales / Aumentar / Liquidar + por qué
3. SUGERENCIAS DE ROTACIÓN: ¿Hay mejores oportunidades ahora?
4. GESTIÓN DE RIESGO: ¿Concentración excesiva? ¿Optimizo el USDT?
5. PRÓXIMOS CATALIZADORES: Eventos relevantes para cada moneda en cartera

Respuesta estructurada, decisiones claras, sin teoría general de crypto.` },
];

type Tab = "Acciones"|"Crypto"|"Dividendos"|"Diario"|"Setups"|"Prompts";
const TABS: Tab[] = ["Acciones","Crypto","Dividendos","Diario","Setups","Prompts"];

const CARD  = { background:"var(--card)", border:"1px solid var(--border)", borderRadius:"6px" } as React.CSSProperties;
const LABEL = { fontSize:"11px", fontWeight:600, letterSpacing:"0.08em", textTransform:"uppercase" as const, color:"var(--text-muted)" };
const TH    = { padding:"10px 14px", textAlign:"left" as const, fontSize:"11px", fontWeight:600, letterSpacing:"0.06em", color:"var(--text-muted)", borderBottom:"1px solid var(--border)" };
const TD    = { padding:"12px 14px", borderBottom:"1px solid var(--border)" };

const statCards = [
  { label:"Capital",   value:"12.022,43€", color:"var(--text)"  },
  { label:"Efectivo",  value:"4.920,81€",  color:"var(--text-mid)"  },
  { label:"PnL Total", value:"+357,90€",   color:"var(--green)"  },
  { label:"PnL hoy",   value:"-204,70€",   color:"var(--red)"  },
];

export default function TradingPage() {
  const [tab, setTab] = useState<Tab>("Acciones");
  const [newOp, setNewOp] = useState({ ticker:"", entrada:"", salida:"", tipo:"LONG" });
  const [ops, setOps] = useState(diarioOps);
  const [modal, setModal] = useState({ open:false, title:"", content:"" });

  function openModal(title: string, content: string) {
    setModal({ open:true, title, content });
  }

  function addOp() {
    if (!newOp.ticker || !newOp.entrada || !newOp.salida) return;
    const diff = parseFloat(newOp.salida) - parseFloat(newOp.entrada);
    const ganancia = diff > 0;
    setOps(prev => [{ fecha: new Date().toISOString().slice(0,10), ticker: newOp.ticker.toUpperCase(), tipo: newOp.tipo, entrada: newOp.entrada, salida: newOp.salida, resultado: (ganancia ? "+" : "") + `€ ${Math.abs(diff * 10).toFixed(0)}`, ganancia }, ...prev]);
    setNewOp({ ticker:"", entrada:"", salida:"", tipo:"LONG" });
  }

  return (
    <div style={{ padding:"32px 40px" }}>
      <h1 style={{ fontSize:"24px", fontWeight:600, color:"var(--text)", marginBottom:"24px" }}>Trading</h1>

      {/* Tab bar */}
      <div style={{ display:"inline-flex", gap:"4px", padding:"4px", background:"var(--surface)", border:"1px solid var(--border)", borderRadius:"8px", marginBottom:"20px" }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding:"7px 16px", borderRadius:"5px", border:"none", cursor:"pointer", fontSize:"13px", fontWeight: tab===t ? 600 : 400, background: tab===t ? "var(--accent-dim)" : "transparent", color: tab===t ? "var(--accent)" : "var(--text-muted)", outline: tab===t ? "1px solid var(--border-accent)" : "none" }}>{t}</button>
        ))}
      </div>

      {/* Acciones */}
      {tab === "Acciones" && (
        <div style={{ display:"flex", flexDirection:"column", gap:"16px" }}>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"12px" }}>
            {statCards.map(({ label, value, color }) => (
              <div key={label} style={{ ...CARD, padding:"18px 20px" }}>
                <p style={{ ...LABEL, marginBottom:"8px" }}>{label}</p>
                <p style={{ fontFamily:"'Space Mono', monospace", fontWeight:700, fontSize:"22px", color }}>{value}</p>
              </div>
            ))}
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:"8px", flexWrap:"wrap" }}>
            <span style={LABEL}>Alertas activas:</span>
            {carteraAcciones
              .filter(a => a.alerta === "STOP ACTIVO" || a.alerta === "REVISAR STOP")
              .map(a => (
                <span key={a.ticker} style={{
                  padding:"3px 10px", borderRadius:"3px", fontSize:"11px", fontWeight:700, letterSpacing:"0.04em",
                  background: a.alerta === "STOP ACTIVO" ? "rgba(255,61,113,0.15)" : "rgba(255,184,0,0.15)",
                  color:       a.alerta === "STOP ACTIVO" ? "var(--red)" : "var(--amber)",
                  border:`1px solid ${a.alerta === "STOP ACTIVO" ? "rgba(255,61,113,0.3)" : "rgba(255,184,0,0.3)"}`,
                }}>
                  {a.ticker} — {a.alerta}
                </span>
              ))
            }
          </div>
          <div style={{ ...CARD, overflow:"hidden" }}>
            <div style={{ padding:"16px 20px", borderBottom:"1px solid var(--border)" }}>
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
                      <td colSpan={5} style={{ padding:"5px 14px", background:"var(--accent-dim)", borderTop:"1px solid var(--border)", borderBottom:"1px solid var(--border)" }}>
                        <span style={{ fontSize:"10px", fontWeight:700, color:"var(--text-muted)", letterSpacing:"0.12em" }}>── EN PÉRDIDAS ─────────────────────────────────</span>
                      </td>
                    </tr>
                  );
                  rows.push(
                    <tr key={item.ticker} style={{ background: rowBg }}>
                      <td style={{ ...TD, fontFamily:"'Space Mono', monospace", fontWeight:700, color:"var(--accent)" }}>{item.ticker}</td>
                      <td style={{ ...TD, fontSize:"13px", color:"var(--text-muted)" }}>{item.nombre}</td>
                      <td style={{ ...TD, fontFamily:"'Space Mono', monospace", fontWeight:700, color: item.pos ? "var(--green)" : "var(--red)" }}>{item.pnlEur}</td>
                      <td style={{ ...TD, fontFamily:"'Space Mono', monospace", fontWeight:700, color: item.pos ? "var(--green)" : "var(--red)" }}>{item.pnlPct}</td>
                      <td style={{ ...TD }}>
                        {item.alerta && (
                          <span style={{
                            fontSize:"10px", fontWeight:700, padding:"2px 7px", borderRadius:"3px", letterSpacing:"0.04em",
                            background: item.alerta === "STOP ACTIVO" ? "rgba(255,61,113,0.15)" : item.alerta === "REVISAR STOP" ? "rgba(255,184,0,0.15)" : "var(--accent-dim)",
                            color:       item.alerta === "STOP ACTIVO" ? "var(--red)"              : item.alerta === "REVISAR STOP" ? "var(--amber)"              : "var(--text-muted)",
                            border:`1px solid ${item.alerta === "STOP ACTIVO" ? "rgba(255,61,113,0.3)" : item.alerta === "REVISAR STOP" ? "rgba(255,184,0,0.3)" : "var(--border)"}`,
                          }}>{item.alerta}</span>
                        )}
                      </td>
                    </tr>
                  );
                  return rows;
                })}
                <tr>
                  <td colSpan={2} style={{ padding:"12px 14px", fontWeight:700, color:"var(--text)", fontSize:"13px", borderTop:"1px solid var(--border)" }}>TOTAL · 18 posiciones</td>
                  <td style={{ padding:"12px 14px", fontFamily:"'Space Mono', monospace", fontWeight:700, color:"var(--green)", borderTop:"1px solid var(--border)" }}>+357,90€</td>
                  <td colSpan={2} style={{ padding:"12px 14px", fontFamily:"'Space Mono', monospace", fontSize:"12px", color:"var(--text-muted)", borderTop:"1px solid var(--border)" }}>Capital: 12.022,43€</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Crypto */}
      {tab === "Crypto" && (
        <div style={{ display:"flex", flexDirection:"column", gap:"16px" }}>
          <div style={{ ...CARD, padding:"20px 24px", display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"16px" }}>
            {[
              { label:"Total",     value:"$1.916",     color:"var(--text)"  },
              { label:"PnL Total", value:"-$458",      color:"var(--red)"  },
              { label:"PnL hoy",   value:"-$166",      color:"var(--red)"  },
              { label:"Exchange",  value:"CoinEx Spot",color:"var(--text-muted)"  },
            ].map(({ label, value, color }) => (
              <div key={label}>
                <p style={{ ...LABEL, marginBottom:"8px" }}>{label}</p>
                <p style={{ fontFamily:"'Space Mono', monospace", fontWeight:700, fontSize:"18px", color }}>{value}</p>
              </div>
            ))}
          </div>
          <div style={{ ...CARD, overflow:"hidden" }}>
            <div style={{ padding:"16px 20px", borderBottom:"1px solid var(--border)" }}>
              <p style={LABEL}>Cartera Crypto — CoinEx Spot · 6 Jun 2026</p>
            </div>
            <table style={{ width:"100%", borderCollapse:"collapse" }}>
              <thead><tr>{["Coin","Nombre","Cantidad","Valor USD","PnL $","PnL %","Target","Estado"].map(h=><th key={h} style={TH}>{h}</th>)}</tr></thead>
              <tbody>
                {carteraCrypto.map(item => {
                  const pnlColor = item.pnl > 0 ? "var(--green)" : item.pnl < 0 ? "var(--red)" : "var(--text-mid)";
                  const pnlSign  = item.pnl > 0 ? "+" : "";
                  const badgeStyle: React.CSSProperties =
                    item.estado === "MANTENER"       ? { background:"var(--accent-dim)",  color:"var(--accent)", border:"1px solid var(--border-accent)"  } :
                    item.estado === "LIQUIDEZ"        ? { background:"var(--accent-dim)", color:"var(--text-mid)", border:"1px solid var(--border)"   } :
                    item.estado === "TOMAR PARCIALES" ? { background:"rgba(255,184,0,0.12)",  color:"var(--amber)", border:"1px solid rgba(255,184,0,0.25)"   } :
                                                        { background:"rgba(255,61,113,0.12)", color:"var(--red)", border:"1px solid rgba(255,61,113,0.25)"  };
                  return (
                    <tr key={item.coin}>
                      <td style={{ ...TD, fontFamily:"'Space Mono', monospace", fontWeight:700, color:"var(--amber)" }}>{item.coin}</td>
                      <td style={{ ...TD, fontSize:"13px", color:"var(--text-muted)" }}>{item.nombre}</td>
                      <td style={{ ...TD, fontFamily:"'Space Mono', monospace", fontSize:"12px", color:"var(--text-mid)" }}>{item.cantidad}</td>
                      <td style={{ ...TD, fontFamily:"'Space Mono', monospace", fontSize:"13px", color:"var(--text)" }}>${item.valor.toFixed(2)}</td>
                      <td style={{ ...TD, fontFamily:"'Space Mono', monospace", fontWeight:700, color: pnlColor }}>{pnlSign}${Math.abs(item.pnl).toFixed(2)}</td>
                      <td style={{ ...TD, fontFamily:"'Space Mono', monospace", fontWeight:700, color: pnlColor }}>{pnlSign}{item.pnlPct}%</td>
                      <td style={{ ...TD, fontSize:"12px", color:"var(--accent)" }}>{item.target}</td>
                      <td style={{ ...TD }}>
                        <span style={{ fontSize:"10px", fontWeight:700, padding:"2px 7px", borderRadius:"3px", letterSpacing:"0.04em", ...badgeStyle }}>{item.estado}</span>
                      </td>
                    </tr>
                  );
                })}
                <tr>
                  <td colSpan={3} style={{ padding:"12px 14px", fontWeight:700, color:"var(--text)", fontSize:"13px", borderTop:"1px solid var(--border)" }}>TOTAL · 8 posiciones</td>
                  <td style={{ padding:"12px 14px", fontFamily:"'Space Mono', monospace", fontWeight:700, color:"var(--text)", borderTop:"1px solid var(--border)" }}>$1.916</td>
                  <td style={{ padding:"12px 14px", fontFamily:"'Space Mono', monospace", fontWeight:700, color:"var(--red)", borderTop:"1px solid var(--border)" }}>-$458</td>
                  <td style={{ padding:"12px 14px", fontFamily:"'Space Mono', monospace", fontWeight:700, color:"var(--red)", borderTop:"1px solid var(--border)" }}>-20.99%</td>
                  <td colSpan={2} style={{ borderTop:"1px solid var(--border)" }}></td>
                </tr>
              </tbody>
            </table>
            <div style={{ padding:"12px 20px", borderTop:"1px solid var(--border)", background:"var(--accent-dim)" }}>
              <p style={{ fontSize:"11px", color:"var(--text-muted)", lineHeight:1.6, margin:0 }}>
                <span style={{ color:"var(--accent)", fontWeight:600 }}>Largo plazo</span>: SOL · XRP · ETH — targets definidos, tesis activa.{" "}
                <span style={{ color:"var(--red)", fontWeight:600 }}>Revisar</span>: DOT · LTC · ADA — sin tesis clara, evaluar salida.{" "}
                DOGE en profit +134%, considerar toma parcial.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Dividendos */}
      {tab === "Dividendos" && (
        <div style={{ ...CARD, overflow:"hidden" }}>
          <div style={{ padding:"16px 20px", borderBottom:"1px solid var(--border)" }}><p style={LABEL}>Cartera Dividendos — Yield anual estimado</p></div>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead><tr>{["Ticker","Nombre","Acciones","Precio","Yield","Ingreso Anual"].map(h=><th key={h} style={TH}>{h}</th>)}</tr></thead>
            <tbody>
              {dividendos.map(({ t,n,a,p,y,ingreso }) => (
                <tr key={t}>
                  <td style={{ ...TD, fontFamily:"'Space Mono', monospace", fontWeight:700, color:"var(--green)" }}>{t}</td>
                  <td style={{ ...TD, fontSize:"12px", color:"var(--text-muted)" }}>{n}</td>
                  <td style={{ ...TD, fontFamily:"'Space Mono', monospace", fontSize:"12px", color:"var(--text-mid)" }}>{a}</td>
                  <td style={{ ...TD, fontFamily:"'Space Mono', monospace", fontSize:"12px", color:"var(--text-mid)" }}>${p}</td>
                  <td style={{ ...TD, fontFamily:"'Space Mono', monospace", fontWeight:700, color:"var(--green)" }}>{y}</td>
                  <td style={{ ...TD, fontFamily:"'Space Mono', monospace", fontWeight:700, color:"var(--text)" }}>{ingreso}</td>
                </tr>
              ))}
              <tr>
                <td colSpan={5} style={{ padding:"12px 14px", fontWeight:700, color:"var(--text)", fontSize:"13px", borderTop:"1px solid var(--border)" }}>TOTAL ANUAL ESTIMADO</td>
                <td style={{ padding:"12px 14px", fontFamily:"'Space Mono', monospace", fontWeight:700, color:"var(--green)", borderTop:"1px solid var(--border)" }}>611€</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Diario */}
      {tab === "Diario" && (
        <div style={{ display:"flex", flexDirection:"column", gap:"16px" }}>
          <div style={{ ...CARD, padding:"16px 20px" }}>
            <p style={{ ...LABEL, marginBottom:"14px" }}>Nueva operación</p>
            <div style={{ display:"flex", gap:"10px", flexWrap:"wrap", alignItems:"flex-end" }}>
              {[["Ticker","ticker","NVDA"],["Entrada","entrada","112.00"],["Salida","salida","115.50"]].map(([label, key, ph]) => (
                <div key={key}>
                  <p style={{ fontSize:"11px", color:"var(--text-muted)", marginBottom:"4px" }}>{label}</p>
                  <input
                    value={(newOp as Record<string, string>)[key]}
                    onChange={e => setNewOp(prev => ({ ...prev, [key]: e.target.value }))}
                    placeholder={ph}
                    style={{ padding:"7px 10px", borderRadius:"4px", border:"1px solid var(--border)", background:"var(--card-hover)", color:"var(--text)", fontSize:"13px", width: key==="ticker" ? "90px" : "110px", outline:"none" }}
                  />
                </div>
              ))}
              <div>
                <p style={{ fontSize:"11px", color:"var(--text-muted)", marginBottom:"4px" }}>Tipo</p>
                <select value={newOp.tipo} onChange={e => setNewOp(p=>({...p,tipo:e.target.value}))} style={{ padding:"7px 10px", borderRadius:"4px", border:"1px solid var(--border)", background:"var(--card-hover)", color:"var(--text)", fontSize:"13px", outline:"none" }}>
                  <option>LONG</option><option>SHORT</option>
                </select>
              </div>
              <button onClick={addOp} style={{ padding:"8px 16px", borderRadius:"4px", background:"var(--accent)", color:"#fff", fontSize:"13px", fontWeight:600, border:"none", cursor:"pointer" }}>Añadir</button>
            </div>
          </div>
          <div style={{ ...CARD, overflow:"hidden" }}>
            <table style={{ width:"100%", borderCollapse:"collapse" }}>
              <thead><tr>{["Fecha","Ticker","Tipo","Entrada","Salida","Resultado"].map(h=><th key={h} style={TH}>{h}</th>)}</tr></thead>
              <tbody>
                {ops.map((op,i) => (
                  <tr key={i}>
                    <td style={{ ...TD, fontFamily:"'Space Mono', monospace", fontSize:"11px", color:"var(--text-muted)" }}>{op.fecha}</td>
                    <td style={{ ...TD, fontFamily:"'Space Mono', monospace", fontWeight:700, color:"var(--accent)" }}>{op.ticker}</td>
                    <td style={{ ...TD }}><span style={{ fontSize:"11px", fontWeight:600, padding:"2px 6px", borderRadius:"3px", background:"var(--accent-dim)", color:"var(--accent)" }}>{op.tipo}</span></td>
                    <td style={{ ...TD, fontFamily:"'Space Mono', monospace", fontSize:"12px", color:"var(--text-mid)" }}>{op.entrada}</td>
                    <td style={{ ...TD, fontFamily:"'Space Mono', monospace", fontSize:"12px", color:"var(--text-mid)" }}>{op.salida}</td>
                    <td style={{ ...TD, fontFamily:"'Space Mono', monospace", fontWeight:700, color: op.ganancia ? "var(--green)" : "var(--red)" }}>{op.resultado}</td>
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
                    <span style={{ fontFamily:"'Space Mono', monospace", fontWeight:700, color:"var(--accent)" }}>{ticker}</span>
                    <button onClick={() => alert(`${ticker} publicado en Telegram ✅`)} style={{ fontSize:"11px", padding:"3px 8px", borderRadius:"3px", background:"var(--accent-dim)", color:"var(--accent)", border:"1px solid var(--border-accent)", cursor:"pointer" }}>Publicar Telegram</button>
                  </div>
                  <p style={{ fontSize:"12px", color:"var(--text-muted)", marginBottom:"10px" }}>{razon}</p>
                  <div style={{ display:"flex", gap:"16px" }}>
                    {[["Entrada",entrada,"var(--text)"],["Stop",stop,"var(--red)"],["Objetivo",objetivo,"var(--green)"]].map(([l,v,c])=>(
                      <div key={l}><span style={{ fontSize:"11px", color:"var(--text-muted)" }}>{l} </span><span style={{ fontFamily:"'Space Mono', monospace", fontSize:"12px", fontWeight:700, color:c }}>{v}</span></div>
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
                  style={{ textAlign:"left", padding:"10px 12px", borderRadius:"5px", border:"1px solid var(--border)", background:"var(--card-hover)", color:"var(--text-mid)", fontSize:"12px", cursor:"pointer", lineHeight:1.4 }}
                  onMouseEnter={e=>(e.currentTarget.style.borderColor="var(--border-accent)")}
                  onMouseLeave={e=>(e.currentTarget.style.borderColor="var(--border)")}
                >
                  <span style={{ fontFamily:"'Space Mono', monospace", color:"var(--text-muted)", marginRight:"8px" }}>{String(i+1).padStart(2,"0")}</span>{p}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Prompts */}
      {tab === "Prompts" && (
        <div style={{ display:"flex", flexDirection:"column", gap:"16px" }}>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"10px" }}>
            {TRADING_PROMPTS.map(({ id, titulo, prompt }) => (
              <button
                key={id}
                onClick={() => openModal(`${id} — ${titulo}`, prompt)}
                style={{ textAlign:"left", padding:"16px 18px", borderRadius:"6px", border:"1px solid var(--border)", background:"var(--card)", color:"var(--text)", cursor:"pointer", display:"flex", flexDirection:"column", gap:"6px" }}
                onMouseEnter={e=>(e.currentTarget.style.borderColor="var(--border-accent)")}
                onMouseLeave={e=>(e.currentTarget.style.borderColor="var(--border)")}
              >
                <span style={{ fontFamily:"'Space Mono', monospace", color:"var(--accent)", fontSize:"14px", fontWeight:700 }}>{id}</span>
                <span style={{ fontSize:"13px", fontWeight:500, color:"var(--text)" }}>{titulo}</span>
                <span style={{ fontSize:"11px", color:"var(--text-muted)" }}>Ver prompt completo →</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Modal */}
      {modal.open && (
        <div
          onClick={() => setModal(m => ({ ...m, open:false }))}
          style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.85)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:"20px" }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background:"var(--card)", border:"1px solid var(--border)", borderRadius:"10px", padding:"28px", maxWidth:"660px", width:"100%", maxHeight:"82vh", overflowY:"auto" }}
          >
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"20px" }}>
              <h3 style={{ color:"var(--text)", margin:0, fontSize:"15px", fontWeight:600 }}>{modal.title}</h3>
              <button onClick={() => setModal(m => ({ ...m, open:false }))} style={{ background:"none", border:"none", color:"var(--text-muted)", cursor:"pointer", fontSize:"22px", lineHeight:1, padding:"0 4px" }}>✕</button>
            </div>
            <pre style={{ color:"var(--text-mid)", fontSize:"12px", lineHeight:1.75, whiteSpace:"pre-wrap", fontFamily:"'Space Mono', monospace", margin:"0 0 24px 0" }}>{modal.content}</pre>
            <button
              onClick={() => navigator.clipboard.writeText(modal.content).then(() => alert("Copiado al portapapeles ✅"))}
              style={{ padding:"9px 22px", background:"var(--accent)", color:"#fff", border:"none", borderRadius:"5px", cursor:"pointer", fontWeight:700, fontSize:"13px" }}
            >Copiar prompt</button>
          </div>
        </div>
      )}
    </div>
  );
}
