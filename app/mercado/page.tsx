"use client";

import { useState, useEffect } from "react";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import { ExternalLink, RefreshCw } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = "Precios" | "Acciones" | "Noticias";

type CoinCfg = { symbol: string; pair: string; name: string; color: string };

type BinanceTicker = {
  symbol: string;
  lastPrice: string;
  priceChangePercent: string;
  quoteVolume: string;
  highPrice: string;
  lowPrice: string;
};

type KlinePoint = { c: number };

type StockCfg = {
  symbol: string;   // Finnhub symbol (e.g. "BBVA.MC")
  display: string;  // Short label shown on card
  name: string;
  region: "US" | "EU";
};

type FinnhubQuote = {
  c: number;   // current price
  d: number;   // change
  dp: number;  // percent change
  h: number;   // day high
  l: number;   // day low
  o: number;   // open
  pc: number;  // previous close
  t: number;   // timestamp
};

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

const STOCKS: StockCfg[] = [
  // US — Finnhub free plan works
  { symbol: "HOOD", display: "HOOD", name: "Robinhood Markets",     region: "US" },
  { symbol: "MRVL", display: "MRVL", name: "Marvell Technology",    region: "US" },
  { symbol: "AVGO", display: "AVGO", name: "Broadcom Inc",          region: "US" },
  { symbol: "FLEX", display: "FLEX", name: "Flex Ltd",              region: "US" },
  { symbol: "CRWD", display: "CRWD", name: "CrowdStrike Holdings",  region: "US" },
  { symbol: "HIMS", display: "HIMS", name: "Hims & Hers Health",    region: "US" },
  { symbol: "CRCL", display: "CRCL", name: "Circle Internet Group", region: "US" },
  { symbol: "RKLB", display: "RKLB", name: "Rocket Lab USA",        region: "US" },
  { symbol: "LUNR", display: "LUNR", name: "Intuitive Machines",    region: "US" },
  { symbol: "MO",   display: "MO",   name: "Altria Group",          region: "US" },
  // EU — puede requerir plan de pago en Finnhub
  { symbol: "BBVA.MC",  display: "BBVA",  name: "Banco Bilbao",  region: "EU" },
  { symbol: "AI.PA",    display: "AI",    name: "Air Liquide",   region: "EU" },
  { symbol: "ENGI.PA",  display: "ENGI",  name: "Engie SA",      region: "EU" },
  { symbol: "LOG.MC",   display: "LOG",   name: "Logista",       region: "EU" },
  { symbol: "ENI.MI",   display: "ENI",   name: "ENI SpA",       region: "EU" },
  { symbol: "REP.MC",   display: "REP",   name: "Repsol SA",     region: "EU" },
];

// Portfolio summary — actualiza manualmente hasta tener conexión IBKR real
const CARTERA_VALOR = "—";
const CARTERA_PNL   = "+542,56 €";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtCryptoPrice(p: string): string {
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

function fmtStockPrice(n: number, region: "US" | "EU"): string {
  const s = n >= 1_000
    ? n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : n.toFixed(2);
  return region === "US" ? `$${s}` : `${s} €`;
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

const MONO: React.CSSProperties = {
  fontFamily: "'Space Mono', monospace",
};

// ─── MiniLine ─────────────────────────────────────────────────────────────────

function MiniLine({ data, color }: { data: KlinePoint[]; color: string }) {
  if (!data?.length) return <div style={{ height: 48 }} />;
  return (
    <ResponsiveContainer width="100%" height={48}>
      <LineChart data={data} margin={{ top: 4, right: 0, bottom: 4, left: 0 }}>
        <Line type="monotone" dataKey="c" stroke={color}
          strokeWidth={1.5} dot={false} isAnimationActive={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

// ─── CoinCard ─────────────────────────────────────────────────────────────────

function CoinCard({ coin, ticker, klines }: {
  coin: CoinCfg;
  ticker: BinanceTicker | undefined;
  klines: KlinePoint[];
}) {
  const pct    = ticker ? parseFloat(ticker.priceChangePercent) : 0;
  const isPos  = pct >= 0;
  const pctClr = isPos ? "var(--green)" : "var(--red)";

  return (
    <div style={CARD}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{
            width: 34, height: 34, borderRadius: "50%",
            background: coin.color + "22", border: `1px solid ${coin.color}55`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "9px", fontWeight: 700, color: coin.color,
            ...MONO, flexShrink: 0, letterSpacing: "0.03em",
          }}>
            {coin.symbol}
          </span>
          <div>
            <p style={{ ...LABEL, margin: 0 }}>{coin.symbol}</p>
            <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: 0, lineHeight: 1.3 }}>{coin.name}</p>
          </div>
        </div>
        <span style={{
          fontSize: "12px", fontWeight: 700, ...MONO,
          color: pctClr, background: `${isPos ? "var(--green)" : "var(--red)"}18`,
          padding: "2px 8px", borderRadius: "4px",
        }}>
          {isPos ? "+" : ""}{pct.toFixed(2)}%
        </span>
      </div>

      <p style={{ ...MONO, fontSize: "21px", fontWeight: 700, color: "var(--text)", margin: "0 0 2px", lineHeight: 1 }}>
        {ticker ? fmtCryptoPrice(ticker.lastPrice) : "—"}
      </p>

      <MiniLine data={klines} color={coin.color} />

      <div style={{ marginTop: "4px", display: "flex", gap: "20px" }}>
        <div>
          <p style={{ ...LABEL, fontSize: "10px", margin: "0 0 1px" }}>Vol 24h</p>
          <p style={{ fontSize: "11px", ...MONO, color: "var(--text-mid)", margin: 0 }}>
            {ticker ? fmtVol(ticker.quoteVolume) : "—"}
          </p>
        </div>
        <div>
          <p style={{ ...LABEL, fontSize: "10px", margin: "0 0 1px" }}>Máx / Mín</p>
          <p style={{ fontSize: "11px", ...MONO, color: "var(--text-mid)", margin: 0 }}>
            {ticker ? `${fmtCryptoPrice(ticker.highPrice)} / ${fmtCryptoPrice(ticker.lowPrice)}` : "—"}
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── StockCard ────────────────────────────────────────────────────────────────

function StockCard({ stock, quote }: {
  stock: StockCfg;
  quote: FinnhubQuote | null | undefined;
}) {
  const noData  = quote !== undefined && (quote === null || quote.c === 0);
  const loading = quote === undefined;
  const isPos   = !noData && !loading && quote!.d >= 0;
  const pctClr  = isPos ? "var(--green)" : "var(--red)";
  const badgeClr = stock.region === "EU" ? "var(--amber)" : "var(--accent)";

  return (
    <div style={CARD}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "10px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{
            padding: "2px 7px", borderRadius: "4px", flexShrink: 0,
            background: badgeClr + "22", border: `1px solid ${badgeClr}55`,
            fontSize: "9px", fontWeight: 700, color: badgeClr,
            ...MONO, letterSpacing: "0.05em",
          }}>
            {stock.region}
          </span>
          <div>
            <p style={{ ...LABEL, margin: 0 }}>{stock.display}</p>
            <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: 0, lineHeight: 1.3 }}>{stock.name}</p>
          </div>
        </div>

        {!noData && !loading && (
          <span style={{
            fontSize: "12px", fontWeight: 700, ...MONO, flexShrink: 0,
            color: pctClr, background: `${isPos ? "var(--green)" : "var(--red)"}18`,
            padding: "2px 8px", borderRadius: "4px",
          }}>
            {isPos ? "+" : ""}{quote!.dp.toFixed(2)}%
          </span>
        )}
      </div>

      {/* Price area */}
      {loading && (
        <p style={{ ...MONO, fontSize: "20px", color: "var(--text-muted)", margin: "0 0 4px", lineHeight: 1 }}>—</p>
      )}

      {noData && (
        <p style={{ fontSize: "12px", color: "var(--text-muted)", fontStyle: "italic", margin: "4px 0 0", lineHeight: 1.4 }}>
          Sin datos disponibles (plan free)
        </p>
      )}

      {!loading && !noData && quote && (
        <>
          {/* Current price */}
          <p style={{ ...MONO, fontSize: "21px", fontWeight: 700, color: "var(--text)", margin: "0 0 5px", lineHeight: 1 }}>
            {fmtStockPrice(quote.c, stock.region)}
          </p>

          {/* Absolute change + prev close */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
            <span style={{ ...MONO, fontSize: "12px", fontWeight: 700, color: pctClr }}>
              {isPos ? "+" : ""}{quote.d.toFixed(2)} {stock.region === "EU" ? "€" : "$"}
            </span>
            <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
              Ant: {fmtStockPrice(quote.pc, stock.region)}
            </span>
          </div>

          {/* Day range */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <p style={{ ...LABEL, fontSize: "10px", margin: 0 }}>H/L</p>
            <p style={{ ...MONO, fontSize: "11px", color: "var(--text-mid)", margin: 0 }}>
              {fmtStockPrice(quote.h, stock.region)} / {fmtStockPrice(quote.l, stock.region)}
            </p>
          </div>
        </>
      )}
    </div>
  );
}

// ─── NewsCard ─────────────────────────────────────────────────────────────────

function NewsCard({ item }: { item: NewsItem }) {
  const [imgErr, setImgErr] = useState(false);
  const hasImg = !!item.image && !imgErr;

  return (
    <a href={item.url} target="_blank" rel="noopener noreferrer"
      style={{ textDecoration: "none", display: "block" }}>
      <div
        style={{ ...CARD, display: "flex", gap: "14px", alignItems: "flex-start", cursor: "pointer", transition: "border 0.12s" }}
        onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--border-accent)")}
        onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--border)")}
      >
        {hasImg && (
          <img src={item.image} alt="" onError={() => setImgErr(true)}
            style={{ width: 100, height: 68, objectFit: "cover", borderRadius: "5px", flexShrink: 0 }} />
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)", margin: "0 0 4px", lineHeight: 1.4,
            overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
            {item.headline}
          </p>
          <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: "0 0 5px", lineHeight: 1.45,
            overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
            {item.summary}
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "11px", color: "var(--accent)", fontWeight: 600 }}>{item.source}</span>
            <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>·</span>
            <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>{fmtDate(item.datetime)}</span>
            <ExternalLink size={11} style={{ color: "var(--text-muted)", marginLeft: "auto" }} />
          </div>
        </div>
      </div>
    </a>
  );
}

// ─── NoKeyBanner ──────────────────────────────────────────────────────────────

function NoKeyBanner({ onRetry }: { onRetry?: () => void }) {
  return (
    <div style={{ ...CARD, textAlign: "center", padding: "48px 32px", color: "var(--text-muted)" }}>
      <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--text)", marginBottom: "8px" }}>
        API key no configurada
      </p>
      <p style={{ fontSize: "13px", margin: "0 0 12px" }}>
        Añade tu clave de Finnhub en{" "}
        <code style={{ background: "var(--card-hover)", padding: "2px 6px", borderRadius: "3px", ...MONO, fontSize: "12px" }}>
          .env.local
        </code>:
      </p>
      <code style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "5px",
        padding: "10px 16px", display: "inline-block", ...MONO, fontSize: "12px", color: "var(--accent)" }}>
        NEXT_PUBLIC_FINNHUB_KEY=tu_api_key
      </code>
      <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "10px", marginBottom: onRetry ? "16px" : 0 }}>
        Clave gratuita en finnhub.io
      </p>
      {onRetry && (
        <button onClick={onRetry} style={{ display: "inline-flex", alignItems: "center", gap: "6px",
          padding: "7px 16px", borderRadius: "5px", border: "1px solid var(--border)",
          background: "transparent", color: "var(--text-muted)", cursor: "pointer", fontSize: "12px" }}>
          <RefreshCw size={13} /> Reintentar
        </button>
      )}
    </div>
  );
}

// ─── LiveDot ──────────────────────────────────────────────────────────────────

function LiveDot({ updatedAt }: { updatedAt: Date | null }) {
  if (!updatedAt) return null;
  return (
    <span style={{ fontSize: "11px", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "5px" }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--green)", display: "inline-block" }} />
      Actualizado {updatedAt.toLocaleTimeString("es-ES")}
    </span>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function MercadoPage() {
  const [tab, setTab] = useState<Tab>("Precios");

  // Crypto state
  const [tickers,     setTickers]     = useState<Record<string, BinanceTicker>>({});
  const [klines,      setKlines]      = useState<Record<string, KlinePoint[]>>({});
  const [cryptoLast,  setCryptoLast]  = useState<Date | null>(null);

  // Acciones state
  const [stockQuotes,  setStockQuotes]  = useState<Record<string, FinnhubQuote | null>>({});
  const [stocksLast,   setStocksLast]   = useState<Date | null>(null);
  const [stocksLoading,setStocksLoading]= useState(false);
  const [stocksError,  setStocksError]  = useState("");

  // Noticias state
  const [news,        setNews]        = useState<NewsItem[]>([]);
  const [newsLoading, setNewsLoading] = useState(false);
  const [newsError,   setNewsError]   = useState("");

  // ── Crypto fetchers ────────────────────────────────────────────────────────

  async function fetchTickers() {
    try {
      const results = await Promise.all(
        COINS.map(c => fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${c.pair}`).then(r => r.json()))
      );
      const map: Record<string, BinanceTicker> = {};
      results.forEach((r, i) => { map[COINS[i].pair] = r; });
      setTickers(map);
      setCryptoLast(new Date());
    } catch { /* keep previous */ }
  }

  async function fetchKlines() {
    try {
      const results = await Promise.all(
        COINS.map(c =>
          fetch(`https://api.binance.com/api/v3/klines?symbol=${c.pair}&interval=1h&limit=24`).then(r => r.json())
        )
      );
      const map: Record<string, KlinePoint[]> = {};
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      results.forEach((arr: any[], i) => { map[COINS[i].pair] = arr.map((k: any[]) => ({ c: parseFloat(k[4]) })); });
      setKlines(map);
    } catch { /* silent */ }
  }

  // ── Acciones fetcher ───────────────────────────────────────────────────────

  async function fetchStocks() {
    const key = process.env.NEXT_PUBLIC_FINNHUB_KEY;
    if (!key) { setStocksError("no_key"); return; }
    setStocksLoading(true);
    setStocksError("");
    try {
      const results = await Promise.all(
        STOCKS.map(s =>
          fetch(`https://finnhub.io/api/v1/quote?symbol=${s.symbol}&token=${key}`)
            .then(r => r.ok ? r.json() : null)
            .catch(() => null)
        )
      );
      const map: Record<string, FinnhubQuote | null> = {};
      results.forEach((r, i) => { map[STOCKS[i].symbol] = r; });
      setStockQuotes(map);
      setStocksLast(new Date());
    } catch {
      setStocksError("fetch_error");
    } finally {
      setStocksLoading(false);
    }
  }

  // ── News fetcher ───────────────────────────────────────────────────────────

  async function fetchNews() {
    const key = process.env.NEXT_PUBLIC_FINNHUB_KEY;
    if (!key) { setNewsError("no_key"); return; }
    setNewsLoading(true);
    setNewsError("");
    try {
      const r = await fetch(`https://finnhub.io/api/v1/news?category=crypto&token=${key}`);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data = await r.json();
      setNews(Array.isArray(data) ? data.slice(0, 30) : []);
    } catch {
      setNewsError("fetch_error");
    } finally {
      setNewsLoading(false);
    }
  }

  // ── Effects ────────────────────────────────────────────────────────────────

  // Crypto: always active, refresh 30s
  useEffect(() => {
    fetchTickers();
    fetchKlines();
    const id = setInterval(fetchTickers, 30_000);
    return () => clearInterval(id);
  }, []);

  // Acciones: only when tab active, refresh 60s
  useEffect(() => {
    if (tab !== "Acciones") return;
    fetchStocks();
    const id = setInterval(fetchStocks, 60_000);
    return () => clearInterval(id);
  }, [tab]);

  // Noticias: only when tab active, refresh 5min
  useEffect(() => {
    if (tab !== "Noticias") return;
    fetchNews();
    const id = setInterval(fetchNews, 5 * 60_000);
    return () => clearInterval(id);
  }, [tab]);

  // ── Tab config ─────────────────────────────────────────────────────────────

  const TABS: [Tab, string][] = [
    ["Precios",  "Crypto"],
    ["Acciones", "Acciones IBKR"],
    ["Noticias", "Noticias"],
  ];

  // ── Derived: stocks split by region ───────────────────────────────────────
  const usStocks = STOCKS.filter(s => s.region === "US");
  const euStocks = STOCKS.filter(s => s.region === "EU");

  return (
    <div style={{ padding: "32px 40px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 600, color: "var(--text)", margin: "0 0 4px" }}>
            Mercado
          </h1>
          <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: 0 }}>
            Crypto · Acciones IBKR · Noticias
          </p>
        </div>
        {tab === "Precios"  && <LiveDot updatedAt={cryptoLast} />}
        {tab === "Acciones" && <LiveDot updatedAt={stocksLast} />}
      </div>

      {/* Tab bar */}
      <div style={{ display: "flex", gap: "4px", marginBottom: "24px", borderBottom: "1px solid var(--border)" }}>
        {TABS.map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)} style={{
            padding: "8px 18px", fontSize: "13px",
            fontWeight: tab === key ? 600 : 400,
            color: tab === key ? "var(--accent)" : "var(--text-muted)",
            background: "transparent", border: "none",
            borderBottom: tab === key ? "2px solid var(--accent)" : "2px solid transparent",
            cursor: "pointer", marginBottom: "-1px", transition: "color 0.12s",
          }}>
            {label}
          </button>
        ))}
      </div>

      {/* ── TAB 1: Crypto precios ─────────────────────────────────────────────── */}
      {tab === "Precios" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "14px" }}>
          {COINS.map(coin => (
            <CoinCard key={coin.pair} coin={coin} ticker={tickers[coin.pair]} klines={klines[coin.pair] ?? []} />
          ))}
        </div>
      )}

      {/* ── TAB 2: Acciones IBKR ─────────────────────────────────────────────── */}
      {tab === "Acciones" && (
        <div>
          {/* Portfolio summary */}
          <div style={{
            ...CARD, display: "flex", alignItems: "center", flexWrap: "wrap",
            gap: "20px", marginBottom: "22px", padding: "14px 20px",
          }}>
            <span style={{ fontSize: "16px" }}>💼</span>
            <div style={{ display: "flex", gap: "6px", alignItems: "baseline" }}>
              <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Valor cartera acciones</span>
              <span style={{ ...MONO, fontSize: "16px", fontWeight: 700, color: "var(--text)" }}>
                {CARTERA_VALOR}
              </span>
            </div>
            <span style={{ fontSize: "11px", color: "var(--border)" }}>|</span>
            <div style={{ display: "flex", gap: "6px", alignItems: "baseline" }}>
              <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>PyG no realizadas</span>
              <span style={{ ...MONO, fontSize: "16px", fontWeight: 700, color: "var(--green)" }}>
                {CARTERA_PNL}
              </span>
            </div>
            <span style={{ fontSize: "10px", color: "var(--text-muted)", marginLeft: "auto", fontStyle: "italic" }}>
              Valores manuales · pendiente conexión IBKR
            </span>
          </div>

          {/* No API key */}
          {stocksError === "no_key" && <NoKeyBanner />}

          {/* Fetch error */}
          {stocksError === "fetch_error" && (
            <div style={{ ...CARD, textAlign: "center", padding: "32px" }}>
              <p style={{ color: "var(--text-muted)", margin: "0 0 12px" }}>Error al cargar cotizaciones</p>
              <button onClick={fetchStocks} style={{
                display: "inline-flex", alignItems: "center", gap: "6px",
                padding: "7px 16px", borderRadius: "5px", border: "1px solid var(--border)",
                background: "transparent", color: "var(--text-muted)", cursor: "pointer", fontSize: "12px",
              }}>
                <RefreshCw size={13} /> Reintentar
              </button>
            </div>
          )}

          {/* Loading initial */}
          {stocksLoading && !stocksError && Object.keys(stockQuotes).length === 0 && (
            <div style={{ textAlign: "center", padding: "48px", color: "var(--text-muted)", fontSize: "13px" }}>
              Cargando cotizaciones…
            </div>
          )}

          {/* Stock grids */}
          {!stocksError && (Object.keys(stockQuotes).length > 0 || !stocksLoading) && (
            <>
              {/* US stocks */}
              <p style={{ ...LABEL, marginBottom: "12px" }}>🇺🇸 Mercado USA</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginBottom: "24px" }}>
                {usStocks.map(s => (
                  <StockCard key={s.symbol} stock={s} quote={stockQuotes[s.symbol]} />
                ))}
              </div>

              {/* EU stocks */}
              <p style={{ ...LABEL, marginBottom: "12px" }}>🇪🇺 Mercado Europeo</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
                {euStocks.map(s => (
                  <StockCard key={s.symbol} stock={s} quote={stockQuotes[s.symbol]} />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── TAB 3: Noticias ──────────────────────────────────────────────────── */}
      {tab === "Noticias" && (
        <div>
          {newsError === "no_key"      && <NoKeyBanner onRetry={fetchNews} />}
          {newsError === "fetch_error" && (
            <div style={{ ...CARD, textAlign: "center", padding: "32px" }}>
              <p style={{ margin: "0 0 12px", color: "var(--text-muted)" }}>Error al cargar noticias</p>
              <button onClick={fetchNews} style={{ display: "inline-flex", alignItems: "center", gap: "6px",
                padding: "7px 16px", borderRadius: "5px", border: "1px solid var(--border)",
                background: "transparent", color: "var(--text-muted)", cursor: "pointer", fontSize: "12px" }}>
                <RefreshCw size={13} /> Reintentar
              </button>
            </div>
          )}
          {newsLoading && !newsError && (
            <div style={{ textAlign: "center", padding: "48px", color: "var(--text-muted)", fontSize: "13px" }}>
              Cargando noticias…
            </div>
          )}
          {!newsLoading && !newsError && news.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {news.map(item => <NewsCard key={item.datetime + item.headline} item={item} />)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
