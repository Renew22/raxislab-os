"use client";

import { useState, useEffect } from "react";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import { ExternalLink, RefreshCw } from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

type Tab = "Precios" | "Noticias";

type CoinCfg = { symbol: string; pair: string; name: string; color: string };

type Ticker = {
  symbol: string;
  lastPrice: string;
  priceChangePercent: string;
  quoteVolume: string;
  highPrice: string;
  lowPrice: string;
};

type KlinePoint = { c: number };

type NewsItem = {
  datetime: number;
  headline: string;
  source: string;
  url: string;
  image: string;
  summary: string;
};

// ─── Config ───────────────────────────────────────────────────────────────────

const COINS: CoinCfg[] = [
  { symbol: "BTC",  pair: "BTCUSDT",  name: "Bitcoin",  color: "#F7931A" },
  { symbol: "ETH",  pair: "ETHUSDT",  name: "Ethereum", color: "#627EEA" },
  { symbol: "SOL",  pair: "SOLUSDT",  name: "Solana",   color: "#9945FF" },
  { symbol: "XRP",  pair: "XRPUSDT",  name: "Ripple",   color: "#00AAE4" },
  { symbol: "DOGE", pair: "DOGEUSDT", name: "Dogecoin", color: "#C2A633" },
  { symbol: "BNB",  pair: "BNBUSDT",  name: "BNB",      color: "#F0B90B" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtPrice(p: string): string {
  const n = parseFloat(p);
  if (n >= 1_000) return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (n >= 1)     return `$${n.toFixed(4)}`;
  return `$${n.toFixed(5)}`;
}

function fmtVol(v: string): string {
  const n = parseFloat(v);
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000)     return `$${(n / 1_000_000).toFixed(2)}M`;
  return `$${(n / 1_000).toFixed(2)}K`;
}

function fmtDate(ts: number): string {
  return new Date(ts * 1000).toLocaleDateString("es-ES", {
    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
  });
}

// ─── Style constants ──────────────────────────────────────────────────────────

const CARD: React.CSSProperties = {
  background: "var(--card)", border: "1px solid var(--border)",
  borderRadius: "8px", padding: "16px",
};

const LABEL: React.CSSProperties = {
  fontSize: "11px", fontWeight: 600, letterSpacing: "0.08em",
  textTransform: "uppercase", color: "var(--text-muted)",
};

// ─── MiniLine ─────────────────────────────────────────────────────────────────

function MiniLine({ data, color }: { data: KlinePoint[]; color: string }) {
  if (!data?.length) return <div style={{ height: 48 }} />;
  return (
    <ResponsiveContainer width="100%" height={48}>
      <LineChart data={data} margin={{ top: 4, right: 0, bottom: 4, left: 0 }}>
        <Line
          type="monotone" dataKey="c" stroke={color}
          strokeWidth={1.5} dot={false} isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

// ─── CoinCard ─────────────────────────────────────────────────────────────────

function CoinCard({ coin, ticker, klines }: {
  coin: CoinCfg;
  ticker: Ticker | undefined;
  klines: KlinePoint[];
}) {
  const pct     = ticker ? parseFloat(ticker.priceChangePercent) : 0;
  const isPos   = pct >= 0;
  const pctClr  = isPos ? "var(--green)" : "var(--red)";

  return (
    <div style={CARD}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{
            width: 34, height: 34, borderRadius: "50%",
            background: coin.color + "22", border: `1px solid ${coin.color}55`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "9px", fontWeight: 700, color: coin.color,
            fontFamily: "'Space Mono', monospace", flexShrink: 0, letterSpacing: "0.03em",
          }}>
            {coin.symbol}
          </span>
          <div>
            <p style={{ ...LABEL, margin: 0 }}>{coin.symbol}</p>
            <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: 0, lineHeight: 1.3 }}>{coin.name}</p>
          </div>
        </div>
        <span style={{
          fontSize: "12px", fontWeight: 700, fontFamily: "'Space Mono', monospace",
          color: pctClr,
          background: `${isPos ? "var(--green)" : "var(--red)"}18`,
          padding: "2px 8px", borderRadius: "4px",
        }}>
          {isPos ? "+" : ""}{pct.toFixed(2)}%
        </span>
      </div>

      {/* Price */}
      <p style={{
        fontFamily: "'Space Mono', monospace", fontSize: "21px", fontWeight: 700,
        color: "var(--text)", margin: "0 0 2px 0", lineHeight: 1,
      }}>
        {ticker ? fmtPrice(ticker.lastPrice) : "—"}
      </p>

      {/* Mini chart */}
      <MiniLine data={klines} color={coin.color} />

      {/* Stats */}
      <div style={{ marginTop: "4px", display: "flex", gap: "20px" }}>
        <div>
          <p style={{ ...LABEL, fontSize: "10px", margin: "0 0 1px 0" }}>Vol 24h</p>
          <p style={{ fontSize: "11px", fontFamily: "'Space Mono', monospace", color: "var(--text-mid)", margin: 0 }}>
            {ticker ? fmtVol(ticker.quoteVolume) : "—"}
          </p>
        </div>
        <div>
          <p style={{ ...LABEL, fontSize: "10px", margin: "0 0 1px 0" }}>Máx / Mín</p>
          <p style={{ fontSize: "11px", fontFamily: "'Space Mono', monospace", color: "var(--text-mid)", margin: 0 }}>
            {ticker
              ? `${fmtPrice(ticker.highPrice)} / ${fmtPrice(ticker.lowPrice)}`
              : "—"}
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── NewsCard ─────────────────────────────────────────────────────────────────

function NewsCard({ item }: { item: NewsItem }) {
  const [imgErr, setImgErr] = useState(false);
  const hasImg = !!item.image && !imgErr;

  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      style={{ textDecoration: "none", display: "block" }}
    >
      <div style={{
        ...CARD, display: "flex", gap: "14px", alignItems: "flex-start",
        cursor: "pointer", transition: "border 0.12s",
      }}
        onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--border-accent)")}
        onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--border)")}
      >
        {hasImg && (
          <img
            src={item.image}
            alt=""
            onError={() => setImgErr(true)}
            style={{
              width: 100, height: 68, objectFit: "cover",
              borderRadius: "5px", flexShrink: 0,
            }}
          />
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            fontSize: "13px", fontWeight: 600, color: "var(--text)",
            margin: "0 0 4px 0", lineHeight: 1.4,
            overflow: "hidden", display: "-webkit-box",
            WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
          }}>
            {item.headline}
          </p>
          <p style={{
            fontSize: "12px", color: "var(--text-muted)", margin: "0 0 5px 0",
            overflow: "hidden", display: "-webkit-box",
            WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
            lineHeight: 1.45,
          }}>
            {item.summary}
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "11px", color: "var(--accent)", fontWeight: 600 }}>
              {item.source}
            </span>
            <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>·</span>
            <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
              {fmtDate(item.datetime)}
            </span>
            <ExternalLink size={11} style={{ color: "var(--text-muted)", marginLeft: "auto" }} />
          </div>
        </div>
      </div>
    </a>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function MercadoPage() {
  const [tab,         setTab]         = useState<Tab>("Precios");
  const [tickers,     setTickers]     = useState<Record<string, Ticker>>({});
  const [klines,      setKlines]      = useState<Record<string, KlinePoint[]>>({});
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [news,        setNews]        = useState<NewsItem[]>([]);
  const [newsLoading, setNewsLoading] = useState(false);
  const [newsError,   setNewsError]   = useState("");

  // ── Fetch ticker data ───────────────────────────────────────────────────────
  async function fetchTickers() {
    try {
      const results = await Promise.all(
        COINS.map(c =>
          fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${c.pair}`)
            .then(r => r.json())
        )
      );
      const map: Record<string, Ticker> = {};
      results.forEach((r, i) => { map[COINS[i].pair] = r; });
      setTickers(map);
      setLastUpdated(new Date());
    } catch {
      // silently keep previous data on network error
    }
  }

  // ── Fetch klines for mini charts ────────────────────────────────────────────
  async function fetchKlines() {
    try {
      const results = await Promise.all(
        COINS.map(c =>
          fetch(`https://api.binance.com/api/v3/klines?symbol=${c.pair}&interval=1h&limit=24`)
            .then(r => r.json())
        )
      );
      const map: Record<string, KlinePoint[]> = {};
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      results.forEach((arr: any[], i) => {
        map[COINS[i].pair] = arr.map(k => ({ c: parseFloat(k[4]) }));
      });
      setKlines(map);
    } catch {
      // silently fail — chart will render empty
    }
  }

  // ── Fetch news ──────────────────────────────────────────────────────────────
  async function fetchNews() {
    const key = process.env.NEXT_PUBLIC_FINNHUB_KEY;
    if (!key) {
      setNewsError("no_key");
      return;
    }
    setNewsLoading(true);
    setNewsError("");
    try {
      const r = await fetch(
        `https://finnhub.io/api/v1/news?category=crypto&token=${key}`
      );
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data = await r.json();
      setNews(Array.isArray(data) ? data.slice(0, 30) : []);
    } catch {
      setNewsError("fetch_error");
    } finally {
      setNewsLoading(false);
    }
  }

  // ── Prices: mount + 30s interval ────────────────────────────────────────────
  useEffect(() => {
    fetchTickers();
    fetchKlines();
    const id = setInterval(fetchTickers, 30_000);
    return () => clearInterval(id);
  }, []);

  // ── News: when tab is active + 5min interval ─────────────────────────────
  useEffect(() => {
    if (tab !== "Noticias") return;
    fetchNews();
    const id = setInterval(fetchNews, 5 * 60_000);
    return () => clearInterval(id);
  }, [tab]);

  // ── Tab bar ─────────────────────────────────────────────────────────────────
  const TABS: [Tab, string][] = [["Precios", "Precios en vivo"], ["Noticias", "Noticias"]];

  return (
    <div style={{ padding: "32px 40px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 600, color: "var(--text)", margin: "0 0 4px 0" }}>
            Mercado
          </h1>
          <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: 0 }}>
            Precios cripto en tiempo real · Noticias
          </p>
        </div>
        {tab === "Precios" && lastUpdated && (
          <span style={{ fontSize: "11px", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "5px" }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--green)", display: "inline-block" }} />
            Actualizado {lastUpdated.toLocaleTimeString("es-ES")}
          </span>
        )}
      </div>

      {/* Tab bar */}
      <div style={{ display: "flex", gap: "4px", marginBottom: "24px", borderBottom: "1px solid var(--border)", paddingBottom: "0" }}>
        {TABS.map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            style={{
              padding: "8px 18px",
              fontSize: "13px",
              fontWeight: tab === key ? 600 : 400,
              color: tab === key ? "var(--accent)" : "var(--text-muted)",
              background: "transparent",
              border: "none",
              borderBottom: tab === key ? "2px solid var(--accent)" : "2px solid transparent",
              cursor: "pointer",
              marginBottom: "-1px",
              transition: "color 0.12s",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── TAB 1: Precios ───────────────────────────────────────────────────── */}
      {tab === "Precios" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "14px" }}>
          {COINS.map(coin => (
            <CoinCard
              key={coin.pair}
              coin={coin}
              ticker={tickers[coin.pair]}
              klines={klines[coin.pair] ?? []}
            />
          ))}
        </div>
      )}

      {/* ── TAB 2: Noticias ──────────────────────────────────────────────────── */}
      {tab === "Noticias" && (
        <div>
          {/* No API key */}
          {newsError === "no_key" && (
            <div style={{
              ...CARD, textAlign: "center", padding: "48px 32px",
              color: "var(--text-muted)",
            }}>
              <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--text)", marginBottom: "8px" }}>
                API key no configurada
              </p>
              <p style={{ fontSize: "13px", margin: "0 0 12px" }}>
                Añade tu clave de Finnhub en <code style={{ background: "var(--card-hover)", padding: "2px 6px", borderRadius: "3px", fontFamily: "'Space Mono', monospace", fontSize: "12px" }}>.env.local</code>:
              </p>
              <code style={{
                background: "var(--surface)", border: "1px solid var(--border)",
                borderRadius: "5px", padding: "10px 16px", display: "inline-block",
                fontFamily: "'Space Mono', monospace", fontSize: "12px", color: "var(--accent)",
              }}>
                NEXT_PUBLIC_FINNHUB_KEY=tu_api_key
              </code>
              <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "10px" }}>
                Clave gratuita en finnhub.io
              </p>
            </div>
          )}

          {/* Fetch error */}
          {newsError === "fetch_error" && (
            <div style={{ ...CARD, textAlign: "center", padding: "32px", color: "var(--text-muted)" }}>
              <p style={{ margin: "0 0 12px" }}>Error al cargar noticias</p>
              <button
                onClick={fetchNews}
                style={{
                  display: "inline-flex", alignItems: "center", gap: "6px",
                  padding: "7px 16px", borderRadius: "5px",
                  border: "1px solid var(--border)", background: "transparent",
                  color: "var(--text-muted)", cursor: "pointer", fontSize: "12px",
                }}
              >
                <RefreshCw size={13} /> Reintentar
              </button>
            </div>
          )}

          {/* Loading */}
          {newsLoading && !newsError && (
            <div style={{ textAlign: "center", padding: "48px", color: "var(--text-muted)", fontSize: "13px" }}>
              Cargando noticias…
            </div>
          )}

          {/* News list */}
          {!newsLoading && !newsError && news.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {news.map(item => (
                <NewsCard key={item.datetime + item.headline} item={item} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
