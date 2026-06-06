"use client";

import { useState } from "react";

const senales = [
  { ticker:"RKLB", score:8.5, razon:"Breakout post-launch + zona acumulación institucional", entrada:"11.30",stop:"10.60",objetivo:"13.50" },
  { ticker:"ASTS", score:8.2, razon:"Catalizador DoD pendiente + setup técnico convergente",  entrada:"22.50",stop:"21.00",objetivo:"26.00" },
  { ticker:"IONQ", score:7.8, razon:"Sector quantum momentum tras earnings IBM + volumen",    entrada:"8.90", stop:"8.20", objetivo:"10.80" },
  { ticker:"SMR",  score:7.5, razon:"Tendencia energía nuclear + insider buying reciente",    entrada:"19.20",stop:"18.00",objetivo:"22.50" },
  { ticker:"GENIE",score:7.1, razon:"Undervalued energy play + rebote técnico en soporte",   entrada:"4.80", stop:"4.40", objetivo:"5.80"  },
];

const fuentes = [
  { nombre:"SEC EDGAR",  descripcion:"13F filings, insider trades, form 4",    estado:"CONECTADA", color:"#00E676" },
  { nombre:"SAM.gov",    descripcion:"Contratos gubernamentales y adjudicaciones",estado:"PENDIENTE", color:"#FFB800" },
  { nombre:"Finnhub",    descripcion:"API datos mercado, opciones, sentimiento", estado:"PENDIENTE", color:"#FFB800" },
  { nombre:"Barchart",   descripcion:"Flujo opciones inusuales, put/call ratio",  estado:"PENDIENTE", color:"#FFB800" },
];

const screeners = [
  { nombre:"Small Cap Volume Breakout",     descripcion:"Cap <2B, volumen >3x media, precio >50d MA" },
  { nombre:"Oversold Dividend Stocks",      descripcion:"RSI <35, dividendo >4%, cap >500M"           },
  { nombre:"Insider Buying Last 30d",       descripcion:"Form 4 compras insider >$100k últimos 30 días"},
  { nombre:"Earnings Momentum Q2 2026",     descripcion:"EPS beat 3 últimos quarters + guidance alza"  },
  { nombre:"Low Float High Short Interest", descripcion:"Float <20M, short interest >20%, catalizador" },
  { nombre:"Value + Catalyst Screen",       descripcion:"P/E <15, P/B <2, evento próximo 30 días"      },
];

const planes = [
  { nombre:"FREE",       precio:"€0/mes",   features:["5 señales/semana","Sin scoring","Email diario"],          color:"#5A6470" },
  { nombre:"TRADER",     precio:"€29/mes",  features:["Señales ilimitadas","Scoring 1-10","Alertas Telegram"],   color:"#00C8FF" },
  { nombre:"PRO",        precio:"€79/mes",  features:["Todo TRADER","Acceso SEC screener","Prompts IA trading"], color:"#FFB800" },
  { nombre:"ENTERPRISE", precio:"€299/mes", features:["Todo PRO","API acceso","White label","Soporte 1:1"],      color:"#00E676" },
];

const fases = [
  { fase:"Fase 1", descripcion:"MVP señales manuales",          pct:100, color:"#00E676" },
  { fase:"Fase 2", descripcion:"Scoring automatizado IA",        pct:40,  color:"#FFB800" },
  { fase:"Fase 3", descripcion:"Plataforma suscripciones",       pct:0,   color:"#5A6470" },
  { fase:"Fase 4", descripcion:"API pública + white label",      pct:0,   color:"#5A6470" },
];

type Tab = "Señales"|"Fuentes"|"Screeners"|"Suscriptores";
const TABS: Tab[] = ["Señales","Fuentes","Screeners","Suscriptores"];

const CARD  = { background:"#111111", border:"1px solid rgba(255,255,255,0.06)", borderRadius:"6px" } as React.CSSProperties;
const LABEL = { fontSize:"11px", fontWeight:600, letterSpacing:"0.08em", textTransform:"uppercase" as const, color:"#5A6470" };
const TH    = { padding:"10px 14px", textAlign:"left" as const, fontSize:"11px", fontWeight:600, letterSpacing:"0.06em", color:"#5A6470", borderBottom:"1px solid rgba(255,255,255,0.06)" };
const TD    = { padding:"12px 14px", borderBottom:"1px solid rgba(255,255,255,0.04)" };

export default function StokersPage() {
  const [tab, setTab] = useState<Tab>("Señales");

  return (
    <div style={{ padding:"32px 40px" }}>
      <div style={{ display:"flex", alignItems:"center", gap:"14px", marginBottom:"24px" }}>
        <h1 style={{ fontSize:"24px", fontWeight:600, color:"#FFFFFF" }}>Stokers Market</h1>
        <span style={{ fontSize:"11px", fontWeight:600, padding:"4px 10px", borderRadius:"4px", background:"rgba(255,184,0,0.08)", color:"#FFB800", border:"1px solid rgba(255,184,0,0.2)" }}>EN DESARROLLO</span>
      </div>

      {/* Tab bar */}
      <div style={{ display:"inline-flex", gap:"4px", padding:"4px", background:"#0a0a0a", border:"1px solid rgba(255,255,255,0.06)", borderRadius:"8px", marginBottom:"20px" }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding:"7px 16px", borderRadius:"5px", border:"none", cursor:"pointer", fontSize:"13px", fontWeight: tab===t ? 600 : 400, background: tab===t ? "rgba(0,200,255,0.1)" : "transparent", color: tab===t ? "#00C8FF" : "#5A6470", outline: tab===t ? "1px solid rgba(0,200,255,0.2)" : "none" }}>{t}</button>
        ))}
      </div>

      {/* Señales hoy */}
      {tab === "Señales" && (
        <div style={{ ...CARD, overflow:"hidden" }}>
          <div style={{ padding:"16px 20px", borderBottom:"1px solid rgba(255,255,255,0.06)" }}><p style={LABEL}>Señales hoy — {new Date().toLocaleDateString("es-ES")}</p></div>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead><tr>{["Ticker","Score","Razón","Entrada","Stop","Objetivo","Acción"].map(h=><th key={h} style={TH}>{h}</th>)}</tr></thead>
            <tbody>
              {senales.map(({ ticker,score,razon,entrada,stop,objetivo }) => {
                const sc = score >= 8 ? "#00E676" : score >= 7 ? "#FFB800" : "#FF3D71";
                return (
                  <tr key={ticker}>
                    <td style={{ ...TD, fontFamily:"'Space Mono', monospace", fontWeight:700, color:"#00C8FF" }}>{ticker}</td>
                    <td style={{ ...TD }}>
                      <span style={{ fontFamily:"'Space Mono', monospace", fontWeight:700, fontSize:"14px", color:sc }}>{score}</span>
                    </td>
                    <td style={{ ...TD, fontSize:"12px", color:"#5A6470", maxWidth:"220px" }}>{razon}</td>
                    <td style={{ ...TD, fontFamily:"'Space Mono', monospace", fontSize:"12px", color:"#FFFFFF" }}>{entrada}</td>
                    <td style={{ ...TD, fontFamily:"'Space Mono', monospace", fontSize:"12px", color:"#FF3D71" }}>{stop}</td>
                    <td style={{ ...TD, fontFamily:"'Space Mono', monospace", fontSize:"12px", color:"#00E676" }}>{objetivo}</td>
                    <td style={{ ...TD }}>
                      <button onClick={() => alert(`${ticker} publicado en Telegram ✅`)} style={{ fontSize:"11px", padding:"4px 10px", borderRadius:"4px", background:"rgba(0,200,255,0.08)", color:"#00C8FF", border:"1px solid rgba(0,200,255,0.15)", cursor:"pointer", whiteSpace:"nowrap" }}>Publicar Telegram</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Fuentes */}
      {tab === "Fuentes" && (
        <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
          {fuentes.map(({ nombre,descripcion,estado,color }) => (
            <div key={nombre} style={{ ...CARD, padding:"16px 20px", display:"flex", alignItems:"center", gap:"16px" }}>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:"14px", fontWeight:600, color:"#FFFFFF", marginBottom:"3px" }}>{nombre}</div>
                <div style={{ fontSize:"12px", color:"#5A6470" }}>{descripcion}</div>
              </div>
              <span style={{ fontSize:"11px", fontWeight:600, padding:"4px 10px", borderRadius:"4px", color, background:`${color}12`, border:`1px solid ${color}30`, whiteSpace:"nowrap" }}>{estado}</span>
              {estado === "PENDIENTE" && (
                <span style={{ fontSize:"12px", color:"#5A6470", cursor:"pointer", textDecoration:"underline" }}>Registrarse →</span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Screeners */}
      {tab === "Screeners" && (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px" }}>
          {screeners.map(({ nombre,descripcion },i) => (
            <div key={nombre} style={{ ...CARD, padding:"16px 20px", display:"flex", flexDirection:"column", gap:"8px" }}>
              <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
                <span style={{ fontFamily:"'Space Mono', monospace", fontSize:"11px", color:"#5A6470" }}>{String(i+1).padStart(2,"0")}</span>
                <span style={{ fontSize:"13px", fontWeight:600, color:"#FFFFFF" }}>{nombre}</span>
              </div>
              <p style={{ fontSize:"12px", color:"#5A6470" }}>{descripcion}</p>
              <button style={{ marginTop:"4px", padding:"7px 14px", borderRadius:"4px", background:"rgba(0,200,255,0.08)", color:"#00C8FF", border:"1px solid rgba(0,200,255,0.15)", fontSize:"12px", cursor:"pointer", textAlign:"left" as const }}>Abrir en Finviz →</button>
            </div>
          ))}
        </div>
      )}

      {/* Suscriptores */}
      {tab === "Suscriptores" && (
        <div style={{ display:"flex", flexDirection:"column", gap:"24px" }}>
          {/* Planes */}
          <div>
            <p style={{ ...LABEL, marginBottom:"14px" }}>Planes de suscripción</p>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"12px" }}>
              {planes.map(({ nombre,precio,features,color }) => (
                <div key={nombre} style={{ ...CARD, padding:"20px", borderColor: nombre==="TRADER" ? "rgba(0,200,255,0.25)" : "rgba(255,255,255,0.06)" }}>
                  <p style={{ fontSize:"12px", fontWeight:600, color, marginBottom:"6px" }}>{nombre}</p>
                  <p style={{ fontFamily:"'Space Mono', monospace", fontWeight:700, fontSize:"20px", color:"#FFFFFF", marginBottom:"14px" }}>{precio}</p>
                  <ul style={{ listStyle:"none", display:"flex", flexDirection:"column", gap:"7px" }}>
                    {features.map(f => (
                      <li key={f} style={{ fontSize:"12px", color:"#5A6470", display:"flex", gap:"6px" }}>
                        <span style={{ color }}>—</span>{f}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Fases de desarrollo */}
          <div>
            <p style={{ ...LABEL, marginBottom:"14px" }}>Fases de desarrollo</p>
            <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
              {fases.map(({ fase,descripcion,pct,color }) => (
                <div key={fase} style={{ ...CARD, padding:"14px 18px" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"8px" }}>
                    <div>
                      <span style={{ fontSize:"12px", fontWeight:600, color:"#FFFFFF", marginRight:"10px" }}>{fase}</span>
                      <span style={{ fontSize:"12px", color:"#5A6470" }}>{descripcion}</span>
                    </div>
                    <span style={{ fontFamily:"'Space Mono', monospace", fontWeight:700, fontSize:"13px", color }}>{pct}%</span>
                  </div>
                  <div style={{ background:"rgba(255,255,255,0.06)", borderRadius:"3px", height:"3px" }}>
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
