"use client";

import { useState, useEffect } from "react";
import { Target, Calculator, BookOpen, TrendingUp, Plus, Trash2, Info, Shield } from "lucide-react";

type Firma = "FTMO" | "Apex" | "TopStep" | "E8" | "Custom";
type Direccion = "LONG" | "SHORT";

interface FondeoConfig {
  firma: Firma;
  fase: 1 | 2;
  balance: number;
  target_pct: number;
  daily_loss_pct: number;
  drawdown_pct: number;
  min_dias: number;
  instrumento_rec: string;
  inicio: string;
}

interface Trade {
  id: string;
  fecha: string;
  instrumento: string;
  direccion: Direccion;
  entrada: number;
  salida: number;
  stop: number;
  pnl: number;
  notas: string;
}

const PRESETS: Record<Firma, Omit<FondeoConfig, "firma" | "fase" | "inicio">> = {
  FTMO:    { balance: 10000, target_pct: 10, daily_loss_pct: 5,   drawdown_pct: 10, min_dias: 4, instrumento_rec: "EUR/USD, XAU/USD, DAX" },
  Apex:    { balance: 25000, target_pct: 6,  daily_loss_pct: 2,   drawdown_pct: 4,  min_dias: 0, instrumento_rec: "MES (mini S&P500), MNQ" },
  TopStep: { balance: 50000, target_pct: 6,  daily_loss_pct: 4,   drawdown_pct: 5,  min_dias: 5, instrumento_rec: "ES, NQ, CL, GC" },
  E8:      { balance: 25000, target_pct: 8,  daily_loss_pct: 5,   drawdown_pct: 8,  min_dias: 0, instrumento_rec: "EUR/USD, GBP/USD, XAU/USD" },
  Custom:  { balance: 10000, target_pct: 10, daily_loss_pct: 5,   drawdown_pct: 10, min_dias: 5, instrumento_rec: "EUR/USD" },
};

const FIRMA_INFO: Record<Firma, { region: string; fases: string; ventaja: string; dificultad: string }> = {
  FTMO:    { region: "🇨🇿 Rep. Checa",  fases: "Fase 1 (10%) + Fase 2 (5%)",         ventaja: "La más popular en Europa, paga 80-90%. Ideal Forex/Metales/Índices EU.",     dificultad: "Media-Alta" },
  Apex:    { region: "🇺🇸 USA",          fases: "Solo 1 fase (6%) — la más fácil",    ventaja: "1 sola fase, sin tiempo mínimo, reinicios baratos. Perfecta para empezar.",  dificultad: "Baja" },
  TopStep: { region: "🇺🇸 USA",          fases: "Trading Combine (días limitados)",    ventaja: "Pionera en futuros US. Referente para traders de ES/NQ profesionales.",       dificultad: "Media" },
  E8:      { region: "🇪🇺 Europa",       fases: "Fase 1 (8%) + Fase 2 (5%)",         ventaja: "Sin restricciones de noticias, sin días mínimos. Ideal para swing trading.",   dificultad: "Media" },
  Custom:  { region: "—",                fases: "Personalizado",                       ventaja: "Configura las reglas de cualquier firma manualmente.",                          dificultad: "—" },
};

const FUTURES_PV: Record<string, number> = { ES: 50, MES: 5, NQ: 20, MNQ: 2, CL: 1000, GC: 100, YM: 5, RTY: 50 };

const STORAGE_KEY = "raxislab_fondeo_v1";

const DEFAULT_CONFIG: FondeoConfig = { firma: "FTMO", fase: 1, inicio: new Date().toISOString().slice(0, 10), ...PRESETS.FTMO };

const CARD: React.CSSProperties = { background: "var(--card)", border: "1px solid var(--border)", borderRadius: "12px", padding: "20px" };
const LBL: React.CSSProperties  = { fontSize: "11px", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: "var(--text-muted)", marginBottom: "5px", display: "block" };
const INP: React.CSSProperties  = { width: "100%", padding: "8px 11px", borderRadius: "6px", border: "1px solid var(--border)", background: "var(--bg)", color: "var(--text)", fontSize: "13px", outline: "none", boxSizing: "border-box" as const };

function today() { return new Date().toISOString().slice(0, 10); }
function fmtUSD(n: number) { return (n >= 0 ? "+" : "-") + "$" + Math.abs(n).toFixed(0); }

export default function FondeoPage() {
  const [tab, setTab]   = useState<"cuenta" | "calc" | "diario" | "progreso">("cuenta");
  const [cfg, setCfg]   = useState<FondeoConfig>(DEFAULT_CONFIG);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [saved, setSaved]   = useState(false);

  // Calculator
  const [cTipo,    setCTipo]    = useState<"Forex" | "Futuros">("Forex");
  const [cInstr,   setCInstr]   = useState("EUR/USD");
  const [cBalance, setCBalance] = useState(10000);
  const [cRisk,    setCRisk]    = useState(1);
  const [cEntry,   setCEntry]   = useState(0);
  const [cStop,    setCStop]    = useState(0);
  const [cTarget,  setCTarget]  = useState(0);

  // New trade form
  const [form, setForm]           = useState<Partial<Trade>>({ fecha: today(), direccion: "LONG", instrumento: "EUR/USD" });
  const [showForm, setShowForm]   = useState(false);

  useEffect(() => {
    try {
      const s = localStorage.getItem(STORAGE_KEY);
      if (s) { const { c, t } = JSON.parse(s); if (c) { setCfg(c); setCBalance(c.balance); } if (t) setTrades(t); }
    } catch {}
  }, []);

  function persist(c: FondeoConfig, t: Trade[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ c, t }));
    setSaved(true); setTimeout(() => setSaved(false), 1800);
  }

  function updateCfg(patch: Partial<FondeoConfig>) {
    const next = { ...cfg, ...patch }; setCfg(next); persist(next, trades);
  }

  function applyFirma(firma: Firma) {
    const p = PRESETS[firma]; const next = { ...cfg, firma, ...p };
    setCfg(next); setCBalance(p.balance); persist(next, trades);
  }

  function addTrade() {
    if (!form.pnl || !form.entrada) return;
    const t: Trade = { id: Date.now().toString(), fecha: form.fecha ?? today(), instrumento: form.instrumento ?? "EUR/USD", direccion: form.direccion as Direccion ?? "LONG", entrada: Number(form.entrada), salida: Number(form.salida ?? 0), stop: Number(form.stop ?? 0), pnl: Number(form.pnl), notas: form.notas ?? "" };
    const next = [t, ...trades]; setTrades(next); persist(cfg, next);
    setForm({ fecha: today(), direccion: "LONG", instrumento: "EUR/USD" }); setShowForm(false);
  }

  function delTrade(id: string) { const next = trades.filter(t => t.id !== id); setTrades(next); persist(cfg, next); }

  // ── Stats ────────────────────────────────────────────────────────
  const pnlTotal    = trades.reduce((s, t) => s + t.pnl, 0);
  const targetAmt   = cfg.balance * cfg.target_pct / 100;
  const dailyLim    = cfg.balance * cfg.daily_loss_pct / 100;
  const pnlToday    = trades.filter(t => t.fecha === today()).reduce((s, t) => s + t.pnl, 0);
  const days        = new Set(trades.map(t => t.fecha)).size;
  const winners     = trades.filter(t => t.pnl > 0);
  const losers      = trades.filter(t => t.pnl < 0);
  const winRate     = trades.length ? Math.round(winners.length / trades.length * 100) : 0;
  const dailyUsedPct = Math.min(100, Math.abs(Math.min(0, pnlToday)) / dailyLim * 100);
  const progressPct = Math.min(100, Math.max(0, (pnlTotal / targetAmt) * 100));

  // Trailing drawdown
  let runPnl = 0, peak = 0, maxDD = 0;
  [...trades].reverse().forEach(t => { runPnl += t.pnl; if (runPnl > peak) peak = runPnl; const dd = peak - runPnl; if (dd > maxDD) maxDD = dd; });
  const ddPct    = (maxDD / cfg.balance) * 100;
  const estado   = ddPct >= cfg.drawdown_pct * 0.8 || dailyUsedPct >= 80 ? "PELIGRO" : ddPct >= cfg.drawdown_pct * 0.5 || dailyUsedPct >= 50 ? "PRECAUCIÓN" : "OK";
  const stColor  = estado === "OK" ? "var(--green)" : estado === "PRECAUCIÓN" ? "var(--amber)" : "var(--red)";

  // ── Calculator ────────────────────────────────────────────────────
  let calcResult: { size: string; riskUSD: number; rrRatio?: number } | null = null;
  if (cEntry > 0 && cStop > 0 && cEntry !== cStop) {
    const riskUSD = cBalance * cRisk / 100;
    if (cTipo === "Forex") {
      const pips = Math.abs(cEntry - cStop) * 10000;
      const lots = riskUSD / (pips * 10);
      const rr   = cTarget > 0 ? Math.abs(cTarget - cEntry) / Math.abs(cStop - cEntry) : undefined;
      calcResult = { size: `${lots.toFixed(2)} lotes · ${(lots * 10).toFixed(1)} mini · ${(lots * 100).toFixed(0)} micro`, riskUSD, rrRatio: rr };
    } else {
      const pv   = FUTURES_PV[cInstr] ?? 50;
      const pts  = Math.abs(cEntry - cStop);
      const ctrs = Math.floor(riskUSD / (pts * pv));
      const rr   = cTarget > 0 ? Math.abs(cTarget - cEntry) / Math.abs(cStop - cEntry) : undefined;
      calcResult = { size: `${ctrs} contrato${ctrs !== 1 ? "s" : ""} ($${(pts * pv).toFixed(0)}/cto)`, riskUSD: ctrs * pts * pv, rrRatio: rr };
    }
  }

  const TABS = [
    { id: "cuenta",   label: "Cuenta",      Icon: Shield     },
    { id: "calc",     label: "Calculadora", Icon: Calculator },
    { id: "diario",   label: "Diario",      Icon: BookOpen   },
    { id: "progreso", label: "Progreso",    Icon: TrendingUp },
  ] as const;

  return (
    <div style={{ padding: "32px 40px", maxWidth: "1200px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "28px" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: 600, color: "var(--text)", margin: 0 }}>Fondeo</h1>
          <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: "4px 0 0" }}>
            {cfg.firma} · Fase {cfg.fase} · ${cfg.balance.toLocaleString()} · {trades.length > 0 ? fmtUSD(pnlTotal) + " total" : "Sin operaciones aún"}
          </p>
        </div>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          {saved && <span style={{ fontSize: "12px", color: "var(--green)", fontWeight: 600 }}>✓ Guardado</span>}
          <span style={{ padding: "5px 14px", borderRadius: "999px", fontSize: "11px", fontWeight: 700, background: `${stColor}18`, color: stColor, border: `1px solid ${stColor}44` }}>
            {estado === "OK" ? "✓ OK" : estado === "PRECAUCIÓN" ? "⚠ PRECAUCIÓN" : "⛔ PELIGRO"}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "4px", marginBottom: "24px", borderBottom: "1px solid var(--border)" }}>
        {TABS.map(({ id, label, Icon }) => (
          <button key={id} onClick={() => setTab(id)} style={{
            display: "flex", alignItems: "center", gap: "7px", padding: "9px 18px",
            borderRadius: "6px 6px 0 0", border: "1px solid transparent",
            borderBottom: tab === id ? "1px solid var(--card)" : "1px solid transparent",
            background: tab === id ? "var(--card)" : "transparent",
            color: tab === id ? "var(--accent)" : "var(--text-muted)",
            fontSize: "13px", fontWeight: tab === id ? 600 : 400, cursor: "pointer",
            fontFamily: "'Space Grotesk', sans-serif", marginBottom: tab === id ? "-1px" : "0",
          }}>
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {/* ══════ TAB: CUENTA ══════ */}
      {tab === "cuenta" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={CARD}>
              <h3 style={{ fontSize: "14px", fontWeight: 600, color: "var(--text)", margin: "0 0 14px" }}>Firma de Fondeo</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "14px" }}>
                {(["FTMO", "Apex", "TopStep", "E8", "Custom"] as Firma[]).map(f => (
                  <button key={f} onClick={() => applyFirma(f)} style={{
                    padding: "10px 8px", borderRadius: "8px", cursor: "pointer",
                    border: cfg.firma === f ? "1px solid var(--accent)" : "1px solid var(--border)",
                    background: cfg.firma === f ? "var(--accent-dim)" : "var(--bg)",
                    color: cfg.firma === f ? "var(--accent)" : "var(--text-muted)",
                    fontSize: "12px", fontWeight: 600, fontFamily: "'Space Grotesk', sans-serif",
                  }}>{f}</button>
                ))}
              </div>
              {cfg.firma !== "Custom" && (
                <div style={{ padding: "12px", background: "var(--bg)", borderRadius: "8px", border: "1px solid var(--border)", fontSize: "12px", color: "var(--text-mid)", lineHeight: 1.6 }}>
                  <div style={{ fontWeight: 600, marginBottom: "4px" }}>{FIRMA_INFO[cfg.firma].region} · {FIRMA_INFO[cfg.firma].fases}</div>
                  <div>{FIRMA_INFO[cfg.firma].ventaja}</div>
                  <div style={{ marginTop: "4px", color: "var(--text-muted)" }}>Dificultad: {FIRMA_INFO[cfg.firma].dificultad}</div>
                </div>
              )}
            </div>

            <div style={CARD}>
              <h3 style={{ fontSize: "14px", fontWeight: 600, color: "var(--text)", margin: "0 0 14px" }}>Configuración</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <div><span style={LBL}>Fase</span>
                    <select value={cfg.fase} onChange={e => updateCfg({ fase: Number(e.target.value) as 1|2 })} style={INP}>
                      <option value={1}>Fase 1 — Evaluación</option>
                      <option value={2}>Fase 2 — Verificación</option>
                    </select>
                  </div>
                  <div><span style={LBL}>Inicio</span>
                    <input type="date" value={cfg.inicio} onChange={e => updateCfg({ inicio: e.target.value })} style={INP}/>
                  </div>
                </div>
                <div><span style={LBL}>Balance ($)</span>
                  <input type="number" value={cfg.balance} onChange={e => updateCfg({ balance: Number(e.target.value) })} style={INP}/>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
                  <div><span style={LBL}>Target %</span>
                    <input type="number" step={0.5} value={cfg.target_pct} onChange={e => updateCfg({ target_pct: Number(e.target.value) })} style={INP}/>
                  </div>
                  <div><span style={LBL}>Daily Loss %</span>
                    <input type="number" step={0.5} value={cfg.daily_loss_pct} onChange={e => updateCfg({ daily_loss_pct: Number(e.target.value) })} style={INP}/>
                  </div>
                  <div><span style={LBL}>Max DD %</span>
                    <input type="number" step={0.5} value={cfg.drawdown_pct} onChange={e => updateCfg({ drawdown_pct: Number(e.target.value) })} style={INP}/>
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <div><span style={LBL}>Días mínimos</span>
                    <input type="number" value={cfg.min_dias} onChange={e => updateCfg({ min_dias: Number(e.target.value) })} style={INP}/>
                  </div>
                  <div><span style={LBL}>Instrumentos</span>
                    <input value={cfg.instrumento_rec} onChange={e => updateCfg({ instrumento_rec: e.target.value })} style={INP}/>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Plan de aprendizaje */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={CARD}>
              <h3 style={{ fontSize: "14px", fontWeight: 600, color: "var(--text)", margin: "0 0 14px" }}>Plan de Aprendizaje — {cfg.firma}</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "9px" }}>
                {[
                  { n: "1", t: "Risk Management (CRÍTICO)", c: "var(--red)",
                    d: `Máx 0.5–1% de riesgo por operación. Daily limit = $${(cfg.balance * cfg.daily_loss_pct / 100).toFixed(0)}. Si pierdes 50% del límite diario, para el día.` },
                  { n: "2", t: "Sesiones de mercado", c: "var(--accent)",
                    d: cfg.firma === "TopStep" || cfg.firma === "Apex"
                      ? "ES/NQ: apertura NY 09:30–11:30 ET (15:30–17:30 Madrid) + cierre 15:00–16:00 ET. Evitar mediodía (12–14h ET)."
                      : "EUR/USD: London open 09:00–11:00 CET + NY open 15:30–17:00 CET. Evitar Asia y horas muertas." },
                  { n: "3", t: "Gestión de noticias macro", c: "var(--amber)",
                    d: "Cerrar posiciones 30 min ANTES de NFP (1er viernes mes), CPI (2ª semana), FOMC (cada 6-7 sem), discursos Fed. Sin excepciones." },
                  { n: "4", t: "Consistencia > performance", c: "var(--green)",
                    d: `Una pérdida grande borra muchos días. Target: +${(cfg.balance * cfg.target_pct / 100 / 20).toFixed(0)}/día consistente > intentar +$${(cfg.balance * cfg.target_pct / 100 / 5).toFixed(0)} en un día.` },
                  { n: "5", t: cfg.firma === "FTMO" || cfg.firma === "E8" ? "Conceptos Forex" : "Conceptos Futuros", c: "var(--text-muted)",
                    d: cfg.firma === "FTMO" || cfg.firma === "E8"
                      ? "Pips, lots, spreads. Order Blocks (ICT), liquidity sweeps, Fair Value Gaps. EMA 20/50/200. Correlaciones EUR↔GBP."
                      : "Puntos vs ticks, point value. MES = $5/pt, ES = $50/pt. Margin intraday. Rollover trimestral de contratos." },
                  { n: "6", t: "Journaling diario", c: "var(--accent)",
                    d: "Registra CADA operación en el Diario: entrada, stop, target, P&L, qué funcionó. Revisión semanal cada viernes." },
                ].map(({ n, t, c, d }) => (
                  <div key={n} style={{ display: "flex", gap: "11px", padding: "10px 12px", background: "var(--bg)", borderRadius: "8px", border: "1px solid var(--border)" }}>
                    <span style={{ width: "22px", height: "22px", borderRadius: "50%", background: `${c}18`, color: c, border: `1px solid ${c}44`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 700, flexShrink: 0 }}>{n}</span>
                    <div>
                      <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--text)", marginBottom: "3px" }}>{t}</div>
                      <div style={{ fontSize: "12px", color: "var(--text-muted)", lineHeight: 1.5 }}>{d}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ ...CARD, background: "rgba(0,200,100,0.04)", border: "1px solid rgba(0,200,100,0.2)" }}>
              <div style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
                <Info size={14} color="var(--green)" style={{ flexShrink: 0, marginTop: "1px" }}/>
                <div style={{ fontSize: "12px", color: "var(--text-muted)", lineHeight: 1.6 }}>
                  <strong style={{ color: "var(--green)" }}>Regla de oro:</strong> El objetivo no es ganar rápido — es demostrar disciplina sistémica.
                  Un trader que hace <strong style={{ color: "var(--text)" }}>+0.5% consistente con bajo drawdown</strong> pasa el desafío.
                  Uno que busca +5% en un día casi siempre viola el daily loss.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════ TAB: CALCULADORA ══════ */}
      {tab === "calc" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
          <div style={CARD}>
            <h3 style={{ fontSize: "14px", fontWeight: 600, color: "var(--text)", margin: "0 0 16px" }}>Calculadora de Posición</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <span style={LBL}>Tipo de instrumento</span>
                <div style={{ display: "flex", gap: "8px" }}>
                  {(["Forex", "Futuros"] as const).map(tipo => (
                    <button key={tipo} onClick={() => { setCTipo(tipo); setCInstr(tipo === "Forex" ? "EUR/USD" : "ES"); }}
                      style={{ flex: 1, padding: "9px", borderRadius: "6px", cursor: "pointer", border: cTipo === tipo ? "1px solid var(--accent)" : "1px solid var(--border)", background: cTipo === tipo ? "var(--accent-dim)" : "var(--bg)", color: cTipo === tipo ? "var(--accent)" : "var(--text-muted)", fontSize: "13px", fontWeight: 600, fontFamily: "'Space Grotesk', sans-serif" }}>
                      {tipo}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div><span style={LBL}>Instrumento</span>
                  <select value={cInstr} onChange={e => setCInstr(e.target.value)} style={INP}>
                    {cTipo === "Forex"
                      ? ["EUR/USD","GBP/USD","USD/JPY","AUD/USD","USD/CAD","XAU/USD"].map(s => <option key={s}>{s}</option>)
                      : ["ES","MES","NQ","MNQ","CL","GC","YM","RTY"].map(s => <option key={s}>{s}</option>)
                    }
                  </select>
                </div>
                <div><span style={LBL}>Balance ($)</span>
                  <input type="number" value={cBalance} onChange={e => setCBalance(Number(e.target.value))} style={INP}/>
                </div>
              </div>
              <div>
                <span style={LBL}>Riesgo por operación (%)</span>
                <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                  <input type="range" min={0.1} max={2} step={0.1} value={cRisk} onChange={e => setCRisk(Number(e.target.value))} style={{ flex: 1 }}/>
                  <span style={{ fontSize: "15px", fontWeight: 700, color: "var(--accent)", fontFamily: "monospace", minWidth: "36px" }}>{cRisk}%</span>
                </div>
                <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>
                  = ${(cBalance * cRisk / 100).toFixed(0)} en riesgo · Daily limit ${(cfg.balance * cfg.daily_loss_pct / 100).toFixed(0)} → máx {Math.floor(cfg.daily_loss_pct / cRisk)} ops/día
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div><span style={LBL}>Precio entrada</span>
                  <input type="number" step={cTipo === "Forex" ? 0.00001 : 0.25} value={cEntry || ""} onChange={e => setCEntry(Number(e.target.value))} style={INP} placeholder="0.00000"/>
                </div>
                <div><span style={LBL}>Stop Loss</span>
                  <input type="number" step={cTipo === "Forex" ? 0.00001 : 0.25} value={cStop || ""} onChange={e => setCStop(Number(e.target.value))} style={INP} placeholder="0.00000"/>
                </div>
              </div>
              <div><span style={LBL}>Target (opcional — para R:R)</span>
                <input type="number" step={cTipo === "Forex" ? 0.00001 : 0.25} value={cTarget || ""} onChange={e => setCTarget(Number(e.target.value))} style={INP} placeholder="Precio objetivo"/>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {calcResult ? (
              <div style={{ ...CARD, border: "1px solid var(--accent)" }}>
                <h3 style={{ fontSize: "14px", fontWeight: 600, color: "var(--accent)", margin: "0 0 16px" }}>Resultado</h3>
                <div style={{ padding: "18px", background: "var(--accent-dim)", borderRadius: "8px", textAlign: "center", marginBottom: "14px" }}>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "6px" }}>TAMAÑO DE POSICIÓN</div>
                  <div style={{ fontSize: "18px", fontWeight: 700, color: "var(--accent)", fontFamily: "monospace" }}>{calcResult.size}</div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: calcResult.rrRatio ? "1fr 1fr" : "1fr", gap: "10px" }}>
                  <div style={{ padding: "12px", background: "var(--bg)", borderRadius: "8px", border: "1px solid var(--border)" }}>
                    <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "4px" }}>RIESGO REAL</div>
                    <div style={{ fontSize: "17px", fontWeight: 600, color: "var(--red)", fontFamily: "monospace" }}>-${calcResult.riskUSD.toFixed(0)}</div>
                  </div>
                  {calcResult.rrRatio && (
                    <div style={{ padding: "12px", background: "var(--bg)", borderRadius: "8px", border: "1px solid var(--border)" }}>
                      <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "4px" }}>R:R RATIO</div>
                      <div style={{ fontSize: "17px", fontWeight: 600, fontFamily: "monospace", color: calcResult.rrRatio >= 1.5 ? "var(--green)" : calcResult.rrRatio >= 1 ? "var(--amber)" : "var(--red)" }}>1:{calcResult.rrRatio.toFixed(2)}</div>
                    </div>
                  )}
                </div>
                <div style={{ marginTop: "12px", padding: "10px 12px", background: "var(--bg)", borderRadius: "6px", border: "1px solid var(--border)", fontSize: "12px", color: "var(--text-muted)" }}>
                  {cTipo === "Forex"
                    ? `Stop: ${(Math.abs(cEntry - cStop) * 10000).toFixed(1)} pips${cTarget > 0 ? ` · Target: ${(Math.abs(cTarget - cEntry) * 10000).toFixed(1)} pips` : ""} · $10/pip por lote`
                    : `Stop: ${Math.abs(cEntry - cStop).toFixed(2)} pts × $${FUTURES_PV[cInstr] ?? 50}/pt${cTarget > 0 ? ` · Target: ${Math.abs(cTarget - cEntry).toFixed(2)} pts` : ""}`
                  }
                </div>
              </div>
            ) : (
              <div style={{ ...CARD, display: "flex", alignItems: "center", justifyContent: "center", minHeight: "180px" }}>
                <p style={{ color: "var(--text-muted)", fontSize: "13px" }}>Introduce entrada y stop para calcular</p>
              </div>
            )}
            <div style={CARD}>
              <h3 style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)", margin: "0 0 12px" }}>Ops máximas/día según riesgo ({cfg.firma})</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {[0.5, 1, 1.5, 2].map(r => (
                  <div key={r} style={{ display: "flex", justifyContent: "space-between", padding: "7px 10px", background: "var(--bg)", borderRadius: "5px", border: "1px solid var(--border)", fontSize: "12px" }}>
                    <span style={{ color: "var(--text-muted)" }}>Riesgo {r}% = ${(cfg.balance * r / 100).toFixed(0)}/op</span>
                    <span style={{ color: r <= 1 ? "var(--green)" : r <= 1.5 ? "var(--amber)" : "var(--red)", fontWeight: 600 }}>{Math.floor(cfg.daily_loss_pct / r)} ops máx/día</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════ TAB: DIARIO ══════ */}
      {tab === "diario" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: "13px", color: "var(--text-muted)" }}>
              {trades.length} ops · Hoy: <span style={{ color: pnlToday >= 0 ? "var(--green)" : "var(--red)", fontWeight: 600 }}>{fmtUSD(pnlToday)}</span>
              {" "}({(Math.abs(Math.min(0, pnlToday)) / dailyLim * 100).toFixed(0)}% del daily limit)
            </div>
            <button onClick={() => setShowForm(!showForm)} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 16px", borderRadius: "6px", background: "var(--accent)", color: "#000", border: "none", cursor: "pointer", fontSize: "13px", fontWeight: 600 }}>
              <Plus size={14}/> Nueva operación
            </button>
          </div>

          {showForm && (
            <div style={{ ...CARD, border: "1px solid var(--accent)" }}>
              <h3 style={{ fontSize: "14px", fontWeight: 600, color: "var(--text)", margin: "0 0 14px" }}>Registrar operación</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px", marginBottom: "10px" }}>
                <div><span style={LBL}>Fecha</span><input type="date" value={form.fecha} onChange={e => setForm(p => ({ ...p, fecha: e.target.value }))} style={INP}/></div>
                <div><span style={LBL}>Instrumento</span><input value={form.instrumento ?? ""} onChange={e => setForm(p => ({ ...p, instrumento: e.target.value }))} style={INP} placeholder="EUR/USD"/></div>
                <div><span style={LBL}>Dirección</span>
                  <select value={form.direccion} onChange={e => setForm(p => ({ ...p, direccion: e.target.value as Direccion }))} style={INP}>
                    <option value="LONG">LONG</option><option value="SHORT">SHORT</option>
                  </select>
                </div>
                <div><span style={LBL}>P&L ($)</span>
                  <input type="number" step={0.01} value={form.pnl ?? ""} onChange={e => setForm(p => ({ ...p, pnl: Number(e.target.value) }))} style={{ ...INP, color: (Number(form.pnl ?? 0)) >= 0 ? "var(--green)" : "var(--red)" }} placeholder="±100.00"/>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px", marginBottom: "10px" }}>
                <div><span style={LBL}>Entrada</span><input type="number" step={0.00001} value={form.entrada ?? ""} onChange={e => setForm(p => ({ ...p, entrada: Number(e.target.value) }))} style={INP} placeholder="0.00000"/></div>
                <div><span style={LBL}>Salida</span><input type="number" step={0.00001} value={form.salida ?? ""} onChange={e => setForm(p => ({ ...p, salida: Number(e.target.value) }))} style={INP} placeholder="0.00000"/></div>
                <div><span style={LBL}>Stop inicial</span><input type="number" step={0.00001} value={form.stop ?? ""} onChange={e => setForm(p => ({ ...p, stop: Number(e.target.value) }))} style={INP} placeholder="0.00000"/></div>
              </div>
              <div style={{ marginBottom: "12px" }}><span style={LBL}>Notas</span><input value={form.notas ?? ""} onChange={e => setForm(p => ({ ...p, notas: e.target.value }))} style={INP} placeholder="Setup, contexto..."/></div>
              <div style={{ display: "flex", gap: "8px" }}>
                <button onClick={addTrade} style={{ padding: "8px 20px", borderRadius: "6px", background: "var(--accent)", color: "#000", border: "none", cursor: "pointer", fontSize: "13px", fontWeight: 600 }}>Guardar</button>
                <button onClick={() => setShowForm(false)} style={{ padding: "8px 14px", borderRadius: "6px", background: "var(--bg)", color: "var(--text-muted)", border: "1px solid var(--border)", cursor: "pointer", fontSize: "13px" }}>Cancelar</button>
              </div>
            </div>
          )}

          {trades.length === 0 ? (
            <div style={{ ...CARD, textAlign: "center", padding: "52px" }}>
              <BookOpen size={36} color="var(--text-muted)" style={{ marginBottom: "12px", opacity: 0.5 }}/>
              <p style={{ color: "var(--text-muted)", fontSize: "14px", margin: 0 }}>Sin operaciones registradas</p>
              <p style={{ color: "var(--text-muted)", fontSize: "12px", margin: "6px 0 0" }}>Añade tu primera operación cuando empieces el desafío</p>
            </div>
          ) : (
            <div style={{ ...CARD, padding: 0, overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border)" }}>
                    {["Fecha","Instrumento","Dir","Entrada","Salida","P&L ($)","R:R","Notas",""].map(h => (
                      <th key={h} style={{ padding: "10px 12px", textAlign: "left", color: "var(--text-muted)", fontWeight: 600, fontSize: "11px" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {trades.map(t => {
                    const risk = t.stop > 0 && t.entrada > 0 ? Math.abs(t.entrada - t.stop) : 0;
                    const rwd  = t.salida > 0 && t.entrada > 0 ? Math.abs(t.salida - t.entrada) : 0;
                    const rr   = risk > 0 ? (rwd / risk).toFixed(2) : "—";
                    return (
                      <tr key={t.id} style={{ borderBottom: "1px solid var(--border)", background: t.pnl > 0 ? "rgba(0,200,100,0.03)" : t.pnl < 0 ? "rgba(255,50,50,0.03)" : "transparent" }}>
                        <td style={{ padding: "8px 12px", color: "var(--text-muted)" }}>{t.fecha}</td>
                        <td style={{ padding: "8px 12px", fontWeight: 600, fontFamily: "monospace" }}>{t.instrumento}</td>
                        <td style={{ padding: "8px 12px" }}>
                          <span style={{ padding: "2px 8px", borderRadius: "4px", fontSize: "10px", fontWeight: 700, background: t.direccion === "LONG" ? "rgba(0,200,100,0.12)" : "rgba(255,50,50,0.12)", color: t.direccion === "LONG" ? "var(--green)" : "var(--red)" }}>{t.direccion}</span>
                        </td>
                        <td style={{ padding: "8px 12px", fontFamily: "monospace" }}>{t.entrada.toFixed(5)}</td>
                        <td style={{ padding: "8px 12px", fontFamily: "monospace" }}>{t.salida > 0 ? t.salida.toFixed(5) : "—"}</td>
                        <td style={{ padding: "8px 12px", fontWeight: 700, fontFamily: "monospace", color: t.pnl > 0 ? "var(--green)" : t.pnl < 0 ? "var(--red)" : "var(--text-muted)" }}>{fmtUSD(t.pnl)}</td>
                        <td style={{ padding: "8px 12px", fontFamily: "monospace", color: Number(rr) >= 1.5 ? "var(--green)" : "var(--text-muted)" }}>{rr}</td>
                        <td style={{ padding: "8px 12px", color: "var(--text-muted)", maxWidth: "140px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.notas || "—"}</td>
                        <td style={{ padding: "8px 10px" }}>
                          <button onClick={() => delTrade(t.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: "2px" }}><Trash2 size={12}/></button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ══════ TAB: PROGRESO ══════ */}
      {tab === "progreso" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px" }}>
            {[
              { label: "P&L Total",       value: fmtUSD(pnlTotal),                color: pnlTotal >= 0 ? "var(--green)" : "var(--red)",    sub: `${progressPct.toFixed(1)}% del target` },
              { label: "Daily Loss Hoy",  value: `${(Math.abs(Math.min(0,pnlToday))/dailyLim*100).toFixed(0)}%`, color: dailyUsedPct >= 80 ? "var(--red)" : dailyUsedPct >= 50 ? "var(--amber)" : "var(--green)", sub: `${fmtUSD(pnlToday)} de -$${dailyLim.toFixed(0)}` },
              { label: "Drawdown actual", value: `${ddPct.toFixed(2)}%`,            color: ddPct >= cfg.drawdown_pct * 0.8 ? "var(--red)" : ddPct >= cfg.drawdown_pct * 0.5 ? "var(--amber)" : "var(--green)", sub: `Límite: ${cfg.drawdown_pct}%` },
              { label: "Días operados",   value: `${days}`,                         color: days >= cfg.min_dias ? "var(--green)" : "var(--text-muted)", sub: `Mín requerido: ${cfg.min_dias}` },
            ].map(({ label, value, color, sub }) => (
              <div key={label} style={CARD}>
                <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</div>
                <div style={{ fontSize: "22px", fontWeight: 700, color, fontFamily: "monospace" }}>{value}</div>
                <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "3px" }}>{sub}</div>
              </div>
            ))}
          </div>

          <div style={CARD}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
              <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)" }}>Progreso hacia el target</span>
              <span style={{ fontSize: "13px", fontFamily: "monospace", color: "var(--accent)" }}>
                {fmtUSD(pnlTotal)} / ${targetAmt.toFixed(0)} ({progressPct.toFixed(1)}%)
              </span>
            </div>
            <div style={{ height: "12px", borderRadius: "999px", overflow: "hidden", background: "var(--border)", marginBottom: "8px" }}>
              <div style={{ width: `${progressPct}%`, height: "100%", borderRadius: "999px", background: progressPct >= 100 ? "var(--green)" : "var(--accent)", transition: "width 0.4s" }}/>
            </div>
            <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
              Restante: ${Math.max(0, targetAmt - pnlTotal).toFixed(0)}
              {days > 0 && pnlTotal > 0 ? ` · Ritmo: $${(pnlTotal / days).toFixed(0)}/día → ~${Math.ceil((targetAmt - pnlTotal) / (pnlTotal / days))} días más` : ""}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div style={CARD}>
              <h3 style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)", margin: "0 0 14px" }}>Estadísticas</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "7px", fontSize: "12px" }}>
                {[
                  { l: "Operaciones",   v: `${trades.length} (${winners.length}W / ${losers.length}L)`, c: "var(--text)" },
                  { l: "Win Rate",      v: `${winRate}%`, c: winRate >= 50 ? "var(--green)" : "var(--red)" },
                  { l: "Avg ganancia",  v: winners.length ? `+$${(winners.reduce((s,t)=>s+t.pnl,0)/winners.length).toFixed(0)}` : "—", c: "var(--green)" },
                  { l: "Avg pérdida",   v: losers.length ? `-$${Math.abs(losers.reduce((s,t)=>s+t.pnl,0)/losers.length).toFixed(0)}` : "—", c: "var(--red)" },
                  { l: "Profit Factor", v: losers.length && winners.length ? (winners.reduce((s,t)=>s+t.pnl,0)/Math.abs(losers.reduce((s,t)=>s+t.pnl,0))).toFixed(2) : "—", c: "var(--accent)" },
                  { l: "Max Drawdown",  v: `-$${maxDD.toFixed(0)} (${(maxDD/cfg.balance*100).toFixed(2)}%)`, c: "var(--amber)" },
                ].map(({ l, v, c }) => (
                  <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "7px 10px", background: "var(--bg)", borderRadius: "5px", border: "1px solid var(--border)" }}>
                    <span style={{ color: "var(--text-muted)" }}>{l}</span>
                    <span style={{ color: c, fontWeight: 600, fontFamily: "monospace" }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={CARD}>
              <h3 style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)", margin: "0 0 10px" }}>Macro — Eventos recurrentes</h3>
              <div style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "10px" }}>Cierra posiciones 30 min <strong>ANTES</strong>. No-trade durante publicación.</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                {[
                  { d: "Lun",    h: "09:00 CET",  e: "PMI Manufacturero y Servicios",                  i: "medio" },
                  { d: "Mar",    h: "14:30 CET",  e: "CPI (2ª semana del mes)",                        i: "muy_alto" },
                  { d: "Mié",    h: "20:00 CET",  e: "ADP Nonfarm / FOMC (cada 6-7 semanas)",          i: "alto" },
                  { d: "Jue",    h: "14:30 CET",  e: "Jobless Claims semanales",                       i: "medio" },
                  { d: "Vie",    h: "14:30 CET",  e: "NFP (1er viernes) / PPI (2º viernes)",           i: "muy_alto" },
                  { d: "Trim.",  h: "14:30 CET",  e: "GDP Flash Estimate",                             i: "alto" },
                ].map(({ d, h, e, i }) => (
                  <div key={e} style={{ display: "flex", gap: "8px", alignItems: "center", padding: "7px 10px", background: "var(--bg)", borderRadius: "5px", border: "1px solid var(--border)", fontSize: "11px" }}>
                    <span style={{ color: "var(--text-muted)", fontWeight: 700, minWidth: "30px" }}>{d}</span>
                    <span style={{ fontFamily: "monospace", color: "var(--text-muted)", minWidth: "60px" }}>{h}</span>
                    <span style={{ flex: 1, color: "var(--text-mid)" }}>{e}</span>
                    <span style={{ padding: "2px 6px", borderRadius: "4px", fontSize: "9px", fontWeight: 700, background: i === "muy_alto" ? "rgba(255,50,50,0.15)" : i === "alto" ? "rgba(255,170,0,0.15)" : "rgba(0,100,255,0.1)", color: i === "muy_alto" ? "var(--red)" : i === "alto" ? "var(--amber)" : "var(--accent)" }}>
                      {i === "muy_alto" ? "MUY ALTO" : i === "alto" ? "ALTO" : "MEDIO"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
