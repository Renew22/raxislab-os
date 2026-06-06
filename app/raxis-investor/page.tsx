"use client";

import { useState } from "react";

// ─── STATIC DATA ──────────────────────────────────────────────────────────────

const trackRecord = [
  { ticker:"ENGI", decision:"COMPRA",  entrada:21.42, actual:26.76, pnlPct: 24.9, estado:"ABIERTA" },
  { ticker:"REP",  decision:"COMPRA",  entrada:18.33, actual:22.95, pnlPct: 25.2, estado:"ABIERTA" },
  { ticker:"BBAI", decision:"VIGILAR", entrada:5.11,  actual:4.18,  pnlPct:-18.2, estado:"ABIERTA" },
];

const youtubeQueue = [
  { titulo:"Análisis ENGI — la energética europea que nadie mira", estado:"guión listo" },
  { titulo:"Por qué aguanto XRP con -28%",                         estado:"pendiente"   },
  { titulo:"AVGO Broadcom — caída de oportunidad o trampa",        estado:"guión listo" },
  { titulo:"Mi cartera completa Junio 2026",                       estado:"pendiente"   },
];

const initialSignals = [
  { coin:"SOL",  tipo:"LONG", entrada:"$79.50", actual:"$63.10", stop:"$55",    target:"$500",   pnlPct:-20.8, nota:""                      },
  { coin:"XRP",  tipo:"LONG", entrada:"$1.09",  actual:"$1.10",  stop:"$0.80",  target:"$5",     pnlPct:-28.1, nota:""                      },
  { coin:"ETH",  tipo:"LONG", entrada:"$1.574", actual:"$1.575", stop:"$1.200", target:"$8.000", pnlPct:-19.9, nota:""                      },
  { coin:"DOGE", tipo:"LONG", entrada:"$0.036", actual:"$0.081", stop:"—",      target:"—",      pnlPct:134.2, nota:"Considerando parciales" },
];

// ─── STYLES ───────────────────────────────────────────────────────────────────

const CARD  = { background:"#111111", border:"1px solid rgba(255,255,255,0.06)", borderRadius:"6px" } as React.CSSProperties;
const LABEL = { fontSize:"11px", fontWeight:600, letterSpacing:"0.08em", textTransform:"uppercase" as const, color:"#5A6470" };
const TH    = { padding:"10px 14px", textAlign:"left" as const, fontSize:"11px", fontWeight:600, letterSpacing:"0.06em", color:"#5A6470", borderBottom:"1px solid rgba(255,255,255,0.06)" };
const TD    = { padding:"12px 14px", borderBottom:"1px solid rgba(255,255,255,0.04)" };
const INPUT = { padding:"8px 10px", borderRadius:"4px", border:"1px solid rgba(255,255,255,0.08)", background:"#161616", color:"#FFFFFF", fontSize:"13px", outline:"none", width:"100%" } as React.CSSProperties;

type Tab = "Publicar" | "TrackRecord" | "YouTube" | "CryptoSignals" | "Métricas";
const TABS: Tab[] = ["Publicar", "TrackRecord", "YouTube", "CryptoSignals", "Métricas"];
const TAB_LABELS: Record<Tab, string> = {
  Publicar:      "Publicar análisis",
  TrackRecord:   "Track Record",
  YouTube:       "YouTube Queue",
  CryptoSignals: "Crypto Signals",
  Métricas:      "Métricas Canal",
};

// ─── COMPONENT ────────────────────────────────────────────────────────────────

export default function RaxisInvestorPage() {
  const [tab, setTab]       = useState<Tab>("Publicar");
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<{ postX: string; guionYoutube: string; articuloEN: string } | null>(null);
  const [form, setForm]     = useState({
    ticker:"", empresa:"", precioActual:"", entrada:"", stop:"",
    target1:"", target2:"", tesis:"", catalizador:"Insider Buy",
    riesgo:"", decision:"COMPRA", timeframe:"Corto",
  });
  const [signals, setSignals]         = useState(initialSignals);
  const [showSignalForm, setShowSignalForm] = useState(false);
  const [newSignal, setNewSignal]     = useState({ coin:"", tipo:"LONG", entrada:"", stop:"", target:"" });
  const [grabados, setGrabados]       = useState<number[]>([]);

  function setField(key: string, value: string) {
    setForm(f => ({ ...f, [key]: value }));
  }

  async function generarContenido() {
    if (!form.ticker || !form.tesis) return;
    setLoading(true);
    setResultado(null);
    try {
      const res = await fetch("/api/claude/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "investor_analysis",
          data: {
            ticker:   form.ticker,
            tesis:    form.tesis,
            entrada:  form.entrada,
            stop:     form.stop,
            target:   form.target1,
            decision: form.decision,
          },
        }),
      });
      const json = await res.json();
      const parsed = JSON.parse(json.content);
      setResultado({
        postX:        parsed.post_x || "",
        guionYoutube: typeof parsed.guion_youtube === "string"
          ? parsed.guion_youtube
          : JSON.stringify(parsed.guion_youtube, null, 2),
        articuloEN: typeof parsed.articulo_blog === "string"
          ? parsed.articulo_blog
          : JSON.stringify(parsed.articulo_blog, null, 2),
      });
    } catch {
      setResultado({ postX: "Error al generar. Verifica la API key en .env.local", guionYoutube: "", articuloEN: "" });
    } finally {
      setLoading(false);
    }
  }

  function addSignal() {
    if (!newSignal.coin) return;
    setSignals(s => [...s, {
      coin: newSignal.coin.toUpperCase(), tipo: newSignal.tipo,
      entrada: newSignal.entrada, actual: "—", stop: newSignal.stop,
      target: newSignal.target, pnlPct: 0, nota: "",
    }]);
    setNewSignal({ coin:"", tipo:"LONG", entrada:"", stop:"", target:"" });
    setShowSignalForm(false);
  }

  return (
    <div style={{ padding:"32px 40px" }}>
      {/* Header */}
      <div style={{ marginBottom:"24px" }}>
        <h1 style={{ fontSize:"24px", fontWeight:600, color:"#FFFFFF", margin:"0 0 4px 0" }}>Raxis Investor</h1>
        <p style={{ fontSize:"13px", color:"#5A6470", margin:0 }}>Análisis · Publicación · Tracking</p>
      </div>

      {/* Tab bar */}
      <div style={{ display:"inline-flex", gap:"4px", padding:"4px", background:"#0a0a0a", border:"1px solid rgba(255,255,255,0.06)", borderRadius:"8px", marginBottom:"24px" }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding:"7px 16px", borderRadius:"5px", border:"none", cursor:"pointer", fontSize:"13px", fontWeight: tab===t ? 600 : 400, background: tab===t ? "rgba(0,200,255,0.1)" : "transparent", color: tab===t ? "#00C8FF" : "#5A6470", outline: tab===t ? "1px solid rgba(0,200,255,0.2)" : "none", whiteSpace:"nowrap" }}>
            {TAB_LABELS[t]}
          </button>
        ))}
      </div>

      {/* ── TAB 1: PUBLICAR ANÁLISIS ── */}
      {tab === "Publicar" && (
        <div style={{ display:"flex", flexDirection:"column", gap:"20px" }}>
          <div style={{ ...CARD, padding:"24px" }}>
            <p style={{ ...LABEL, marginBottom:"20px" }}>Datos del análisis</p>

            {/* Fila 1 */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"12px", marginBottom:"12px" }}>
              {([ ["ticker","Ticker"], ["empresa","Empresa"], ["precioActual","Precio actual"], ["entrada","Entrada"] ] as [string,string][]).map(([k, l]) => (
                <div key={k}>
                  <p style={{ fontSize:"11px", color:"#5A6470", marginBottom:"4px" }}>{l}</p>
                  <input value={(form as Record<string,string>)[k]} onChange={e => setField(k, e.target.value)} style={INPUT} />
                </div>
              ))}
            </div>

            {/* Fila 2 */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"12px", marginBottom:"12px" }}>
              {([ ["stop","Stop"], ["target1","Target 1"], ["target2","Target 2"], ["riesgo","Riesgo"] ] as [string,string][]).map(([k, l]) => (
                <div key={k}>
                  <p style={{ fontSize:"11px", color:"#5A6470", marginBottom:"4px" }}>{l}</p>
                  <input value={(form as Record<string,string>)[k]} onChange={e => setField(k, e.target.value)} style={INPUT} />
                </div>
              ))}
            </div>

            {/* Tesis */}
            <div style={{ marginBottom:"12px" }}>
              <p style={{ fontSize:"11px", color:"#5A6470", marginBottom:"4px" }}>Tesis</p>
              <textarea value={form.tesis} onChange={e => setField("tesis", e.target.value)} rows={3} style={{ ...INPUT, resize:"vertical" as const }} />
            </div>

            {/* Fila 3 — selects + radio */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"12px", marginBottom:"20px" }}>
              <div>
                <p style={{ fontSize:"11px", color:"#5A6470", marginBottom:"4px" }}>Catalizador</p>
                <select value={form.catalizador} onChange={e => setField("catalizador", e.target.value)} style={INPUT}>
                  {["Insider Buy","Contrato gobierno","Earnings","Volumen inusual","Otro"].map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <p style={{ fontSize:"11px", color:"#5A6470", marginBottom:"4px" }}>Timeframe</p>
                <select value={form.timeframe} onChange={e => setField("timeframe", e.target.value)} style={INPUT}>
                  {["Corto","Medio","Largo"].map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <p style={{ fontSize:"11px", color:"#5A6470", marginBottom:"8px" }}>Decisión</p>
                <div style={{ display:"flex", gap:"14px", paddingTop:"4px" }}>
                  {(["COMPRA","VIGILAR","EVITAR"] as const).map(d => (
                    <label key={d} style={{ display:"flex", alignItems:"center", gap:"5px", cursor:"pointer" }}>
                      <input type="radio" name="decision" value={d} checked={form.decision === d} onChange={() => setField("decision", d)} style={{ accentColor:"#00C8FF" }} />
                      <span style={{ fontSize:"12px", fontWeight:600, color: d==="COMPRA" ? "#00E676" : d==="EVITAR" ? "#FF3D71" : "#FFB800" }}>{d}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={generarContenido}
              disabled={loading}
              style={{ padding:"10px 24px", background: loading ? "#1a1a1a" : "#00C8FF", color: loading ? "#5A6470" : "#000000", border:"none", borderRadius:"5px", cursor: loading ? "default" : "pointer", fontWeight:700, fontSize:"14px" }}
            >
              {loading ? "Generando..." : "Generar contenido →"}
            </button>
          </div>

          {/* Resultados */}
          {resultado && (
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"16px" }}>
              {[
                { titulo:"Post X (280 chars)", contenido: resultado.postX       },
                { titulo:"Guión YouTube",      contenido: resultado.guionYoutube },
                { titulo:"Artículo EN",        contenido: resultado.articuloEN   },
              ].map(({ titulo, contenido }) => (
                <div key={titulo} style={{ ...CARD, padding:"18px", display:"flex", flexDirection:"column", gap:"12px" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <p style={LABEL}>{titulo}</p>
                    <button onClick={() => navigator.clipboard.writeText(contenido).then(() => alert("Copiado ✅"))} style={{ fontSize:"11px", padding:"3px 8px", borderRadius:"3px", background:"rgba(0,200,255,0.08)", color:"#00C8FF", border:"1px solid rgba(0,200,255,0.15)", cursor:"pointer" }}>Copiar</button>
                  </div>
                  <pre style={{ fontSize:"12px", color:"#C4CDD5", lineHeight:1.6, whiteSpace:"pre-wrap", fontFamily:"'Space Mono', monospace", margin:0, maxHeight:"220px", overflowY:"auto" }}>{contenido}</pre>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 2: TRACK RECORD ── */}
      {tab === "TrackRecord" && (
        <div style={{ display:"flex", flexDirection:"column", gap:"16px" }}>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"12px" }}>
            {[
              { label:"Win Rate",       value:"67%",  color:"#00E676" },
              { label:"Ganancia media", value:"+25%", color:"#00E676" },
              { label:"Pérdida media",  value:"-14%", color:"#FF3D71" },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ ...CARD, padding:"18px 20px" }}>
                <p style={{ ...LABEL, marginBottom:"8px" }}>{label}</p>
                <p style={{ fontFamily:"'Space Mono', monospace", fontWeight:700, fontSize:"26px", color, margin:0 }}>{value}</p>
              </div>
            ))}
          </div>
          <div style={{ ...CARD, overflow:"hidden" }}>
            <div style={{ padding:"16px 20px", borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
              <p style={LABEL}>Historial de análisis publicados</p>
            </div>
            <table style={{ width:"100%", borderCollapse:"collapse" }}>
              <thead><tr>{["Ticker","Decisión","Entrada","Actual","PnL %","Estado"].map(h => <th key={h} style={TH}>{h}</th>)}</tr></thead>
              <tbody>
                {trackRecord.map(({ ticker, decision, entrada, actual, pnlPct, estado }) => {
                  const pos = pnlPct >= 0;
                  const dc  = decision === "COMPRA" ? "#00E676" : decision === "EVITAR" ? "#FF3D71" : "#FFB800";
                  return (
                    <tr key={ticker}>
                      <td style={{ ...TD, fontFamily:"'Space Mono', monospace", fontWeight:700, color:"#00C8FF" }}>{ticker}</td>
                      <td style={{ ...TD }}>
                        <span style={{ fontSize:"11px", fontWeight:700, padding:"2px 7px", borderRadius:"3px", background:`${dc}18`, color:dc, border:`1px solid ${dc}40` }}>{decision}</span>
                      </td>
                      <td style={{ ...TD, fontFamily:"'Space Mono', monospace", fontSize:"13px", color:"#9AA3AD" }}>{entrada}</td>
                      <td style={{ ...TD, fontFamily:"'Space Mono', monospace", fontSize:"13px", color:"#FFFFFF" }}>{actual}</td>
                      <td style={{ ...TD, fontFamily:"'Space Mono', monospace", fontWeight:700, color: pos ? "#00E676" : "#FF3D71" }}>{pos ? "+" : ""}{pnlPct}%</td>
                      <td style={{ ...TD }}>
                        <span style={{ fontSize:"11px", padding:"2px 7px", borderRadius:"3px", background:"rgba(0,200,255,0.08)", color:"#00C8FF" }}>{estado}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 3: YOUTUBE QUEUE ── */}
      {tab === "YouTube" && (
        <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
          <p style={{ ...LABEL, marginBottom:"4px" }}>Videos pendientes · {youtubeQueue.length - grabados.length} restantes</p>
          {youtubeQueue.map(({ titulo, estado }, i) => {
            const grabado = grabados.includes(i);
            const listo   = estado === "guión listo";
            return (
              <div key={i} style={{ ...CARD, padding:"16px 20px", display:"flex", alignItems:"center", justifyContent:"space-between", gap:"16px", opacity: grabado ? 0.45 : 1 }}>
                <div style={{ display:"flex", alignItems:"center", gap:"12px", flex:1, minWidth:0 }}>
                  <span style={{ fontSize:"11px", fontWeight:700, padding:"2px 8px", borderRadius:"3px", whiteSpace:"nowrap", background: listo ? "rgba(0,230,118,0.12)" : "rgba(255,184,0,0.12)", color: listo ? "#00E676" : "#FFB800", border:`1px solid ${listo ? "rgba(0,230,118,0.25)" : "rgba(255,184,0,0.25)"}` }}>
                    {listo ? "GUIÓN LISTO" : "PENDIENTE"}
                  </span>
                  <p style={{ margin:0, fontSize:"13px", color: grabado ? "#5A6470" : "#FFFFFF", textDecoration: grabado ? "line-through" : "none", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{titulo}</p>
                </div>
                <div style={{ display:"flex", gap:"8px", flexShrink:0 }}>
                  <button style={{ fontSize:"11px", padding:"5px 10px", borderRadius:"3px", background:"rgba(0,200,255,0.08)", color:"#00C8FF", border:"1px solid rgba(0,200,255,0.15)", cursor:"pointer", whiteSpace:"nowrap" }}>Generar guión</button>
                  <button
                    onClick={() => setGrabados(g => g.includes(i) ? g.filter(x => x !== i) : [...g, i])}
                    style={{ fontSize:"11px", padding:"5px 10px", borderRadius:"3px", cursor:"pointer", whiteSpace:"nowrap", background: grabado ? "rgba(255,255,255,0.04)" : "rgba(0,230,118,0.08)", color: grabado ? "#5A6470" : "#00E676", border:`1px solid ${grabado ? "rgba(255,255,255,0.06)" : "rgba(0,230,118,0.15)"}` }}
                  >{grabado ? "Desmarcar" : "✓ Grabado"}</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── TAB 4: CRYPTO SIGNALS ── */}
      {tab === "CryptoSignals" && (
        <div style={{ display:"flex", flexDirection:"column", gap:"16px" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <p style={LABEL}>Señales activas · {signals.length} posiciones</p>
            <button onClick={() => setShowSignalForm(s => !s)} style={{ padding:"7px 16px", borderRadius:"4px", background:"rgba(0,200,255,0.1)", color:"#00C8FF", border:"1px solid rgba(0,200,255,0.2)", cursor:"pointer", fontSize:"12px", fontWeight:600 }}>+ Nueva señal</button>
          </div>

          {showSignalForm && (
            <div style={{ ...CARD, padding:"16px 20px" }}>
              <p style={{ ...LABEL, marginBottom:"14px" }}>Nueva señal crypto</p>
              <div style={{ display:"flex", gap:"10px", flexWrap:"wrap", alignItems:"flex-end" }}>
                {([ ["coin","Coin"], ["entrada","Entrada"], ["stop","Stop"], ["target","Target"] ] as [string,string][]).map(([k, l]) => (
                  <div key={k}>
                    <p style={{ fontSize:"11px", color:"#5A6470", marginBottom:"4px" }}>{l}</p>
                    <input value={(newSignal as Record<string,string>)[k]} onChange={e => setNewSignal(s => ({ ...s, [k]: e.target.value }))} style={{ padding:"7px 10px", borderRadius:"4px", border:"1px solid rgba(255,255,255,0.08)", background:"#161616", color:"#FFFFFF", fontSize:"13px", width: k==="coin" ? "80px" : "100px", outline:"none" }} />
                  </div>
                ))}
                <div>
                  <p style={{ fontSize:"11px", color:"#5A6470", marginBottom:"4px" }}>Tipo</p>
                  <select value={newSignal.tipo} onChange={e => setNewSignal(s => ({ ...s, tipo: e.target.value }))} style={{ padding:"7px 10px", borderRadius:"4px", border:"1px solid rgba(255,255,255,0.08)", background:"#161616", color:"#FFFFFF", fontSize:"13px", outline:"none" }}>
                    <option>LONG</option><option>SHORT</option>
                  </select>
                </div>
                <button onClick={addSignal} style={{ padding:"8px 16px", borderRadius:"4px", background:"#00C8FF", color:"#000", fontSize:"13px", fontWeight:600, border:"none", cursor:"pointer" }}>Añadir</button>
              </div>
            </div>
          )}

          <div style={{ ...CARD, overflow:"hidden" }}>
            <table style={{ width:"100%", borderCollapse:"collapse" }}>
              <thead><tr>{["Coin","Tipo","Entrada","Actual","Stop","Target","PnL %","Nota"].map(h => <th key={h} style={TH}>{h}</th>)}</tr></thead>
              <tbody>
                {signals.map(({ coin, tipo, entrada, actual, stop, target, pnlPct, nota }) => {
                  const pos = pnlPct >= 0;
                  return (
                    <tr key={coin}>
                      <td style={{ ...TD, fontFamily:"'Space Mono', monospace", fontWeight:700, color:"#FFB800" }}>{coin}</td>
                      <td style={{ ...TD }}><span style={{ fontSize:"11px", fontWeight:700, padding:"2px 6px", borderRadius:"3px", background:"rgba(0,200,255,0.08)", color:"#00C8FF" }}>{tipo}</span></td>
                      <td style={{ ...TD, fontFamily:"'Space Mono', monospace", fontSize:"12px", color:"#9AA3AD" }}>{entrada}</td>
                      <td style={{ ...TD, fontFamily:"'Space Mono', monospace", fontSize:"13px", color:"#FFFFFF" }}>{actual}</td>
                      <td style={{ ...TD, fontFamily:"'Space Mono', monospace", fontSize:"12px", color:"#FF3D71" }}>{stop}</td>
                      <td style={{ ...TD, fontFamily:"'Space Mono', monospace", fontSize:"12px", color:"#00C8FF" }}>{target}</td>
                      <td style={{ ...TD, fontFamily:"'Space Mono', monospace", fontWeight:700, color: pos ? "#00E676" : "#FF3D71" }}>{pos ? "+" : ""}{pnlPct}%</td>
                      <td style={{ ...TD, fontSize:"12px", color:"#5A6470" }}>{nota}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 5: MÉTRICAS CANAL ── */}
      {tab === "Métricas" && (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:"16px" }}>
          {[
            { label:"X / Twitter", actual:0, meta:1000, unidad:"seguidores",  plazo:"3 meses", color:"#00C8FF" },
            { label:"YouTube",     actual:0, meta:100,  unidad:"suscriptores",plazo:"3 meses", color:"#FF3D71" },
            { label:"Telegram",    actual:0, meta:500,  unidad:"miembros",    plazo:"3 meses", color:"#7C5CBF" },
            { label:"Ingresos",    actual:0, meta:500,  unidad:"€/mes",       plazo:"6 meses", color:"#00E676" },
          ].map(({ label, actual, meta, unidad, plazo, color }) => {
            const pct = Math.round((actual / meta) * 100);
            return (
              <div key={label} style={{ ...CARD, padding:"22px 24px" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"16px" }}>
                  <div>
                    <p style={{ ...LABEL, marginBottom:"6px" }}>{label}</p>
                    <p style={{ fontFamily:"'Space Mono', monospace", fontWeight:700, fontSize:"28px", color:"#FFFFFF", margin:0 }}>{actual.toLocaleString()}</p>
                  </div>
                  <div style={{ textAlign:"right" }}>
                    <p style={{ fontSize:"11px", color:"#5A6470", margin:"0 0 4px 0" }}>Meta · {plazo}</p>
                    <p style={{ fontFamily:"'Space Mono', monospace", fontWeight:700, fontSize:"18px", color, margin:0 }}>{meta.toLocaleString()} {unidad}</p>
                  </div>
                </div>
                <div style={{ background:"rgba(255,255,255,0.06)", borderRadius:"4px", height:"6px", overflow:"hidden" }}>
                  <div style={{ width:`${pct}%`, height:"100%", background:color, borderRadius:"4px" }}></div>
                </div>
                <p style={{ fontSize:"11px", color:"#5A6470", margin:"8px 0 0 0" }}>{pct}% completado</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
