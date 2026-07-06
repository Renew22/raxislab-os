"use client";

import { useState, useEffect } from "react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface TechnicalScore {
  ticker: string;
  score: number; // 0-100
  price: number | null;
  sma200: number | null;
  rsi14: number | null;
  ema20: number | null;
  ema21: number | null; // fallback ema50 if 21 not available
  volume: number | null;
  vwap: number | null;
  criteria: { label: string; ok: boolean; value: string }[];
  trend: string;
  loading: boolean;
  error: string | null;
}

interface EarningsEvent {
  symbol: string;
  date: string;
  horario: string;
  epsEstimate: number | null;
}

interface InsiderBuy {
  filingDate: string; tradeDate: string; ticker: string; company: string;
  insiderName: string; title: string; value: number; qty: number; price: number; score: number;
}

interface NewsItem {
  id: string; publisher: string; title: string;
  published_utc: string; article_url: string; tickers: string[];
}

// ── Watchlist default ─────────────────────────────────────────────────────────

// Cartera real IBKR (US tickers con datos en Polygon) — 2026-06-30
// EU positions (BBVA.MC, AI.PA, etc.) no tienen cobertura técnica en Polygon free tier
const DEFAULT_WATCHLIST = [
  "CRCL","RCUS","KEEL","AAOI","SWKS","INTC","BE","MO",
];

// ── Styles ────────────────────────────────────────────────────────────────────

const CARD  = { background:"var(--card)", border:"1px solid var(--border)", borderRadius:"6px" } as React.CSSProperties;
const LABEL = { fontSize:"11px", fontWeight:600, letterSpacing:"0.08em", textTransform:"uppercase" as const, color:"var(--text-muted)" };
const MONO  = { fontFamily:"'Space Mono', monospace" } as React.CSSProperties;

function scoreColor(s: number) {
  if (s >= 80) return "var(--green)";
  if (s >= 60) return "var(--amber)";
  if (s >= 40) return "var(--accent)";
  return "var(--red)";
}

function scoreBadge(s: number) {
  if (s >= 80) return "🟢";
  if (s >= 60) return "🟡";
  return "🔴";
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ScoreTab() {
  const [watchlist, setWatchlist]       = useState<string[]>(() => {
    if (typeof window === "undefined") return DEFAULT_WATCHLIST;
    const saved = localStorage.getItem("raxislab_watchlist_se_v2");
    return saved ? JSON.parse(saved) : DEFAULT_WATCHLIST;
  });
  const [scores, setScores]             = useState<Record<string, TechnicalScore>>({});
  const [earnings, setEarnings]         = useState<EarningsEvent[]>([]);
  const [earningsLoading, setEarningsLoading] = useState(false);
  const [earningsError, setEarningsError]     = useState<string | null>(null);
  const [insiders, setInsiders]         = useState<InsiderBuy[]>([]);
  const [insidersLoading, setInsidersLoading] = useState(false);
  const [insidersError, setInsidersError]     = useState<string | null>(null);
  const [news, setNews]                 = useState<NewsItem[]>([]);
  const [newsLoading, setNewsLoading]   = useState(false);
  const [newTicker, setNewTicker]       = useState("");
  const [loading, setLoading]           = useState(false);
  const [lastUpdate, setLastUpdate]     = useState<string | null>(null);
  const [notifPerm, setNotifPerm]       = useState<NotificationPermission>("default");

  useEffect(() => {
    if (typeof window === "undefined") return;
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => {});
    if ("Notification" in window) setNotifPerm(Notification.permission);
  }, []);

  async function enableNotifications() {
    if (!("Notification" in window)) return;
    const perm = await Notification.requestPermission();
    setNotifPerm(perm);
  }

  function fireNotif(title: string, body: string) {
    if (notifPerm !== "granted") return;
    if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type:"SHOW_NOTIF", title, body });
    } else {
      new Notification(title, { body, icon:"/logo.png" });
    }
  }

  async function fetchScores(tickers: string[]) {
    setLoading(true);
    const results = await Promise.allSettled(
      tickers.map(t => fetch(`/api/polygon/technicals?ticker=${t}`).then(r => r.json()))
    );
    const map: Record<string, TechnicalScore> = {};
    results.forEach((r, i) => {
      const t = tickers[i];
      if (r.status === "fulfilled" && !r.value.error) {
        const d = r.value;
        // Score: 20 pts per criterion
        const criteria = [
          { label:"Precio > SMA200",    ok: d.price && d.sma200 ? d.price > d.sma200 : false, value: d.sma200 ? `$${Number(d.sma200).toFixed(2)}` : "—" },
          { label:"RSI 35-65 (óptimo)", ok: d.rsi14  ? d.rsi14 >= 35 && d.rsi14 <= 65 : false, value: d.rsi14 ? d.rsi14.toFixed(1) : "—" },
          { label:"EMA20 > EMA50",      ok: d.ema20  && d.ema50  ? d.ema20 > d.ema50 : false, value: d.ema20 ? `$${Number(d.ema20).toFixed(2)}` : "—" },
          { label:"Volumen > media",    ok: false, value: d.volume ? Number(d.volume).toLocaleString("es-ES") : "—" }, // no avg available here
          { label:"Precio > VWAP",      ok: d.price && d.vwap   ? d.price > d.vwap : false, value: d.vwap ? `$${Number(d.vwap).toFixed(2)}` : "—" },
        ];
        const score = criteria.filter(c => c.ok).length * 20;
        map[t] = { ticker:t, score, price:d.price, sma200:d.sma200, rsi14:d.rsi14, ema20:d.ema20, ema21:d.ema50, volume:d.volume, vwap:d.vwap, criteria, trend:d.trend, loading:false, error:null };
      } else {
        map[t] = { ticker:t, score:0, price:null, sma200:null, rsi14:null, ema20:null, ema21:null, volume:null, vwap:null, criteria:[], trend:"—", loading:false, error: r.status === "fulfilled" ? (r.value.error ?? "Error") : "Error de red" };
      }
    });
    setScores(prev => {
      // Fire notification for tickers that crossed ≥80 or ≤20
      Object.values(map).forEach(s => {
        if (!s.error && s.score >= 80) {
          fireNotif(`🟢 ${s.ticker} Score ${s.score}/100`, `Confluencia técnica alta — precio $${s.price?.toFixed(2) ?? "—"}`);
        } else if (!s.error && s.score <= 20) {
          fireNotif(`🔴 ${s.ticker} Score ${s.score}/100`, `Score técnico muy bajo — revisar posición`);
        }
      });
      return { ...prev, ...map };
    });
    setLastUpdate(new Date().toLocaleTimeString("es-ES"));
    setLoading(false);
  }

  async function fetchInsiders() {
    setInsidersLoading(true); setInsidersError(null);
    try {
      const r = await fetch("/api/openinsider");
      const j = await r.json();
      if (j.error) { setInsidersError(j.error); return; }
      setInsiders(j.insiders ?? []);
    } catch (e) { setInsidersError(String(e)); }
    finally { setInsidersLoading(false); }
  }

  async function fetchNews() {
    setNewsLoading(true);
    try {
      // Fetch news for all watchlist tickers, merge and dedupe
      const results = await Promise.allSettled(
        watchlist.map(t => fetch(`/api/polygon/news?ticker=${t}&limit=5`).then(r => r.json()))
      );
      const all: NewsItem[] = [];
      const seen = new Set<string>();
      results.forEach(r => {
        if (r.status === "fulfilled" && r.value.results) {
          r.value.results.forEach((n: NewsItem) => {
            if (!seen.has(n.id)) { seen.add(n.id); all.push(n); }
          });
        }
      });
      all.sort((a, b) => new Date(b.published_utc).getTime() - new Date(a.published_utc).getTime());
      setNews(all.slice(0, 20));
    } catch { /* silent */ }
    finally { setNewsLoading(false); }
  }

  async function fetchEarnings() {
    setEarningsLoading(true); setEarningsError(null);
    try {
      const res  = await fetch("/api/finnhub/earnings?from=" + getDateOffset(0) + "&to=" + getDateOffset(14));
      const json = await res.json();
      if (json.error) { setEarningsError(json.error + (json._debug?.note ? " — " + json._debug.note : "")); return; }
      // Filter to watchlist
      const filtered = (json.calendar ?? []).filter((e: EarningsEvent) => watchlist.includes(e.symbol));
      setEarnings(filtered.length > 0 ? filtered : json.calendar?.slice(0, 20) ?? []);
    } catch (e) { setEarningsError(String(e)); }
    finally { setEarningsLoading(false); }
  }

  useEffect(() => {
    fetchScores(watchlist);
    fetchEarnings();
    fetchInsiders();
    fetchNews();
  }, []);

  function addTicker() {
    const t = newTicker.toUpperCase().trim();
    if (!t || watchlist.includes(t)) { setNewTicker(""); return; }
    const next = [...watchlist, t];
    setWatchlist(next);
    localStorage.setItem("raxislab_watchlist_se_v2", JSON.stringify(next));
    fetchScores([t]);
    setNewTicker("");
  }

  function removeTicker(t: string) {
    const next = watchlist.filter(x => x !== t);
    setWatchlist(next);
    localStorage.setItem("raxislab_watchlist_se_v2", JSON.stringify(next));
    setScores(prev => { const n = { ...prev }; delete n[t]; return n; });
  }

  const sortedScores = watchlist.map(t => scores[t]).filter(Boolean).sort((a, b) => b.score - a.score);
  const topCandidates = sortedScores.filter(s => s.score >= 80);
  const earningsThisWeek = earnings.filter(e => {
    const d = new Date(e.date); const now = new Date();
    return d >= now && d <= new Date(now.getTime() + 7*86400000);
  });

  return (
    <div style={{ padding:"32px 40px", display:"flex", flexDirection:"column", gap:"24px" }}>
      {/* Header */}
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between" }}>
        <div>
          <h1 style={{ fontSize:"24px", fontWeight:600, color:"var(--text)", margin:"0 0 4px" }}>Score Engine</h1>
          <p style={{ fontSize:"13px", color:"var(--text-muted)", margin:0 }}>
            Score técnico 0-100 · Earnings · Insider buys · Catalizadores
            {lastUpdate && <span style={{ marginLeft:"8px", color:"var(--accent)" }}>· Actualizado {lastUpdate}</span>}
          </p>
        </div>
        <div style={{ display:"flex", gap:"8px", alignItems:"center" }}>
          {notifPerm !== "granted" ? (
            <button onClick={enableNotifications} style={{ padding:"8px 14px", borderRadius:"6px", border:"1px solid var(--border)", background:"transparent", color:"var(--text-muted)", fontSize:"12px", cursor:"pointer" }}>
              🔔 Activar alertas
            </button>
          ) : (
            <span style={{ fontSize:"12px", color:"var(--green)", display:"flex", alignItems:"center", gap:"4px" }}>
              <span style={{ width:6, height:6, borderRadius:"50%", background:"var(--green)", display:"inline-block" }}/>
              Alertas activas
            </span>
          )}
          <button onClick={() => fetchScores(watchlist)} disabled={loading} style={{ padding:"8px 16px", borderRadius:"6px", border:"1px solid var(--border-accent)", background:"var(--accent-dim)", color:"var(--accent)", fontSize:"12px", fontWeight:600, cursor:loading?"not-allowed":"pointer" }}>
            {loading ? "Actualizando..." : "Actualizar scores"}
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"12px" }}>
        {[
          { l:"Tickers watchlist", v:watchlist.length, c:"var(--text)" },
          { l:"Score ≥80 🟢",      v:topCandidates.length, c:"var(--green)" },
          { l:"Earnings 7 días",   v:earningsThisWeek.length, c:"var(--amber)" },
          { l:"Score medio",       v: sortedScores.length > 0 ? Math.round(sortedScores.reduce((s,x)=>s+x.score,0)/sortedScores.length) : 0, c:"var(--accent)" },
        ].map(({l,v,c}) => (
          <div key={l} style={{ ...CARD, padding:"16px 20px" }}>
            <p style={{ ...LABEL, marginBottom:"6px" }}>{l}</p>
            <p style={{ ...MONO, fontSize:"28px", fontWeight:700, color:c, margin:0 }}>{v}</p>
          </div>
        ))}
      </div>

      {/* Confluencias máximas */}
      {topCandidates.length > 0 && (
        <div style={{ padding:"14px 18px", borderRadius:"6px", background:"rgba(0,230,118,0.06)", border:"1px solid rgba(0,230,118,0.25)" }}>
          <p style={{ fontSize:"13px", fontWeight:700, color:"var(--green)", margin:"0 0 8px" }}>🔥 Candidatos destacados — Score ≥80</p>
          <div style={{ display:"flex", gap:"8px", flexWrap:"wrap" }}>
            {topCandidates.map(s => (
              <span key={s.ticker} style={{ ...MONO, padding:"4px 12px", borderRadius:"4px", background:"rgba(0,230,118,0.12)", color:"var(--green)", fontSize:"13px", fontWeight:700 }}>
                {s.ticker} {s.score}/100
                {earningsThisWeek.find(e => e.symbol === s.ticker) ? " ⚠️ EARNINGS" : ""}
              </span>
            ))}
          </div>
        </div>
      )}

      <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr", gap:"20px", alignItems:"flex-start" }}>
        {/* Score table */}
        <div style={{ ...CARD, overflow:"hidden" }}>
          <div style={{ padding:"12px 16px", borderBottom:"1px solid var(--border)", display:"flex", alignItems:"center", gap:"12px" }}>
            <p style={{ ...LABEL, margin:0, flex:1 }}>Score técnico por ticker</p>
            <div style={{ display:"flex", gap:"6px" }}>
              <input value={newTicker} onChange={e => setNewTicker(e.target.value)}
                onKeyDown={e => e.key === "Enter" && addTicker()}
                placeholder="Añadir ticker..." style={{ padding:"5px 10px", borderRadius:"4px", border:"1px solid var(--border)", background:"var(--surface)", color:"var(--text)", fontSize:"12px", outline:"none", width:"120px" }}/>
              <button onClick={addTicker} style={{ padding:"5px 12px", borderRadius:"4px", border:"none", background:"var(--accent)", color:"#000", fontSize:"12px", fontWeight:600, cursor:"pointer" }}>+</button>
            </div>
          </div>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead>
              <tr>{["Ticker","Score","Precio","SMA200","RSI14","EMA20/50","Tendencia",""].map(h => (
                <th key={h} style={{ padding:"8px 12px", textAlign:"left", fontSize:"10px", fontWeight:600, color:"var(--text-muted)", borderBottom:"1px solid var(--border)" }}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {sortedScores.map(s => (
                <tr key={s.ticker} style={{ borderBottom:"1px solid var(--border)" }}>
                  <td style={{ padding:"10px 12px" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:"6px" }}>
                      <span style={{ ...MONO, fontWeight:700, color:"var(--accent)", fontSize:"13px" }}>{s.ticker}</span>
                      {earningsThisWeek.find(e => e.symbol === s.ticker) && (
                        <span style={{ fontSize:"9px", fontWeight:700, padding:"1px 5px", borderRadius:"3px", background:"rgba(251,191,36,0.15)", color:"var(--amber)" }}>EARN</span>
                      )}
                    </div>
                  </td>
                  <td style={{ padding:"10px 12px" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:"6px" }}>
                      <span style={{ fontSize:"14px" }}>{scoreBadge(s.score)}</span>
                      <span style={{ ...MONO, fontWeight:700, fontSize:"15px", color:scoreColor(s.score) }}>{s.score}</span>
                    </div>
                  </td>
                  <td style={{ padding:"10px 12px", ...MONO, fontSize:"13px", color:"var(--text)" }}>{s.price ? `$${s.price.toFixed(2)}` : s.error ? <span style={{ color:"var(--red)", fontSize:"11px" }}>{s.error.slice(0,20)}</span> : "—"}</td>
                  <td style={{ padding:"10px 12px", ...MONO, fontSize:"12px", color: s.price && s.sma200 ? (s.price > s.sma200 ? "var(--green)" : "var(--red)") : "var(--text-muted)" }}>{s.sma200 ? `$${s.sma200.toFixed(2)}` : "—"}</td>
                  <td style={{ padding:"10px 12px", ...MONO, fontSize:"12px", color: s.rsi14 ? (s.rsi14 >= 35 && s.rsi14 <= 65 ? "var(--green)" : s.rsi14 >= 70 ? "var(--red)" : "var(--amber)") : "var(--text-muted)" }}>{s.rsi14 ? s.rsi14.toFixed(1) : "—"}</td>
                  <td style={{ padding:"10px 12px", ...MONO, fontSize:"12px", color: s.ema20 && s.ema21 ? (s.ema20 > s.ema21 ? "var(--green)" : "var(--red)") : "var(--text-muted)" }}>{s.ema20 ? `$${s.ema20.toFixed(1)}` : "—"}</td>
                  <td style={{ padding:"10px 12px" }}>
                    <span style={{ fontSize:"10px", fontWeight:600, padding:"2px 6px", borderRadius:"3px", background:"var(--accent-dim)", color:"var(--accent)" }}>{s.trend}</span>
                  </td>
                  <td style={{ padding:"10px 12px" }}>
                    <button onClick={() => removeTicker(s.ticker)} style={{ padding:"3px 8px", borderRadius:"4px", border:"1px solid var(--border)", background:"transparent", color:"var(--text-muted)", cursor:"pointer", fontSize:"11px" }}>×</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Earnings panel */}
        <div style={{ ...CARD, overflow:"hidden" }}>
          <div style={{ padding:"12px 16px", borderBottom:"1px solid var(--border)", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <p style={{ ...LABEL, margin:0 }}>Earnings próximos (14d)</p>
            <button onClick={fetchEarnings} disabled={earningsLoading} style={{ fontSize:"11px", color:"var(--accent)", background:"none", border:"none", cursor:"pointer" }}>
              {earningsLoading ? "..." : "↺"}
            </button>
          </div>
          {earningsError && (
            <div style={{ padding:"12px 16px" }}>
              <p style={{ fontSize:"12px", color:"var(--red)", margin:0 }}>{earningsError}</p>
              <p style={{ fontSize:"11px", color:"var(--text-muted)", margin:"6px 0 0" }}>
                Verifica que <code style={{ background:"var(--surface)", padding:"1px 4px", borderRadius:"3px" }}>NEXT_PUBLIC_FINNHUB_KEY</code> está configurado en Vercel → Settings → Environment Variables.
              </p>
            </div>
          )}
          {!earningsLoading && !earningsError && earnings.length === 0 && (
            <p style={{ padding:"16px", fontSize:"12px", color:"var(--text-muted)" }}>Sin earnings en watchlist en los próximos 14 días.</p>
          )}
          <div style={{ display:"flex", flexDirection:"column" }}>
            {earnings.slice(0, 15).map((e, i) => {
              const inWatchlist = watchlist.includes(e.symbol);
              return (
                <div key={i} style={{ padding:"10px 14px", borderBottom:"1px solid var(--border)", display:"flex", justifyContent:"space-between", alignItems:"center", background: inWatchlist ? "rgba(0,87,255,0.04)" : "transparent" }}>
                  <div>
                    <p style={{ ...MONO, fontWeight:700, fontSize:"13px", color: inWatchlist ? "var(--accent)" : "var(--text-mid)", margin:"0 0 2px" }}>
                      {e.symbol} {inWatchlist && <span style={{ fontSize:"9px", color:"var(--accent)", fontWeight:600 }}>WL</span>}
                    </p>
                    <p style={{ fontSize:"11px", color:"var(--text-muted)", margin:0 }}>{e.date} · {e.horario}</p>
                  </div>
                  {e.epsEstimate !== null && (
                    <span style={{ ...MONO, fontSize:"11px", color:"var(--text-muted)" }}>EPS est. {e.epsEstimate}</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Insider Buys — OpenInsider */}
      <div style={{ ...CARD, overflow:"hidden" }}>
        <div style={{ padding:"12px 16px", borderBottom:"1px solid var(--border)", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <p style={{ ...LABEL, margin:0 }}>Insider Buys — últimos 14 días &gt;$100K</p>
          <button onClick={fetchInsiders} disabled={insidersLoading} style={{ fontSize:"11px", color:"var(--accent)", background:"none", border:"none", cursor:"pointer" }}>
            {insidersLoading ? "..." : "↺"}
          </button>
        </div>
        {insidersError && (
          <p style={{ padding:"12px 16px", fontSize:"12px", color:"var(--red)", margin:0 }}>Error: {insidersError}</p>
        )}
        {!insidersLoading && !insidersError && insiders.length === 0 && (
          <p style={{ padding:"14px 16px", fontSize:"12px", color:"var(--text-muted)", margin:0 }}>Sin insider buys &gt;$100K en los últimos 14 días.</p>
        )}
        {insiders.length > 0 && (
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead>
              <tr>{["Ticker","Insider","Cargo","Valor","Precio","Fecha","Score"].map(h => (
                <th key={h} style={{ padding:"7px 12px", textAlign:"left", fontSize:"10px", fontWeight:600, color:"var(--text-muted)", borderBottom:"1px solid var(--border)" }}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {insiders.slice(0, 15).map((ins, i) => {
                const inWatchlist = watchlist.includes(ins.ticker);
                const scoreColors = ["","var(--text-muted)","var(--amber)","var(--green)"];
                return (
                  <tr key={i} style={{ borderBottom:"1px solid var(--border)", background: inWatchlist ? "rgba(0,87,255,0.04)" : "transparent" }}>
                    <td style={{ padding:"8px 12px" }}>
                      <span style={{ ...MONO, fontWeight:700, color: inWatchlist ? "var(--accent)" : "var(--text)", fontSize:"13px" }}>
                        {ins.ticker} {inWatchlist && <span style={{ fontSize:"8px", color:"var(--accent)" }}>WL</span>}
                      </span>
                    </td>
                    <td style={{ padding:"8px 12px", fontSize:"12px", color:"var(--text)" }}>{ins.insiderName}</td>
                    <td style={{ padding:"8px 12px", fontSize:"11px", color:"var(--text-muted)" }}>{ins.title.slice(0, 22)}</td>
                    <td style={{ padding:"8px 12px", ...MONO, fontSize:"12px", color:"var(--green)", fontWeight:600 }}>
                      ${(ins.value / 1000).toFixed(0)}K
                    </td>
                    <td style={{ padding:"8px 12px", ...MONO, fontSize:"12px", color:"var(--text-muted)" }}>${ins.price.toFixed(2)}</td>
                    <td style={{ padding:"8px 12px", fontSize:"11px", color:"var(--text-muted)" }}>{ins.tradeDate}</td>
                    <td style={{ padding:"8px 12px" }}>
                      <span style={{ fontSize:"13px" }}>{"⭐".repeat(ins.score)}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Noticias — Polygon Starter */}
      <div style={{ ...CARD, overflow:"hidden" }}>
        <div style={{ padding:"12px 16px", borderBottom:"1px solid var(--border)", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <p style={{ ...LABEL, margin:0 }}>Noticias watchlist (Polygon)</p>
          <button onClick={fetchNews} disabled={newsLoading} style={{ fontSize:"11px", color:"var(--accent)", background:"none", border:"none", cursor:"pointer" }}>
            {newsLoading ? "..." : "↺"}
          </button>
        </div>
        {!newsLoading && news.length === 0 && (
          <p style={{ padding:"14px 16px", fontSize:"12px", color:"var(--text-muted)", margin:0 }}>Sin noticias recientes en watchlist.</p>
        )}
        <div style={{ display:"flex", flexDirection:"column" }}>
          {news.slice(0, 12).map((n, i) => {
            const ts   = new Date(n.published_utc);
            const diff = Math.floor((Date.now() - ts.getTime()) / 60000);
            const timeStr = diff < 60 ? `${diff}m` : diff < 1440 ? `${Math.floor(diff/60)}h` : `${Math.floor(diff/1440)}d`;
            const tks = (n.tickers ?? []).filter((t: string) => watchlist.includes(t));
            return (
              <div key={n.id ?? i} style={{ padding:"10px 14px", borderBottom:"1px solid var(--border)", display:"flex", gap:"12px", alignItems:"flex-start" }}>
                <div style={{ flex:1 }}>
                  <div style={{ display:"flex", gap:"6px", flexWrap:"wrap", marginBottom:"4px" }}>
                    {tks.map((t: string) => (
                      <span key={t} style={{ ...MONO, fontSize:"9px", fontWeight:700, padding:"1px 5px", borderRadius:"3px", background:"var(--accent-dim)", color:"var(--accent)" }}>{t}</span>
                    ))}
                  </div>
                  <a href={n.article_url as string} target="_blank" rel="noopener noreferrer"
                     style={{ fontSize:"13px", color:"var(--text)", textDecoration:"none", lineHeight:1.4, display:"block" }}>
                    {n.title as string}
                  </a>
                  <p style={{ fontSize:"11px", color:"var(--text-muted)", margin:"3px 0 0" }}>{n.publisher} · {timeStr}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function getDateOffset(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

