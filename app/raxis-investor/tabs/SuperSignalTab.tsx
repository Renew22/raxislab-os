"use client";
import { useEffect, useState } from "react";

interface Signal {
  id: number;
  ts: string;
  ticker: string;
  source: "python" | "tradingview";
  signal_type: "WATCH" | "LONG";
  score: number | null;
  price_entry: number;
  price_1d: number | null;
  price_2d: number | null;
  pct_1d: number | null;
  pct_2d: number | null;
  hit_5pct: number;
  hit_10pct: number;
  catalyst: string | null;
}

interface Stats {
  total: number | null;
  hit5: number | null;
  hit10: number | null;
  avg1d: number | null;
  avg2d: number | null;
}

interface Data {
  python: Stats;
  tradingview: Stats;
  recent: Signal[];
}

function pct(n: number | null) {
  if (n == null) return "—";
  const c = n >= 5 ? "#4ade80" : n >= 0 ? "#a3e635" : "#f87171";
  return <span style={{ color: c }}>{n > 0 ? "+" : ""}{n.toFixed(1)}%</span>;
}

function StatsCard({ label, s, color }: { label: string; s: Stats; color: string }) {
  const total  = s.total ?? 0;
  const hit5   = s.hit5  ?? 0;
  const hit10  = s.hit10 ?? 0;
  const pct5   = total ? Math.round(hit5 / total * 100) : 0;
  const pct10  = total ? Math.round(hit10 / total * 100) : 0;

  return (
    <div style={{ background: "var(--card)", border: `1px solid ${color}40`, borderRadius: 12, padding: "16px 20px", flex: 1, minWidth: 200 }}>
      <div style={{ fontSize: 12, color, fontWeight: 700, marginBottom: 10, textTransform: "uppercase", letterSpacing: 1 }}>
        {label}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <Stat label="Señales" value={String(total)} />
        <Stat label="Hit +5%" value={`${pct5}%`} color={pct5 >= 50 ? "#4ade80" : "#f87171"} />
        <Stat label="Hit +10%" value={`${pct10}%`} color={pct10 >= 30 ? "#4ade80" : "#f87171"} />
        <Stat label="Avg 1d" value={s.avg1d != null ? `${s.avg1d > 0 ? "+" : ""}${s.avg1d.toFixed(1)}%` : "—"} color={s.avg1d != null && s.avg1d > 0 ? "#4ade80" : "#f87171"} />
      </div>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 700, color: color || "var(--text)" }}>{value}</div>
    </div>
  );
}

export default function SuperSignalTab() {
  const [data, setData]     = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [tvForm, setTvForm] = useState({ ticker: "", price: "", signal_type: "LONG" });
  const [tvMsg, setTvMsg]   = useState("");

  const fetchData = () => {
    setLoading(true);
    fetch("/api/server/signals")
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const addTvSignal = async () => {
    if (!tvForm.ticker || !tvForm.price) return;
    const r = await fetch("/api/server/signals", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ ticker: tvForm.ticker.toUpperCase(), price: parseFloat(tvForm.price), signal_type: tvForm.signal_type }),
    });
    if (r.ok) {
      setTvMsg("✅ Señal TradingView añadida");
      setTvForm({ ticker: "", price: "", signal_type: "LONG" });
      setTimeout(() => { setTvMsg(""); fetchData(); }, 1500);
    }
  };

  const C = { bg: "var(--bg)", card: "var(--card)", border: "var(--border)", text: "var(--text)", muted: "var(--text-muted)" };

  return (
    <div style={{ padding: "0 0 40px" }}>

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>SuperSignal — A/B Tracker</h2>
        <p style={{ color: C.muted, fontSize: 13, margin: "4px 0 0" }}>
          Compara señales Python vs TradingView. Señales Python se auto-registran. Las de TV las añades tú manualmente o vía webhook.
        </p>
      </div>

      {/* Stats cards */}
      {data && (
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 24 }}>
          <StatsCard label="🐍 Python (SuperSignal)" s={data.python}       color="#a78bfa" />
          <StatsCard label="📺 TradingView"           s={data.tradingview}  color="#60a5fa" />
        </div>
      )}

      {/* Añadir señal TV manual */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "14px 16px", marginBottom: 24 }}>
        <div style={{ fontSize: 12, color: C.muted, marginBottom: 10, fontWeight: 600 }}>
          AÑADIR SEÑAL TRADINGVIEW
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div>
            <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>Ticker</div>
            <input value={tvForm.ticker} onChange={e => setTvForm(f => ({ ...f, ticker: e.target.value.toUpperCase() }))}
              placeholder="NVDA" style={{ width: 80, padding: "6px 10px", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 6, color: C.text, fontSize: 13 }} />
          </div>
          <div>
            <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>Precio entrada</div>
            <input value={tvForm.price} onChange={e => setTvForm(f => ({ ...f, price: e.target.value }))}
              placeholder="150.00" type="number" style={{ width: 100, padding: "6px 10px", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 6, color: C.text, fontSize: 13 }} />
          </div>
          <div>
            <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>Tipo</div>
            <select value={tvForm.signal_type} onChange={e => setTvForm(f => ({ ...f, signal_type: e.target.value }))}
              style={{ padding: "6px 10px", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 6, color: C.text, fontSize: 13 }}>
              <option value="LONG">LONG</option>
              <option value="WATCH">WATCH</option>
            </select>
          </div>
          <button onClick={addTvSignal}
            style={{ padding: "7px 18px", background: "#3b82f6", color: "#fff", border: "none", borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            Añadir
          </button>
          {tvMsg && <span style={{ fontSize: 13, color: "#4ade80" }}>{tvMsg}</span>}
        </div>
      </div>

      {/* Tabla señales recientes */}
      {loading && <div style={{ color: C.muted, fontSize: 13 }}>Cargando señales...</div>}
      {!loading && (!data?.recent?.length) && (
        <div style={{ color: C.muted, fontSize: 13 }}>
          Sin señales aún. Las señales Python se registran automáticamente cada noche. Añade las de TV manualmente.
        </div>
      )}
      {!loading && data?.recent && data.recent.length > 0 && (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                {["Fecha","Ticker","Fuente","Tipo","Score","Entrada","Δ1d","Δ2d","Hit5%","Hit10%","Catalizador"].map(h => (
                  <th key={h} style={{ padding: "8px 10px", textAlign: "left", color: C.muted, fontWeight: 600, whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.recent.map(s => (
                <tr key={s.id} style={{ borderBottom: `1px solid ${C.border}20` }}>
                  <td style={{ padding: "8px 10px", color: C.muted, whiteSpace: "nowrap" }}>{s.ts.slice(0, 10)}</td>
                  <td style={{ padding: "8px 10px", fontWeight: 700 }}>{s.ticker}</td>
                  <td style={{ padding: "8px 10px" }}>
                    <span style={{ padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600,
                      background: s.source === "python" ? "#a78bfa30" : "#3b82f630",
                      color: s.source === "python" ? "#a78bfa" : "#60a5fa" }}>
                      {s.source === "python" ? "🐍 Python" : "📺 TV"}
                    </span>
                  </td>
                  <td style={{ padding: "8px 10px" }}>
                    <span style={{ color: s.signal_type === "LONG" ? "#4ade80" : "#facc15" }}>
                      {s.signal_type === "LONG" ? "🟢" : "🟡"} {s.signal_type}
                    </span>
                  </td>
                  <td style={{ padding: "8px 10px", textAlign: "center" }}>{s.score ?? "—"}/7</td>
                  <td style={{ padding: "8px 10px" }}>${s.price_entry.toFixed(2)}</td>
                  <td style={{ padding: "8px 10px" }}>{pct(s.pct_1d)}</td>
                  <td style={{ padding: "8px 10px" }}>{pct(s.pct_2d)}</td>
                  <td style={{ padding: "8px 10px", textAlign: "center" }}>{s.hit_5pct ? "✅" : "—"}</td>
                  <td style={{ padding: "8px 10px", textAlign: "center" }}>{s.hit_10pct ? "✅" : "—"}</td>
                  <td style={{ padding: "8px 10px", color: C.muted, maxWidth: 250, fontSize: 11 }}>
                    {s.catalyst ? s.catalyst.slice(0, 120) + (s.catalyst.length > 120 ? "…" : "") : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Info webhook TV */}
      <div style={{ marginTop: 24, padding: "12px 16px", background: C.card, border: `1px solid ${C.border}`, borderRadius: 8 }}>
        <div style={{ fontSize: 12, color: C.muted, fontWeight: 600, marginBottom: 6 }}>WEBHOOK PARA TRADINGVIEW (automático)</div>
        <div style={{ fontSize: 12, color: C.muted, fontFamily: "monospace" }}>
          URL: POST https://raxislab-os-v2.vercel.app/api/server/signals<br />
          Body: {`{"ticker":"{{ticker}}","price":{{close}},"signal_type":"LONG"}`}
        </div>
      </div>
    </div>
  );
}
