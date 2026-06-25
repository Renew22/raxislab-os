"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Wallet, TrendingUp, Users, AlertTriangle, ExternalLink, RefreshCw } from "lucide-react";
import SparkLine from "../components/spark-line";
import AgendaDnD from "../components/agenda-dnd";

// ── Types ──────────────────────────────────────────────────────────────────────

interface BriefingEntry {
  id: string; semana: string; fecha: string;
  metricasDestacadas: string; tareasCriticas: string[];
  tareasImportantes: string[]; tareasSiHayTiempo: string[];
  prioridadLunes: string; clientesConActividad: string[];
  briefingCompleto: string;
}

interface HoodData {
  ticker: string; price: number | null; open: number | null;
  high52w: number | null; low52w: number | null;
  vol: number | null; volAvg20: number | null; volRatio: number | null;
  entry: number; qty: number;
  pnl: number | null; pnlPct: number | null; valor: number | null;
  earnings: { date: string; hour: string; epsEstimate: number | null; daysLeft: number | null } | null;
  sparkline: { t: number; c: number }[];
  updatedAt: string;
  error?: string;
}

// ── Static data ────────────────────────────────────────────────────────────────

const SPARK_MRR   = [820, 880, 900, 940, 970, 1050, 1100];
const SPARK_LEADS = [1, 1, 2, 2, 3, 3, 3];
const SPARK_TAREAS = [2, 3, 4, 5, 5, 4, 4];

const DIAS  = ["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"];
const MESES = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];

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

const CLIENTES = [
  { nombre: "Identity Peluqueros",  mrr: 450,  estado: "activo"  },
  { nombre: "Desancho Estilistas",  mrr: 450,  estado: "activo"  },
  { nombre: "Malvarrosa CF",        mrr: 350,  estado: "activo"  },
  { nombre: "Auto García",          mrr: 450,  estado: "activo"  },
];

const agenda = [
  { time: "07:00", label: "Gym" },
  { time: "09:00", label: "Deep Work" },
  { time: "12:00", label: "Clientes" },
  { time: "15:00", label: "Contenido" },
  { time: "17:00", label: "Proyecto" },
  { time: "18:30", label: "Trading" },
  { time: "19:00", label: "Cierre día" },
];

// ── Styles ─────────────────────────────────────────────────────────────────────

const CARD  = { background: "var(--card)", border: "1px solid var(--border)", borderRadius: "6px", padding: "20px" } as React.CSSProperties;
const LABEL = { fontSize: "11px", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: "var(--text-muted)", marginBottom: "8px" };
const MONO  = { fontFamily: "'Space Mono', monospace" } as React.CSSProperties;
const NUM   = { ...MONO, fontWeight: 700, fontSize: "28px", lineHeight: 1, marginBottom: "8px" } as React.CSSProperties;

// ── HoodWidget ─────────────────────────────────────────────────────────────────

function HoodWidget() {
  const [data, setData]   = useState<HoodData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/trading/hood")
      .then(r => r.json())
      .then(d => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  const pnlPos  = data?.pnl !== null && data?.pnl !== undefined && data.pnl >= 0;
  const pnlClr  = data?.pnl !== null && data?.pnl !== undefined
    ? (pnlPos ? "var(--green)" : "var(--red)")
    : "var(--text-muted)";

  const sparkData = data?.sparkline?.map(p => p.c) ?? [];

  return (
    <div style={CARD}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
        <div>
          <p style={{ ...LABEL, marginBottom: "2px" }}>HOOD · Robinhood</p>
          <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: 0 }}>
            {data?.qty ?? 30} acc · entrada ${data?.entry ?? "107.70"}
          </p>
        </div>
        <Link href="/mercado" style={{ textDecoration: "none" }}>
          <span style={{ fontSize: "11px", color: "var(--accent)", display: "flex", alignItems: "center", gap: "3px" }}>
            ver <ExternalLink size={10} />
          </span>
        </Link>
      </div>

      {loading && (
        <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--text-muted)", fontSize: "13px" }}>
          <RefreshCw size={13} style={{ animation: "spin 1s linear infinite" }} /> Cargando...
        </div>
      )}

      {!loading && data?.error && (
        <p style={{ fontSize: "12px", color: "var(--red)", margin: 0 }}>{data.error}</p>
      )}

      {!loading && !data?.error && data && (
        <>
          <div style={{ display: "flex", alignItems: "baseline", gap: "10px", marginBottom: "4px" }}>
            <p style={{ ...MONO, fontSize: "26px", fontWeight: 700, color: "var(--text)", margin: 0, lineHeight: 1 }}>
              {data.price !== null ? `$${data.price.toFixed(2)}` : "—"}
            </p>
            {data.pnl !== null && data.pnlPct !== null && (
              <span style={{ ...MONO, fontSize: "13px", fontWeight: 700, color: pnlClr }}>
                {data.pnl >= 0 ? "+" : ""}${data.pnl.toFixed(2)} ({data.pnlPct >= 0 ? "+" : ""}{data.pnlPct.toFixed(2)}%)
              </span>
            )}
          </div>

          {sparkData.length > 0 && (
            <div style={{ marginBottom: "10px" }}>
              <SparkLine data={sparkData} id="hood" />
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", fontSize: "11px" }}>
            <div>
              <span style={{ color: "var(--text-muted)" }}>Valor posición </span>
              <span style={{ ...MONO, color: "var(--text-mid)" }}>
                {data.valor !== null ? `$${data.valor.toLocaleString("en-US")}` : "—"}
              </span>
            </div>
            <div>
              <span style={{ color: "var(--text-muted)" }}>Vol ratio </span>
              <span style={{ ...MONO, color: data.volRatio && data.volRatio > 1.8 ? "var(--amber)" : "var(--text-mid)" }}>
                {data.volRatio !== null ? `${data.volRatio}×` : "—"}
              </span>
            </div>
            <div>
              <span style={{ color: "var(--text-muted)" }}>Máx 30d </span>
              <span style={{ ...MONO, color: "var(--text-mid)" }}>
                {data.high52w !== null ? `$${data.high52w.toFixed(2)}` : "—"}
              </span>
            </div>
            <div>
              <span style={{ color: "var(--text-muted)" }}>Mín 30d </span>
              <span style={{ ...MONO, color: "var(--text-mid)" }}>
                {data.low52w !== null ? `$${data.low52w.toFixed(2)}` : "—"}
              </span>
            </div>
          </div>

          {data.earnings && (
            <div style={{
              marginTop: "10px", padding: "7px 10px",
              background: (data.earnings.daysLeft ?? 99) <= 14 ? "rgba(251,191,36,0.06)" : "rgba(255,255,255,0.03)",
              border: `1px solid ${(data.earnings.daysLeft ?? 99) <= 14 ? "rgba(251,191,36,0.25)" : "var(--border)"}`,
              borderRadius: "5px", fontSize: "11px",
            }}>
              <span style={{ color: (data.earnings.daysLeft ?? 99) <= 14 ? "var(--amber)" : "var(--text-muted)" }}>
                Earnings {data.earnings.date}
              </span>
              <span style={{ color: "var(--text-muted)", marginLeft: "6px" }}>
                (en {data.earnings.daysLeft}d · {data.earnings.hour === "amc" ? "cierre" : "apertura"})
              </span>
              {data.earnings.epsEstimate !== null && (
                <span style={{ ...MONO, color: "var(--text-muted)", marginLeft: "6px" }}>
                  EPS est. ${data.earnings.epsEstimate?.toFixed(2)}
                </span>
              )}
            </div>
          )}
        </>
      )}
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

// ── ClientesWidget ─────────────────────────────────────────────────────────────

function ClientesWidget() {
  const mrr   = CLIENTES.reduce((s, c) => s + c.mrr, 0);
  const activos = CLIENTES.filter(c => c.estado === "activo").length;
  return (
    <div style={CARD}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
        <p style={{ ...LABEL, marginBottom: 0 }}>Clientes agencia</p>
        <Link href="/clientes" style={{ textDecoration: "none" }}>
          <span style={{ fontSize: "11px", color: "var(--accent)", display: "flex", alignItems: "center", gap: "3px" }}>
            ver <ExternalLink size={10} />
          </span>
        </Link>
      </div>
      <p style={{ ...NUM, color: "var(--accent)" }}>{activos}</p>
      <p style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "12px" }}>
        activos · MRR <span style={{ ...MONO, color: "var(--green)" }}>{mrr.toLocaleString("es-ES")}€</span>
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        {CLIENTES.map(c => (
          <div key={c.nombre} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "12px", color: "var(--text-mid)" }}>{c.nombre}</span>
            <span style={{ ...MONO, fontSize: "11px", color: "var(--green)" }}>{c.mrr}€/mes</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── MetaWidget ─────────────────────────────────────────────────────────────────

function MetaWidget() {
  return (
    <div style={CARD}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
        <p style={{ ...LABEL, marginBottom: 0 }}>Meta Ads · Clientes</p>
        <Link href="/clientes" style={{ textDecoration: "none" }}>
          <span style={{ fontSize: "11px", color: "var(--accent)", display: "flex", alignItems: "center", gap: "3px" }}>
            ver <ExternalLink size={10} />
          </span>
        </Link>
      </div>
      <div style={{ padding: "16px 12px", background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "5px", textAlign: "center" }}>
        <p style={{ fontSize: "12px", color: "var(--red)", margin: "0 0 6px", fontWeight: 600 }}>Token Meta expirado</p>
        <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: 0, lineHeight: 1.5 }}>
          Renueva en Meta Business Manager<br />
          y actualiza en Hetzner .env
        </p>
      </div>
      <div style={{ marginTop: "12px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
        {[["Identity", "450€/mes"], ["Desancho", "450€/mes"], ["Malvarrosa", "350€/mes"], ["García", "450€/mes"]].map(([name, mrr]) => (
          <div key={name} style={{ fontSize: "11px" }}>
            <span style={{ color: "var(--text-muted)" }}>{name} </span>
            <span style={{ ...MONO, color: "var(--text-mid)" }}>{mrr}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [now, setNow]               = useState(new Date());
  const [positionsCount, setPositionsCount] = useState<number | null>(null);
  const [briefing, setBriefing]     = useState<BriefingEntry | null>(null);
  const [briefingLoading, setBriefingLoading] = useState(true);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("raxislab_acciones_v1");
      const arr    = stored ? JSON.parse(stored) : [];
      setPositionsCount(Array.isArray(arr) ? arr.length : 0);
    } catch { setPositionsCount(0); }
  }, []);

  useEffect(() => {
    fetch("/api/notion/briefing")
      .then(r => r.json())
      .then(d => setBriefing(d.briefing ?? null))
      .catch(() => setBriefing(null))
      .finally(() => setBriefingLoading(false));
  }, []);

  const h        = now.getHours();
  const greeting = h < 12 ? "Buenos días" : h < 19 ? "Buenas tardes" : "Buenas noches";
  const timeStr  = now.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const dateStr  = `${DIAS[now.getDay()]}, ${now.getDate()} de ${MESES[now.getMonth()]} de ${now.getFullYear()}`;

  const cobrosHoy   = GASTOS_COBRO.filter(g => g.dia === now.getDate());
  const cobrosTotal = cobrosHoy.reduce((s, g) => s + g.importe, 0);
  const cobrosSubtext = cobrosHoy.length === 0
    ? "Sin cobros hoy"
    : cobrosHoy.length === 1
    ? `−${cobrosTotal.toFixed(0)}€ · ${cobrosHoy[0].servicio}`
    : `−${cobrosTotal.toFixed(0)}€ · ${cobrosHoy.length} servicios`;

  const mrrTotal = CLIENTES.reduce((s, c) => s + c.mrr, 0);

  return (
    <div style={{ padding: "32px 40px" }}>

      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "32px" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: 600, color: "var(--text)", marginBottom: "4px" }}>{greeting}, Rene</h1>
          <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>{dateStr}</p>
        </div>
        <span style={{ ...MONO, fontSize: "22px", fontWeight: 700, color: "var(--accent)", letterSpacing: "0.05em" }}>
          {timeStr}
        </span>
      </div>

      {/* ── Stat cards ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "12px", marginBottom: "24px" }}>
        <div style={CARD}>
          <p style={LABEL}>MRR Agencia</p>
          <p style={{ ...NUM, color: "var(--green)" }}>{mrrTotal.toLocaleString("es-ES")}€</p>
          <p style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "8px" }}>meta 5.000€/mes</p>
          <SparkLine data={SPARK_MRR} id="mrr" />
          <div style={{ background: "var(--border)", borderRadius: "3px", height: "3px", marginTop: "8px" }}>
            <div style={{ width: `${(mrrTotal / 5000 * 100).toFixed(0)}%`, height: "100%", background: "var(--green)", borderRadius: "3px" }} />
          </div>
          <p style={{ fontSize: "11px", color: "var(--green)", marginTop: "4px", ...MONO }}>{(mrrTotal / 5000 * 100).toFixed(0)}%</p>
        </div>

        <div style={CARD}>
          <p style={LABEL}>Cartera IBKR</p>
          <p style={{ ...NUM, color: "var(--accent)" }}>
            {positionsCount === null ? "—" : positionsCount}
          </p>
          <p style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "8px" }}>
            {positionsCount ? "posiciones activas" : "Sin posiciones"}
          </p>
          <Link href="/mercado" style={{ fontSize: "11px", color: "var(--accent)", textDecoration: "none", display: "flex", alignItems: "center", gap: "3px" }}>
            ver PyG <ExternalLink size={10} />
          </Link>
        </div>

        <div style={CARD}>
          <p style={LABEL}>Leads Activos</p>
          <p style={{ ...NUM, color: "var(--amber)" }}>3</p>
          <p style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "8px" }}>Taller García · Rent-a-Car Sol</p>
          <SparkLine data={SPARK_LEADS} id="leads" />
        </div>

        <Link href="/finanzas" style={{ textDecoration: "none" }}>
          <div style={{ ...CARD, cursor: "pointer" }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--border-accent)")}
            onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--border)")}
          >
            <p style={{ ...LABEL, marginBottom: "8px" }}>Cobros hoy</p>
            <p style={{ ...NUM, color: cobrosHoy.length > 0 ? "var(--red)" : "var(--green)" }}>
              {cobrosHoy.length > 0 ? cobrosHoy.length : "—"}
            </p>
            <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>{cobrosSubtext}</p>
          </div>
        </Link>
      </div>

      {/* ── Row 2: HOOD + Clientes + Meta ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginBottom: "24px" }}>
        <HoodWidget />
        <ClientesWidget />
        <MetaWidget />
      </div>

      {/* ── Row 3: Agenda + Briefing ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "24px" }}>
        <div style={CARD}>
          <p style={{ ...LABEL, marginBottom: "16px" }}>Agenda del día</p>
          <AgendaDnD />
        </div>

        <div style={CARD}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
            <p style={{ ...LABEL, marginBottom: 0 }}>
              {briefingLoading ? "Briefing Semanal" : briefing ? `Briefing · ${briefing.semana}` : "Alertas"}
            </p>
            {briefing && <AlertTriangle size={14} color="var(--amber)" />}
          </div>

          {briefingLoading && (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {[1,2,3].map(i => (
                <div key={i} style={{ height: "14px", borderRadius: "3px", background: "var(--border)", opacity: 0.5, width: i === 2 ? "80%" : i === 3 ? "65%" : "100%" }} />
              ))}
            </div>
          )}

          {!briefingLoading && briefing && (
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {briefing.prioridadLunes && (
                <div style={{ padding: "10px 12px", background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.2)", borderRadius: "5px" }}>
                  <p style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--amber)", marginBottom: "4px" }}>Lo primero</p>
                  <p style={{ fontSize: "12px", color: "var(--text)", lineHeight: 1.5 }}>{briefing.prioridadLunes}</p>
                </div>
              )}
              <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "8px" }}>
                {briefing.tareasCriticas.slice(0,4).map((t, i) => (
                  <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                    <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--red)", flexShrink: 0, marginTop: "5px" }} />
                    <span style={{ fontSize: "12px", color: "var(--text-mid)", lineHeight: 1.4 }}>{t}</span>
                  </li>
                ))}
                {briefing.tareasImportantes.slice(0,3).map((t, i) => (
                  <li key={`imp-${i}`} style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                    <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--amber)", flexShrink: 0, marginTop: "5px" }} />
                    <span style={{ fontSize: "12px", color: "var(--text-muted)", lineHeight: 1.4 }}>{t}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {!briefingLoading && !briefing && (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div style={{ padding: "10px 12px", background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "5px" }}>
                <p style={{ fontSize: "11px", fontWeight: 600, color: "var(--red)", marginBottom: "3px" }}>Token Meta expirado</p>
                <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: 0 }}>Renueva en Business Manager → actualiza en Hetzner .env</p>
              </div>
              <div style={{ padding: "10px 12px", background: "rgba(251,191,36,0.05)", border: "1px solid rgba(251,191,36,0.15)", borderRadius: "5px" }}>
                <p style={{ fontSize: "11px", fontWeight: 600, color: "var(--amber)", marginBottom: "3px" }}>Desancho — CPL subió</p>
                <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: 0 }}>Revisar segmentación y creativos</p>
              </div>
              <div style={{ padding: "10px 12px", background: "rgba(52,211,153,0.05)", border: "1px solid rgba(52,211,153,0.15)", borderRadius: "5px" }}>
                <p style={{ fontSize: "11px", fontWeight: 600, color: "var(--green)", marginBottom: "3px" }}>HOOD earnings: 28 Jul 2026</p>
                <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: 0 }}>AMC · EPS est. $0.42 · en 35 días</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Row 4: Accesos rápidos ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
        {[
          { href: "/mercado",       label: "Mercado",       sub: "Crypto · Acciones · Noticias", icon: "📈" },
          { href: "/raxis-investor",label: "Investor Pro",  sub: "M6 · Señales · Screener",      icon: "🔭" },
          { href: "/clientes",      label: "Clientes",      sub: "CRM · Proyectos · Métricas",   icon: "👥" },
          { href: "/propuestas",    label: "Propuestas",    sub: "PDF · Envío · Historial",       icon: "📄" },
        ].map(({ href, label, sub, icon }) => (
          <Link key={href} href={href} style={{ textDecoration: "none" }}>
            <div
              style={{ ...CARD, cursor: "pointer", transition: "border 0.12s" }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--border-accent)")}
              onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--border)")}
            >
              <span style={{ fontSize: "20px", display: "block", marginBottom: "8px" }}>{icon}</span>
              <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)", margin: "0 0 3px" }}>{label}</p>
              <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: 0 }}>{sub}</p>
            </div>
          </Link>
        ))}
      </div>

    </div>
  );
}
