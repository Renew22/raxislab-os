"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Wallet, TrendingUp, Users, AlertTriangle, ExternalLink, RefreshCw, Bell, BellOff, CheckCircle2, Circle } from "lucide-react";
import SparkLine from "../components/spark-line";
import AgendaDnD from "./weekly-calendar";

// ── Types ──────────────────────────────────────────────────────────────────────

interface BriefingEntry {
  id: string; semana: string; fecha: string;
  metricasDestacadas: string; tareasCriticas: string[];
  tareasImportantes: string[]; tareasSiHayTiempo: string[];
  prioridadLunes: string; clientesConActividad: string[];
  briefingCompleto: string;
}

interface FinnhubQ { c: number; d: number; dp: number }

interface M9Candidate {
  ticker: string; price?: number; score: number;
  vol_ratio?: number; move4h?: number; verdict?: string; ts?: string;
}

interface NearMiss {
  ticker: string; price?: number; score: number;
  vol_ratio?: number; move4h?: number; ts?: string;
}

interface Position {
  ticker: string; accion: string; cantidad: number;
  precio: number; fecha: string; estado?: string;
}

interface M7Cooldown { pair_dir: string; ts: string; score: number }

interface ServerData {
  ts: string;
  m7: { active_cooldowns: M7Cooldown[]; last_log: string[] };
  m9: { top_candidates: M9Candidate[]; last_log: string[] };
  near_miss: NearMiss[];
  positions: Position[];
  error?: string;
}

interface Task { id: string; text: string; done: boolean; priority: 'critical' | 'important' | 'low' }

// ── Static config ──────────────────────────────────────────────────────────────

const CLIENTES = [
  { nombre: "Identity Peluqueros",  mrr: 450, estado: "activo" },
  { nombre: "Desancho Estilistas",  mrr: 450, estado: "activo" },
  { nombre: "Malvarrosa CF",        mrr: 350, estado: "activo" },
  { nombre: "Auto García",          mrr: 450, estado: "activo" },
];

const GASTOS_COBRO = [
  { servicio: "Alquiler",        dia: 1,  importe: 650    },
  { servicio: "Coche",           dia: 1,  importe: 165    },
  { servicio: "Pepephone",       dia: 4,  importe: 15     },
  { servicio: "AXA Seguro",      dia: 5,  importe: 27.46  },
  { servicio: "Digi",            dia: 28, importe: 10     },
  { servicio: "Renting Tec",     dia: 25, importe: 22.99  },
  { servicio: "Canva Pro",       dia: 22, importe: 12     },
  { servicio: "Genspark",        dia: 1,  importe: 25     },
  { servicio: "Apple servicios", dia: 5,  importe: 15     },
  { servicio: "Cloudflare",      dia: 17, importe: 3.5    },
];

const DIAS  = ["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"];
const MESES = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];

// ── Styles ─────────────────────────────────────────────────────────────────────

const CARD  = { background: "var(--card)", border: "1px solid var(--border)", borderRadius: "6px", padding: "20px" } as React.CSSProperties;
const LABEL = { fontSize: "11px", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: "var(--text-muted)", marginBottom: "8px" };
const MONO  = { fontFamily: "'Space Mono', monospace" } as React.CSSProperties;
const NUM   = { ...MONO, fontWeight: 700, fontSize: "28px", lineHeight: 1, marginBottom: "8px" } as React.CSSProperties;

function cardHover(e: React.MouseEvent<HTMLDivElement>, enter: boolean) {
  (e.currentTarget as HTMLDivElement).style.borderColor = enter ? "var(--border-accent)" : "var(--border)";
}

// ── CarteraWidget ──────────────────────────────────────────────────────────────

const CARTERA_SNAP = [
  { sym:"SWKS", qty:30,      avg:74.43,  name:"Skyworks" },
  { sym:"RCUS", qty:50,      avg:30.40,  name:"Arcus Bio" },
  { sym:"CRCL", qty:16,      avg:80.49,  name:"Circle" },
  { sym:"BE",   qty:6,       avg:319.58, name:"Bloom Energy" },
  { sym:"INTC", qty:6.5,     avg:132.73, name:"Intel" },
];

function CarteraWidget() {
  const [quotes, setQuotes] = useState<Record<string, FinnhubQ>>({});
  const [loading, setLoading] = useState(true);
  const key = process.env.NEXT_PUBLIC_FINNHUB_KEY;

  useEffect(() => {
    if (!key) { setLoading(false); return; }
    Promise.all(
      CARTERA_SNAP.map(p =>
        fetch(`https://finnhub.io/api/v1/quote?symbol=${p.sym}&token=${key}`)
          .then(r => r.ok ? r.json() : null).catch(() => null)
      )
    ).then(results => {
      const m: Record<string, FinnhubQ> = {};
      results.forEach((r, i) => { if (r?.c) m[CARTERA_SNAP[i].sym] = r; });
      setQuotes(m);
    }).finally(() => setLoading(false));
  }, [key]);

  const totalVal = CARTERA_SNAP.reduce((s, p) => {
    const q = quotes[p.sym];
    return s + (q?.c ? q.c * p.qty : p.avg * p.qty);
  }, 0);
  const totalPnl = CARTERA_SNAP.reduce((s, p) => {
    const q = quotes[p.sym];
    return s + (q?.c ? (q.c - p.avg) * p.qty : 0);
  }, 0);

  return (
    <div style={CARD}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"12px" }}>
        <div>
          <p style={{ ...LABEL, marginBottom:"2px" }}>Cartera IBKR · US</p>
          <p style={{ fontSize:"11px", color:"var(--text-muted)", margin:0 }}>{CARTERA_SNAP.length} posiciones · cotización Finnhub</p>
        </div>
        <Link href="/raxis-investor" style={{ textDecoration:"none" }}>
          <span style={{ fontSize:"11px", color:"var(--accent)", display:"flex", alignItems:"center", gap:"3px" }}>ver <ExternalLink size={10}/></span>
        </Link>
      </div>

      {loading ? (
        <div style={{ color:"var(--text-muted)", fontSize:"13px", display:"flex", alignItems:"center", gap:"8px" }}>
          <RefreshCw size={13} style={{ animation:"spin 1s linear infinite" }}/> Cargando…
        </div>
      ) : (
        <>
          <div style={{ display:"flex", alignItems:"baseline", gap:"10px", marginBottom:"10px" }}>
            <p style={{ ...MONO, fontSize:"22px", fontWeight:700, color:"var(--text)", margin:0 }}>${totalVal.toLocaleString("en-US",{maximumFractionDigits:0})}</p>
            <span style={{ ...MONO, fontSize:"13px", fontWeight:700, color:totalPnl>=0?"var(--green)":"var(--red)" }}>{totalPnl>=0?"+":""}{totalPnl.toFixed(0)} USD</span>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:"5px" }}>
            {CARTERA_SNAP.slice(0, 4).map(p => {
              const q = quotes[p.sym];
              const pnl = q?.c ? (q.c - p.avg) * p.qty : null;
              const dp  = q?.dp ?? null;
              return (
                <div key={p.sym} style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <span style={{ fontSize:"12px", color:"var(--text-mid)" }}>
                    <span style={{ ...MONO, fontWeight:700, color:"var(--accent)" }}>{p.sym}</span>
                    <span style={{ color:"var(--text-muted)", marginLeft:"5px" }}>{p.qty} acc</span>
                  </span>
                  <span style={{ display:"flex", gap:"6px", alignItems:"center" }}>
                    {q?.c && <span style={{ ...MONO, fontSize:"12px" }}>${q.c.toFixed(2)}</span>}
                    {dp !== null && (
                      <span style={{ ...MONO, fontSize:"10px", fontWeight:700, color:dp>=0?"var(--green)":"var(--red)" }}>
                        {dp>=0?"+":""}{dp.toFixed(1)}%
                      </span>
                    )}
                    {pnl !== null && (
                      <span style={{ ...MONO, fontSize:"10px", color:pnl>=0?"var(--green)":"var(--red)" }}>
                        {pnl>=0?"+":""}{pnl.toFixed(0)}$
                      </span>
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        </>
      )}
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

// ── M7Widget ───────────────────────────────────────────────────────────────────

function M7Widget({ data, loading }: { data: ServerData | null; loading: boolean }) {
  const cooldowns = data?.m7?.active_cooldowns ?? [];
  const log       = data?.m7?.last_log ?? [];

  return (
    <div style={CARD}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"12px" }}>
        <p style={{ ...LABEL, marginBottom:0 }}>M7 · Futuros CoinEx</p>
        <span style={{ fontSize:"10px", color: cooldowns.length > 0 ? "var(--amber)" : "var(--text-muted)" }}>
          {cooldowns.length} cooldowns activos
        </span>
      </div>
      {loading && <p style={{ fontSize:"12px", color:"var(--text-muted)" }}>Cargando...</p>}
      {!loading && cooldowns.length === 0 && (
        <p style={{ fontSize:"12px", color:"var(--text-muted)" }}>Sin cooldowns activos · mercado limpio</p>
      )}
      {!loading && cooldowns.slice(0,5).map(c => {
        const pair = c.pair_dir.replace('_LONG','').replace('_SHORT','');
        const dir  = c.pair_dir.includes('_LONG') ? 'LONG' : 'SHORT';
        const ago  = c.ts ? Math.round((Date.now() - new Date(c.ts).getTime()) / 3600000) : null;
        return (
          <div key={c.pair_dir} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"6px 0", borderBottom:"1px solid var(--border)", fontSize:"12px" }}>
            <span style={{ ...MONO, color:"var(--text)", fontWeight:600 }}>{pair}</span>
            <div style={{ display:"flex", gap:"8px", alignItems:"center" }}>
              <span style={{ fontSize:"10px", padding:"2px 6px", borderRadius:"3px", background: dir==='LONG' ? "rgba(52,211,153,0.12)" : "rgba(239,68,68,0.12)", color: dir==='LONG' ? "var(--green)" : "var(--red)" }}>{dir}</span>
              <span style={{ color:"var(--text-muted)", fontSize:"10px" }}>score {c.score}</span>
              {ago != null && <span style={{ color:"var(--text-muted)", fontSize:"10px" }}>{ago}h</span>}
            </div>
          </div>
        );
      })}
      {!loading && log.length > 0 && (
        <div style={{ marginTop:"10px", padding:"8px", background:"rgba(255,255,255,0.02)", borderRadius:"4px" }}>
          <p style={{ fontSize:"10px", color:"var(--text-muted)", marginBottom:"4px", textTransform:"uppercase", letterSpacing:"0.06em" }}>Último ciclo</p>
          <p style={{ fontSize:"10px", color:"var(--text-muted)", margin:0, fontFamily:"monospace", lineHeight:1.6 }}>{log[log.length-1]?.slice(0,90)}</p>
        </div>
      )}
    </div>
  );
}

// ── M9Widget ───────────────────────────────────────────────────────────────────

function M9Widget({ data, loading }: { data: ServerData | null; loading: boolean }) {
  const candidates = data?.m9?.top_candidates ?? [];

  return (
    <div style={CARD}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"12px" }}>
        <p style={{ ...LABEL, marginBottom:0 }}>M9 · Radar mercado</p>
        <Link href="/mercado" style={{ textDecoration:"none" }}>
          <span style={{ fontSize:"11px", color:"var(--accent)", display:"flex", alignItems:"center", gap:"3px" }}>ver <ExternalLink size={10}/></span>
        </Link>
      </div>
      {loading && <p style={{ fontSize:"12px", color:"var(--text-muted)" }}>Cargando...</p>}
      {!loading && candidates.length === 0 && (
        <p style={{ fontSize:"12px", color:"var(--text-muted)" }}>Sin candidatos en radar</p>
      )}
      {!loading && candidates.slice(0,5).map(c => (
        <div key={c.ticker} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"6px 0", borderBottom:"1px solid var(--border)", fontSize:"12px" }}>
          <span style={{ ...MONO, color:"var(--text)", fontWeight:600 }}>{c.ticker}</span>
          <div style={{ display:"flex", gap:"8px", alignItems:"center" }}>
            {c.price != null && <span style={{ ...MONO, color:"var(--text-mid)", fontSize:"11px" }}>${c.price.toFixed(2)}</span>}
            {c.vol_ratio != null && <span style={{ fontSize:"10px", color:"var(--amber)" }}>vol {c.vol_ratio.toFixed(1)}×</span>}
            {c.move4h != null && <span style={{ fontSize:"10px", color: c.move4h >= 0 ? "var(--green)" : "var(--red)" }}>{c.move4h >= 0 ? "+" : ""}{c.move4h.toFixed(1)}%</span>}
            <span style={{ fontSize:"10px", color:"var(--text-muted)" }}>{c.score}/4</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── NearMissWidget ─────────────────────────────────────────────────────────────

function NearMissWidget({ data, loading }: { data: ServerData | null; loading: boolean }) {
  const items = data?.near_miss ?? [];

  return (
    <div style={CARD}>
      <p style={{ ...LABEL, marginBottom:"12px" }}>Barrido · Near-Miss</p>
      {loading && <p style={{ fontSize:"12px", color:"var(--text-muted)" }}>Cargando...</p>}
      {!loading && items.length === 0 && (
        <p style={{ fontSize:"12px", color:"var(--text-muted)" }}>Sin near-miss recientes</p>
      )}
      {!loading && [...items].reverse().slice(0,5).map((m, i) => {
        const ago = m.ts ? Math.round((Date.now() - new Date(m.ts).getTime()) / 3600000) : null;
        return (
          <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"6px 0", borderBottom:"1px solid var(--border)", fontSize:"12px" }}>
            <span style={{ ...MONO, color:"var(--text)", fontWeight:600 }}>{m.ticker}</span>
            <div style={{ display:"flex", gap:"8px", alignItems:"center" }}>
              {m.price != null && <span style={{ ...MONO, fontSize:"11px", color:"var(--text-mid)" }}>${m.price.toFixed(2)}</span>}
              {m.vol_ratio != null && <span style={{ fontSize:"10px", color:"var(--amber)" }}>vol {m.vol_ratio.toFixed(1)}×</span>}
              <span style={{ fontSize:"10px", padding:"2px 5px", borderRadius:"3px", background:"rgba(251,191,36,0.1)", color:"var(--amber)" }}>{m.score}/4</span>
              {ago != null && <span style={{ fontSize:"10px", color:"var(--text-muted)" }}>{ago > 24 ? `${Math.floor(ago/24)}d` : `${ago}h`}</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── PositionsWidget ────────────────────────────────────────────────────────────

function PositionsWidget({ data, loading }: { data: ServerData | null; loading: boolean }) {
  const positions = data?.positions ?? [];

  return (
    <div style={CARD}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"12px" }}>
        <p style={{ ...LABEL, marginBottom:0 }}>MEXEM · Últimas ops</p>
        <Link href="/trading" style={{ textDecoration:"none" }}>
          <span style={{ fontSize:"11px", color:"var(--accent)", display:"flex", alignItems:"center", gap:"3px" }}>ver <ExternalLink size={10}/></span>
        </Link>
      </div>
      {loading && <p style={{ fontSize:"12px", color:"var(--text-muted)" }}>Cargando...</p>}
      {!loading && positions.length === 0 && <p style={{ fontSize:"12px", color:"var(--text-muted)" }}>Sin operaciones registradas</p>}
      {!loading && [...positions].reverse().slice(0,5).map((p, i) => (
        <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"6px 0", borderBottom:"1px solid var(--border)", fontSize:"12px" }}>
          <div style={{ display:"flex", gap:"8px", alignItems:"center" }}>
            <span style={{ fontSize:"10px", padding:"2px 6px", borderRadius:"3px", background: p.accion==='BUY' ? "rgba(52,211,153,0.12)" : "rgba(239,68,68,0.12)", color: p.accion==='BUY' ? "var(--green)" : "var(--red)" }}>{p.accion}</span>
            <span style={{ ...MONO, fontWeight:600, color:"var(--text)" }}>{p.ticker}</span>
          </div>
          <div style={{ display:"flex", gap:"8px", alignItems:"center" }}>
            <span style={{ ...MONO, fontSize:"11px", color:"var(--text-mid)" }}>{p.cantidad} × ${p.precio?.toFixed(2)}</span>
            <span style={{ fontSize:"10px", color:"var(--text-muted)" }}>{new Date(p.fecha).toLocaleDateString("es-ES", { month:"short", day:"numeric" })}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── NotificationsPanel ─────────────────────────────────────────────────────────

function NotificationsPanel({ briefing, cobrosHoy, open, onClose }: {
  briefing: BriefingEntry | null;
  cobrosHoy: typeof GASTOS_COBRO;
  open: boolean;
  onClose: () => void;
}) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const today = new Date().toDateString();

  useEffect(() => {
    const stored = localStorage.getItem(`raxislab_tasks_${today}`);
    if (stored) { setTasks(JSON.parse(stored)); return; }

    const newTasks: Task[] = [];
    briefing?.tareasCriticas?.forEach((t, i) =>
      newTasks.push({ id: `c${i}`, text: t, done: false, priority: "critical" }));
    briefing?.tareasImportantes?.forEach((t, i) =>
      newTasks.push({ id: `i${i}`, text: t, done: false, priority: "important" }));
    cobrosHoy.forEach((g, i) =>
      newTasks.push({ id: `g${i}`, text: `Cobro: ${g.servicio} −${g.importe}€`, done: false, priority: "low" }));
    setTasks(newTasks);
    localStorage.setItem(`raxislab_tasks_${today}`, JSON.stringify(newTasks));
  }, [briefing, cobrosHoy, today]);

  const toggle = (id: string) => {
    const updated = tasks.map(t => t.id === id ? { ...t, done: !t.done } : t);
    setTasks(updated);
    localStorage.setItem(`raxislab_tasks_${today}`, JSON.stringify(updated));
  };

  if (!open) return null;

  const pendientes = tasks.filter(t => !t.done).length;

  return (
    <div style={{ position:"fixed", top:0, right:0, bottom:0, width:"340px", background:"var(--card)", borderLeft:"1px solid var(--border)", zIndex:1000, display:"flex", flexDirection:"column", boxShadow:"-4px 0 20px rgba(0,0,0,0.3)" }}>
      <div style={{ padding:"20px", borderBottom:"1px solid var(--border)", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div>
          <p style={{ fontSize:"14px", fontWeight:600, color:"var(--text)", margin:0 }}>Tareas del día</p>
          <p style={{ fontSize:"11px", color:"var(--text-muted)", margin:"2px 0 0" }}>{pendientes} pendiente{pendientes !== 1 ? "s" : ""}</p>
        </div>
        <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer", color:"var(--text-muted)", fontSize:"18px" }}>×</button>
      </div>
      <div style={{ flex:1, overflowY:"auto", padding:"16px" }}>
        {tasks.length === 0 && (
          <div style={{ textAlign:"center", padding:"32px 16px", color:"var(--text-muted)", fontSize:"13px" }}>
            {briefing ? "Todas las tareas completadas" : "Sin briefing disponible"}
          </div>
        )}
        {(["critical","important","low"] as const).map(priority => {
          const group = tasks.filter(t => t.priority === priority);
          if (!group.length) return null;
          const label = priority === "critical" ? "Críticas" : priority === "important" ? "Importantes" : "Recordatorios";
          const dot   = priority === "critical" ? "var(--red)" : priority === "important" ? "var(--amber)" : "var(--border-accent)";
          return (
            <div key={priority} style={{ marginBottom:"20px" }}>
              <p style={{ fontSize:"10px", fontWeight:600, letterSpacing:"0.08em", textTransform:"uppercase", color:"var(--text-muted)", marginBottom:"10px" }}>{label}</p>
              <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
                {group.map(task => (
                  <div key={task.id} onClick={() => toggle(task.id)} style={{ display:"flex", gap:"10px", alignItems:"flex-start", cursor:"pointer", padding:"8px 10px", borderRadius:"5px", background: task.done ? "transparent" : "rgba(255,255,255,0.02)", border:"1px solid var(--border)" }}>
                    {task.done
                      ? <CheckCircle2 size={15} color="var(--green)" style={{ flexShrink:0, marginTop:"1px" }}/>
                      : <Circle size={15} color={dot} style={{ flexShrink:0, marginTop:"1px" }}/>
                    }
                    <span style={{ fontSize:"12px", color: task.done ? "var(--text-muted)" : "var(--text-mid)", lineHeight:1.4, textDecoration: task.done ? "line-through" : "none" }}>{task.text}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [now, setNow]           = useState(new Date());
  const [briefing, setBriefing] = useState<BriefingEntry | null>(null);
  const [briefingLoading, setBriefingLoading] = useState(true);
  const [serverData, setServerData]   = useState<ServerData | null>(null);
  const [serverLoading, setServerLoading] = useState(true);
  const [notifOpen, setNotifOpen]     = useState(false);
  const [positionsCount, setPositionsCount] = useState<number | null>(null);

  useEffect(() => { const t = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(t); }, []);

  useEffect(() => {
    try {
      const arr = JSON.parse(localStorage.getItem("raxislab_acciones_v1") ?? "[]");
      setPositionsCount(Array.isArray(arr) ? arr.length : 0);
    } catch { setPositionsCount(0); }
  }, []);

  useEffect(() => {
    fetch("/api/notion/briefing")
      .then(r => r.json()).then(d => setBriefing(d.briefing ?? null)).catch(() => setBriefing(null)).finally(() => setBriefingLoading(false));
  }, []);

  const loadServerData = useCallback(() => {
    setServerLoading(true);
    fetch("/api/server/data")
      .then(r => r.json()).then(setServerData).catch(() => setServerData(null)).finally(() => setServerLoading(false));
  }, []);

  useEffect(() => { loadServerData(); }, [loadServerData]);

  const h        = now.getHours();
  const greeting = h < 12 ? "Buenos días" : h < 19 ? "Buenas tardes" : "Buenas noches";
  const timeStr  = now.toLocaleTimeString("es-ES", { hour:"2-digit", minute:"2-digit", second:"2-digit" });
  const dateStr  = `${DIAS[now.getDay()]}, ${now.getDate()} de ${MESES[now.getMonth()]} de ${now.getFullYear()}`;
  const cobrosHoy   = GASTOS_COBRO.filter(g => g.dia === now.getDate());
  const cobrosTotal = cobrosHoy.reduce((s, g) => s + g.importe, 0);
  const mrrTotal    = CLIENTES.reduce((s, c) => s + c.mrr, 0);

  const today = now.toDateString();
  const storedTasks = typeof window !== "undefined" ? JSON.parse(localStorage.getItem(`raxislab_tasks_${today}`) ?? "[]") : [];
  const pendientesCount = storedTasks.filter((t: Task) => !t.done).length;

  return (
    <div style={{ padding:"32px 40px", paddingRight: notifOpen ? "380px" : "40px", transition:"padding 0.2s" }}>

      {/* ── Header ── */}
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:"32px" }}>
        <div>
          <h1 style={{ fontSize:"24px", fontWeight:600, color:"var(--text)", marginBottom:"4px" }}>{greeting}, René</h1>
          <p style={{ fontSize:"13px", color:"var(--text-muted)" }}>{dateStr}</p>
        </div>
        <div style={{ display:"flex", gap:"12px", alignItems:"center" }}>
          <button onClick={loadServerData} style={{ background:"none", border:"none", cursor:"pointer", color:"var(--text-muted)", display:"flex", alignItems:"center", gap:"4px", fontSize:"11px" }}>
            <RefreshCw size={12}/> Actualizar
          </button>
          <button onClick={() => setNotifOpen(o => !o)} style={{ position:"relative", background:"none", border:"1px solid var(--border)", borderRadius:"6px", padding:"6px 10px", cursor:"pointer", color: notifOpen ? "var(--accent)" : "var(--text-muted)", display:"flex", alignItems:"center", gap:"6px", fontSize:"11px", transition:"color 0.12s" }}>
            {notifOpen ? <BellOff size={14}/> : <Bell size={14}/>}
            Tareas
            {pendientesCount > 0 && (
              <span style={{ position:"absolute", top:"-5px", right:"-5px", background:"var(--red)", color:"#fff", fontSize:"9px", fontWeight:700, borderRadius:"50%", width:"16px", height:"16px", display:"flex", alignItems:"center", justifyContent:"center" }}>{pendientesCount}</span>
            )}
          </button>
          <span style={{ ...MONO, fontSize:"22px", fontWeight:700, color:"var(--accent)", letterSpacing:"0.05em" }}>{timeStr}</span>
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"12px", marginBottom:"24px" }}>
        <div style={CARD}>
          <p style={LABEL}>MRR Agencia</p>
          <p style={{ ...NUM, color:"var(--green)" }}>{mrrTotal.toLocaleString("es-ES")}€</p>
          <p style={{ fontSize:"12px", color:"var(--text-muted)", marginBottom:"8px" }}>meta 5.000€/mes</p>
          <div style={{ background:"var(--border)", borderRadius:"3px", height:"3px" }}>
            <div style={{ width:`${(mrrTotal/5000*100).toFixed(0)}%`, height:"100%", background:"var(--green)", borderRadius:"3px" }}/>
          </div>
          <p style={{ fontSize:"11px", color:"var(--green)", marginTop:"4px", ...MONO }}>{(mrrTotal/5000*100).toFixed(0)}%</p>
        </div>
        <div style={CARD}>
          <p style={LABEL}>Candidatos M9</p>
          <p style={{ ...NUM, color:"var(--amber)" }}>{serverLoading ? "—" : (serverData?.m9?.top_candidates?.length ?? 0)}</p>
          <p style={{ fontSize:"12px", color:"var(--text-muted)" }}>{serverLoading ? "cargando..." : "en radar hoy"}</p>
        </div>
        <div style={CARD}>
          <p style={LABEL}>Ops MEXEM</p>
          <p style={{ ...NUM, color:"var(--accent)" }}>{serverLoading ? "—" : (serverData?.positions?.length ?? positionsCount ?? 0)}</p>
          <p style={{ fontSize:"12px", color:"var(--text-muted)" }}>
            <Link href="/trading" style={{ color:"var(--accent)", textDecoration:"none", fontSize:"11px", display:"flex", alignItems:"center", gap:"3px" }}>ver PyG <ExternalLink size={10}/></Link>
          </p>
        </div>
        <Link href="/finanzas" style={{ textDecoration:"none" }}>
          <div style={{ ...CARD, cursor:"pointer" }} onMouseEnter={e => cardHover(e, true)} onMouseLeave={e => cardHover(e, false)}>
            <p style={{ ...LABEL, marginBottom:"8px" }}>Cobros hoy</p>
            <p style={{ ...NUM, color: cobrosHoy.length > 0 ? "var(--red)" : "var(--green)" }}>{cobrosHoy.length > 0 ? cobrosHoy.length : "—"}</p>
            <p style={{ fontSize:"12px", color:"var(--text-muted)" }}>
              {cobrosHoy.length === 0 ? "Sin cobros hoy" : cobrosHoy.length === 1 ? `−${cobrosTotal.toFixed(0)}€ · ${cobrosHoy[0].servicio}` : `−${cobrosTotal.toFixed(0)}€ · ${cobrosHoy.length} servicios`}
            </p>
          </div>
        </Link>
      </div>

      {/* ── Row 2: Cartera + Clientes + Meta ── */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"12px", marginBottom:"24px" }}>
        <CarteraWidget/>
        <div style={CARD}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"12px" }}>
            <p style={{ ...LABEL, marginBottom:0 }}>Clientes agencia</p>
            <Link href="/clientes" style={{ textDecoration:"none" }}><span style={{ fontSize:"11px", color:"var(--accent)", display:"flex", alignItems:"center", gap:"3px" }}>ver <ExternalLink size={10}/></span></Link>
          </div>
          <p style={{ ...NUM, color:"var(--accent)" }}>{CLIENTES.filter(c => c.estado==="activo").length}</p>
          <p style={{ fontSize:"12px", color:"var(--text-muted)", marginBottom:"12px" }}>activos · MRR <span style={{ ...MONO, color:"var(--green)" }}>{mrrTotal.toLocaleString("es-ES")}€</span></p>
          <div style={{ display:"flex", flexDirection:"column", gap:"6px" }}>
            {CLIENTES.map(c => (
              <div key={c.nombre} style={{ display:"flex", justifyContent:"space-between" }}>
                <span style={{ fontSize:"12px", color:"var(--text-mid)" }}>{c.nombre}</span>
                <span style={{ ...MONO, fontSize:"11px", color:"var(--green)" }}>{c.mrr}€/mes</span>
              </div>
            ))}
          </div>
        </div>
        <div style={CARD}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"12px" }}>
            <p style={{ ...LABEL, marginBottom:0 }}>Meta Ads · Clientes</p>
            <Link href="/clientes" style={{ textDecoration:"none" }}><span style={{ fontSize:"11px", color:"var(--accent)", display:"flex", alignItems:"center", gap:"3px" }}>ver <ExternalLink size={10}/></span></Link>
          </div>
          <Link href="/clientes" style={{ textDecoration:"none" }}>
            <div style={{ padding:"10px 12px", background:"rgba(30,155,240,0.06)", border:"1px solid rgba(30,155,240,0.2)", borderRadius:"5px", marginBottom:"10px" }}>
              <p style={{ fontSize:"11px", color:"var(--accent)", margin:0, fontWeight:600 }}>Ver campañas activas →</p>
            </div>
          </Link>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"8px" }}>
            {[["Identity","450€/mes"],["Desancho","450€/mes"],["Malvarrosa","350€/mes"],["García","450€/mes"]].map(([name, mrr]) => (
              <div key={name} style={{ fontSize:"11px" }}>
                <span style={{ color:"var(--text-muted)" }}>{name} </span>
                <span style={{ ...MONO, color:"var(--text-mid)" }}>{mrr}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Row 3: Agenda + Briefing ── */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px", marginBottom:"24px" }}>
        <div style={CARD}>
          <p style={{ ...LABEL, marginBottom:"16px" }}>Agenda del día</p>
          <AgendaDnD/>
        </div>
        <div style={CARD}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"12px" }}>
            <p style={{ ...LABEL, marginBottom:0 }}>{briefingLoading ? "Briefing Semanal" : briefing ? `Briefing · ${briefing.semana}` : "Alertas"}</p>
            {briefing && <AlertTriangle size={14} color="var(--amber)"/>}
          </div>
          {briefingLoading && <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>{[1,2,3].map(i => <div key={i} style={{ height:"14px", borderRadius:"3px", background:"var(--border)", opacity:0.5, width: i===2?"80%":i===3?"65%":"100%" }}/>)}</div>}
          {!briefingLoading && briefing && (
            <div style={{ display:"flex", flexDirection:"column", gap:"12px" }}>
              {briefing.prioridadLunes && (
                <div style={{ padding:"10px 12px", background:"rgba(251,191,36,0.06)", border:"1px solid rgba(251,191,36,0.2)", borderRadius:"5px" }}>
                  <p style={{ fontSize:"10px", fontWeight:600, letterSpacing:"0.07em", textTransform:"uppercase", color:"var(--amber)", marginBottom:"4px" }}>Lo primero</p>
                  <p style={{ fontSize:"12px", color:"var(--text)", lineHeight:1.5 }}>{briefing.prioridadLunes}</p>
                </div>
              )}
              <ul style={{ listStyle:"none", display:"flex", flexDirection:"column", gap:"7px" }}>
                {briefing.tareasCriticas.slice(0,4).map((t, i) => (
                  <li key={i} style={{ display:"flex", gap:"10px", alignItems:"flex-start" }}>
                    <span style={{ width:"6px", height:"6px", borderRadius:"50%", background:"var(--red)", flexShrink:0, marginTop:"5px" }}/>
                    <span style={{ fontSize:"12px", color:"var(--text-mid)", lineHeight:1.4 }}>{t}</span>
                  </li>
                ))}
                {briefing.tareasImportantes.slice(0,3).map((t, i) => (
                  <li key={`i${i}`} style={{ display:"flex", gap:"10px", alignItems:"flex-start" }}>
                    <span style={{ width:"6px", height:"6px", borderRadius:"50%", background:"var(--amber)", flexShrink:0, marginTop:"5px" }}/>
                    <span style={{ fontSize:"12px", color:"var(--text-muted)", lineHeight:1.4 }}>{t}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {!briefingLoading && !briefing && (
            <p style={{ fontSize:"12px", color:"var(--text-muted)" }}>Sin briefing disponible esta semana</p>
          )}
        </div>
      </div>

      {/* ── Row 4: M7 + M9 ── */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px", marginBottom:"24px" }}>
        <M7Widget data={serverData} loading={serverLoading}/>
        <M9Widget data={serverData} loading={serverLoading}/>
      </div>

      {/* ── Row 5: Near Miss + Posiciones ── */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px", marginBottom:"24px" }}>
        <NearMissWidget data={serverData} loading={serverLoading}/>
        <PositionsWidget data={serverData} loading={serverLoading}/>
      </div>

      {/* ── Row 6: Quick access ── */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"12px" }}>
        {[
          { href:"/mercado",        label:"Mercado",       sub:"Crypto · Acciones · Noticias", icon:"📈" },
          { href:"/raxis-investor", label:"Investor Pro",  sub:"M6 · Screener · Señales",      icon:"🔭" },
          { href:"/clientes",       label:"Clientes",      sub:"CRM · Métricas · Campañas",    icon:"👥" },
          { href:"/propuestas",     label:"Propuestas",    sub:"PDF · Precios · Notion",        icon:"📄" },
        ].map(({ href, label, sub, icon }) => (
          <Link key={href} href={href} style={{ textDecoration:"none" }}>
            <div style={{ ...CARD, cursor:"pointer", transition:"border 0.12s" }} onMouseEnter={e => cardHover(e, true)} onMouseLeave={e => cardHover(e, false)}>
              <span style={{ fontSize:"20px", display:"block", marginBottom:"8px" }}>{icon}</span>
              <p style={{ fontSize:"13px", fontWeight:600, color:"var(--text)", margin:"0 0 3px" }}>{label}</p>
              <p style={{ fontSize:"11px", color:"var(--text-muted)", margin:0 }}>{sub}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* ── Panel notificaciones ── */}
      <NotificationsPanel
        briefing={briefing}
        cobrosHoy={cobrosHoy}
        open={notifOpen}
        onClose={() => setNotifOpen(false)}
      />
    </div>
  );
}
