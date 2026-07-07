"use client";

import { useState, useEffect } from "react";

interface M9Candidate {
  ticker: string;
  ts: string;
  price: number;
  score: number;
  vol_ratio: number;
  move4h: number;
  verdict: string;
  source: string;
}

const FUENTES = [
  { nombre:"SEC EDGAR",  descripcion:"13F filings, insider trades, form 4",     estado:"CONECTADA", color:"var(--green)" },
  { nombre:"Polygon.io", descripcion:"Precios, volumen, medias móviles, screener",estado:"CONECTADA", color:"var(--green)" },
  { nombre:"Finnhub",    descripcion:"API datos mercado, opciones, sentimiento",  estado:"PENDIENTE", color:"var(--amber)" },
  { nombre:"Barchart",   descripcion:"Flujo opciones inusuales, put/call ratio",  estado:"PENDIENTE", color:"var(--amber)" },
];

const SCREENERS = [
  { nombre:"Small Cap Volume Breakout",     descripcion:"Cap <2B, volumen >3x media, precio >50d MA",      finviz:"v=111&f=cap_smallunder,sh_avgvol_o300,ta_sma50_pa" },
  { nombre:"Oversold Dividend Stocks",      descripcion:"RSI <35, dividendo >4%, cap >500M",                finviz:"v=111&f=cap_midover,fa_div_o4,ta_rsi_ob30" },
  { nombre:"Insider Buying Last 30d",       descripcion:"Form 4 compras insider >$100k últimos 30 días",    finviz:"v=111&f=insiderown_o10,sh_insidertrans_pos" },
  { nombre:"Earnings Momentum Q2 2026",     descripcion:"EPS beat 3 últimos quarters + guidance alza",      finviz:"v=111&f=earningsdate_thisweek" },
  { nombre:"Low Float High Short Interest", descripcion:"Float <20M, short interest >20%, catalizador",     finviz:"v=111&f=sh_float_u20,sh_short_o20" },
  { nombre:"Value + Catalyst Screen",       descripcion:"P/E <15, P/B <2, evento próximo 30 días",          finviz:"v=111&f=fa_pe_u15,fa_pb_u2" },
];

const PLANES = [
  { nombre:"FREE",       precio:"€0/mes",   features:["5 señales/semana","Sin scoring","Email diario"],          color:"var(--text-muted)" },
  { nombre:"TRADER",     precio:"€29/mes",  features:["Señales ilimitadas","Scoring 1-10","Alertas Telegram"],   color:"var(--accent)" },
  { nombre:"PRO",        precio:"€79/mes",  features:["Todo TRADER","Acceso SEC screener","Prompts IA trading"], color:"var(--amber)" },
  { nombre:"ENTERPRISE", precio:"€299/mes", features:["Todo PRO","API acceso","White label","Soporte 1:1"],      color:"var(--green)" },
];

const FASES = [
  { fase:"Fase 1", descripcion:"MVP señales manuales",       pct:100, color:"var(--green)" },
  { fase:"Fase 2", descripcion:"Scoring automatizado IA",    pct:40,  color:"var(--amber)" },
  { fase:"Fase 3", descripcion:"Plataforma suscripciones",   pct:0,   color:"var(--text-muted)" },
  { fase:"Fase 4", descripcion:"API pública + white label",  pct:0,   color:"var(--text-muted)" },
];

type Tab = "Señales M9" | "Fuentes" | "Screeners" | "Suscriptores";
const TABS: Tab[] = ["Señales M9", "Fuentes", "Screeners", "Suscriptores"];

const CARD  = { background:"var(--card)", border:"1px solid var(--border)", borderRadius:"6px" } as React.CSSProperties;
const LABEL = { fontSize:"11px", fontWeight:600, letterSpacing:"0.08em", textTransform:"uppercase" as const, color:"var(--text-muted)" };
const TH    = { padding:"10px 14px", textAlign:"left" as const, fontSize:"11px", fontWeight:600, letterSpacing:"0.06em", color:"var(--text-muted)", borderBottom:"1px solid var(--border)" };
const TD    = { padding:"11px 14px", borderBottom:"1px solid var(--border)" };

function verdictColor(verdict: string): string {
  if (verdict.includes("COMPRA") || verdict.includes("ENTRADA")) return "var(--green)";
  if (verdict.includes("ESPERAR")) return "var(--amber)";
  return "var(--text-muted)";
}

function sourceLabel(source: string): string {
  const map: Record<string, string> = {
    day_gainers: "Gainers día",
    small_cap_gainers: "Small Cap",
    high_volume: "Vol alto",
    premarket: "Pre-market",
  };
  return map[source] ?? source;
}

export default function StokersPage() {
  const [tab, setTab]             = useState<Tab>("Señales M9");
  const [candidates, setCandidates] = useState<M9Candidate[]>([]);
  const [lastLog, setLastLog]     = useState<string>("");
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");

  useEffect(() => {
    fetch("/api/server/data")
      .then(r => r.json())
      .then(d => {
        const top = d?.m9?.top_candidates ?? [];
        const log = d?.m9?.last_log ?? "";
        setCandidates(top);
        setLastLog(log);
      })
      .catch(() => setError("No se pudo conectar con el servidor"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ padding:"32px 40px" }}>
      <div style={{ display:"flex", alignItems:"center", gap:"14px", marginBottom:"24px" }}>
        <h1 style={{ fontSize:"24px", fontWeight:600, color:"var(--text)" }}>Stokers Market</h1>
        <span style={{ fontSize:"11px", fontWeight:600, padding:"4px 10px", borderRadius:"4px", background:"rgba(0,200,100,0.08)", color:"var(--green)", border:"1px solid rgba(0,200,100,0.2)" }}>LIVE · M9</span>
      </div>

      {/* Tabs */}
      <div style={{ display:"inline-flex", gap:"4px", padding:"4px", background:"var(--surface)", border:"1px solid var(--border)", borderRadius:"8px", marginBottom:"20px" }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding:"7px 16px", borderRadius:"5px", border:"none", cursor:"pointer", fontSize:"13px", fontWeight: tab===t ? 600 : 400, background: tab===t ? "var(--accent-dim)" : "transparent", color: tab===t ? "var(--accent)" : "var(--text-muted)", outline: tab===t ? "1px solid var(--border-accent)" : "none" }}>{t}</button>
        ))}
      </div>

      {/* Señales M9 */}
      {tab === "Señales M9" && (
        <div>
          {lastLog && (
            <p style={{ fontSize:"11px", color:"var(--text-muted)", marginBottom:"12px" }}>
              Último scan M9: {new Date(lastLog).toLocaleString("es-ES")}
            </p>
          )}
          <div style={{ ...CARD, overflow:"hidden" }}>
            <div style={{ padding:"14px 20px", borderBottom:"1px solid var(--border)", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <p style={LABEL}>Candidatos detectados por M9 — Radar de mercado</p>
              {!loading && <span style={{ fontSize:"11px", color:"var(--text-muted)" }}>{candidates.length} candidatos</span>}
            </div>

            {loading && (
              <div style={{ padding:"40px", textAlign:"center", color:"var(--text-muted)", fontSize:"13px" }}>
                Cargando datos M9...
              </div>
            )}
            {error && (
              <div style={{ padding:"40px", textAlign:"center", color:"var(--red)", fontSize:"13px" }}>{error}</div>
            )}
            {!loading && !error && candidates.length === 0 && (
              <div style={{ padding:"40px", textAlign:"center", color:"var(--text-muted)", fontSize:"13px" }}>
                Sin candidatos activos en este momento.
              </div>
            )}
            {!loading && !error && candidates.length > 0 && (
              <table style={{ width:"100%", borderCollapse:"collapse" }}>
                <thead>
                  <tr>
                    {["Ticker","Precio","Score","Vol ×","Mov 4h","Veredicto","Fuente","Fecha scan"].map(h => (
                      <th key={h} style={TH}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {candidates.map((c, i) => {
                    const sc = c.score >= 7 ? "var(--green)" : c.score >= 5 ? "var(--amber)" : "var(--text-muted)";
                    const vc = verdictColor(c.verdict);
                    const fecha = new Date(c.ts).toLocaleDateString("es-ES", { day:"2-digit", month:"2-digit", hour:"2-digit", minute:"2-digit" });
                    return (
                      <tr key={`${c.ticker}-${i}`} style={{ background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)" }}>
                        <td style={{ ...TD, fontFamily:"'Space Mono', monospace", fontWeight:700, color:"var(--accent)", fontSize:"14px" }}>{c.ticker}</td>
                        <td style={{ ...TD, fontFamily:"'Space Mono', monospace", fontSize:"13px", color:"var(--text)" }}>${c.price.toFixed(2)}</td>
                        <td style={{ ...TD }}>
                          <span style={{ fontFamily:"'Space Mono', monospace", fontWeight:700, fontSize:"14px", color:sc }}>{c.score}</span>
                        </td>
                        <td style={{ ...TD, fontFamily:"'Space Mono', monospace", fontSize:"12px", color:"var(--text-mid)" }}>{c.vol_ratio.toFixed(1)}×</td>
                        <td style={{ ...TD, fontFamily:"'Space Mono', monospace", fontSize:"12px", color: c.move4h >= 0 ? "var(--green)" : "var(--red)" }}>
                          {c.move4h >= 0 ? "+" : ""}{c.move4h.toFixed(1)}%
                        </td>
                        <td style={{ ...TD, fontSize:"11px", fontWeight:600, color:vc }}>{c.verdict}</td>
                        <td style={{ ...TD }}>
                          <span style={{ fontSize:"10px", padding:"2px 8px", borderRadius:"3px", background:"var(--surface)", color:"var(--text-muted)", border:"1px solid var(--border)" }}>{sourceLabel(c.source)}</span>
                        </td>
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

      {/* Fuentes */}
      {tab === "Fuentes" && (
        <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
          {FUENTES.map(({ nombre,descripcion,estado,color }) => (
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

      {/* Screeners */}
      {tab === "Screeners" && (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px" }}>
          {SCREENERS.map(({ nombre,descripcion,finviz },i) => (
            <div key={nombre} style={{ ...CARD, padding:"16px 20px", display:"flex", flexDirection:"column", gap:"8px" }}>
              <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
                <span style={{ fontFamily:"'Space Mono', monospace", fontSize:"11px", color:"var(--text-muted)" }}>{String(i+1).padStart(2,"0")}</span>
                <span style={{ fontSize:"13px", fontWeight:600, color:"var(--text)" }}>{nombre}</span>
              </div>
              <p style={{ fontSize:"12px", color:"var(--text-muted)" }}>{descripcion}</p>
              <a
                href={`https://finviz.com/screener.ashx?${finviz}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ marginTop:"4px", padding:"7px 14px", borderRadius:"4px", background:"var(--accent-dim)", color:"var(--accent)", border:"1px solid var(--border-accent)", fontSize:"12px", cursor:"pointer", textDecoration:"none", display:"inline-block" }}
              >
                Abrir en Finviz →
              </a>
            </div>
          ))}
        </div>
      )}

      {/* Suscriptores */}
      {tab === "Suscriptores" && (
        <div style={{ display:"flex", flexDirection:"column", gap:"24px" }}>
          <div>
            <p style={{ ...LABEL, marginBottom:"14px" }}>Planes de suscripción</p>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"12px" }}>
              {PLANES.map(({ nombre,precio,features,color }) => (
                <div key={nombre} style={{ ...CARD, padding:"20px", borderColor: nombre==="TRADER" ? "var(--border-accent)" : "var(--border)" }}>
                  <p style={{ fontSize:"12px", fontWeight:600, color, marginBottom:"6px" }}>{nombre}</p>
                  <p style={{ fontFamily:"'Space Mono', monospace", fontWeight:700, fontSize:"20px", color:"var(--text)", marginBottom:"14px" }}>{precio}</p>
                  <ul style={{ listStyle:"none", display:"flex", flexDirection:"column", gap:"7px" }}>
                    {features.map(f => (
                      <li key={f} style={{ fontSize:"12px", color:"var(--text-muted)", display:"flex", gap:"6px" }}>
                        <span style={{ color }}>—</span>{f}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p style={{ ...LABEL, marginBottom:"14px" }}>Fases de desarrollo</p>
            <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
              {FASES.map(({ fase,descripcion,pct,color }) => (
                <div key={fase} style={{ ...CARD, padding:"14px 18px" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"8px" }}>
                    <div>
                      <span style={{ fontSize:"12px", fontWeight:600, color:"var(--text)", marginRight:"10px" }}>{fase}</span>
                      <span style={{ fontSize:"12px", color:"var(--text-muted)" }}>{descripcion}</span>
                    </div>
                    <span style={{ fontFamily:"'Space Mono', monospace", fontWeight:700, fontSize:"13px", color }}>{pct}%</span>
                  </div>
                  <div style={{ background:"var(--border)", borderRadius:"3px", height:"3px" }}>
                    <div style={{ width:`${pct}%`, height:"100%", background:color, borderRadius:"3px", minWidth: pct > 0 ? "4px" : "0" }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
