"use client";

import { useState, useEffect } from "react";

interface M9Candidate {
  ticker:string; ts:string; price:number; score:number;
  vol_ratio:number; move4h:number; verdict:string; source:string;
}

const FUENTES = [
  { nombre:"SEC EDGAR",  descripcion:"13F filings, insider trades, form 4",      estado:"CONECTADA", color:"var(--green)" },
  { nombre:"Polygon.io", descripcion:"Precios, volumen, medias móviles, screener",estado:"CONECTADA", color:"var(--green)" },
  { nombre:"Finnhub",    descripcion:"API datos mercado, opciones, sentimiento",  estado:"PENDIENTE", color:"var(--amber)" },
  { nombre:"Barchart",   descripcion:"Flujo opciones inusuales, put/call ratio",  estado:"PENDIENTE", color:"var(--amber)" },
];

const SCREENERS = [
  { nombre:"Small Cap Volume Breakout",   descripcion:"Cap <2B, volumen >3x media, precio >50d MA",     finviz:"v=111&f=cap_smallunder,sh_avgvol_o300,ta_sma50_pa" },
  { nombre:"Oversold Dividend Stocks",    descripcion:"RSI <35, dividendo >4%, cap >500M",               finviz:"v=111&f=cap_midover,fa_div_o4,ta_rsi_ob30" },
  { nombre:"Insider Buying Last 30d",     descripcion:"Form 4 compras insider >$100k últimos 30 días",   finviz:"v=111&f=insiderown_o10,sh_insidertrans_pos" },
  { nombre:"Earnings Momentum Q2 2026",   descripcion:"EPS beat 3 últimos quarters + guidance alza",     finviz:"v=111&f=earningsdate_thisweek" },
  { nombre:"Low Float High Short Interest",descripcion:"Float <20M, short interest >20%, catalizador",   finviz:"v=111&f=sh_float_u20,sh_short_o20" },
  { nombre:"Value + Catalyst Screen",     descripcion:"P/E <15, P/B <2, evento próximo 30 días",         finviz:"v=111&f=fa_pe_u15,fa_pb_u2" },
];

const CARD  = { background:"var(--card)", border:"1px solid var(--border)", borderRadius:"6px" } as React.CSSProperties;
const LABEL = { fontSize:"11px", fontWeight:600, letterSpacing:"0.08em", textTransform:"uppercase" as const, color:"var(--text-muted)" };
const TH    = { padding:"10px 14px", textAlign:"left" as const, fontSize:"11px", fontWeight:600, letterSpacing:"0.06em", color:"var(--text-muted)", borderBottom:"1px solid var(--border)" };
const TD    = { padding:"11px 14px", borderBottom:"1px solid var(--border)" };

function verdictColor(v:string) {
  if (v.includes("COMPRA")||v.includes("ENTRADA")) return "var(--green)";
  if (v.includes("ESPERAR")) return "var(--amber)";
  return "var(--text-muted)";
}
const SRC_MAP: Record<string,string> = { day_gainers:"Gainers día", small_cap_gainers:"Small Cap", high_volume:"Vol alto", premarket:"Pre-market" };

type SubTab = "Señales"|"Screeners"|"Fuentes";

export default function M9Tab() {
  const [sub, setSub] = useState<SubTab>("Señales");
  const [candidates, setCandidates] = useState<M9Candidate[]>([]);
  const [lastLog, setLastLog] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/server/data")
      .then(r=>r.json())
      .then(d=>{ setCandidates(d?.m9?.top_candidates??[]); const raw=d?.m9?.last_log; setLastLog(Array.isArray(raw)?raw.at(-1)??"":raw??""); })
      .catch(()=>setError("No se pudo conectar con el servidor"))
      .finally(()=>setLoading(false));
  }, []);

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:"16px" }}>
      {/* Sub-tab bar */}
      <div style={{ display:"inline-flex", gap:"4px", padding:"4px", background:"var(--surface)", border:"1px solid var(--border)", borderRadius:"8px" }}>
        {(["Señales","Screeners","Fuentes"] as SubTab[]).map(t=>(
          <button key={t} onClick={()=>setSub(t)} style={{ padding:"6px 14px", borderRadius:"5px", border:"none", cursor:"pointer", fontSize:"12px", fontWeight:sub===t?600:400, background:sub===t?"var(--accent-dim)":"transparent", color:sub===t?"var(--accent)":"var(--text-muted)", outline:sub===t?"1px solid var(--border-accent)":"none" }}>{t}</button>
        ))}
      </div>

      {/* Señales M9 */}
      {sub==="Señales" && (
        <div>
          {lastLog && <p style={{ fontSize:"11px", color:"var(--text-muted)", marginBottom:"12px" }}>Último scan M9: {(()=>{ const m=lastLog.match(/\[([^\]]+)\]/); return m?new Date(m[1]).toLocaleString("es-ES"):lastLog; })()}</p>}
          <div style={{ ...CARD, overflow:"hidden" }}>
            <div style={{ padding:"14px 20px", borderBottom:"1px solid var(--border)", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <p style={LABEL}>Candidatos detectados por M9 — Radar de mercado</p>
              {!loading && <span style={{ fontSize:"11px", color:"var(--text-muted)" }}>{candidates.length} candidatos</span>}
            </div>
            {loading && <div style={{ padding:"40px", textAlign:"center", color:"var(--text-muted)", fontSize:"13px" }}>Cargando datos M9...</div>}
            {error && <div style={{ padding:"40px", textAlign:"center", color:"var(--red)", fontSize:"13px" }}>{error}</div>}
            {!loading && !error && candidates.length===0 && <div style={{ padding:"40px", textAlign:"center", color:"var(--text-muted)", fontSize:"13px" }}>Sin candidatos activos.</div>}
            {!loading && !error && candidates.length>0 && (
              <table style={{ width:"100%", borderCollapse:"collapse" }}>
                <thead><tr>{["Ticker","Precio","Score","Vol ×","Mov 4h","Veredicto","Fuente","Fecha scan"].map(h=><th key={h} style={TH}>{h}</th>)}</tr></thead>
                <tbody>
                  {candidates.map((c,i)=>{
                    const sc = c.score>=7?"var(--green)":c.score>=5?"var(--amber)":"var(--text-muted)";
                    const fecha = new Date(c.ts).toLocaleDateString("es-ES",{day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"});
                    return (
                      <tr key={`${c.ticker}-${i}`} style={{ background:i%2===0?"transparent":"rgba(255,255,255,0.01)" }}>
                        <td style={{ ...TD, fontFamily:"'Space Mono', monospace", fontWeight:700, color:"var(--accent)", fontSize:"14px" }}>{c.ticker}</td>
                        <td style={{ ...TD, fontFamily:"'Space Mono', monospace", fontSize:"13px", color:"var(--text)" }}>${c.price.toFixed(2)}</td>
                        <td style={TD}><span style={{ fontFamily:"'Space Mono', monospace", fontWeight:700, fontSize:"14px", color:sc }}>{c.score}</span></td>
                        <td style={{ ...TD, fontFamily:"'Space Mono', monospace", fontSize:"12px", color:"var(--text-mid)" }}>{c.vol_ratio.toFixed(1)}×</td>
                        <td style={{ ...TD, fontFamily:"'Space Mono', monospace", fontSize:"12px", color:c.move4h>=0?"var(--green)":"var(--red)" }}>{c.move4h>=0?"+":""}{c.move4h.toFixed(1)}%</td>
                        <td style={{ ...TD, fontSize:"11px", fontWeight:600, color:verdictColor(c.verdict) }}>{c.verdict}</td>
                        <td style={TD}><span style={{ fontSize:"10px", padding:"2px 8px", borderRadius:"3px", background:"var(--surface)", color:"var(--text-muted)", border:"1px solid var(--border)" }}>{SRC_MAP[c.source]??c.source}</span></td>
                        <td style={{ ...TD, fontSize:"11px", color:"var(--text-muted)" }}>{fecha}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Screeners */}
      {sub==="Screeners" && (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px" }}>
          {SCREENERS.map(({nombre,descripcion,finviz},i)=>(
            <div key={nombre} style={{ ...CARD, padding:"16px 20px", display:"flex", flexDirection:"column", gap:"8px" }}>
              <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
                <span style={{ fontFamily:"'Space Mono', monospace", fontSize:"11px", color:"var(--text-muted)" }}>{String(i+1).padStart(2,"0")}</span>
                <span style={{ fontSize:"13px", fontWeight:600, color:"var(--text)" }}>{nombre}</span>
              </div>
              <p style={{ fontSize:"12px", color:"var(--text-muted)" }}>{descripcion}</p>
              <a href={`https://finviz.com/screener.ashx?${finviz}`} target="_blank" rel="noopener noreferrer"
                style={{ padding:"7px 14px", borderRadius:"4px", background:"var(--accent-dim)", color:"var(--accent)", border:"1px solid var(--border-accent)", fontSize:"12px", textDecoration:"none", display:"inline-block" }}>
                Abrir en Finviz →
              </a>
            </div>
          ))}
        </div>
      )}

      {/* Fuentes */}
      {sub==="Fuentes" && (
        <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
          {FUENTES.map(({nombre,descripcion,estado,color})=>(
            <div key={nombre} style={{ ...CARD, padding:"16px 20px", display:"flex", alignItems:"center", gap:"16px" }}>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:"14px", fontWeight:600, color:"var(--text)", marginBottom:"3px" }}>{nombre}</div>
                <div style={{ fontSize:"12px", color:"var(--text-muted)" }}>{descripcion}</div>
              </div>
              <span style={{ fontSize:"11px", fontWeight:600, padding:"4px 10px", borderRadius:"4px", color, background:"var(--accent-dim)", border:"1px solid var(--border-accent)", whiteSpace:"nowrap" }}>{estado}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
