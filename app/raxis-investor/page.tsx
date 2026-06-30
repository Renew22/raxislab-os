"use client";

import { useState, useRef, useEffect } from "react";
import dynamic from "next/dynamic";

// ── Lazy-load heavy tabs ──────────────────────────────────────────────────────

const CarteraTab  = dynamic(() => import("./tabs/CarteraTab"),  { ssr:false });
const CryptoTab   = dynamic(() => import("./tabs/CryptoTab"),   { ssr:false });
const M9Tab       = dynamic(() => import("./tabs/M9Tab"),       { ssr:false });

// ── Types ─────────────────────────────────────────────────────────────────────

type Tab =
  | "Dashboard" | "Cartera" | "Crypto" | "M9/Stokers"
  | "Técnico" | "Diario" | "Dividendos" | "Calendario"
  | "Prompts" | "Publicar" | "Imagen" | "Telegram";

const TABS: [Tab, string][] = [
  ["Dashboard",  "Dashboard"],
  ["Cartera",    "Cartera IBKR"],
  ["Crypto",     "Crypto"],
  ["M9/Stokers", "M9 · Stokers"],
  ["Técnico",    "Técnico"],
  ["Diario",     "Diario"],
  ["Dividendos", "Dividendos"],
  ["Calendario", "Calendario"],
  ["Prompts",    "Prompts IA"],
  ["Publicar",   "Publicar"],
  ["Imagen",     "Analista Imagen"],
  ["Telegram",   "Telegram"],
];

// ── Static data ───────────────────────────────────────────────────────────────

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

const TRADING_PROMPTS = [
  { id:"P1", titulo:"Macro diario",        prompt:`Eres mi analista macro senior. Dame el briefing completo de apertura de hoy:\n\n1. FUTUROS Y APERTURA: Estado actual de futuros US (ES, NQ, RTY), Europa (DAX, IBEX) y Asia cerrada\n2. MACRO DEL DÍA: Datos económicos publicados hoy y pendientes\n3. NARRATIVA DOMINANTE: Qué está moviendo el mercado hoy\n4. SECTORES: Top 3 sectores fuertes y top 3 débiles\n5. SETUPS DESTACADOS: 3-5 tickers con movimiento relevante pre-market\n6. RIESGO DEL DÍA: Nivel de riesgo 1-10 y eventos de volatilidad` },
  { id:"P2", titulo:"Empresa nueva",       prompt:`Analiza esta empresa para decidir si entra en la cartera Raxis Investor:\nTicker: [TICKER]\n\n1. TESIS EN UNA LÍNEA\n2. NEGOCIO: Qué hace, moat, posición competitiva\n3. FINANCIERO: Revenue growth, márgenes, deuda, FCF\n4. TÉCNICO: Tendencia, soporte/resistencia, RSI semanal\n5. CATALIZADORES: 3-5 próximos 6-12 meses\n6. RIESGOS: Top 3\n7. VALORACIÓN: P/E, P/S, EV/EBITDA vs sector\n8. VEREDICTO: COMPRAR / VIGILAR / PASAR + convicción 1-10` },
  { id:"P3", titulo:"Update posición",     prompt:`Tengo esta posición abierta y necesito un update completo:\nTicker: [TICKER] | Entrada: [PRECIO] | Stop: [STOP] | Target: [TARGET]\n\n1. QUÉ HA CAMBIADO\n2. TESIS VIGENTE: ¿Sigue intacta?\n3. TÉCNICO ACTUAL\n4. CATALIZADORES PRÓXIMOS\n5. ESCENARIOS: Bull/Bear\n6. ACCIÓN: Mantener / Reducir / Añadir / Cerrar` },
  { id:"P4", titulo:"Screener sector",     prompt:`Haz un screener del sector [SECTOR] — cap $500M-$10B, revenue growth >20%, precio sobre 50d y 200d, RSI 40-70. Dame 5 nombres con entrada, stop, target 6-12 meses.` },
  { id:"P5", titulo:"Validar spike",       prompt:`[TICKER] acaba de moverse [X%] en [TIMEFRAME].\n1. CAUSA\n2. CALIDAD DEL MOVIMIENTO: ¿Volumen confirma?\n3. CONTEXTO TÉCNICO\n4. OPCIONES: A) Perseguir B) Esperar retroceso C) Ignorar\n5. ACCIÓN con entrada, stop, target` },
  { id:"P6", titulo:"Semanal",             prompt:`Genera el análisis semanal completo de la cartera Raxis Investor:\n1. MERCADO LA SEMANA PASADA\n2. REVIEW CARTERA: tesis status verde/amarillo/rojo\n3. AGENDA PRÓXIMA SEMANA\n4. SETUPS PARA LA SEMANA: 3-5 ideas\n5. ROTACIONES de sectores` },
  { id:"P7", titulo:"Super Prompt 10B",    prompt:`Análisis COMPLETO. Ticker: [TICKER]\n\nBLOQUE 1 — TESIS\nBLOQUE 2 — NEGOCIO\nBLOQUE 3 — FINANCIERO (últimos 4 trimestres)\nBLOQUE 4 — VALORACIÓN (P/E, EV/EBITDA, P/S, DCF)\nBLOQUE 5 — TÉCNICO (semanal + diario)\nBLOQUE 6 — CATALIZADORES con fecha\nBLOQUE 7 — SENTIMIENTO (short interest, insider, analysts)\nBLOQUE 8 — RIESGOS (top 5 con probabilidad)\nBLOQUE 9 — COMPARABLES (3 empresas)\nBLOQUE 10 — PLAN (entrada, stop, target 1/2, tamaño %)` },
  { id:"P8", titulo:"Fundamentales",       prompt:`Análisis fundamentales profundos para [TICKER]:\n1. CALIDAD DEL NEGOCIO /10: ROIC, pricing power, switching costs\n2. CRECIMIENTO: Revenue CAGR 3-5 años\n3. BALANCE: Cash, deuda, vencimientos\n4. FREE CASH FLOW: margen, conversión, uso\n5. VALORACIÓN HISTÓRICA: rango P/E y EV/EBITDA 5 años\n6. MANAGEMENT: track record, skin in the game\n7. ALERTAS: red flags contables\n8. SCORE /100` },
  { id:"P9", titulo:"SuperChart (imagen)", prompt:`[ADJUNTA CAPTURA DEL GRÁFICO]\nTicker: [TICKER] | Timeframe: [1D/1W]\n\n1. ESTRUCTURA: HH/HL o LH/LL\n2. NIVELES CLAVE: soportes y resistencias\n3. PATRONES en formación\n4. INDICADORES: RSI, MACD, volumen\n5. ESCENARIOS: A) Alcista B) Bajista\n6. TRADE SETUP: entrada, stop, target 1, target 2, R:R` },
  { id:"P10",titulo:"Pepine nocturno",     prompt:`Son las 22:00. Prepara el briefing para mañana:\n1. CIERRE DE HOY: SP500, Nasdaq, Russell\n2. FUTUROS NOCHE\n3. WATCHLIST MAÑANA: 5-7 tickers con setup\n4. RIESGO MACRO: datos mañana\n5. SESGO: Alcista/Bajista/Neutral\n6. GESTIÓN CARTERA: posiciones a revisar\n\nCartera: [LISTA POSICIONES]\nMáx 400 palabras.` },
  { id:"P11",titulo:"Analizar Finviz",     prompt:`[ADJUNTA CAPTURA FINVIZ]\n1. FUNDAMENTALES: P/E, P/S, P/B, EV/EBITDA, ROE\n2. SEÑALES TÉCNICAS: SMA 20/50/200, RSI, Beta\n3. ANALISTAS: precio objetivo, % upside\n4. EARNINGS: próxima fecha, EPS surprise histórico\n5. VALORACIÓN vs sector\n6. SCORING: Fundamentales/10 · Técnico/10 · Valoración/10 · VEREDICTO` },
  { id:"P12",titulo:"Cripto CoinEx",       prompt:`Analiza mi cartera crypto actual en CoinEx:\n- SOL 10.22u · Valor $645 · PnL -$170 (-21%)\n- XRP 406u · Valor $446 · PnL -$174 (-28%)\n- ETH 0.163u · Valor $258 · PnL -$64 (-20%)\n- DOGE 2079u · Valor $170 · PnL +$97 (+134%)\n\n1. ESTADO CRYPTO HOY\n2. DECISIÓN POR MONEDA: Mantener/Liquidar/Parciales\n3. ROTACIONES sugeridas\n4. PRÓXIMOS CATALIZADORES` },
];

// ── Styles ────────────────────────────────────────────────────────────────────

const CARD: React.CSSProperties  = { background:"var(--card)", border:"1px solid var(--border)", borderRadius:"6px" };
const LABEL: React.CSSProperties = { fontSize:"11px", fontWeight:600, letterSpacing:"0.08em", textTransform:"uppercase", color:"var(--text-muted)" };
const MONO: React.CSSProperties  = { fontFamily:"'Space Mono', monospace" };
const TH = { padding:"10px 14px", textAlign:"left" as const, fontSize:"11px", fontWeight:600, letterSpacing:"0.06em", color:"var(--text-muted)", borderBottom:"1px solid var(--border)" };
const TD = { padding:"12px 14px", borderBottom:"1px solid var(--border)" };

// ── Main page ─────────────────────────────────────────────────────────────────

export default function RaxisInvestorPage() {
  const [tab, setTab]   = useState<Tab>("Dashboard");
  const [modal, setModal] = useState({ open:false, title:"", content:"" });

  // Publicar / content gen
  const [loading, setLoading]     = useState(false);
  const [resultado, setResultado] = useState<{ postX:string; guionYoutube:string; articuloEN:string }|null>(null);
  const [form, setForm]           = useState({ ticker:"", empresa:"", precioActual:"", entrada:"", stop:"", target1:"", target2:"", tesis:"", catalizador:"Insider Buy", riesgo:"", decision:"COMPRA", timeframe:"Corto" });

  // Imagen / chart analysis
  const fileInputRef                   = useRef<HTMLInputElement>(null);
  const [imgPreview, setImgPreview]    = useState("");
  const [imgBase64, setImgBase64]      = useState("");
  const [imgType, setImgType]          = useState("image/png");
  const [imgPromptKey, setImgPromptKey]= useState("chart_tecnico");
  const [imgCustom, setImgCustom]      = useState("");
  const [imgLoading, setImgLoading]    = useState(false);
  const [imgResult, setImgResult]      = useState("");

  // Técnico (Polygon)
  const [polyTicker, setPolyTicker]     = useState("");
  const [polyData, setPolyData]         = useState<Record<string,unknown>|null>(null);
  const [polyLoading, setPolyLoading]   = useState(false);
  const [polyError, setPolyError]       = useState("");

  // Diario
  const [ops, setOps]     = useState([
    { fecha:"2026-06-06",ticker:"NVDA",tipo:"LONG",entrada:"109.40",salida:"112.10",resultado:"+€ 58", ganancia:true },
    { fecha:"2026-06-05",ticker:"ASTS",tipo:"LONG",entrada:"22.50", salida:"21.80", resultado:"-€ 35", ganancia:false },
    { fecha:"2026-06-04",ticker:"SHLS",tipo:"LONG",entrada:"13.90", salida:"14.20", resultado:"+€ 45", ganancia:true },
  ]);
  const [newOp, setNewOp] = useState({ ticker:"", entrada:"", salida:"", tipo:"LONG" });

  // Telegram photos
  const [telegramPhotos, setTelegramPhotos] = useState<{ update_id:number; file_id:string; url:string; caption:string; date:number; date_str:string }[]>([]);
  const [telegramLoading, setTelegramLoading] = useState(false);

  function setField(k:string,v:string) { setForm(f=>({...f,[k]:v})); }

  async function generarContenido() {
    if (!form.ticker||!form.tesis) return;
    setLoading(true); setResultado(null);
    try {
      const res = await fetch("/api/claude/generate",{ method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ type:"investor_analysis", data:{ ticker:form.ticker, tesis:form.tesis, entrada:form.entrada, stop:form.stop, target:form.target1, decision:form.decision } }) });
      const json = await res.json();
      const parsed = JSON.parse(json.content);
      setResultado({ postX:parsed.post_x||"", guionYoutube:typeof parsed.guion_youtube==="string"?parsed.guion_youtube:JSON.stringify(parsed.guion_youtube,null,2), articuloEN:typeof parsed.articulo_blog==="string"?parsed.articulo_blog:JSON.stringify(parsed.articulo_blog,null,2) });
    } catch { /* no-op */ }
    finally { setLoading(false); }
  }

  function handleImageFile(file:File) {
    if (!file.type.startsWith("image/")) return;
    setImgType(file.type); setImgResult("");
    const reader = new FileReader();
    reader.onload = e => { const b64 = (e.target?.result as string).split(",")[1]; setImgBase64(b64); setImgPreview(URL.createObjectURL(file)); };
    reader.readAsDataURL(file);
  }

  const IMG_PROMPTS: Record<string,string> = {
    chart_tecnico: "Analiza este gráfico técnico como trader profesional: estructura de mercado (HH/HL o LH/LL), niveles clave de soporte/resistencia, patrón en formación, lectura de RSI y volumen, escenario alcista y bajista, setup trade con entrada/stop/target y ratio R:R.",
    finviz_screen: "Eres analista value/growth. Extrae de esta ficha Finviz: fundamentales clave (P/E, ROE, EV/EBITDA, Debt/Eq), señales técnicas (SMA 20/50/200, RSI), opinión analistas (precio objetivo, upside), próximos earnings, scoring fundamentales/técnico/valoración (cada /10), y veredicto COMPRAR/VIGILAR/PASAR.",
    earnings_slide:"Analiza este slide de earnings/presentación inversores: métricas clave (revenue, EPS, márgenes, guidance), qué sorprendió al mercado, si la tesis de inversión sigue o se ha debilitado, y qué esperar en las próximas semanas.",
    captura_custom: imgCustom,
  };

  async function analizarImagen() {
    if (!imgBase64) return;
    setImgLoading(true); setImgResult("");
    const prompt = IMG_PROMPTS[imgPromptKey]||imgCustom;
    try {
      const res = await fetch("/api/claude/generate",{ method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ type:"image_analysis", imageBase64:imgBase64, mediaType:imgType, prompt }) });
      const json = await res.json();
      setImgResult(json.content||json.error||"Error");
    } catch { setImgResult("Error de conexión"); }
    finally { setImgLoading(false); }
  }

  async function fetchPolygon() {
    if (!polyTicker.trim()) return;
    setPolyLoading(true); setPolyError(""); setPolyData(null);
    try {
      const r = await fetch(`/api/polygon/technicals?ticker=${polyTicker.trim().toUpperCase()}`);
      const j = await r.json();
      if (j.error) setPolyError(j.error); else setPolyData(j);
    } catch { setPolyError("Error de conexión"); }
    finally { setPolyLoading(false); }
  }

  function addOp() {
    if (!newOp.ticker||!newOp.entrada||!newOp.salida) return;
    const diff = parseFloat(newOp.salida)-parseFloat(newOp.entrada);
    const ganancia = diff>0;
    setOps(prev=>[{ fecha:new Date().toISOString().slice(0,10), ticker:newOp.ticker.toUpperCase(), tipo:newOp.tipo, entrada:newOp.entrada, salida:newOp.salida, resultado:(ganancia?"+":"")+`€ ${Math.abs(diff*10).toFixed(0)}`, ganancia },...prev]);
    setNewOp({ ticker:"", entrada:"", salida:"", tipo:"LONG" });
  }

  useEffect(() => {
    if (tab!=="Telegram") return;
    setTelegramLoading(true);
    fetch("/api/telegram/photos").then(r=>r.json()).then(d=>setTelegramPhotos(d?.photos??[])).catch(()=>{}).finally(()=>setTelegramLoading(false));
  }, [tab]);

  const n = (v:unknown) => v!==null&&v!==undefined?Number(v).toFixed(2):"—";
  const pct = (v:unknown) => v!==null&&v!==undefined?`${Number(v)>0?"+":""}${Number(v).toFixed(2)}%`:"—";
  const pctColor = (v:unknown) => v===null||v===undefined?"var(--text-muted)":Number(v)>=0?"var(--green)":"var(--red)";

  return (
    <div style={{ padding:"32px 40px", display:"flex", flexDirection:"column", gap:"20px" }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize:"24px", fontWeight:600, color:"var(--text)", margin:"0 0 4px" }}>Raxis Investor</h1>
        <p style={{ fontSize:"13px", color:"var(--text-muted)", margin:0 }}>Centro de inversión — Cartera · Crypto · M9 · Trading · Contenido</p>
      </div>

      {/* Tab bar */}
      <div style={{ display:"flex", flexWrap:"wrap", gap:"4px", borderBottom:"1px solid var(--border)", paddingBottom:"1px" }}>
        {TABS.map(([key,label])=>(
          <button key={key} onClick={()=>setTab(key)} style={{ padding:"8px 14px", fontSize:"12px", fontWeight:tab===key?600:400, color:tab===key?"var(--accent)":"var(--text-muted)", background:"transparent", border:"none", borderBottom:tab===key?"2px solid var(--accent)":"2px solid transparent", cursor:"pointer", marginBottom:"-1px", whiteSpace:"nowrap" }}>
            {label}
          </button>
        ))}
      </div>

      {/* ── DASHBOARD ────────────────────────────────────────────────────────── */}
      {tab==="Dashboard" && (
        <div style={{ display:"flex", flexDirection:"column", gap:"20px" }}>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"12px" }}>
            {[
              { l:"Capital IBKR",   v:"12.022 €",  c:"var(--text)" },
              { l:"PnL Total",      v:"+357 €",    c:"var(--green)" },
              { l:"Dividendo anual",v:"611 €",     c:"var(--green)" },
              { l:"Señales M9 hoy", v:"Cargando…", c:"var(--accent)" },
            ].map(({l,v,c})=>(
              <div key={l} style={{ ...CARD, padding:"18px 20px" }}>
                <p style={{ ...LABEL, marginBottom:"6px" }}>{l}</p>
                <p style={{ ...MONO, fontSize:"22px", fontWeight:700, color:c, margin:0 }}>{v}</p>
              </div>
            ))}
          </div>
          <div style={{ ...CARD, padding:"18px 20px" }}>
            <p style={{ ...LABEL, marginBottom:"12px" }}>Acceso rápido</p>
            <div style={{ display:"flex", flexWrap:"wrap", gap:"8px" }}>
              {TABS.filter(([k])=>k!=="Dashboard").map(([k,l])=>(
                <button key={k} onClick={()=>setTab(k)} style={{ padding:"7px 16px", borderRadius:"5px", border:"1px solid var(--border)", background:"var(--card-hover)", color:"var(--text-mid)", fontSize:"12px", cursor:"pointer" }}>{l}</button>
              ))}
            </div>
          </div>
          {/* Track record */}
          <div style={{ ...CARD, overflow:"hidden" }}>
            <div style={{ padding:"14px 20px", borderBottom:"1px solid var(--border)" }}><p style={LABEL}>Track Record</p></div>
            <table style={{ width:"100%", borderCollapse:"collapse" }}>
              <thead><tr>{["Ticker","Decisión","Entrada","Actual","PnL %","Estado"].map(h=><th key={h} style={TH}>{h}</th>)}</tr></thead>
              <tbody>
                {[
                  { ticker:"ENGI", decision:"COMPRA",  entrada:21.42, actual:26.76, pnlPct:24.9,  estado:"ABIERTA" },
                  { ticker:"REP",  decision:"COMPRA",  entrada:18.33, actual:22.95, pnlPct:25.2,  estado:"ABIERTA" },
                  { ticker:"BBAI", decision:"VIGILAR", entrada:5.11,  actual:4.18,  pnlPct:-18.2, estado:"ABIERTA" },
                ].map(r=>(
                  <tr key={r.ticker}>
                    <td style={{ ...TD, ...MONO, fontWeight:700, color:"var(--accent)" }}>{r.ticker}</td>
                    <td style={TD}><span style={{ fontSize:"10px", fontWeight:600, padding:"2px 7px", borderRadius:"3px", background:"var(--accent-dim)", color:"var(--accent)" }}>{r.decision}</span></td>
                    <td style={{ ...TD, ...MONO, fontSize:"12px", color:"var(--text-mid)" }}>${r.entrada}</td>
                    <td style={{ ...TD, ...MONO, fontSize:"12px", color:"var(--text)" }}>${r.actual}</td>
                    <td style={{ ...TD, ...MONO, fontWeight:700, color:r.pnlPct>=0?"var(--green)":"var(--red)" }}>{r.pnlPct>=0?"+":""}{r.pnlPct}%</td>
                    <td style={TD}><span style={{ fontSize:"10px", fontWeight:600, padding:"2px 7px", borderRadius:"3px", background:"rgba(0,87,255,0.08)", color:"var(--accent-muted)" }}>{r.estado}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── CARTERA ──────────────────────────────────────────────────────────── */}
      {tab==="Cartera" && <CarteraTab/>}

      {/* ── CRYPTO ───────────────────────────────────────────────────────────── */}
      {tab==="Crypto" && <CryptoTab/>}

      {/* ── M9 / STOKERS ─────────────────────────────────────────────────────── */}
      {tab==="M9/Stokers" && <M9Tab/>}

      {/* ── TÉCNICO ──────────────────────────────────────────────────────────── */}
      {tab==="Técnico" && (
        <div style={{ display:"flex", flexDirection:"column", gap:"20px" }}>
          <div style={{ ...CARD, padding:"20px 24px" }}>
            <p style={{ ...LABEL, marginBottom:"14px" }}>Análisis Técnico — Polygon.io</p>
            <div style={{ display:"flex", gap:"10px", alignItems:"center" }}>
              <input value={polyTicker} onChange={e=>setPolyTicker(e.target.value.toUpperCase())} onKeyDown={e=>e.key==="Enter"&&fetchPolygon()} placeholder="AAPL, NVDA, PLTR…" style={{ padding:"8px 12px", borderRadius:"4px", border:"1px solid var(--border)", background:"var(--card-hover)", color:"var(--text)", fontSize:"14px", width:"200px", outline:"none", ...MONO }}/>
              <button onClick={fetchPolygon} disabled={polyLoading} style={{ padding:"8px 20px", borderRadius:"4px", background:"var(--accent)", color:"#fff", fontSize:"13px", fontWeight:600, border:"none", cursor:"pointer" }}>{polyLoading?"Cargando…":"Analizar"}</button>
              {polyError && <span style={{ fontSize:"12px", color:"var(--red)" }}>{polyError}</span>}
            </div>
          </div>
          {polyData && (() => {
            const d = polyData as Record<string,unknown>;
            const trendColor = (t:string) => t.includes("ALCISTA")?"var(--green)":"var(--red)";
            const rsiColor = (v:unknown) => { if (!v) return "var(--text-muted)"; const r=Number(v); if(r>=70)return"var(--red)"; if(r<=30)return"var(--green)"; return"var(--text)"; };
            return (
              <div style={{ display:"flex", flexDirection:"column", gap:"14px" }}>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"12px" }}>
                  {[
                    { l:"Precio cierre", v:`$${n(d.price)}`, c:"var(--text)" },
                    { l:"Tendencia", v:String(d.trend||"—"), c:trendColor(String(d.trend||"")) },
                    { l:"RSI(14)", v:n(d.rsi14), c:rsiColor(d.rsi14) },
                    { l:"RSI señal", v:String(d.rsiSignal||"—"), c:rsiColor(d.rsi14) },
                  ].map(({l,v,c})=>(
                    <div key={l} style={{ ...CARD, padding:"16px 18px" }}>
                      <p style={{ ...LABEL, marginBottom:"6px" }}>{l}</p>
                      <p style={{ ...MONO, fontWeight:700, fontSize:"18px", color:c }}>{v}</p>
                    </div>
                  ))}
                </div>
                <div style={{ ...CARD, overflow:"hidden" }}>
                  <div style={{ padding:"12px 20px", borderBottom:"1px solid var(--border)" }}><p style={LABEL}>Medias Móviles vs Precio</p></div>
                  <table style={{ width:"100%", borderCollapse:"collapse" }}>
                    <thead><tr>{["Indicador","Valor","Precio vs MA","Señal"].map(h=><th key={h} style={TH}>{h}</th>)}</tr></thead>
                    <tbody>
                      {[
                        { l:"SMA 20", v:d.sma20, diff:d.priceVsSma20 },
                        { l:"SMA 50", v:d.sma50, diff:d.priceVsSma50 },
                        { l:"SMA 200",v:d.sma200,diff:d.priceVsSma200 },
                        { l:"EMA 20", v:d.ema20, diff:null },
                        { l:"EMA 50", v:d.ema50, diff:null },
                      ].map(({l,v,diff})=>{
                        const price=Number(d.price||0), ma=Number(v||0), above=!!v&&price>ma;
                        return (
                          <tr key={l}>
                            <td style={{ ...TD, ...MONO, fontWeight:600, color:"var(--text)" }}>{l}</td>
                            <td style={{ ...TD, ...MONO, color:"var(--text-mid)" }}>${n(v)}</td>
                            <td style={{ ...TD, ...MONO, fontWeight:700, color:pctColor(diff) }}>{diff!==null?pct(diff):"—"}</td>
                            <td style={TD}>{v?<span style={{ fontSize:"11px", fontWeight:700, padding:"2px 8px", borderRadius:"3px", background:above?"rgba(0,230,118,0.12)":"rgba(255,61,113,0.12)", color:above?"var(--green)":"var(--red)", border:`1px solid ${above?"rgba(0,230,118,0.25)":"rgba(255,61,113,0.25)"}` }}>{above?"POR ENCIMA":"POR DEBAJO"}</span>:<span style={{ color:"var(--text-muted)", fontSize:"12px" }}>Sin datos</span>}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* ── DIARIO ───────────────────────────────────────────────────────────── */}
      {tab==="Diario" && (
        <div style={{ display:"flex", flexDirection:"column", gap:"16px" }}>
          <div style={{ ...CARD, padding:"16px 20px" }}>
            <p style={{ ...LABEL, marginBottom:"14px" }}>Nueva operación</p>
            <div style={{ display:"flex", gap:"10px", flexWrap:"wrap", alignItems:"flex-end" }}>
              {[["Ticker","ticker","NVDA"],["Entrada","entrada","112.00"],["Salida","salida","115.50"]].map(([label,key,ph])=>(
                <div key={key}>
                  <p style={{ fontSize:"11px", color:"var(--text-muted)", marginBottom:"4px" }}>{label}</p>
                  <input value={(newOp as Record<string,string>)[key]} onChange={e=>setNewOp(prev=>({...prev,[key]:e.target.value}))} placeholder={ph} style={{ padding:"7px 10px", borderRadius:"4px", border:"1px solid var(--border)", background:"var(--card-hover)", color:"var(--text)", fontSize:"13px", width:key==="ticker"?"90px":"110px", outline:"none" }}/>
                </div>
              ))}
              <div>
                <p style={{ fontSize:"11px", color:"var(--text-muted)", marginBottom:"4px" }}>Tipo</p>
                <select value={newOp.tipo} onChange={e=>setNewOp(p=>({...p,tipo:e.target.value}))} style={{ padding:"7px 10px", borderRadius:"4px", border:"1px solid var(--border)", background:"var(--card-hover)", color:"var(--text)", fontSize:"13px", outline:"none" }}>
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
                {ops.map((op,i)=>(
                  <tr key={i}>
                    <td style={{ ...TD, ...MONO, fontSize:"11px", color:"var(--text-muted)" }}>{op.fecha}</td>
                    <td style={{ ...TD, ...MONO, fontWeight:700, color:"var(--accent)" }}>{op.ticker}</td>
                    <td style={TD}><span style={{ fontSize:"11px", fontWeight:600, padding:"2px 6px", borderRadius:"3px", background:"var(--accent-dim)", color:"var(--accent)" }}>{op.tipo}</span></td>
                    <td style={{ ...TD, ...MONO, fontSize:"12px", color:"var(--text-mid)" }}>{op.entrada}</td>
                    <td style={{ ...TD, ...MONO, fontSize:"12px", color:"var(--text-mid)" }}>{op.salida}</td>
                    <td style={{ ...TD, ...MONO, fontWeight:700, color:op.ganancia?"var(--green)":"var(--red)" }}>{op.resultado}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Setups */}
          <p style={{ ...LABEL, marginTop:"8px" }}>Setups activos</p>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px" }}>
            {[
              { ticker:"SHLS",razon:"Breakout técnico sobre resistencia semanal con volumen",entrada:"14.20",stop:"13.40",objetivo:"16.50"},
              { ticker:"ASTS",razon:"Catalizador DoD pendiente + setup técnico limpio",      entrada:"22.50",stop:"21.00",objetivo:"26.00"},
              { ticker:"IONQ",razon:"Momentum sector quantum tras earnings IBM",              entrada:"8.90", stop:"8.20", objetivo:"10.80"},
              { ticker:"RKLB",razon:"Post-lanzamiento exitoso — setup técnico convergente",  entrada:"11.30",stop:"10.60",objetivo:"13.50"},
            ].map(({ticker,razon,entrada,stop,objetivo})=>(
              <div key={ticker} style={{ ...CARD, padding:"14px 16px" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"6px" }}>
                  <span style={{ ...MONO, fontWeight:700, color:"var(--accent)" }}>{ticker}</span>
                </div>
                <p style={{ fontSize:"12px", color:"var(--text-muted)", marginBottom:"10px" }}>{razon}</p>
                <div style={{ display:"flex", gap:"16px" }}>
                  {[["Entrada",entrada,"var(--text)"],["Stop",stop,"var(--red)"],["Target",objetivo,"var(--green)"]].map(([l,v,c])=>(
                    <div key={l}><span style={{ fontSize:"11px", color:"var(--text-muted)" }}>{l} </span><span style={{ ...MONO, fontSize:"12px", fontWeight:700, color:c as string }}>{v}</span></div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── DIVIDENDOS ───────────────────────────────────────────────────────── */}
      {tab==="Dividendos" && (
        <div style={{ ...CARD, overflow:"hidden" }}>
          <div style={{ padding:"16px 20px", borderBottom:"1px solid var(--border)" }}><p style={LABEL}>Cartera Dividendos — Yield anual estimado</p></div>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead><tr>{["Ticker","Nombre","Acciones","Precio","Yield","Ingreso Anual"].map(h=><th key={h} style={TH}>{h}</th>)}</tr></thead>
            <tbody>
              {dividendos.map(({t,n,a,p,y,ingreso})=>(
                <tr key={t}>
                  <td style={{ ...TD, ...MONO, fontWeight:700, color:"var(--green)" }}>{t}</td>
                  <td style={{ ...TD, fontSize:"12px", color:"var(--text-muted)" }}>{n}</td>
                  <td style={{ ...TD, ...MONO, fontSize:"12px", color:"var(--text-mid)" }}>{a}</td>
                  <td style={{ ...TD, ...MONO, fontSize:"12px", color:"var(--text-mid)" }}>${p}</td>
                  <td style={{ ...TD, ...MONO, fontWeight:700, color:"var(--green)" }}>{y}</td>
                  <td style={{ ...TD, ...MONO, fontWeight:700, color:"var(--text)" }}>{ingreso}</td>
                </tr>
              ))}
              <tr>
                <td colSpan={5} style={{ padding:"12px 14px", fontWeight:700, color:"var(--text)", fontSize:"13px", borderTop:"1px solid var(--border)" }}>TOTAL ANUAL ESTIMADO</td>
                <td style={{ padding:"12px 14px", ...MONO, fontWeight:700, color:"var(--green)", borderTop:"1px solid var(--border)" }}>611€</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* ── CALENDARIO ───────────────────────────────────────────────────────── */}
      {tab==="Calendario" && (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"20px" }}>
          <div style={{ display:"flex", flexDirection:"column", gap:"12px" }}>
            <p style={{ ...LABEL }}>Horarios de mercado (hora España)</p>
            {[
              { mercado:"NYSE / NASDAQ",premarket:"10:00 — 15:29",sesion:"15:30 — 22:00",afterhours:"22:00 — 00:00",color:"var(--accent)" },
              { mercado:"BME (España)", premarket:"08:30 — 09:00",sesion:"09:00 — 17:30",afterhours:"—",             color:"var(--amber)" },
              { mercado:"DAX / Xetra", premarket:"08:00 — 09:00",sesion:"09:00 — 17:30",afterhours:"—",             color:"var(--green)" },
            ].map(({mercado,premarket,sesion,afterhours,color})=>(
              <div key={mercado} style={{ ...CARD, padding:"16px 18px" }}>
                <p style={{ fontSize:"13px", fontWeight:600, color, marginBottom:"10px" }}>{mercado}</p>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"8px" }}>
                  {[["Pre-market",premarket,"var(--text-muted)"],["Sesión",sesion,"var(--text)"],["After-hours",afterhours,"var(--text-muted)"]].map(([l,v,c])=>(
                    <div key={l}>
                      <p style={{ fontSize:"10px", color:"var(--text-muted)", fontWeight:600, letterSpacing:"0.06em", marginBottom:"3px" }}>{l}</p>
                      <p style={{ ...MONO, fontSize:"12px", color:c as string, fontWeight:600 }}>{v}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <div style={{ ...CARD, padding:"16px 18px" }}>
              <p style={{ ...LABEL, marginBottom:"12px" }}>Eventos macro recurrentes</p>
              {[
                { dia:"Lunes",    evento:"Apertura NYSE — revisar setups semanales" },
                { dia:"Miércoles",evento:"FOMC minutes / datos empleo ADP" },
                { dia:"Jueves",   evento:"Peticiones desempleo semanales 14:30 ET" },
                { dia:"Viernes",  evento:"Non-Farm Payroll (1er viernes de mes)" },
                { dia:"Domingo",  evento:"Briefing semanal — M9 candidatos 16:00" },
              ].map(({dia,evento})=>(
                <div key={dia} style={{ display:"flex", gap:"12px", padding:"8px 0", borderBottom:"1px solid var(--border)" }}>
                  <span style={{ ...MONO, fontSize:"11px", color:"var(--accent)", fontWeight:600, width:"80px", flexShrink:0 }}>{dia}</span>
                  <span style={{ fontSize:"12px", color:"var(--text-muted)" }}>{evento}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:"12px" }}>
            <p style={LABEL}>Reglas de disciplina</p>
            <div style={{ ...CARD, padding:"18px 20px", display:"flex", flexDirection:"column", gap:"10px" }}>
              {[
                "NUNCA operar sin stop loss definido antes de entrar",
                "Risk máximo por operación: 1-2% del capital total",
                "R:R mínimo 2:1 — si el objetivo no dobla el riesgo, no entras",
                "No operar los primeros 15 min de sesión (15:30-15:45 ET)",
                "No añadir a perdedoras — promediar a la baja = trampa",
                "Máximo 3 posiciones abiertas simultáneamente al inicio",
                "Después de 2 stops seguidos: parar el día, revisar setup",
                "No operar en days con datos macro importantes sin confirmación",
                "Cerrar posiciones antes de earnings salvo tesis muy clara",
                "Tomar parciales en +10-15%, dejar correr con stop en breakeven",
              ].map((regla,i)=>(
                <div key={i} style={{ display:"flex", gap:"14px", alignItems:"flex-start" }}>
                  <span style={{ ...MONO, fontSize:"13px", fontWeight:700, color:"var(--accent)", flexShrink:0 }}>{String(i+1).padStart(2,"0")}</span>
                  <span style={{ fontSize:"13px", color:"var(--text-mid)", lineHeight:1.5 }}>{regla}</span>
                </div>
              ))}
            </div>
            <div style={{ ...CARD, padding:"16px 18px" }}>
              <p style={{ ...LABEL, marginBottom:"12px" }}>Rutina diaria óptima</p>
              {[
                ["07:00","Leer noticias macro — Briefing M9 (si lunes)"],
                ["10:00","Pre-market US — revisar futuros ES/NQ"],
                ["15:15","Setup pre-apertura — listar candidatas del día"],
                ["15:30","Apertura NYSE — esperar 15 min antes de operar"],
                ["15:45","Primera ventana operativa (momentum inicial)"],
                ["18:00","Check posiciones — ajustar stops si aplica"],
                ["21:30","Power hour — segunda ventana operativa"],
                ["22:00","Cierre NYSE — cerrar o dejar overnight con análisis"],
                ["22:30","Diario: anotar operaciones + aprendizajes del día"],
              ].map(([hora,accion])=>(
                <div key={hora} style={{ display:"flex", gap:"12px", padding:"7px 0", borderBottom:"1px solid var(--border)" }}>
                  <span style={{ ...MONO, fontSize:"11px", color:"var(--amber)", fontWeight:600, width:"50px", flexShrink:0 }}>{hora}</span>
                  <span style={{ fontSize:"12px", color:"var(--text-muted)" }}>{accion}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── PROMPTS ──────────────────────────────────────────────────────────── */}
      {tab==="Prompts" && (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"10px" }}>
          {TRADING_PROMPTS.map(({id,titulo,prompt})=>(
            <button key={id} onClick={()=>setModal({open:true,title:`${id} — ${titulo}`,content:prompt})} style={{ textAlign:"left", padding:"16px 18px", borderRadius:"6px", border:"1px solid var(--border)", background:"var(--card)", color:"var(--text)", cursor:"pointer", display:"flex", flexDirection:"column", gap:"6px" }}
              onMouseEnter={e=>(e.currentTarget.style.borderColor="var(--border-accent)")}
              onMouseLeave={e=>(e.currentTarget.style.borderColor="var(--border)")}>
              <span style={{ ...MONO, color:"var(--accent)", fontSize:"14px", fontWeight:700 }}>{id}</span>
              <span style={{ fontSize:"13px", fontWeight:500, color:"var(--text)" }}>{titulo}</span>
              <span style={{ fontSize:"11px", color:"var(--text-muted)" }}>Ver prompt completo →</span>
            </button>
          ))}
        </div>
      )}

      {/* ── PUBLICAR ─────────────────────────────────────────────────────────── */}
      {tab==="Publicar" && (
        <div style={{ display:"flex", flexDirection:"column", gap:"16px" }}>
          <div style={{ ...CARD, padding:"20px 24px" }}>
            <p style={{ ...LABEL, marginBottom:"16px" }}>Generar contenido de inversión — Claude IA</p>
            <p style={{ fontSize:"11px", color:"var(--amber)", marginBottom:"16px" }}>⚠ Usa Claude API (coste). Confirma antes de enviar.</p>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px" }}>
              {[["Ticker","ticker","NVDA"],["Empresa","empresa","Nvidia Corp"],["Precio actual","precioActual","$180"],["Entrada","entrada","$165"],["Stop","stop","$155"],["Target 1","target1","$200"],["Target 2","target2","$250"],["Riesgo principal","riesgo","Regulación IA"]].map(([l,k,ph])=>(
                <div key={k}>
                  <p style={{ fontSize:"11px", color:"var(--text-muted)", marginBottom:"4px" }}>{l}</p>
                  <input value={(form as Record<string,string>)[k]} onChange={e=>setField(k,e.target.value)} placeholder={ph} style={{ width:"100%", padding:"7px 10px", borderRadius:"4px", border:"1px solid var(--border)", background:"var(--card-hover)", color:"var(--text)", fontSize:"13px", outline:"none", boxSizing:"border-box" as const }}/>
                </div>
              ))}
            </div>
            <div style={{ marginTop:"10px" }}>
              <p style={{ fontSize:"11px", color:"var(--text-muted)", marginBottom:"4px" }}>Tesis de inversión</p>
              <textarea value={form.tesis} onChange={e=>setField("tesis",e.target.value)} rows={3} placeholder="Describe la tesis de inversión en 2-3 líneas…" style={{ width:"100%", padding:"8px 10px", borderRadius:"4px", border:"1px solid var(--border)", background:"var(--card-hover)", color:"var(--text)", fontSize:"13px", outline:"none", resize:"vertical", boxSizing:"border-box" as const }}/>
            </div>
            <div style={{ display:"flex", gap:"10px", marginTop:"10px", flexWrap:"wrap" }}>
              <div>
                <p style={{ fontSize:"11px", color:"var(--text-muted)", marginBottom:"4px" }}>Catalizador</p>
                <select value={form.catalizador} onChange={e=>setField("catalizador",e.target.value)} style={{ padding:"7px 10px", borderRadius:"4px", border:"1px solid var(--border)", background:"var(--card-hover)", color:"var(--text)", fontSize:"13px", outline:"none" }}>
                  {["Insider Buy","Earnings Beat","DoD Contract","Breakout Técnico","Dividendo","Expansión Internacional","M&A","Product Launch"].map(c=><option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <p style={{ fontSize:"11px", color:"var(--text-muted)", marginBottom:"4px" }}>Decisión</p>
                <select value={form.decision} onChange={e=>setField("decision",e.target.value)} style={{ padding:"7px 10px", borderRadius:"4px", border:"1px solid var(--border)", background:"var(--card-hover)", color:"var(--text)", fontSize:"13px", outline:"none" }}>
                  {["COMPRA","VIGILAR","PASAR","PARCIALES"].map(d=><option key={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <p style={{ fontSize:"11px", color:"var(--text-muted)", marginBottom:"4px" }}>Timeframe</p>
                <select value={form.timeframe} onChange={e=>setField("timeframe",e.target.value)} style={{ padding:"7px 10px", borderRadius:"4px", border:"1px solid var(--border)", background:"var(--card-hover)", color:"var(--text)", fontSize:"13px", outline:"none" }}>
                  {["Corto","Medio","Largo"].map(t=><option key={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <button onClick={generarContenido} disabled={loading||!form.ticker||!form.tesis} style={{ marginTop:"16px", padding:"10px 24px", background:"var(--accent)", color:"#fff", border:"none", borderRadius:"5px", fontWeight:700, fontSize:"13px", cursor:"pointer", opacity:loading||!form.ticker||!form.tesis?0.5:1 }}>
              {loading?"Generando contenido…":"Generar contenido"}
            </button>
          </div>
          {resultado && (
            <div style={{ display:"flex", flexDirection:"column", gap:"12px" }}>
              {[["Post X / Twitter",resultado.postX],["Guión YouTube",resultado.guionYoutube],["Artículo Blog (EN)",resultado.articuloEN]].map(([titulo,contenido])=>(
                <div key={titulo as string} style={{ ...CARD, padding:"16px 20px" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"12px" }}>
                    <p style={{ ...LABEL, margin:0 }}>{titulo}</p>
                    <button onClick={()=>navigator.clipboard.writeText(contenido as string).then(()=>alert("Copiado ✅"))} style={{ fontSize:"11px", padding:"4px 12px", borderRadius:"4px", background:"var(--accent-dim)", color:"var(--accent)", border:"1px solid var(--border-accent)", cursor:"pointer" }}>Copiar</button>
                  </div>
                  <pre style={{ color:"var(--text-mid)", fontSize:"12px", lineHeight:1.7, whiteSpace:"pre-wrap", ...MONO, margin:0 }}>{contenido}</pre>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── IMAGEN ───────────────────────────────────────────────────────────── */}
      {tab==="Imagen" && (
        <div style={{ display:"flex", flexDirection:"column", gap:"16px" }}>
          <div style={{ ...CARD, padding:"20px 24px" }}>
            <p style={{ ...LABEL, marginBottom:"4px" }}>Analista de Imagen — Claude Vision</p>
            <p style={{ fontSize:"11px", color:"var(--amber)", marginBottom:"14px" }}>⚠ Usa Claude API (coste). Confirma antes de enviar.</p>
            {/* Drop zone */}
            <div
              onDragOver={e=>{e.preventDefault();(e.currentTarget as HTMLDivElement).style.borderColor="var(--accent)";}}
              onDragLeave={e=>{(e.currentTarget as HTMLDivElement).style.borderColor="var(--border)";}}
              onDrop={e=>{e.preventDefault();(e.currentTarget as HTMLDivElement).style.borderColor="var(--border)";const f=e.dataTransfer.files[0];if(f)handleImageFile(f);}}
              onClick={()=>fileInputRef.current?.click()}
              style={{ border:"2px dashed var(--border)", borderRadius:"8px", padding:"32px", textAlign:"center", cursor:"pointer", marginBottom:"14px", transition:"border-color 0.15s" }}
            >
              <input ref={fileInputRef} type="file" accept="image/*" style={{ display:"none" }} onChange={e=>{const f=e.target.files?.[0];if(f)handleImageFile(f);}}/>
              {imgPreview ? (
                <img src={imgPreview} alt="Preview" style={{ maxHeight:"200px", maxWidth:"100%", borderRadius:"5px", marginBottom:"8px", display:"block", margin:"0 auto 8px" }}/>
              ) : (
                <p style={{ color:"var(--text-muted)", margin:0 }}>Arrastra o pulsa para subir una imagen (gráfico, Finviz, earnings)</p>
              )}
            </div>
            {/* Prompt selector */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:"8px", marginBottom:"14px" }}>
              {[
                ["chart_tecnico","📊 Gráfico técnico"],
                ["finviz_screen","📋 Ficha Finviz"],
                ["earnings_slide","📈 Slide earnings"],
                ["captura_custom","✏️ Personalizado"],
              ].map(([k,l])=>(
                <button key={k} onClick={()=>setImgPromptKey(k)} style={{ padding:"8px 12px", borderRadius:"5px", fontSize:"12px", fontWeight:imgPromptKey===k?600:400, border:`1px solid ${imgPromptKey===k?"var(--border-accent)":"var(--border)"}`, background:imgPromptKey===k?"var(--accent-dim)":"transparent", color:imgPromptKey===k?"var(--accent)":"var(--text-muted)", cursor:"pointer" }}>{l}</button>
              ))}
            </div>
            {imgPromptKey==="captura_custom" && (
              <textarea value={imgCustom} onChange={e=>setImgCustom(e.target.value)} rows={3} placeholder="Describe qué quieres analizar de esta imagen…" style={{ width:"100%", padding:"8px 10px", borderRadius:"4px", border:"1px solid var(--border)", background:"var(--card-hover)", color:"var(--text)", fontSize:"13px", outline:"none", resize:"vertical", marginBottom:"14px", boxSizing:"border-box" as const }}/>
            )}
            <button onClick={analizarImagen} disabled={!imgBase64||imgLoading} style={{ padding:"9px 22px", background:"var(--accent)", color:"#fff", border:"none", borderRadius:"5px", fontWeight:700, fontSize:"13px", cursor:"pointer", opacity:!imgBase64||imgLoading?0.5:1 }}>
              {imgLoading?"Analizando…":"Analizar imagen"}
            </button>
          </div>
          {imgResult && (
            <div style={{ ...CARD, padding:"20px 24px" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"14px" }}>
                <p style={{ ...LABEL, margin:0 }}>Análisis</p>
                <button onClick={()=>navigator.clipboard.writeText(imgResult).then(()=>alert("Copiado ✅"))} style={{ fontSize:"11px", padding:"4px 12px", borderRadius:"4px", background:"var(--accent-dim)", color:"var(--accent)", border:"1px solid var(--border-accent)", cursor:"pointer" }}>Copiar</button>
              </div>
              <pre style={{ color:"var(--text-mid)", fontSize:"13px", lineHeight:1.75, whiteSpace:"pre-wrap", fontFamily:"inherit", margin:0 }}>{imgResult}</pre>
            </div>
          )}
        </div>
      )}

      {/* ── TELEGRAM ─────────────────────────────────────────────────────────── */}
      {tab==="Telegram" && (
        <div style={{ display:"flex", flexDirection:"column", gap:"16px" }}>
          {/* Setup banner */}
          <div style={{ padding:"14px 18px", borderRadius:"6px", background:"rgba(0,87,255,0.05)", border:"1px solid rgba(0,87,255,0.2)", display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:"10px" }}>
            <div>
              <p style={{ fontSize:"13px", fontWeight:600, color:"var(--accent)", margin:"0 0 4px" }}>@RaxisM15_bot — Trade Photo Feed</p>
              <p style={{ fontSize:"12px", color:"var(--text-muted)", margin:0, lineHeight:1.6 }}>
                Envía una foto de tu operación al bot → aparece aquí automáticamente.<br/>
                <strong style={{ color:"var(--text)" }}>1 paso pendiente:</strong> añadir <code style={{ fontSize:"11px", background:"var(--surface)", padding:"1px 5px", borderRadius:"3px" }}>TELEGRAM_M15_BOT_TOKEN</code> en Vercel settings.
              </p>
            </div>
            <button onClick={()=>{setTelegramLoading(true);fetch("/api/telegram/photos").then(r=>r.json()).then(d=>setTelegramPhotos(d?.photos??[])).catch(()=>{}).finally(()=>setTelegramLoading(false));}}
              style={{ padding:"7px 14px", borderRadius:"5px", border:"1px solid var(--border-accent)", background:"var(--accent-dim)", color:"var(--accent)", fontSize:"12px", fontWeight:600, cursor:"pointer", flexShrink:0 }}>
              ↺ Actualizar
            </button>
          </div>
          {telegramLoading && <div style={{ textAlign:"center", padding:"32px", color:"var(--text-muted)" }}>Cargando capturas…</div>}
          {!telegramLoading && telegramPhotos.length===0 && (
            <div style={{ ...CARD, padding:"48px 32px", textAlign:"center" }}>
              <p style={{ fontSize:"14px", fontWeight:600, color:"var(--text)", margin:"0 0 8px" }}>Sin capturas recibidas</p>
              <p style={{ fontSize:"12px", color:"var(--text-muted)", margin:0 }}>Manda una foto al bot <strong>@RaxisM15_bot</strong> y pulsa Actualizar.</p>
            </div>
          )}
          {telegramPhotos.length>0 && (
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(280px,1fr))", gap:"14px" }}>
              {telegramPhotos.map(photo=>(
                <div key={photo.update_id} style={{ ...CARD, overflow:"hidden" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photo.url} alt={photo.caption||"Trade screenshot"} style={{ width:"100%", display:"block", maxHeight:"220px", objectFit:"cover" }}/>
                  <div style={{ padding:"10px 12px" }}>
                    {photo.caption && <p style={{ ...MONO, fontSize:"12px", fontWeight:700, color:"var(--accent)", margin:"0 0 3px", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{photo.caption}</p>}
                    <p style={{ fontSize:"11px", color:"var(--text-muted)", margin:0 }}>{photo.date_str}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Modal ────────────────────────────────────────────────────────────── */}
      {modal.open && (
        <div onClick={()=>setModal(m=>({...m,open:false}))} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.85)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:"20px" }}>
          <div onClick={e=>e.stopPropagation()} style={{ background:"var(--card)", border:"1px solid var(--border)", borderRadius:"10px", padding:"28px", maxWidth:"660px", width:"100%", maxHeight:"82vh", overflowY:"auto" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"20px" }}>
              <h3 style={{ color:"var(--text)", margin:0, fontSize:"15px", fontWeight:600 }}>{modal.title}</h3>
              <button onClick={()=>setModal(m=>({...m,open:false}))} style={{ background:"none", border:"none", color:"var(--text-muted)", cursor:"pointer", fontSize:"22px", lineHeight:1 }}>✕</button>
            </div>
            <pre style={{ color:"var(--text-mid)", fontSize:"12px", lineHeight:1.75, whiteSpace:"pre-wrap", ...MONO, margin:"0 0 24px" }}>{modal.content}</pre>
            <button onClick={()=>navigator.clipboard.writeText(modal.content).then(()=>alert("Copiado ✅"))} style={{ padding:"9px 22px", background:"var(--accent)", color:"#fff", border:"none", borderRadius:"5px", cursor:"pointer", fontWeight:700, fontSize:"13px" }}>Copiar prompt</button>
          </div>
        </div>
      )}
    </div>
  );
}
