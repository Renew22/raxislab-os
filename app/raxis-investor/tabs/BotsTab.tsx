"use client";

import { useState, useEffect } from "react";

function fmt(n: number, dec = 2) { return (n ?? 0).toFixed(dec); }
function fmtTs(unix: number) {
  return new Date(unix * 1000).toLocaleString("es-ES", {
    timeZone: "Europe/Madrid", day: "2-digit", month: "2-digit",
    hour: "2-digit", minute: "2-digit",
  });
}
function pnlColor(v: number) {
  return v > 0 ? "var(--green)" : v < 0 ? "var(--red)" : "var(--text-muted)";
}

const CARD: React.CSSProperties = {
  background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8,
};

interface BotData {
  updated?: string;
  mode?: string;
  leverage?: number;
  score_min?: number;
  capital_inicial?: number;
  capital_actual?: number;
  pnl_total_usdt?: number;
  pnl_pct?: number;
  trades_cerrados?: number;
  win_rate?: number;
  wins?: number;
  losses?: number;
  posiciones_abiertas?: {
    market?: string; symbol?: string; side?: string;
    entry?: number; stop?: number; tp?: number;
    size?: number; lev?: number; leverage?: number; score?: number; ts?: number;
  }[];
  cycle_signals?: Record<string, { price?: number; score?: number; action?: string; side?: string }>;
  signals_ciclo?: Record<string, { price?: number; score?: number; action?: string; side?: string }>;
  ultimos_trades?: {
    market?: string; symbol?: string; side?: string; entry?: number;
    exit?: number; status?: string; pnl_usdt?: number; pnl_r?: number;
    leverage?: number; lev?: number; score?: number; ts_close?: number;
  }[];
  all_trades?: unknown[];
}

function BotCard({
  title, subtitle, apiUrl, scoreKey,
}: {
  title: string; subtitle: string; apiUrl: string; scoreKey: "cycle_signals" | "signals_ciclo";
}) {
  const [data, setData] = useState<BotData | null>(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);
  const [showTrades, setShowTrades] = useState(false);

  async function load() {
    try {
      const r = await fetch(apiUrl);
      const j = await r.json();
      if (j.error || j.detail) throw new Error(j.error ?? j.detail);
      setData(j);
      setErr("");
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 60_000);
    return () => clearInterval(t);
  }, []);

  const signals = data ? Object.entries(data[scoreKey] ?? {}) : [];
  const positions = data?.posiciones_abiertas ?? [];
  const trades = data?.ultimos_trades ?? [];
  const isLive = data?.mode === "LIVE";
  const scMin = data?.score_min ?? 7;

  return (
    <div style={{ ...CARD, padding: 0, overflow: "hidden" }}>
      {/* Header */}
      <div style={{
        padding: "12px 16px", background: "var(--surface)",
        borderBottom: "1px solid var(--border)",
        display: "flex", alignItems: "center", gap: 8,
      }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14 }}>{title}</div>
          <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{subtitle}</div>
        </div>
        <span style={{
          marginLeft: 8, fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 12,
          background: isLive ? "rgba(34,197,94,0.2)" : "rgba(99,102,241,0.15)",
          color: isLive ? "var(--green)" : "#818cf8",
        }}>
          {loading ? "…" : data?.mode ?? "—"}
        </span>
        <button onClick={load} style={{
          marginLeft: "auto", padding: "2px 10px", borderRadius: 6,
          border: "1px solid var(--border)", background: "var(--surface)",
          color: "var(--text-muted)", cursor: "pointer", fontSize: 11,
        }}>↻</button>
      </div>

      {err && <div style={{ padding: 12, color: "var(--red)", fontSize: 12 }}>Error: {err}</div>}

      {/* KPIs */}
      {data && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 0 }}>
          {[
            { l: "Capital", v: `$${fmt(data.capital_actual ?? 0)}`, c: pnlColor((data.capital_actual ?? 0) - (data.capital_inicial ?? 0)) },
            { l: "PnL", v: `${(data.pnl_total_usdt ?? 0) >= 0 ? "+" : ""}$${fmt(data.pnl_total_usdt ?? 0)}`, c: pnlColor(data.pnl_total_usdt ?? 0) },
            { l: "Win Rate", v: `${fmt(data.win_rate ?? 0, 1)}%`, c: (data.win_rate ?? 0) >= 50 ? "var(--green)" : "var(--amber)" },
            { l: "Trades", v: `${data.wins ?? 0}W/${data.losses ?? 0}L`, c: "var(--text)" },
          ].map(k => (
            <div key={k.l} style={{ padding: "12px 14px", borderBottom: "1px solid var(--border)", borderRight: "1px solid var(--border)" }}>
              <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 2 }}>{k.l}</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: k.c }}>{k.v}</div>
            </div>
          ))}
        </div>
      )}

      {/* Posiciones */}
      {positions.length > 0 && (
        <div style={{ padding: "8px 16px 4px", borderBottom: "1px solid var(--border)" }}>
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 6 }}>POSICIONES ABIERTAS</div>
          {positions.map((p, i) => {
            const name = (p.market ?? p.symbol ?? "—").replace("USDT", "");
            const lev = p.lev ?? p.leverage ?? 1;
            return (
              <div key={i} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "6px 0", borderBottom: "1px solid var(--border)",
              }}>
                <span style={{ fontWeight: 700, fontSize: 13 }}>{name}</span>
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 4,
                  background: p.side === "long" ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)",
                  color: p.side === "long" ? "var(--green)" : "var(--red)",
                }}>{p.side?.toUpperCase()} x{lev}</span>
                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>${fmt(p.entry ?? 0, 4)}</span>
                <span style={{ fontSize: 11 }}>SL ${fmt(p.stop ?? 0, 4)}</span>
                <span style={{ fontSize: 11 }}>TP ${fmt(p.tp ?? 0, 4)}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Señales */}
      {data && signals.length > 0 && (
        <div style={{ padding: "8px 16px" }}>
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 6 }}>SEÑALES</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 4 }}>
            {signals.map(([sym, sig]) => {
              const score = Number(sig.score ?? 0);
              const pct = (score / 9) * 100;
              const col = score >= scMin ? "var(--green)" : score >= 4 ? "var(--amber)" : "var(--text-muted)";
              return (
                <div key={sym} style={{
                  background: "var(--surface)", borderRadius: 6, padding: "8px 10px",
                  border: "1px solid var(--border)",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontWeight: 700, fontSize: 12 }}>{sym.replace("USDT", "")}</span>
                    <span style={{ fontSize: 11, color: col, fontWeight: 700 }}>{score}/9</span>
                  </div>
                  <div style={{ height: 3, background: "var(--border)", borderRadius: 2 }}>
                    <div style={{ height: 3, borderRadius: 2, background: col, width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Últimos trades toggle */}
      {trades.length > 0 && (
        <div style={{ padding: "0 16px 12px" }}>
          <button onClick={() => setShowTrades(s => !s)} style={{
            fontSize: 11, color: "var(--text-muted)", background: "none",
            border: "none", cursor: "pointer", padding: 0, marginTop: 8,
          }}>
            {showTrades ? "▲ ocultar" : `▼ ver ${trades.length} trades`}
          </button>
          {showTrades && (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, marginTop: 8 }}>
              <thead>
                <tr>
                  {["Par", "Dir", "Est", "PnL", "R", "Fecha"].map(h => (
                    <th key={h} style={{ padding: "4px 8px", textAlign: "left", color: "var(--text-muted)", fontWeight: 500, fontSize: 11 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...trades].reverse().slice(0, 10).map((t, i) => (
                  <tr key={i} style={{ borderTop: "1px solid var(--border)" }}>
                    <td style={{ padding: "6px 8px", fontWeight: 700 }}>{(t.market ?? t.symbol ?? "—").replace("USDT", "")}</td>
                    <td style={{ padding: "6px 8px", color: t.side === "long" ? "var(--green)" : "var(--red)", fontSize: 10, fontWeight: 700 }}>{t.side?.toUpperCase()}</td>
                    <td style={{ padding: "6px 8px" }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: t.status === "TP" ? "var(--green)" : "var(--red)" }}>{t.status}</span>
                    </td>
                    <td style={{ padding: "6px 8px", color: pnlColor(t.pnl_usdt ?? 0), fontWeight: 600 }}>
                      {(t.pnl_usdt ?? 0) >= 0 ? "+" : ""}${fmt(t.pnl_usdt ?? 0)}
                    </td>
                    <td style={{ padding: "6px 8px", color: pnlColor(t.pnl_r ?? 0) }}>{(t.pnl_r ?? 0) >= 0 ? "+" : ""}{fmt(t.pnl_r ?? 0)}R</td>
                    <td style={{ padding: "6px 8px", color: "var(--text-muted)", fontSize: 10 }}>{fmtTs(t.ts_close ?? 0)}</td>
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

export default function BotsTab() {
  return (
    <div style={{ padding: 20 }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 4px" }}>Bots de Trading Cripto</h2>
        <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0 }}>
          CoinEx Futuros (LONG/SHORT x10) · Pionex Spot (paper) · Actualización automática cada 60s
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <BotCard
          title="Bot Futuros CoinEx"
          subtitle="LONG/SHORT · x10 leverage · Score ≥ 5/9"
          apiUrl="/api/server/futures"
          scoreKey="cycle_signals"
        />
        <BotCard
          title="Bot Pionex Spot"
          subtitle="Paper trading · Score ≥ 7/9"
          apiUrl="/api/server/pionex"
          scoreKey="signals_ciclo"
        />
      </div>
    </div>
  );
}
