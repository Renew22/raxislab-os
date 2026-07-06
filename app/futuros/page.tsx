"use client";

import { useState, useEffect } from "react";

const API_URL = "/api/server/futures";

interface Position {
  market: string;
  side: "long" | "short";
  entry: number;
  stop: number;
  tp: number;
  size: number;
  lev: number;
  score: number;
  ts: number;
}

interface Trade {
  market: string;
  side: string;
  entry: number;
  exit: number;
  stop: number;
  tp: number;
  size: number;
  leverage: number;
  score: number;
  status: string;
  pnl_usdt: number;
  pnl_r: number;
  fee_usdt: number;
  ts_open: number;
  ts_close: number;
  mode: string;
}

interface CycleSignal {
  price: number;
  score?: number;
  action: string;
  side?: string;
}

interface DashData {
  updated: string;
  mode: string;
  leverage: number;
  score_min: number;
  capital_inicial: number;
  capital_actual: number;
  pnl_total_usdt: number;
  pnl_pct: number;
  trades_cerrados: number;
  win_rate: number;
  wins: number;
  losses: number;
  posiciones_abiertas: Position[];
  cycle_signals: Record<string, CycleSignal>;
  ultimos_trades: Trade[];
}

function fmt(n: number, dec = 2) {
  return (n ?? 0).toFixed(dec);
}

function fmtTs(unix: number) {
  return new Date(unix * 1000).toLocaleString("es-ES", {
    timeZone: "Europe/Madrid",
    day: "2-digit", month: "2-digit",
    hour: "2-digit", minute: "2-digit",
  });
}

function pnlColor(v: number) {
  return v > 0 ? "var(--green)" : v < 0 ? "var(--red)" : "var(--text-muted)";
}

export default function FuturosPage() {
  const [data, setData] = useState<DashData | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [tab, setTab] = useState<"live" | "historial">("live");

  async function load() {
    try {
      const r = await fetch(API_URL);
      const j = await r.json();
      if (j.error || j.detail) throw new Error(j.error ?? j.detail);
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

  if (loading) return <div style={{ padding: 32, color: "var(--text-muted)" }}>Cargando...</div>;
  if (err) return <div style={{ padding: 32, color: "var(--red)" }}>Error: {err}</div>;
  if (!data) return null;

  const isLive = data.mode === "LIVE";
  const signals = Object.entries(data.cycle_signals ?? {});
  const trades  = data.ultimos_trades ?? [];
  const positions = data.posiciones_abiertas ?? [];

  return (
    <div style={{ padding: 24, maxWidth: 1100 }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Bot Futuros CoinEx</h1>
        <span style={{
          fontSize: 11, fontWeight: 700, padding: "2px 10px", borderRadius: 20,
          background: isLive ? "rgba(34,197,94,0.2)" : "rgba(99,102,241,0.15)",
          color: isLive ? "var(--green)" : "#818cf8",
        }}>
          {data.mode}
        </span>
        <span style={{
          fontSize: 11, padding: "2px 10px", borderRadius: 20,
          background: "rgba(255,255,255,0.06)", color: "var(--text-muted)",
        }}>
          x{data.leverage} | Score ≥ {data.score_min}/9
        </span>
        <span style={{ fontSize: 12, color: "var(--text-muted)", marginLeft: "auto" }}>
          {data.updated ? new Date(data.updated).toLocaleTimeString("es-ES") : "—"}
        </span>
        <button onClick={load} style={{
          padding: "4px 12px", borderRadius: 6, border: "1px solid var(--border)",
          background: "var(--surface)", color: "var(--text)", cursor: "pointer", fontSize: 12,
        }}>↻</button>
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 12, marginBottom: 24 }}>
        {[
          { label: "Capital inicial", value: `$${fmt(data.capital_inicial)}`, color: "var(--text)" },
          { label: "Capital actual", value: `$${fmt(data.capital_actual)}`, color: pnlColor(data.capital_actual - data.capital_inicial) },
          { label: "PnL total", value: `${data.pnl_total_usdt >= 0 ? "+" : ""}$${fmt(data.pnl_total_usdt)}`, color: pnlColor(data.pnl_total_usdt) },
          { label: "Win Rate", value: `${fmt(data.win_rate, 1)}%`, color: data.win_rate >= 50 ? "var(--green)" : "var(--amber)" },
          { label: "Trades", value: `${data.wins ?? 0}W / ${data.losses ?? 0}L`, color: "var(--text)" },
        ].map(k => (
          <div key={k.label} style={{
            background: "var(--surface)", border: "1px solid var(--border)",
            borderRadius: 10, padding: "14px 16px",
          }}>
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
            color: tab === t ? "#fff" : "var(--text)", cursor: "pointer",
            fontSize: 13, fontWeight: 600,
          }}>
            {t === "live" ? "En vivo" : "Historial"}
          </button>
        ))}
      </div>

      {tab === "live" && (
        <>
          {/* Posiciones abiertas */}
          <div style={{
            background: "var(--surface)", border: "1px solid var(--border)",
            borderRadius: 10, marginBottom: 20,
          }}>
            <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)", fontSize: 13, fontWeight: 600 }}>
              Posiciones abiertas ({positions.length})
            </div>
            {positions.length === 0 ? (
              <div style={{ padding: 20, color: "var(--text-muted)", fontSize: 13 }}>
                Sin posiciones — esperando señal ≥ {data.score_min}/9
              </div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "var(--bg)" }}>
                    {["Par", "Dir", "Leverage", "Score", "Entry", "Stop", "TP", "Abierto"].map(h => (
                      <th key={h} style={{
                        padding: "8px 12px", textAlign: "left",
                        color: "var(--text-muted)", fontWeight: 500,
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {positions.map(p => (
                    <tr key={p.market} style={{ borderTop: "1px solid var(--border)" }}>
                      <td style={{ padding: "10px 12px", fontWeight: 700 }}>{p.market.replace("USDT", "")}</td>
                      <td style={{ padding: "10px 12px" }}>
                        <span style={{
                          fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 4,
                          background: p.side === "long" ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)",
                          color: p.side === "long" ? "var(--green)" : "var(--red)",
                        }}>
                          {p.side.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: "10px 12px", color: "var(--text-muted)" }}>x{p.lev}</td>
                      <td style={{ padding: "10px 12px" }}>
                        <span style={{ color: p.score >= 7 ? "var(--green)" : "var(--amber)" }}>
                          {p.score}/9
                        </span>
                      </td>
                      <td style={{ padding: "10px 12px" }}>${fmt(p.entry, 4)}</td>
                      <td style={{ padding: "10px 12px", color: "var(--red)" }}>${fmt(p.stop, 4)}</td>
                      <td style={{ padding: "10px 12px", color: "var(--green)" }}>${fmt(p.tp, 4)}</td>
                      <td style={{ padding: "10px 12px", color: "var(--text-muted)", fontSize: 11 }}>{fmtTs(p.ts)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Señales */}
          <div style={{
            background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10,
          }}>
            <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)", fontSize: 13, fontWeight: 600 }}>
              Señales último ciclo ({signals.length} pares)
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)" }}>
              {signals.map(([sym, sig]) => {
                const score = Number(sig.score ?? 0);
                const pct   = (score / 9) * 100;
                const col   = score >= data.score_min ? "var(--green)" : score >= 4 ? "var(--amber)" : "var(--text-muted)";
                return (
                  <div key={sym} style={{
                    padding: "14px 16px",
                    borderBottom: "1px solid var(--border)",
                    borderRight: "1px solid var(--border)",
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <span style={{ fontWeight: 700, fontSize: 14 }}>{sym.replace("USDT", "")}</span>
                      <span style={{ fontSize: 12, color: col, fontWeight: 700 }}>{score}/9</span>
                    </div>
                    <div style={{ height: 4, background: "var(--border)", borderRadius: 2, marginBottom: 4 }}>
                      <div style={{
                        height: 4, borderRadius: 2, background: col,
                        width: `${pct}%`, transition: "width 0.4s",
                      }} />
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", display: "flex", justifyContent: "space-between" }}>
                      <span>${sig.price?.toLocaleString("es-ES", { maximumFractionDigits: 4 }) ?? "—"}</span>
                      {sig.action === "entered" && (
                        <span style={{ color: sig.side === "long" ? "var(--green)" : "var(--red)", fontWeight: 600 }}>
                          ✓ {sig.side?.toUpperCase()}
                        </span>
                      )}
                      {sig.action === "monitoring" && (
                        <span style={{ color: "var(--amber)" }}>● abierta</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {tab === "historial" && (
        <div style={{
          background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10,
        }}>
          <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)", fontSize: 13, fontWeight: 600 }}>
            Historial ({trades.length} trades)
          </div>
          {trades.length === 0 ? (
            <div style={{ padding: 20, color: "var(--text-muted)", fontSize: 13 }}>
              Sin trades aún — bot en paper trading esperando señales ≥ {data.score_min}/9
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "var(--bg)" }}>
                  {["Par", "Dir", "Estado", "x Lev", "Entry", "Exit", "PnL USDT", "PnL R", "Fee", "Cerrado"].map(h => (
                    <th key={h} style={{
                      padding: "8px 12px", textAlign: "left",
                      color: "var(--text-muted)", fontWeight: 500,
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...trades].reverse().map((t, i) => (
                  <tr key={i} style={{ borderTop: "1px solid var(--border)" }}>
                    <td style={{ padding: "10px 12px", fontWeight: 700 }}>{t.market?.replace("USDT", "")}</td>
                    <td style={{ padding: "10px 12px" }}>
                      <span style={{
                        fontSize: 11, fontWeight: 700, padding: "2px 6px", borderRadius: 4,
                        background: t.side === "long" ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)",
                        color: t.side === "long" ? "var(--green)" : "var(--red)",
                      }}>
                        {t.side?.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: "10px 12px" }}>
                      <span style={{
                        fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 4,
                        background: t.status === "TP" ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)",
                        color: t.status === "TP" ? "var(--green)" : "var(--red)",
                      }}>{t.status}</span>
                    </td>
                    <td style={{ padding: "10px 12px", color: "var(--text-muted)" }}>x{t.leverage}</td>
                    <td style={{ padding: "10px 12px" }}>${fmt(t.entry, 4)}</td>
                    <td style={{ padding: "10px 12px" }}>${fmt(t.exit, 4)}</td>
                    <td style={{ padding: "10px 12px", fontWeight: 600, color: pnlColor(t.pnl_usdt) }}>
                      {t.pnl_usdt >= 0 ? "+" : ""}${fmt(t.pnl_usdt)}
                    </td>
                    <td style={{ padding: "10px 12px", color: pnlColor(t.pnl_r) }}>
                      {t.pnl_r >= 0 ? "+" : ""}{fmt(t.pnl_r)}R
                    </td>
                    <td style={{ padding: "10px 12px", color: "var(--text-muted)" }}>${fmt(t.fee_usdt, 3)}</td>
                    <td style={{ padding: "10px 12px", color: "var(--text-muted)", fontSize: 11 }}>{fmtTs(t.ts_close)}</td>
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
