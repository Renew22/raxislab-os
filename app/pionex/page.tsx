"use client";

import { useState, useEffect } from "react";

const HETZNER = process.env.NEXT_PUBLIC_HETZNER_URL || "http://167.233.72.200";
const KEY = "rxl_dash_k9m4p7q2x8";

interface Position {
  symbol: string;
  entry: number;
  stop: number;
  tp: number;
  size: number;
  pnl_actual: number;
  ts: number;
}

interface Trade {
  symbol: string;
  side: string;
  entry: number;
  exit: number;
  stop: number;
  tp: number;
  size: number;
  status: string;
  pnl_usdt: number;
  pnl_r: number;
  fee_usdt: number;
  ts_open: number;
  ts_close: number;
  mode: string;
}

interface Signal {
  price: number;
  score?: number;
  action: string;
}

interface DashData {
  updated: string;
  mode: string;
  capital_inicial: number;
  capital_actual: number;
  pnl_total_usdt: number;
  pnl_pct: number;
  trades_cerrados: number;
  win_rate: number;
  wins: number;
  losses: number;
  posiciones_abiertas: Position[];
  ultimos_trades: Trade[];
  signals_ciclo: Record<string, Signal>;
  all_trades: Trade[];
}

function fmt(n: number, dec = 2) {
  return n?.toFixed(dec) ?? "—";
}

function ts(unix: number) {
  return new Date(unix * 1000).toLocaleString("es-ES", { timeZone: "Europe/Madrid", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

export default function PionexPage() {
  const [data, setData] = useState<DashData | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [tab, setTab] = useState<"live" | "historial">("live");

  async function load() {
    try {
      const r = await fetch(`${HETZNER}/data/pionex?key=${KEY}`);
      const j = await r.json();
      if (j.detail) throw new Error(j.detail);
      setData(j);
      setErr("");
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Error cargando datos");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 60_000);
    return () => clearInterval(t);
  }, []);

  const pnlColor = (v: number) => v > 0 ? "var(--green)" : v < 0 ? "var(--red)" : "var(--text-muted)";

  if (loading) return <div style={{ padding: 32, color: "var(--text-muted)" }}>Cargando...</div>;
  if (err) return <div style={{ padding: 32, color: "var(--red)" }}>Error: {err}</div>;
  if (!data) return null;

  const isLive = data.mode === "LIVE";

  return (
    <div style={{ padding: 24, maxWidth: 1100 }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Bot Pionex</h1>
        <span style={{
          fontSize: 11, fontWeight: 700, padding: "2px 10px", borderRadius: 20,
          background: isLive ? "var(--green)" : "rgba(99,102,241,0.15)",
          color: isLive ? "#000" : "#818cf8"
        }}>
          {data.mode}
        </span>
        <span style={{ fontSize: 12, color: "var(--text-muted)", marginLeft: "auto" }}>
          Actualizado: {new Date(data.updated).toLocaleTimeString("es-ES")}
        </span>
        <button onClick={load} style={{
          padding: "4px 12px", borderRadius: 6, border: "1px solid var(--border)",
          background: "var(--surface)", color: "var(--text)", cursor: "pointer", fontSize: 12
        }}>↻ Actualizar</button>
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 12, marginBottom: 24 }}>
        {[
          { label: "Capital inicial", value: `$${fmt(data.capital_inicial)}`, color: "var(--text)" },
          { label: "Capital actual", value: `$${fmt(data.capital_actual)}`, color: pnlColor(data.capital_actual - data.capital_inicial) },
          { label: "PnL total", value: `${data.pnl_total_usdt >= 0 ? "+" : ""}$${fmt(data.pnl_total_usdt)}`, color: pnlColor(data.pnl_total_usdt) },
          { label: "Win Rate", value: `${fmt(data.win_rate, 1)}%`, color: data.win_rate >= 50 ? "var(--green)" : "var(--amber)" },
          { label: "Trades", value: `${data.wins}W / ${data.losses}L`, color: "var(--text)" },
        ].map(k => (
          <div key={k.label} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "14px 16px" }}>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 6 }}>{k.label}</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: k.color }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {(["live", "historial"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: "6px 18px", borderRadius: 8, border: "1px solid var(--border)",
            background: tab === t ? "var(--accent)" : "var(--surface)",
            color: tab === t ? "#fff" : "var(--text)", cursor: "pointer", fontSize: 13, fontWeight: 600
          }}>
            {t === "live" ? "En vivo" : "Historial"}
          </button>
        ))}
      </div>

      {tab === "live" && (
        <>
          {/* Posiciones abiertas */}
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, marginBottom: 20 }}>
            <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)", fontSize: 13, fontWeight: 600 }}>
              Posiciones abiertas ({data.posiciones_abiertas.length})
            </div>
            {data.posiciones_abiertas.length === 0 ? (
              <div style={{ padding: 20, color: "var(--text-muted)", fontSize: 13 }}>Sin posiciones abiertas</div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "var(--bg)" }}>
                    {["Par", "Entry", "Stop", "TP", "PnL actual", "Abierto"].map(h => (
                      <th key={h} style={{ padding: "8px 12px", textAlign: "left", color: "var(--text-muted)", fontWeight: 500 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.posiciones_abiertas.map(p => (
                    <tr key={p.symbol} style={{ borderTop: "1px solid var(--border)" }}>
                      <td style={{ padding: "10px 12px", fontWeight: 700 }}>{p.symbol.replace("_USDT", "")}</td>
                      <td style={{ padding: "10px 12px" }}>${fmt(p.entry, 4)}</td>
                      <td style={{ padding: "10px 12px", color: "var(--red)" }}>${fmt(p.stop, 4)}</td>
                      <td style={{ padding: "10px 12px", color: "var(--green)" }}>${fmt(p.tp, 4)}</td>
                      <td style={{ padding: "10px 12px", color: pnlColor(p.pnl_actual), fontWeight: 600 }}>
                        {p.pnl_actual >= 0 ? "+" : ""}${fmt(p.pnl_actual)}
                      </td>
                      <td style={{ padding: "10px 12px", color: "var(--text-muted)", fontSize: 11 }}>{ts(p.ts)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Señales último ciclo */}
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10 }}>
            <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)", fontSize: 13, fontWeight: 600 }}>
              Señales último ciclo
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 0 }}>
              {Object.entries(data.signals_ciclo).map(([sym, sig]) => {
                const score = Number(sig.score ?? 0);
                const pct = (score / 9) * 100;
                const color = score >= 7 ? "var(--green)" : score >= 4 ? "var(--amber)" : "var(--text-muted)";
                return (
                  <div key={sym} style={{ padding: "14px 16px", borderBottom: "1px solid var(--border)", borderRight: "1px solid var(--border)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <span style={{ fontWeight: 700, fontSize: 14 }}>{sym.replace("_USDT", "")}</span>
                      <span style={{ fontSize: 12, color, fontWeight: 700 }}>{score}/9</span>
                    </div>
                    <div style={{ height: 4, background: "var(--border)", borderRadius: 2 }}>
                      <div style={{ height: 4, borderRadius: 2, background: color, width: `${pct}%`, transition: "width 0.3s" }} />
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
                      ${sig.price?.toLocaleString("es-ES", { maximumFractionDigits: 4 })}
                      {sig.action === "entered" && <span style={{ color: "var(--green)", marginLeft: 8 }}>✓ ENTRADA</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {tab === "historial" && (
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10 }}>
          <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)", fontSize: 13, fontWeight: 600 }}>
            Historial de trades ({data.all_trades.length})
          </div>
          {data.all_trades.length === 0 ? (
            <div style={{ padding: 20, color: "var(--text-muted)", fontSize: 13 }}>Sin trades aún — el bot está en paper trading, esperando señales score ≥ 7/9</div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "var(--bg)" }}>
                  {["Par", "Estado", "Entry", "Exit", "PnL USDT", "PnL R", "Fee", "Cerrado"].map(h => (
                    <th key={h} style={{ padding: "8px 12px", textAlign: "left", color: "var(--text-muted)", fontWeight: 500 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...data.all_trades].reverse().map((t, i) => (
                  <tr key={i} style={{ borderTop: "1px solid var(--border)" }}>
                    <td style={{ padding: "10px 12px", fontWeight: 700 }}>{t.symbol.replace("_USDT", "")}</td>
                    <td style={{ padding: "10px 12px" }}>
                      <span style={{
                        fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 4,
                        background: t.status === "TP" ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)",
                        color: t.status === "TP" ? "var(--green)" : "var(--red)"
                      }}>{t.status}</span>
                    </td>
                    <td style={{ padding: "10px 12px" }}>${fmt(t.entry, 4)}</td>
                    <td style={{ padding: "10px 12px" }}>${fmt(t.exit, 4)}</td>
                    <td style={{ padding: "10px 12px", color: pnlColor(t.pnl_usdt), fontWeight: 600 }}>
                      {t.pnl_usdt >= 0 ? "+" : ""}${fmt(t.pnl_usdt)}
                    </td>
                    <td style={{ padding: "10px 12px", color: pnlColor(t.pnl_r) }}>{t.pnl_r >= 0 ? "+" : ""}{fmt(t.pnl_r)}R</td>
                    <td style={{ padding: "10px 12px", color: "var(--text-muted)" }}>${fmt(t.fee_usdt, 3)}</td>
                    <td style={{ padding: "10px 12px", color: "var(--text-muted)", fontSize: 11 }}>{ts(t.ts_close)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
