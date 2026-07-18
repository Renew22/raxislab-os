"use client";

import { useState, useEffect, useRef } from "react";
import { Calculator, BookOpen, TrendingUp, Plus, Trash2, Info, Shield, Activity, BarChart2, RefreshCw, Target, Clock } from "lucide-react";

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

interface BacktestResult {
  instrument: string; strategy: string; session: string;
  pass_rate: number; total_trades: number; win_rate: number; total_r: number;
  avg_r?: number; max_dd?: number;
}
interface BacktestData {
  generated?: string;
  top_results?: BacktestResult[];
  winner?: BacktestResult;
  error?: string;
}

interface XAUSignalData {
  ts: string;
  price: number;
  signal: "LONG" | "SHORT" | "AGUARDAR";
  sr_levels: Array<{ level: number; type: "support" | "resistance" }>;
  rsi14: number | null;
  ema50: number | null;
  ema200: number | null;
  trend: "BULL" | "BEAR";
  session: string;
  error?: string;
}

interface Cuenta {
  id: string;
  nombre: string;
  firma: string;
  tipo: "Challenge" | "Funded" | "Live";
  balance: number;
  pnlHoy: number;
  pnlTotal: number;
  estado: "Activa" | "Pasada" | "Fallida";
  inicio: string;
  notas: string;
}
const CUENTAS_KEY = "raxislab_cuentas_v1";

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

function getSession(d: Date): { name: string; active: boolean; color: string } {
  const mins = d.getUTCHours() * 60 + d.getUTCMinutes();
  if (mins >= 420 && mins < 720)  return { name: "LONDON",     active: true,  color: "var(--accent)" };
  if (mins >= 300 && mins < 420)  return { name: "PRE-LONDON", active: false, color: "var(--amber)"  };
  if (mins >= 780 && mins < 1260) return { name: "NEW YORK",   active: true,  color: "var(--green)"  };
  return { name: "CERRADO", active: false, color: "var(--text-muted)" };
}

function getLondonCountdown(d: Date): string {
  const totalSecs = d.getUTCHours() * 3600 + d.getUTCMinutes() * 60 + d.getUTCSeconds();
  const open = 7 * 3600, close = 12 * 3600;
  let left: number, label: string;
  if (totalSecs >= open && totalSecs < close) {
    left = close - totalSecs; label = "Cierra en";
  } else {
    left = open - totalSecs;
    if (left < 0) left += 86400;
    label = "Abre en";
  }
  const h = Math.floor(left / 3600), m = Math.floor((left % 3600) / 60), s = left % 60;
  return `${label} ${h}h ${String(m).padStart(2,"0")}m ${String(s).padStart(2,"0")}s`;
}

export default function FondeoTab() {
  const [tab, setTab] = useState<"cuenta" | "signal" | "calc" | "diario" | "progreso" | "comparativa" | "backtest" | "protocolo" | "cuentas">("cuenta");
  const [cfg, setCfg] = useState<FondeoConfig>(DEFAULT_CONFIG);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [saved, setSaved] = useState(false);

  const [cTipo,    setCTipo]    = useState<"Forex" | "Futuros">("Forex");
  const [cInstr,   setCInstr]   = useState("XAU/USD");
  const [cBalance, setCBalance] = useState(10000);
  const [cRisk,    setCRisk]    = useState(1);
  const [cEntry,   setCEntry]   = useState(0);
  const [cStop,    setCStop]    = useState(0);
  const [cTarget,  setCTarget]  = useState(0);

  const [form, setForm]         = useState<Partial<Trade>>({ fecha: today(), direccion: "LONG", instrumento: "XAU/USD" });
  const [showForm, setShowForm] = useState(false);

  const [xauSignal,    setXauSignal]    = useState<XAUSignalData | null>(null);
  const [xauLoading,   setXauLoading]   = useState(false);
  const [backtest,     setBacktest]     = useState<BacktestData | null>(null);
  const [btLoading,    setBtLoading]    = useState(false);
  const [now, setNow] = useState(new Date());
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [cuentas, setCuentas] = useState<Cuenta[]>([]);
  const [cuentaForm, setCuentaForm] = useState<Partial<Cuenta>>({ tipo: "Challenge", estado: "Activa", inicio: today() });
  const [showCuentaForm, setShowCuentaForm] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const prevSniperRef = useRef<"red" | "yellow" | "green">("red");

  useEffect(() => {
    try {
      const s = localStorage.getItem(STORAGE_KEY);
      if (s) { const { c, t } = JSON.parse(s); if (c) { setCfg(c); setCBalance(c.balance); } if (t) setTrades(t); }
    } catch {}
    try {
      const sc = localStorage.getItem(CUENTAS_KEY);
      if (sc) setCuentas(JSON.parse(sc));
    } catch {}
  }, []);

  function playBeep(freq = 880, dur = 0.4) {
    if (typeof window === "undefined") return;
    try {
      if (!audioCtxRef.current) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const AC = window.AudioContext || (window as any).webkitAudioContext;
        if (!AC) return;
        audioCtxRef.current = new AC();
      }
      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
      osc.start(); osc.stop(ctx.currentTime + dur);
    } catch {}
  }

  useEffect(() => {
    const tick = setInterval(() => setNow(new Date()), 1000);
    fetchXAUSignal();
    fetchBacktest();
    const refresh = setInterval(fetchXAUSignal, 15000);
    return () => { clearInterval(tick); clearInterval(refresh); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!xauSignal) return;
    let lvl: "red" | "yellow" | "green" = "red";
    if (xauSignal.signal !== "AGUARDAR") lvl = "green";
    else if (xauSignal.sr_levels?.length) {
      const sorted = [...xauSignal.sr_levels].sort((a, b) => Math.abs(a.level - xauSignal.price) - Math.abs(b.level - xauSignal.price));
      if (sorted.length && Math.abs(xauSignal.price - sorted[0].level) < 8) lvl = "yellow";
    }
    if (audioEnabled && lvl !== prevSniperRef.current) {
      if (lvl === "green") { playBeep(880, 0.5); setTimeout(() => playBeep(1100, 0.3), 250); }
      else if (lvl === "yellow") playBeep(660, 0.25);
    }
    prevSniperRef.current = lvl;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [xauSignal]);

  async function fetchBacktest() {
    setBtLoading(true);
    try {
      const res = await fetch("/api/server/fondeo/backtest");
      if (res.ok) {
        const json = await res.json();
        if (json && !json.error) {
          // Hetzner usa top10/pair/trades — normalizar a top_results/instrument/total_trades
          const rawItems: Array<Record<string, unknown>> = json.top_results ?? json.top10 ?? [];
          const normalized: BacktestResult[] = rawItems.map((r) => ({
            instrument:   String(r.instrument ?? r.pair ?? ""),
            strategy:     String(r.strategy ?? ""),
            session:      String(r.session ?? ""),
            pass_rate:    Number(r.pass_rate ?? 0),
            total_trades: Number(r.total_trades ?? r.trades ?? 0),
            win_rate:     Number(r.win_rate ?? 0),
            total_r:      Number(r.total_r ?? 0),
            avg_r:        r.avg_r != null ? Number(r.avg_r) : undefined,
          }));
          setBacktest({ generated: String(json.generated ?? ""), top_results: normalized, winner: normalized[0] });
          return;
        }
      }
    } catch {}
    // Fallback: known static results from last backtest run 2026-07-07
    setBacktest({
      generated: "2026-07-07 (Hetzner offline — datos estáticos)",
      winner: { instrument: "XAUUSD", strategy: "sr_structure", session: "London", pass_rate: 90, total_trades: 49, win_rate: 49, total_r: 23, avg_r: 0.47 },
      top_results: [
        { instrument: "XAUUSD",  strategy: "sr_structure",   session: "London",  pass_rate: 90, total_trades: 49, win_rate: 49, total_r: 23, avg_r: 0.47 },
        { instrument: "NAS100",  strategy: "ema_cross",       session: "overlap", pass_rate: 75, total_trades: 37, win_rate: 54, total_r: 37, avg_r: 1.0  },
        { instrument: "XAUUSD",  strategy: "london_breakout", session: "London",  pass_rate: 75, total_trades: 41, win_rate: 46, total_r: 27, avg_r: 0.66 },
        { instrument: "EURUSD",  strategy: "sr_structure",    session: "London",  pass_rate: 60, total_trades: 38, win_rate: 50, total_r: 14, avg_r: 0.37 },
      ],
    });
    setBtLoading(false);
  }

  async function fetchXAUSignal() {
    setXauLoading(true);
    try {
      const sigRes = await fetch("/api/server/fondeo/signal").catch(() => null);
      const sigData = sigRes?.ok ? await sigRes.json().catch(() => null) : null;
      if (sigData && !sigData.error && sigData.price) { setXauSignal(sigData); return; }

      const polyRes = await fetch("/api/polygon/technicals?ticker=C:XAUUSD");
      if (polyRes.ok) {
        const p = await polyRes.json();
        setXauSignal({
          ts: new Date().toISOString(),
          price: p.price ?? 0,
          signal: "AGUARDAR",
          sr_levels: [],
          rsi14: p.rsi14 ?? null,
          ema50: p.ema50 ?? null,
          ema200: p.ema200 ?? null,
          trend: (p.trend ?? "").includes("ALCISTA") ? "BULL" : "BEAR",
          session: getSession(new Date()).name,
          error: "signal_monitor no activo — deploy pendiente en Hetzner",
        });
      }
    } catch {}
    finally { setXauLoading(false); }
  }

  function persist(c: FondeoConfig, t: Trade[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ c, t }));
    setSaved(true); setTimeout(() => setSaved(false), 1800);
  }
  function updateCfg(patch: Partial<FondeoConfig>) { const next = { ...cfg, ...patch }; setCfg(next); persist(next, trades); }
  function applyFirma(firma: Firma) { const p = PRESETS[firma]; const next = { ...cfg, firma, ...p }; setCfg(next); setCBalance(p.balance); persist(next, trades); }
  function addTrade() {
    if (!form.pnl || !form.entrada) return;
    const t: Trade = { id: Date.now().toString(), fecha: form.fecha ?? today(), instrumento: form.instrumento ?? "XAU/USD", direccion: form.direccion as Direccion ?? "LONG", entrada: Number(form.entrada), salida: Number(form.salida ?? 0), stop: Number(form.stop ?? 0), pnl: Number(form.pnl), notas: form.notas ?? "" };
    const next = [t, ...trades]; setTrades(next); persist(cfg, next);
    setForm({ fecha: today(), direccion: "LONG", instrumento: "XAU/USD" }); setShowForm(false);
  }
  function delTrade(id: string) { const next = trades.filter(t => t.id !== id); setTrades(next); persist(cfg, next); }

  function persistCuentas(c: Cuenta[]) { localStorage.setItem(CUENTAS_KEY, JSON.stringify(c)); }
  function addCuenta() {
    if (!cuentaForm.nombre || !cuentaForm.balance) return;
    const c: Cuenta = { id: Date.now().toString(), nombre: cuentaForm.nombre ?? "", firma: cuentaForm.firma ?? "FTMO", tipo: cuentaForm.tipo ?? "Challenge", balance: Number(cuentaForm.balance), pnlHoy: 0, pnlTotal: 0, estado: cuentaForm.estado ?? "Activa", inicio: cuentaForm.inicio ?? today(), notas: cuentaForm.notas ?? "" };
    const next = [c, ...cuentas]; setCuentas(next); persistCuentas(next);
    setCuentaForm({ tipo: "Challenge", estado: "Activa", inicio: today() }); setShowCuentaForm(false);
  }
  function delCuenta(id: string) { const next = cuentas.filter(c => c.id !== id); setCuentas(next); persistCuentas(next); }
  function updateCuenta(id: string, patch: Partial<Cuenta>) { const next = cuentas.map(c => c.id === id ? { ...c, ...patch } : c); setCuentas(next); persistCuentas(next); }

  const pnlTotal     = trades.reduce((s, t) => s + t.pnl, 0);
  const targetAmt    = cfg.balance * cfg.target_pct / 100;
  const dailyLim     = cfg.balance * cfg.daily_loss_pct / 100;
  const pnlToday     = trades.filter(t => t.fecha === today()).reduce((s, t) => s + t.pnl, 0);
  const days         = new Set(trades.map(t => t.fecha)).size;
  const winners      = trades.filter(t => t.pnl > 0);
  const losers       = trades.filter(t => t.pnl < 0);
  const winRate      = trades.length ? Math.round(winners.length / trades.length * 100) : 0;
  const dailyUsedPct = Math.min(100, Math.abs(Math.min(0, pnlToday)) / dailyLim * 100);
  const progressPct  = Math.min(100, Math.max(0, (pnlTotal / targetAmt) * 100));
  let runPnl = 0, peak = 0, maxDD = 0;
  [...trades].reverse().forEach(t => { runPnl += t.pnl; if (runPnl > peak) peak = runPnl; const dd = peak - runPnl; if (dd > maxDD) maxDD = dd; });
  const ddPct   = (maxDD / cfg.balance) * 100;
  const estado  = ddPct >= cfg.drawdown_pct * 0.8 || dailyUsedPct >= 80 ? "PELIGRO" : ddPct >= cfg.drawdown_pct * 0.5 || dailyUsedPct >= 50 ? "PRECAUCIÓN" : "OK";
  const stColor = estado === "OK" ? "var(--green)" : estado === "PRECAUCIÓN" ? "var(--amber)" : "var(--red)";

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

  // ── Sniper level ──
  let sniperLevel: "red" | "yellow" | "green" = "red";
  let nearestSR: { level: number; type: "support" | "resistance" } | null = null;
  let distancePips = 999;
  if (xauSignal?.price && xauSignal.sr_levels?.length) {
    const sorted = [...xauSignal.sr_levels].sort((a, b) => Math.abs(a.level - xauSignal.price) - Math.abs(b.level - xauSignal.price));
    nearestSR = sorted[0];
    distancePips = Math.abs(xauSignal.price - nearestSR.level);
    if (xauSignal.signal !== "AGUARDAR") sniperLevel = "green";
    else if (distancePips < 8) sniperLevel = "yellow";
  }
  const sniperColor   = sniperLevel === "green" ? "var(--green)" : sniperLevel === "yellow" ? "var(--amber)" : "var(--red)";
  const sniperEmoji   = sniperLevel === "green" ? "🟢" : sniperLevel === "yellow" ? "🟡" : "🔴";
  const sniperLabel   = sniperLevel === "green" ? "ZONA DE ENTRADA" : sniperLevel === "yellow" ? "APROXIMÁNDOSE" : "EN ESPERA";
  const distBarFill   = nearestSR ? Math.max(5, Math.min(97, 100 - (distancePips / 20) * 92)) : 5;

  const session   = getSession(now);
  const countdown = getLondonCountdown(now);
  const sigColor  = xauSignal?.signal === "LONG" ? "var(--green)" : xauSignal?.signal === "SHORT" ? "var(--red)" : "var(--text-muted)";
  const sigEmoji  = xauSignal?.signal === "LONG" ? "🟢" : xauSignal?.signal === "SHORT" ? "🔴" : "⚪";

  const TABS = [
    { id: "cuenta",      label: "Cuenta",      Icon: Shield     },
    { id: "signal",      label: "Señal XAU",   Icon: Activity   },
    { id: "calc",        label: "Calculadora", Icon: Calculator },
    { id: "diario",      label: "Diario",      Icon: BookOpen   },
    { id: "progreso",    label: "Progreso",    Icon: TrendingUp },
    { id: "comparativa", label: "Comparativa", Icon: BarChart2  },
    { id: "backtest",    label: "Backtest",    Icon: Target     },
    { id: "protocolo",   label: "Cuándo operar", Icon: Clock  },
    { id: "cuentas",     label: "Cuentas",       Icon: Plus   },
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
      <div style={{ display: "flex", gap: "2px", marginBottom: "24px", borderBottom: "1px solid var(--border)", flexWrap: "wrap" }}>
        {TABS.map(({ id, label, Icon }) => (
          <button key={id} onClick={() => setTab(id)} style={{
            display: "flex", alignItems: "center", gap: "7px", padding: "9px 16px",
            borderRadius: "6px 6px 0 0", border: "1px solid transparent",
            borderBottom: tab === id ? "1px solid var(--card)" : "1px solid transparent",
            background: tab === id ? "var(--card)" : "transparent",
            color: tab === id ? "var(--accent)" : "var(--text-muted)",
            fontSize: "12px", fontWeight: tab === id ? 600 : 400, cursor: "pointer",
            fontFamily: "'Space Grotesk', sans-serif", marginBottom: tab === id ? "-1px" : "0",
          }}>
            <Icon size={13} /> {label}
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
                      : "XAUUSD: London open 07:00–12:00 UTC (09:00–14:00 Madrid). Evitar Asia y horas muertas." },
                  { n: "3", t: "Gestión de noticias macro", c: "var(--amber)",
                    d: "Cerrar posiciones 30 min ANTES de NFP (1er viernes mes), CPI (2ª semana), FOMC (cada 6-7 sem), discursos Fed. Sin excepciones." },
                  { n: "4", t: "Consistencia > performance", c: "var(--green)",
                    d: `Una pérdida grande borra muchos días. Target: +${(cfg.balance * cfg.target_pct / 100 / 20).toFixed(0)}/día consistente > intentar +$${(cfg.balance * cfg.target_pct / 100 / 5).toFixed(0)} en un día.` },
                  { n: "5", t: cfg.firma === "FTMO" || cfg.firma === "E8" ? "Conceptos Forex/Metales" : "Conceptos Futuros", c: "var(--text-muted)",
                    d: cfg.firma === "FTMO" || cfg.firma === "E8"
                      ? "XAUUSD: S/R structure, Order Blocks, sesión London. EMA 50/200 para tendencia. RSI divergencias. Spread ~0.25 pip."
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
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════ TAB: SEÑAL XAU ══════ */}
      {tab === "signal" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

          {/* ── SNIPER PANEL ── */}
          <div style={{ ...CARD, border: `2px solid ${sniperColor}`, background: `${sniperColor}08`, padding: "18px 24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "20px", flexWrap: "wrap" }}>
              {/* Semáforo */}
              <div style={{ display: "flex", flexDirection: "column", gap: "5px", flexShrink: 0 }}>
                {(["green", "yellow", "red"] as const).map(c => (
                  <div key={c} style={{ width: "14px", height: "14px", borderRadius: "50%",
                    background: c === sniperLevel ? (c === "green" ? "#00c864" : c === "yellow" ? "#ffaa00" : "#ff3232") : "var(--border)",
                    boxShadow: c === sniperLevel ? `0 0 8px ${c === "green" ? "#00c864" : c === "yellow" ? "#ffaa00" : "#ff3232"}` : "none",
                    transition: "all 0.4s" }}/>
                ))}
              </div>
              {/* Estado */}
              <div style={{ flex: "0 0 auto" }}>
                <div style={{ fontSize: "20px", fontWeight: 800, color: sniperColor, fontFamily: "monospace", letterSpacing: "0.04em" }}>
                  {sniperEmoji} {sniperLabel}
                </div>
                <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "3px" }}>
                  {sniperLevel === "green"
                    ? `Señal ${xauSignal?.signal} — confirmar setup visualmente antes de entrar`
                    : sniperLevel === "yellow"
                    ? `$${distancePips.toFixed(1)} del nivel más cercano — preparar MT5 y calcular tamaño`
                    : xauSignal?.price ? `Precio $${xauSignal.price.toFixed(2)} — esperando acercamiento a zona S/R` : "Esperando datos del monitor..."}
                </div>
              </div>
              {/* Barra de distancia */}
              {nearestSR && xauSignal?.price && (
                <div style={{ flex: 1, minWidth: "180px", maxWidth: "380px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "var(--text-muted)", marginBottom: "6px" }}>
                    <span>Precio: <strong style={{ color: "var(--text)", fontFamily: "monospace" }}>${xauSignal.price.toFixed(2)}</strong></span>
                    <span>{nearestSR.type === "support" ? "SUP" : "RES"}: <strong style={{ color: sniperColor, fontFamily: "monospace" }}>${nearestSR.level.toFixed(2)}</strong></span>
                  </div>
                  <div style={{ height: "8px", background: "var(--border)", borderRadius: "999px", overflow: "hidden" }}>
                    <div style={{ height: "100%", borderRadius: "999px", width: `${distBarFill}%`, background: `linear-gradient(90deg, ${sniperColor}44, ${sniperColor})`, transition: "width 0.8s" }}/>
                  </div>
                  <div style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "4px", textAlign: "center" }}>
                    $${distancePips.toFixed(1)} · {nearestSR.type === "support" ? "buscar LONG en soporte" : "buscar SHORT en resistencia"}
                  </div>
                </div>
              )}
              {/* Audio */}
              <button onClick={() => setAudioEnabled(p => !p)} style={{ padding: "7px 14px", borderRadius: "6px", border: `1px solid ${audioEnabled ? "var(--accent)" : "var(--border)"}`, background: audioEnabled ? "var(--accent-dim)" : "var(--bg)", color: audioEnabled ? "var(--accent)" : "var(--text-muted)", fontSize: "12px", fontWeight: 600, cursor: "pointer", flexShrink: 0, fontFamily: "'Space Grotesk', sans-serif" }}>
                {audioEnabled ? "🔔 Alerta ON" : "🔕 Alerta OFF"}
              </button>
            </div>
          </div>

          {/* Top row: Sesión · Precio · Señal */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
            {/* Sesión */}
            <div style={{ ...CARD, borderColor: session.active ? `${session.color}55` : "var(--border)" }}>
              <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.08em" }}>Sesión Actual</div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                <span style={{ fontSize: "22px", fontWeight: 700, color: session.color, fontFamily: "monospace" }}>{session.name}</span>
                {session.active && <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: session.color, display: "inline-block", boxShadow: `0 0 6px ${session.color}` }}/>}
              </div>
              <div style={{ fontSize: "12px", color: "var(--text-muted)", fontFamily: "monospace", marginBottom: "4px" }}>{countdown}</div>
              <div style={{ fontSize: "11px", color: "var(--text-muted)", opacity: 0.7 }}>
                {String(now.getUTCHours()).padStart(2,"0")}:{String(now.getUTCMinutes()).padStart(2,"0")}:{String(now.getUTCSeconds()).padStart(2,"0")} UTC
              </div>
              <div style={{ marginTop: "10px", fontSize: "11px", color: "var(--text-muted)", padding: "6px 8px", background: "var(--bg)", borderRadius: "5px", border: "1px solid var(--border)" }}>
                London 07:00–12:00 UTC · Solo operar en esta ventana
              </div>
            </div>

            {/* Precio */}
            <div style={CARD}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <div style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>XAU/USD (Gold)</div>
                <button onClick={fetchXAUSignal} title="Actualizar" style={{ background: "none", border: "none", cursor: "pointer", color: xauLoading ? "var(--accent)" : "var(--text-muted)", padding: "2px" }}>
                  <RefreshCw size={12}/>
                </button>
              </div>
              <div style={{ fontSize: "30px", fontWeight: 700, color: "var(--accent)", fontFamily: "'Space Mono', monospace", marginBottom: "4px" }}>
                {xauSignal?.price ? `$${xauSignal.price.toFixed(2)}` : "—"}
              </div>
              <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "10px" }}>
                {xauSignal?.ts ? `Cierre previo · ${new Date(xauSignal.ts).toLocaleDateString("es")}` : xauLoading ? "Cargando..." : "Sin datos"}
              </div>
              <div style={{ display: "inline-block", padding: "3px 10px", borderRadius: "4px", fontSize: "11px", fontWeight: 700,
                background: xauSignal?.trend === "BULL" ? "rgba(0,200,100,0.12)" : xauSignal?.trend === "BEAR" ? "rgba(255,50,50,0.12)" : "rgba(100,100,100,0.08)",
                color: xauSignal?.trend === "BULL" ? "var(--green)" : xauSignal?.trend === "BEAR" ? "var(--red)" : "var(--text-muted)",
              }}>
                {xauSignal?.trend === "BULL" ? "↑ ALCISTA" : xauSignal?.trend === "BEAR" ? "↓ BAJISTA" : "— TENDENCIA"}
              </div>
            </div>

            {/* Señal */}
            <div style={{ ...CARD, border: `1px solid ${sigColor === "var(--text-muted)" ? "var(--border)" : `${sigColor}44`}`, background: sigColor === "var(--text-muted)" ? "var(--card)" : `${sigColor}06` }}>
              <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.08em" }}>Señal sr_structure London</div>
              <div style={{ fontSize: "26px", fontWeight: 800, color: sigColor, fontFamily: "monospace", marginBottom: "6px", letterSpacing: "0.05em" }}>
                {sigEmoji} {xauSignal?.signal ?? "—"}
              </div>
              {xauSignal?.error ? (
                <div style={{ fontSize: "11px", color: "var(--amber)", padding: "5px 8px", background: "rgba(255,170,0,0.08)", borderRadius: "4px", lineHeight: 1.5 }}>
                  ⚠ {xauSignal.error}
                </div>
              ) : xauSignal?.signal === "AGUARDAR" ? (
                <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                  {session.name === "LONDON" ? "Sin setup confirmado — esperar ruptura S/R limpia" : "Señales activas solo en London (07:00–12:00 UTC)"}
                </div>
              ) : (
                <div style={{ fontSize: "12px", color: sigColor, fontWeight: 600 }}>
                  Setup detectado · Confirmar manualmente antes de entrar
                </div>
              )}
            </div>
          </div>

          {/* Escalado de entradas — solo cuando hay señal activa */}
          {xauSignal?.signal !== "AGUARDAR" && xauSignal?.signal && nearestSR && (
            <div style={CARD}>
              <h3 style={{ fontSize: "14px", fontWeight: 600, color: "var(--text)", margin: "0 0 14px" }}>
                Plan de entradas escalado — <span style={{ color: sigColor }}>{xauSignal.signal}</span>
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginBottom: "12px" }}>
                {[
                  { lbl: "E1 — 50%", price: nearestSR.level, cond: nearestSR.type === "support" ? "precio toca soporte" : "precio toca resistencia", active: true },
                  { lbl: "E2 — 30%", price: xauSignal.ema50 ?? (nearestSR.level + (xauSignal.signal === "LONG" ? -5 : 5)), cond: "pullback a EMA50 si retrocede", active: false },
                  { lbl: "E3 — 20%", price: xauSignal.signal === "LONG" ? nearestSR.level - 4 : nearestSR.level + 4, cond: "confirmación de momentum", active: false },
                ].map(({ lbl, price, cond, active }) => (
                  <div key={lbl} style={{ padding: "16px", background: active ? `${sigColor}06` : "var(--bg)", borderRadius: "8px", border: `1px solid ${active ? sigColor : "var(--border)"}44`, textAlign: "center" }}>
                    <div style={{ fontSize: "10px", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "8px" }}>{lbl}</div>
                    <div style={{ fontSize: "22px", fontWeight: 800, fontFamily: "monospace", color: active ? sigColor : "var(--text)" }}>${price.toFixed(2)}</div>
                    <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "6px" }}>{cond}</div>
                  </div>
                ))}
              </div>
              <div style={{ padding: "10px 12px", background: "var(--bg)", borderRadius: "6px", border: "1px solid var(--border)", fontSize: "12px", color: "var(--text-muted)", lineHeight: 1.6 }}>
                Entra con 50% en E1. Si el precio confirma dirección, añade 30% en E2 (EMA50). Reserva 20% para E3 si el momentum sigue. Stop total: al otro lado del nivel S/R ± 2-3 pips de margen.
              </div>
            </div>
          )}

          {/* Bottom row: Indicadores + SR Levels */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            {/* Indicadores */}
            <div style={CARD}>
              <h3 style={{ fontSize: "14px", fontWeight: 600, color: "var(--text)", margin: "0 0 14px" }}>Indicadores técnicos</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {[
                  {
                    label: "RSI 14",
                    value: xauSignal?.rsi14 != null ? xauSignal.rsi14.toFixed(1) : "—",
                    color: xauSignal?.rsi14 != null ? (xauSignal.rsi14 >= 70 ? "var(--red)" : xauSignal.rsi14 <= 30 ? "var(--green)" : "var(--text)") : "var(--text-muted)",
                    note: xauSignal?.rsi14 != null ? (xauSignal.rsi14 >= 70 ? "Sobrecomprado — cuidado LONG" : xauSignal.rsi14 <= 30 ? "Sobrevendido — buscar LONG" : xauSignal.rsi14 > 50 ? "Momentum alcista" : "Momentum bajista") : "Sin datos",
                  },
                  {
                    label: "EMA 50",
                    value: xauSignal?.ema50 != null ? `$${xauSignal.ema50.toFixed(2)}` : "—",
                    color: (xauSignal?.price && xauSignal?.ema50) ? (xauSignal.price > xauSignal.ema50 ? "var(--green)" : "var(--red)") : "var(--text)",
                    note: (xauSignal?.price && xauSignal?.ema50) ? (xauSignal.price > xauSignal.ema50 ? `+${((xauSignal.price - xauSignal.ema50)/xauSignal.ema50*100).toFixed(2)}% sobre EMA50` : `${((xauSignal.price - xauSignal.ema50)/xauSignal.ema50*100).toFixed(2)}% bajo EMA50`) : "Sin datos",
                  },
                  {
                    label: "EMA 200",
                    value: xauSignal?.ema200 != null ? `$${xauSignal.ema200.toFixed(2)}` : "—",
                    color: (xauSignal?.price && xauSignal?.ema200) ? (xauSignal.price > xauSignal.ema200 ? "var(--green)" : "var(--red)") : "var(--text)",
                    note: (xauSignal?.price && xauSignal?.ema200) ? (xauSignal.price > xauSignal.ema200 ? "Tendencia macro alcista ↑" : "Tendencia macro bajista ↓") : "Sin datos",
                  },
                ].map(({ label, value, color, note }) => (
                  <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", background: "var(--bg)", borderRadius: "6px", border: "1px solid var(--border)" }}>
                    <div>
                      <div style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "2px" }}>{label}</div>
                      <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{note}</div>
                    </div>
                    <div style={{ fontSize: "17px", fontWeight: 700, color, fontFamily: "'Space Mono', monospace" }}>{value}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: "10px", padding: "8px 10px", background: "rgba(200,245,66,0.04)", borderRadius: "6px", border: "1px solid rgba(200,245,66,0.15)", fontSize: "11px", color: "var(--text-muted)", lineHeight: 1.5 }}>
                Datos del cierre diario anterior (Polygon). Para precio live en tiempo real, despliega <strong style={{ color: "var(--accent)" }}>signal_monitor.py</strong> en Hetzner.
              </div>
            </div>

            {/* SR Levels */}
            <div style={CARD}>
              <h3 style={{ fontSize: "14px", fontWeight: 600, color: "var(--text)", margin: "0 0 14px" }}>Niveles Soporte / Resistencia</h3>
              {xauSignal?.sr_levels && xauSignal.sr_levels.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {[...xauSignal.sr_levels].sort((a, b) => b.level - a.level).map((lv, i) => {
                    const isNear = xauSignal.price > 0 && Math.abs(xauSignal.price - lv.level) / xauSignal.price < 0.003;
                    return (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", borderRadius: "6px", border: `1px solid ${isNear ? "var(--accent)" : "var(--border)"}`, background: isNear ? "rgba(200,245,66,0.05)" : "var(--bg)" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ fontSize: "10px", fontWeight: 700, padding: "2px 7px", borderRadius: "3px",
                            background: lv.type === "resistance" ? "rgba(255,50,50,0.12)" : "rgba(0,200,100,0.12)",
                            color: lv.type === "resistance" ? "var(--red)" : "var(--green)",
                          }}>{lv.type === "resistance" ? "RES" : "SUP"}</span>
                          {isNear && <span style={{ fontSize: "10px", color: "var(--accent)", fontWeight: 700 }}>← ZONA CLAVE</span>}
                        </div>
                        <span style={{ fontFamily: "'Space Mono', monospace", fontSize: "15px", fontWeight: 600 }}>${lv.level.toFixed(2)}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 20px", textAlign: "center", gap: "10px" }}>
                  <div style={{ fontSize: "32px" }}>📡</div>
                  <div style={{ fontSize: "13px", color: "var(--text-muted)", fontWeight: 600 }}>signal_monitor.py no activo</div>
                  <div style={{ fontSize: "12px", color: "var(--text-muted)", lineHeight: 1.6, maxWidth: "240px" }}>
                    Los niveles S/R se calculan en tiempo real cuando el script está corriendo en Hetzner.
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)", opacity: 0.6, fontFamily: "monospace", background: "var(--bg)", padding: "4px 10px", borderRadius: "4px", border: "1px solid var(--border)" }}>
                    /opt/raxislab/fondeo/signal_monitor.py
                  </div>
                </div>
              )}
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
                    <button key={tipo} onClick={() => { setCTipo(tipo); setCInstr(tipo === "Forex" ? "XAU/USD" : "ES"); }}
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
                      ? ["XAU/USD","EUR/USD","GBP/USD","USD/JPY","AUD/USD","USD/CAD"].map(s => <option key={s}>{s}</option>)
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
                  <input type="number" step={cTipo === "Forex" ? 0.01 : 0.25} value={cEntry || ""} onChange={e => setCEntry(Number(e.target.value))} style={INP} placeholder="2350.00"/>
                </div>
                <div><span style={LBL}>Stop Loss</span>
                  <input type="number" step={cTipo === "Forex" ? 0.01 : 0.25} value={cStop || ""} onChange={e => setCStop(Number(e.target.value))} style={INP} placeholder="2340.00"/>
                </div>
              </div>
              <div><span style={LBL}>Target (opcional — para R:R)</span>
                <input type="number" step={cTipo === "Forex" ? 0.01 : 0.25} value={cTarget || ""} onChange={e => setCTarget(Number(e.target.value))} style={INP} placeholder="Precio objetivo"/>
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
                <div><span style={LBL}>Instrumento</span><input value={form.instrumento ?? ""} onChange={e => setForm(p => ({ ...p, instrumento: e.target.value }))} style={INP} placeholder="XAU/USD"/></div>
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
                <div><span style={LBL}>Entrada</span><input type="number" step={0.01} value={form.entrada ?? ""} onChange={e => setForm(p => ({ ...p, entrada: Number(e.target.value) }))} style={INP} placeholder="2350.00"/></div>
                <div><span style={LBL}>Salida</span><input type="number" step={0.01} value={form.salida ?? ""} onChange={e => setForm(p => ({ ...p, salida: Number(e.target.value) }))} style={INP} placeholder="2360.00"/></div>
                <div><span style={LBL}>Stop inicial</span><input type="number" step={0.01} value={form.stop ?? ""} onChange={e => setForm(p => ({ ...p, stop: Number(e.target.value) }))} style={INP} placeholder="2340.00"/></div>
              </div>
              <div style={{ marginBottom: "12px" }}><span style={LBL}>Notas</span><input value={form.notas ?? ""} onChange={e => setForm(p => ({ ...p, notas: e.target.value }))} style={INP} placeholder="Setup, contexto, qué funcionó..."/></div>
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
                        <td style={{ padding: "8px 12px", fontFamily: "monospace" }}>{t.entrada.toFixed(2)}</td>
                        <td style={{ padding: "8px 12px", fontFamily: "monospace" }}>{t.salida > 0 ? t.salida.toFixed(2) : "—"}</td>
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
                  { d: "Lun",    h: "09:00 CET",  e: "PMI Manufacturero y Servicios",        i: "medio"    },
                  { d: "Mar",    h: "14:30 CET",  e: "CPI (2ª semana del mes)",               i: "muy_alto" },
                  { d: "Mié",    h: "20:00 CET",  e: "ADP Nonfarm / FOMC (cada 6-7 sem)",     i: "alto"     },
                  { d: "Jue",    h: "14:30 CET",  e: "Jobless Claims semanales",              i: "medio"    },
                  { d: "Vie",    h: "14:30 CET",  e: "NFP (1er viernes) / PPI (2º viernes)", i: "muy_alto" },
                  { d: "Trim.",  h: "14:30 CET",  e: "GDP Flash Estimate",                    i: "alto"     },
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

      {/* ══════ TAB: COMPARATIVA FTMO vs APEX ══════ */}
      {tab === "comparativa" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Recomendación */}
          <div style={{ ...CARD, border: "1px solid var(--accent)", background: "rgba(200,245,66,0.04)" }}>
            <div style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
              <div style={{ fontSize: "28px", flexShrink: 0 }}>🏆</div>
              <div>
                <div style={{ fontSize: "15px", fontWeight: 700, color: "var(--accent)", marginBottom: "6px" }}>Recomendación para sr_structure XAUUSD London</div>
                <div style={{ fontSize: "13px", color: "var(--text)", lineHeight: 1.7 }}>
                  <strong>FTMO $25k — cuenta Swing</strong>. El backtest fue sobre XAUUSD CFD (MT4/MT5), no futuros CME. Apex solo ofrece oro como futuros GC/MGC con specs distintos. FTMO Swing elimina el daily loss limit, que es el mayor riesgo para XAUUSD en London (spikes de 20–30 pips en noticias). Al 90% de pass rate en backtest y 23R en 49 trades, el challenge de $25k ($2.500 target) es alcanzable con 2–3 meses de operativa disciplinada.
                </div>
                <div style={{ marginTop: "10px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  {["✅ XAUUSD CFD = instrumento exacto del backtest","✅ Sin daily loss limit (cuenta Swing)","✅ 80%→90% profit split","✅ Fee se devuelve en 1ª retirada"].map(t => (
                    <span key={t} style={{ fontSize: "11px", color: "var(--green)", padding: "3px 10px", background: "rgba(0,200,100,0.08)", borderRadius: "4px", border: "1px solid rgba(0,200,100,0.2)" }}>{t}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Tabla comparativa */}
          <div style={{ display: "grid", gridTemplateColumns: "200px 1fr 1fr", gap: "0", border: "1px solid var(--border)", borderRadius: "12px", overflow: "hidden" }}>
            {/* Header */}
            {["Criterio", "🇨🇿 FTMO", "🇺🇸 Apex Trader Funding"].map((h, i) => (
              <div key={h} style={{ padding: "14px 16px", background: i === 1 ? "rgba(200,245,66,0.08)" : "var(--card)", borderBottom: "1px solid var(--border)", borderRight: i < 2 ? "1px solid var(--border)" : "none", fontSize: "13px", fontWeight: 700, color: i === 1 ? "var(--accent)" : "var(--text)" }}>
                {h}{i === 1 && <span style={{ marginLeft: "8px", fontSize: "10px", padding: "2px 6px", background: "var(--accent)", color: "#000", borderRadius: "4px", fontWeight: 700 }}>✓ REC</span>}
              </div>
            ))}

            {[
              { label: "Instrumento",      ftmo: "XAUUSD CFD (MT4/MT5) ✅",           apex: "GC/MGC futuros CME ⚠️" },
              { label: "Fases",            ftmo: "Fase 1 (10%) + Fase 2 (5%)",         apex: "1 sola fase (6%) ✅" },
              { label: "Precio $25k",      ftmo: "~€250 (fee devuelto en 1ª retirada)", apex: "$147 one-time o suscripción" },
              { label: "Precio $50k",      ftmo: "~€345",                               apex: "$167/mes suscripción" },
              { label: "Precio $100k",     ftmo: "~€540",                               apex: "$207/mes suscripción" },
              { label: "Daily loss",       ftmo: "5% / día (Swing: sin límite ✅)",     apex: "Sin límite diario (trailing EOD)" },
              { label: "Max drawdown",     ftmo: "10% trailing desde pico",             apex: "Trailing EOD desde equity máximo ⚠️" },
              { label: "Días mínimos",     ftmo: "4 días mínimo",                       apex: "Sin mínimo ✅" },
              { label: "Tiempo límite",    ftmo: "30 días F1 + 60 días F2",             apex: "Sin límite de tiempo ✅" },
              { label: "Profit split",     ftmo: "80% (→90% con scaling)",              apex: "90% (100% primer $10k) ✅" },
              { label: "Retiro",           ftmo: "Mensual (quincenal si se pide)",      apex: "Semanal ✅" },
              { label: "Noticias",         ftmo: "Permitido (mismo size 2min antes/dps)", apex: "Permitido ✅" },
              { label: "Weekend hold",     ftmo: "Permitido",                           apex: "No en algunas cuentas ⚠️" },
              { label: "XAUUSD London",    ftmo: "✅ Ideal — spread 0.25, alta liquidez", apex: "GC futures — diferente spread/lote" },
              { label: "Plataforma",       ftmo: "MT4 / MT5",                           apex: "NinjaTrader / Tradovate" },
              { label: "Scaling",          ftmo: "25% cada 4 meses constantes",         apex: "Múltiples cuentas simultáneas" },
              { label: "Copy/auto",        ftmo: "Permitido en misma cuenta",           apex: "Según términos" },
            ].map(({ label, ftmo, apex }, idx) => (
              <>
                <div key={`l${idx}`} style={{ padding: "11px 16px", background: idx % 2 === 0 ? "var(--bg)" : "var(--card)", borderBottom: "1px solid var(--border)", borderRight: "1px solid var(--border)", fontSize: "12px", fontWeight: 600, color: "var(--text-muted)" }}>{label}</div>
                <div key={`f${idx}`} style={{ padding: "11px 16px", background: idx % 2 === 0 ? "rgba(200,245,66,0.03)" : "rgba(200,245,66,0.06)", borderBottom: "1px solid var(--border)", borderRight: "1px solid var(--border)", fontSize: "12px", color: "var(--text)" }}>{ftmo}</div>
                <div key={`a${idx}`} style={{ padding: "11px 16px", background: idx % 2 === 0 ? "var(--bg)" : "var(--card)", borderBottom: "1px solid var(--border)", fontSize: "12px", color: "var(--text-muted)" }}>{apex}</div>
              </>
            ))}
          </div>

          {/* Riesgo clave Apex */}
          <div style={{ ...CARD, border: "1px solid rgba(255,170,0,0.3)", background: "rgba(255,170,0,0.04)" }}>
            <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--amber)", marginBottom: "8px" }}>⚠ Riesgo clave de Apex para esta estrategia</div>
            <div style={{ fontSize: "12px", color: "var(--text-muted)", lineHeight: 1.7 }}>
              Apex usa <strong style={{ color: "var(--text)" }}>trailing drawdown EOD</strong>: si haces +$500, el floor sube. Si luego el oro te da un spike de noticias en London y pierdes esos $500, estás en drawdown sin haber netted nada. Con XAUUSD esta dinámica es muy peligrosa. Además, el instrumento exacto del backtest (XAUUSD CFD) no está disponible en Apex — habría que re-validar la estrategia sobre GC/MGC antes de pagar el challenge.
            </div>
          </div>

          {/* Próximos pasos */}
          <div style={CARD}>
            <h3 style={{ fontSize: "14px", fontWeight: 600, color: "var(--text)", margin: "0 0 14px" }}>Próximos pasos para arrancar</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {[
                { n: "1", t: "Verificar condiciones FTMO actuales", d: "Confirmar precios y reglas en ftmo.com — cambian con frecuencia. Foco en cuenta Swing $25k.", c: "var(--accent)" },
                { n: "2", t: "Deploy signal_monitor.py en Hetzner", d: "Script listo para /opt/raxislab/fondeo/signal_monitor.py — cron cada 5min en London. Ver tab Señal XAU.", c: "var(--accent)" },
                { n: "3", t: "Pagar el challenge FTMO $25k Swing", d: "€345 aprox. No el Aggressive. La cuenta Swing elimina el daily loss — compatible con XAUUSD London.", c: "var(--amber)" },
                { n: "4", t: "Fondear CoinEx cuando hayas pasado",  d: "Avisar a Claude → cambiar DRY_RUN=False en futures_bot.py para live trading en paralelo.", c: "var(--text-muted)" },
              ].map(({ n, t, d, c }) => (
                <div key={n} style={{ display: "flex", gap: "12px", padding: "10px 14px", background: "var(--bg)", borderRadius: "8px", border: "1px solid var(--border)" }}>
                  <span style={{ width: "24px", height: "24px", borderRadius: "50%", background: `${c}18`, color: c, border: `1px solid ${c}44`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 700, flexShrink: 0 }}>{n}</span>
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)", marginBottom: "3px" }}>{t}</div>
                    <div style={{ fontSize: "12px", color: "var(--text-muted)", lineHeight: 1.5 }}>{d}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ══════ TAB: BACKTEST ══════ */}
      {tab === "backtest" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h2 style={{ fontSize: "18px", fontWeight: 600, color: "var(--text)", margin: 0 }}>Resultados del backtest</h2>
              <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: "4px 0 0" }}>
                {backtest?.generated ? `Generado: ${backtest.generated}` : "Cargando de Hetzner..."}
              </p>
            </div>
            <button onClick={fetchBacktest} disabled={btLoading} style={{ padding: "7px 14px", borderRadius: "5px", border: "none", background: "var(--accent)", color: "#000", fontSize: "12px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "5px" }}>
              <RefreshCw size={11}/> Actualizar
            </button>
          </div>

          {/* Winner card */}
          {backtest?.winner && (
            <div style={{ ...CARD, border: "1px solid var(--accent)", background: "rgba(200,245,66,0.04)" }}>
              <div style={{ display: "flex", gap: "16px", alignItems: "flex-start", flexWrap: "wrap" }}>
                <div style={{ fontSize: "32px" }}>🏆</div>
                <div style={{ flex: 1, minWidth: "200px" }}>
                  <p style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.1em", color: "var(--accent)", textTransform: "uppercase", margin: "0 0 6px" }}>Estrategia ganadora</p>
                  <p style={{ fontSize: "20px", fontWeight: 700, color: "var(--text)", margin: "0 0 4px", fontFamily: "monospace" }}>
                    {backtest.winner.instrument} · {backtest.winner.strategy} · sesión {backtest.winner.session}
                  </p>
                  <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: 0 }}>
                    Esta combinación es la que se usará en el challenge de fondeo
                  </p>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "12px" }}>
                  {[
                    ["Pass Rate", `${backtest.winner.pass_rate}%`, backtest.winner.pass_rate >= 80 ? "var(--green)" : "var(--amber)"],
                    ["Total Trades", `${backtest.winner.total_trades}`, "var(--accent)"],
                    ["Win Rate", `${backtest.winner.win_rate}%`, "var(--text)"],
                    ["Total R", `${backtest.winner.total_r}R`, "var(--green)"],
                  ].map(([l, v, c]) => (
                    <div key={l as string} style={{ textAlign: "center", padding: "12px 10px", background: "var(--bg)", borderRadius: "8px", border: "1px solid var(--border)" }}>
                      <p style={{ fontSize: "10px", color: "var(--text-muted)", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 4px" }}>{l}</p>
                      <p style={{ fontSize: "22px", fontWeight: 800, color: c as string, fontFamily: "monospace", margin: 0 }}>{v}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ marginTop: "16px", padding: "12px 14px", background: "rgba(200,245,66,0.06)", borderRadius: "6px", fontSize: "12px", color: "var(--text-muted)", lineHeight: 1.7 }}>
                <strong style={{ color: "var(--text)" }}>Por qué funciona:</strong> El oro (XAUUSD) en sesión London (07:00–12:00 UTC = 09:00–14:00 Madrid) tiene las condiciones óptimas: mayor volumen del día, spread bajo (~0.25 pip), y los niveles de S/R del día anterior se respetan más fielmente porque los grandes bancos europeos abren posiciones justo en esta ventana. La estrategia <em>sr_structure</em> explota exactamente ese patrón: precio llega a un nivel previo → rechazo → entrada en la dirección de la tendencia macro (EMA50/200).
              </div>
            </div>
          )}

          {/* All results table */}
          {backtest?.top_results && backtest.top_results.length > 0 && (
            <div style={CARD}>
              <h3 style={{ fontSize: "14px", fontWeight: 600, color: "var(--text)", margin: "0 0 14px" }}>Top combinaciones — ranking por pass rate + R total</h3>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--border)" }}>
                      {["#", "Instrumento", "Estrategia", "Sesión", "Pass Rate", "Trades", "Win %", "Total R", "R medio/trade"].map(h => (
                        <th key={h} style={{ padding: "8px 12px", textAlign: "left", color: "var(--text-muted)", fontWeight: 600, fontSize: "10px", letterSpacing: "0.06em", textTransform: "uppercase" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {backtest.top_results.map((r, i) => (
                      <tr key={i} style={{ borderBottom: "1px solid var(--border)", background: i === 0 ? "rgba(200,245,66,0.04)" : "transparent" }}>
                        <td style={{ padding: "10px 12px", fontWeight: 700, color: i === 0 ? "var(--accent)" : "var(--text-muted)" }}>{i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i+1}`}</td>
                        <td style={{ padding: "10px 12px", fontWeight: 600, fontFamily: "monospace", color: "var(--text)" }}>{r.instrument}</td>
                        <td style={{ padding: "10px 12px", color: "var(--text-mid)" }}>{r.strategy}</td>
                        <td style={{ padding: "10px 12px", color: "var(--text-muted)" }}>{r.session}</td>
                        <td style={{ padding: "10px 12px", fontWeight: 700, color: r.pass_rate >= 80 ? "var(--green)" : r.pass_rate >= 70 ? "var(--amber)" : "var(--red)" }}>{r.pass_rate}%</td>
                        <td style={{ padding: "10px 12px", color: "var(--text-mid)", fontFamily: "monospace" }}>{r.total_trades}</td>
                        <td style={{ padding: "10px 12px", color: "var(--text-mid)", fontFamily: "monospace" }}>{r.win_rate}%</td>
                        <td style={{ padding: "10px 12px", fontWeight: 700, color: "var(--green)", fontFamily: "monospace" }}>{r.total_r}R</td>
                        <td style={{ padding: "10px 12px", color: "var(--text-muted)", fontFamily: "monospace" }}>{r.avg_r != null ? `${r.avg_r.toFixed(2)}R` : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "10px", lineHeight: 1.5 }}>
                <strong>Pass Rate:</strong> % de veces que la estrategia habría pasado el challenge de fondeo simulado (no es win rate de trades, es si el conjunto de trades supera las reglas de la firm). · <strong>Total R:</strong> ganancias totales en múltiplos de riesgo (1R = 1% de la cuenta si arriesgas 1%).
              </p>
            </div>
          )}

          {/* Why NOT the others */}
          <div style={CARD}>
            <h3 style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)", margin: "0 0 12px" }}>Por qué NO las otras combinaciones</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "12px" }}>
              {[
                { what: "NAS100 + ema_cross + overlap", why: "El NAS100 solo está disponible como índice CFD o futuros (NQ/MNQ en Apex). El spread y el slippage en noticias macro (CPI, FOMC) son mucho más peligrosos que en XAUUSD. 75% pass rate pero con más varianza." },
                { what: "XAUUSD + london_breakout", why: "La estrategia de breakout en London tiene más falsos rompimientos — el oro frecuentemente rompe un nivel para luego revertir. sr_structure (esperar al nivel y confirmar rechazo) es más seguro que entrar en breakout." },
                { what: "EURUSD + sr_structure", why: "Misma estrategia pero EURUSD tiene menos rango diario (menos pips por operación), lo que resulta en R/R peor y más tiempo para llegar al target. 60% pass rate confirma que no es suficiente para el fondeo." },
              ].map(({ what, why }) => (
                <div key={what} style={{ padding: "10px 12px", background: "var(--bg)", borderRadius: "6px", border: "1px solid var(--border)" }}>
                  <p style={{ fontWeight: 600, color: "var(--text-mid)", margin: "0 0 3px", fontFamily: "monospace", fontSize: "11px" }}>{what}</p>
                  <p style={{ color: "var(--text-muted)", margin: 0, lineHeight: 1.5 }}>{why}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ══════ TAB: CUÁNDO OPERAR / PROTOCOLO ══════ */}
      {tab === "protocolo" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Live session status */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "14px" }}>
            <div style={{ ...CARD, borderColor: session.active ? `${session.color}55` : "var(--border)" }}>
              <p style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 8px" }}>Sesión ahora</p>
              <p style={{ fontSize: "24px", fontWeight: 800, color: session.color, fontFamily: "monospace", margin: "0 0 4px" }}>{session.name}</p>
              <p style={{ fontSize: "12px", color: "var(--text-muted)", fontFamily: "monospace" }}>{countdown}</p>
            </div>
            <div style={CARD}>
              <p style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 8px" }}>Hora UTC ahora</p>
              <p style={{ fontSize: "24px", fontWeight: 800, color: "var(--accent)", fontFamily: "monospace", margin: "0 0 4px" }}>
                {String(now.getUTCHours()).padStart(2,"0")}:{String(now.getUTCMinutes()).padStart(2,"0")}:{String(now.getUTCSeconds()).padStart(2,"0")}
              </p>
              <p style={{ fontSize: "11px", color: "var(--text-muted)" }}>Madrid = UTC+2 (verano) / UTC+1 (invierno)</p>
            </div>
            <div style={{ ...CARD, background: session.name === "LONDON" ? "rgba(200,245,66,0.06)" : "var(--card)", borderColor: session.name === "LONDON" ? "var(--accent)" : "var(--border)" }}>
              <p style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 8px" }}>¿Operar ahora?</p>
              <p style={{ fontSize: "20px", fontWeight: 800, color: session.name === "LONDON" ? "var(--green)" : "var(--text-muted)", margin: "0 0 4px" }}>
                {session.name === "LONDON" ? "✅ SÍ" : session.name === "PRE-LONDON" ? "⏳ PREPARAR" : "🚫 NO"}
              </p>
              <p style={{ fontSize: "11px", color: "var(--text-muted)" }}>{session.name === "LONDON" ? "Ventana activa — buscar setups" : session.name === "PRE-LONDON" ? "Revisar niveles ahora" : "Fuera de ventana operativa"}</p>
            </div>
          </div>

          {/* Daily schedule */}
          <div style={CARD}>
            <h3 style={{ fontSize: "14px", fontWeight: 600, color: "var(--text)", margin: "0 0 14px" }}>Horario diario (Madrid — hora de verano CET+2)</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              {[
                { hora: "07:00–09:00", accion: "Revisar gráfico H4 y H1 de XAUUSD", tipo: "prep", detalle: "Ver tendencia macro (EMA50/200 en H4). Identificar niveles S/R del día anterior. Anotar el rango del día anterior (high/low)." },
                { hora: "09:00–09:30", accion: "London Open — ATENCIÓN MÁXIMA", tipo: "clave", detalle: "Alta volatilidad al abrir. NO entrar en los primeros 15 min si hay movimiento brusco. Esperar que el precio se estabilice cerca de un nivel." },
                { hora: "09:30–13:00", accion: "Ventana operativa principal", tipo: "operar", detalle: "Buscar setups. Precio llega a nivel S/R → esperar vela de rechazo en TF 15min → confirmar EMA50/200 → entrar. MÁXIMO 2 operaciones al día." },
                { hora: "13:00–14:00", accion: "Cierre de posiciones London", tipo: "prep", detalle: "Liquidez empieza a bajar. Si estás en una operación ganadora pero sin llegar al target, considera cerrar parcial. Cuidado con el slippage." },
                { hora: "14:00–15:30", accion: "Pausa — NY pre-mercado", tipo: "pausa", detalle: "Momento de mayor volatilidad falsa. NO abrir nuevas posiciones. Revisar si hay noticias macro (CPI, FOMC, NFP)." },
                { hora: "15:30–17:00", accion: "NY Open — opcional (solo XAUUSD)", tipo: "opcional", detalle: "Segunda ventana para XAUUSD si no operaste en London. Mismas reglas. Menos prioridad porque el spread sube y hay más ruido." },
                { hora: "Resto del día", accion: "CERRADO — no operar", tipo: "cerrado", detalle: "Fuera de estas ventanas el mercado es noise. Asia tiene muy baja liquidez en XAUUSD. El riesgo supera el beneficio potencial." },
              ].map(({ hora, accion, tipo, detalle }) => {
                const colors: Record<string, string> = { prep: "var(--text-muted)", clave: "var(--red)", operar: "var(--green)", pausa: "var(--amber)", opcional: "#4285F4", cerrado: "var(--border)" };
                const bgs: Record<string, string> = { prep: "var(--bg)", clave: "rgba(255,50,50,0.05)", operar: "rgba(0,200,100,0.05)", pausa: "rgba(255,170,0,0.05)", opcional: "rgba(66,133,244,0.05)", cerrado: "var(--bg)" };
                return (
                  <div key={hora} style={{ display: "flex", gap: "12px", padding: "12px 14px", background: bgs[tipo], borderRadius: "6px", border: `1px solid ${colors[tipo]}22` }}>
                    <div style={{ minWidth: "110px", flexShrink: 0 }}>
                      <p style={{ fontFamily: "monospace", fontSize: "12px", fontWeight: 700, color: colors[tipo], margin: 0 }}>{hora}</p>
                    </div>
                    <div>
                      <p style={{ fontSize: "12px", fontWeight: 600, color: "var(--text)", margin: "0 0 3px" }}>{accion}</p>
                      <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: 0, lineHeight: 1.5 }}>{detalle}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Entry checklist */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div style={CARD}>
              <h3 style={{ fontSize: "13px", fontWeight: 600, color: "var(--green)", margin: "0 0 12px" }}>✅ Checklist de entrada (sr_structure)</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "12px" }}>
                {[
                  "Estás en ventana London (09:00–13:00 Madrid)",
                  "Hay un nivel S/R claro (mínimo 2 toques previos)",
                  "El precio se acerca al nivel desde la dirección correcta",
                  "EMA200 en H4 confirma la dirección del trade (precio por encima = LONG)",
                  "EMA50 en H1 alineada con el trade",
                  "RSI 14 NO está sobrecomprado/sobrevendido contra tu dirección",
                  "Aparece vela de rechazo o pin bar en 15min en el nivel",
                  "Stop loss < 1.5% de la cuenta (máx 1% ideal)",
                  "No hay noticias macro en las próximas 2 horas (CPI, FOMC, NFP)",
                  "Llevas <2 operaciones hoy",
                ].map((item, i) => (
                  <div key={i} style={{ display: "flex", gap: "8px", padding: "7px 10px", background: "rgba(0,200,100,0.04)", borderRadius: "5px", border: "1px solid rgba(0,200,100,0.15)" }}>
                    <span style={{ color: "var(--green)", flexShrink: 0 }}>□</span>
                    <span style={{ color: "var(--text-mid)" }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={CARD}>
                <h3 style={{ fontSize: "13px", fontWeight: 600, color: "var(--red)", margin: "0 0 12px" }}>🚫 NO entres si...</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "5px", fontSize: "12px" }}>
                  {[
                    "Ya llevas 2 operaciones hoy (aunque sean ganadoras)",
                    "Has perdido >50% del daily limit (para el día)",
                    "El precio lleva >30 pips corriendo sin pullback",
                    "Estás fuera de la ventana London/NY",
                    "Hay spread >0.8 pip en XAUUSD",
                    "No ves el nivel claramente — si dudas, no entres",
                    "El news calendar muestra HIGH IMPACT en <2h",
                  ].map((item, i) => (
                    <div key={i} style={{ display: "flex", gap: "8px", padding: "6px 10px", background: "rgba(255,50,50,0.04)", borderRadius: "5px", border: "1px solid rgba(255,50,50,0.1)", color: "var(--text-muted)" }}>
                      <span style={{ color: "var(--red)", flexShrink: 0 }}>✗</span>
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              <div style={CARD}>
                <h3 style={{ fontSize: "13px", fontWeight: 600, color: "var(--amber)", margin: "0 0 12px" }}>📌 Reglas de salida</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "5px", fontSize: "12px", color: "var(--text-muted)" }}>
                  {[
                    { l: "Target mínimo", d: "2R desde la entrada (si arriesgas 10 pips, target 20)" },
                    { l: "Cierre parcial", d: "Al llegar a 1R, cierra 50% y mueve stop a breakeven" },
                    { l: "Stop inicial", d: "Al otro lado del nivel S/R + pequeño margen (2-3 pips)" },
                    { l: "Trailing stop", d: "Si supera 1.5R, trail por máximos/mínimos de 15min" },
                    { l: "Tiempo límite", d: "Si en 3 horas no llega al target, cierra aunque esté en +0" },
                    { l: "Noticias macro", d: "Cierra siempre 30 min antes de NFP, CPI, FOMC" },
                  ].map(({ l, d }) => (
                    <div key={l} style={{ padding: "6px 10px", background: "var(--bg)", borderRadius: "5px", border: "1px solid var(--border)" }}>
                      <span style={{ color: "var(--amber)", fontWeight: 600 }}>{l}: </span>
                      <span>{d}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════ TAB: CUENTAS ══════ */}
      {tab === "cuentas" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h2 style={{ fontSize: "16px", fontWeight: 600, color: "var(--text)", margin: 0 }}>Gestión de cuentas</h2>
              <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: "3px 0 0" }}>Seguimiento multi-cuenta: challenges, funded y live</p>
            </div>
            <button onClick={() => setShowCuentaForm(!showCuentaForm)} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 16px", borderRadius: "6px", background: "var(--accent)", color: "#000", border: "none", cursor: "pointer", fontSize: "13px", fontWeight: 600 }}>
              <Plus size={14}/> Nueva cuenta
            </button>
          </div>

          {/* Formulario nueva cuenta */}
          {showCuentaForm && (
            <div style={{ ...CARD, border: "1px solid var(--accent)" }}>
              <h3 style={{ fontSize: "14px", fontWeight: 600, color: "var(--text)", margin: "0 0 14px" }}>Nueva cuenta</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px", marginBottom: "10px" }}>
                <div><span style={LBL}>Nombre</span><input value={cuentaForm.nombre ?? ""} onChange={e => setCuentaForm(p => ({...p, nombre: e.target.value}))} style={INP} placeholder="FTMO Challenge $25k"/></div>
                <div><span style={LBL}>Firma</span><input value={cuentaForm.firma ?? ""} onChange={e => setCuentaForm(p => ({...p, firma: e.target.value}))} style={INP} placeholder="FTMO"/></div>
                <div><span style={LBL}>Balance inicial ($)</span><input type="number" value={cuentaForm.balance ?? ""} onChange={e => setCuentaForm(p => ({...p, balance: Number(e.target.value)}))} style={INP} placeholder="25000"/></div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px", marginBottom: "10px" }}>
                <div><span style={LBL}>Tipo</span>
                  <select value={cuentaForm.tipo} onChange={e => setCuentaForm(p => ({...p, tipo: e.target.value as Cuenta["tipo"]}))} style={INP}>
                    <option>Challenge</option><option>Funded</option><option>Live</option>
                  </select>
                </div>
                <div><span style={LBL}>Estado</span>
                  <select value={cuentaForm.estado} onChange={e => setCuentaForm(p => ({...p, estado: e.target.value as Cuenta["estado"]}))} style={INP}>
                    <option>Activa</option><option>Pasada</option><option>Fallida</option>
                  </select>
                </div>
                <div><span style={LBL}>Fecha inicio</span><input type="date" value={cuentaForm.inicio ?? today()} onChange={e => setCuentaForm(p => ({...p, inicio: e.target.value}))} style={INP}/></div>
              </div>
              <div style={{ marginBottom: "12px" }}><span style={LBL}>Notas</span><input value={cuentaForm.notas ?? ""} onChange={e => setCuentaForm(p => ({...p, notas: e.target.value}))} style={INP} placeholder="Fase 1, objetivo, broker..."/></div>
              <div style={{ display: "flex", gap: "8px" }}>
                <button onClick={addCuenta} style={{ padding: "8px 20px", borderRadius: "6px", background: "var(--accent)", color: "#000", border: "none", cursor: "pointer", fontSize: "13px", fontWeight: 600 }}>Añadir</button>
                <button onClick={() => setShowCuentaForm(false)} style={{ padding: "8px 14px", borderRadius: "6px", background: "var(--bg)", color: "var(--text-muted)", border: "1px solid var(--border)", cursor: "pointer", fontSize: "13px" }}>Cancelar</button>
              </div>
            </div>
          )}

          {/* Resumen agregado */}
          {cuentas.length > 0 && (
            <div style={{ ...CARD, background: "rgba(200,245,66,0.04)", border: "1px solid rgba(200,245,66,0.2)" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
                {[
                  { l: "Cuentas activas", v: `${cuentas.filter(c => c.estado === "Activa").length}`, c: "var(--accent)" },
                  { l: "P&L Hoy (total)", v: fmtUSD(cuentas.reduce((s, c) => s + c.pnlHoy, 0)), c: cuentas.reduce((s, c) => s + c.pnlHoy, 0) >= 0 ? "var(--green)" : "var(--red)" },
                  { l: "P&L Acumulado", v: fmtUSD(cuentas.reduce((s, c) => s + c.pnlTotal, 0)), c: cuentas.reduce((s, c) => s + c.pnlTotal, 0) >= 0 ? "var(--green)" : "var(--red)" },
                  { l: "Capital total", v: `$${cuentas.reduce((s, c) => s + c.balance, 0).toLocaleString()}`, c: "var(--text)" },
                ].map(({ l, v, c }) => (
                  <div key={l} style={{ textAlign: "center", padding: "10px" }}>
                    <div style={{ fontSize: "10px", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "5px" }}>{l}</div>
                    <div style={{ fontSize: "20px", fontWeight: 700, color: c, fontFamily: "monospace" }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tarjetas por cuenta */}
          {cuentas.length === 0 ? (
            <div style={{ ...CARD, textAlign: "center", padding: "52px" }}>
              <Target size={36} color="var(--text-muted)" style={{ marginBottom: "12px", opacity: 0.4 }}/>
              <p style={{ color: "var(--text-muted)", fontSize: "14px", margin: 0 }}>Sin cuentas registradas</p>
              <p style={{ color: "var(--text-muted)", fontSize: "12px", margin: "6px 0 0" }}>Añade tu primera cuenta cuando empieces el challenge</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {cuentas.map(c => {
                const estColor = c.estado === "Activa" ? "var(--green)" : c.estado === "Pasada" ? "var(--accent)" : "var(--red)";
                const ddPctC = c.balance > 0 ? Math.abs(Math.min(0, c.pnlTotal)) / c.balance * 100 : 0;
                return (
                  <div key={c.id} style={CARD}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "14px" }}>
                      <div>
                        <div style={{ fontSize: "16px", fontWeight: 700, color: "var(--text)" }}>{c.nombre}</div>
                        <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
                          {c.firma} · {c.tipo} · Inicio: {c.inicio}
                          {c.notas && ` · ${c.notas}`}
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                        <span style={{ padding: "3px 10px", borderRadius: "4px", fontSize: "11px", fontWeight: 700, background: `${estColor}18`, color: estColor, border: `1px solid ${estColor}33` }}>{c.estado}</span>
                        <button onClick={() => delCuenta(c.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: "3px" }}><Trash2 size={13}/></button>
                      </div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "10px" }}>
                      {/* Balance */}
                      <div style={{ padding: "10px 12px", background: "var(--bg)", borderRadius: "6px", border: "1px solid var(--border)" }}>
                        <div style={{ fontSize: "10px", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px" }}>Balance</div>
                        <div style={{ fontSize: "15px", fontWeight: 700, fontFamily: "monospace" }}>${c.balance.toLocaleString()}</div>
                      </div>
                      {/* P&L Hoy */}
                      <div style={{ padding: "10px 12px", background: "var(--bg)", borderRadius: "6px", border: "1px solid var(--border)" }}>
                        <div style={{ fontSize: "10px", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px" }}>P&L Hoy</div>
                        <input type="number" step={0.01} value={c.pnlHoy || ""}
                          onChange={e => updateCuenta(c.id, { pnlHoy: Number(e.target.value) || 0 })}
                          style={{ ...INP, fontSize: "14px", fontWeight: 700, fontFamily: "monospace", color: c.pnlHoy >= 0 ? "var(--green)" : "var(--red)", padding: "3px 6px" }}
                          placeholder="0"/>
                      </div>
                      {/* P&L Total */}
                      <div style={{ padding: "10px 12px", background: "var(--bg)", borderRadius: "6px", border: "1px solid var(--border)" }}>
                        <div style={{ fontSize: "10px", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px" }}>P&L Total</div>
                        <input type="number" step={0.01} value={c.pnlTotal || ""}
                          onChange={e => updateCuenta(c.id, { pnlTotal: Number(e.target.value) || 0 })}
                          style={{ ...INP, fontSize: "14px", fontWeight: 700, fontFamily: "monospace", color: c.pnlTotal >= 0 ? "var(--green)" : "var(--red)", padding: "3px 6px" }}
                          placeholder="0"/>
                      </div>
                      {/* DD */}
                      <div style={{ padding: "10px 12px", background: "var(--bg)", borderRadius: "6px", border: "1px solid var(--border)" }}>
                        <div style={{ fontSize: "10px", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px" }}>Drawdown</div>
                        <div style={{ fontSize: "15px", fontWeight: 700, fontFamily: "monospace", color: ddPctC > 7 ? "var(--red)" : ddPctC > 4 ? "var(--amber)" : "var(--green)" }}>
                          {ddPctC.toFixed(1)}%
                        </div>
                      </div>
                      {/* Estado */}
                      <div style={{ padding: "10px 12px", background: "var(--bg)", borderRadius: "6px", border: "1px solid var(--border)" }}>
                        <div style={{ fontSize: "10px", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px" }}>Estado</div>
                        <select value={c.estado} onChange={e => updateCuenta(c.id, { estado: e.target.value as Cuenta["estado"] })}
                          style={{ ...INP, fontSize: "12px", padding: "3px 6px", color: estColor, fontWeight: 600 }}>
                          <option value="Activa">Activa</option>
                          <option value="Pasada">Pasada</option>
                          <option value="Fallida">Fallida</option>
                        </select>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div style={{ ...CARD, background: "rgba(0,200,100,0.04)", border: "1px solid rgba(0,200,100,0.15)", fontSize: "12px", color: "var(--text-muted)", lineHeight: 1.6 }}>
            <strong style={{ color: "var(--green)" }}>Trade Copier MT5:</strong> Cuando tengas 2+ cuentas activas, configura el MT5 Trade Copier EA (gratuito, incluido en MT5) para copiar órdenes de la cuenta master a las slave en milisegundos. Una sola decisión de entrada — múltiples cuentas ejecutan simultáneamente.
          </div>
        </div>
      )}

    </div>
  );
}
