"use client";

import { useState, useEffect, useRef } from "react";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import { ExternalLink, RefreshCw, Plus, Pencil, Trash2, X } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = "Precios" | "Acciones" | "Noticias" | "Screener";

type CoinCfg  = { symbol: string; pair: string; name: string; color: string };
type StockCfg = { symbol: string; display: string; name: string; region: "US" | "EU" };

type BinanceTicker = {
  symbol: string; lastPrice: string; priceChangePercent: string;
  quoteVolume: string; highPrice: string; lowPrice: string;
};

type KlinePoint = { c: number };

type FinnhubQuote = {
  c: number; d: number; dp: number;
  h: number; l: number; o: number;
  pc: number; t: number;
};

type NewsItem = {
  datetime: number; headline: string; source: string;
  url: string; image: string; summary: string;
};

type Position = {
  id: string;
  symbol: string;
  quantity: number;
  avgPrice: number;
};

type ModalState = {
  open: boolean;
  mode: "add" | "edit";
  id: string;
  symbol: string;
  qty: string;
  avgPrice: string;
};

type SearchResult = {
  description: string;
  displaySymbol: string;
  symbol: string;
  type: string;
};

type WatchlistItem = {
  id: string;
  symbol: string;
  name: string;
  note: string;
  addedAt: number;
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
  // US
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
  // EU
  { symbol: "BBVA.MC", display: "BBVA", name: "Banco Bilbao",  region: "EU" },
  { symbol: "AI.PA",   display: "AI",   name: "Air Liquide",   region: "EU" },
  { symbol: "ENGI.PA", display: "ENGI", name: "Engie SA",      region: "EU" },
  { symbol: "LOG.MC",  display: "LOG",  name: "Logista",       region: "EU" },
  { symbol: "ENI.MI",  display: "ENI",  name: "ENI SpA",       region: "EU" },
  { symbol: "REP.MC",  display: "REP",  name: "Repsol SA",     region: "EU" },
];

// ─── localStorage ─────────────────────────────────────────────────────────────

const POSITIONS_KEY  = "raxislab_acciones_v1";
const WATCHLIST_KEY  = "raxislab_watchlist_v1";

function loadPositions(): Position[] {
  if (typeof window === "undefined") return [];
  try { const r = localStorage.getItem(POSITIONS_KEY); return r ? JSON.parse(r) : []; }
  catch { return []; }
}
function savePositions(ps: Position[]) {
  localStorage.setItem(POSITIONS_KEY, JSON.stringify(ps));
}

function loadWatchlist(): WatchlistItem[] {
  if (typeof window === "undefined") return [];
  try { const r = localStorage.getItem(WATCHLIST_KEY); return r ? JSON.parse(r) : []; }
  catch { return []; }
}
function saveWatchlist(items: WatchlistItem[]) {
  localStorage.setItem(WATCHLIST_KEY, JSON.stringify(items));
}

function newId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getStock(symbol: string): StockCfg | undefined {
  return STOCKS.find(s => s.symbol === symbol);
}

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

function fmtMoney(n: number, region: "US" | "EU"): string {
  const abs = Math.abs(n);
  const s = abs >= 10_000
    ? abs.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })
    : abs.toFixed(2);
  const sign = n < 0 ? "−" : "";
  return region === "US" ? `${sign}$${s}` : `${sign}${s} €`;
}

function fmtMoneySign(n: number, region: "US" | "EU"): string {
  const abs = Math.abs(n);
  const s = abs >= 10_000
    ? abs.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })
    : abs.toFixed(2);
  const sign = n >= 0 ? "+" : "−";
  return region === "US" ? `${sign}$${s}` : `${sign}${s} €`;
}

function fmtPct(n: number): string {
  return `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`;
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

const INPUT: React.CSSProperties = {
  width: "100%", padding: "9px 12px", borderRadius: "6px",
  border: "1px solid var(--border)", background: "var(--bg)",
  color: "var(--text)", fontSize: "13px", boxSizing: "border-box",
  outline: "none",
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
  coin: CoinCfg; ticker: BinanceTicker | undefined; klines: KlinePoint[];
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

// ─── PositionCard ─────────────────────────────────────────────────────────────

function PositionCard({ position, quote, onEdit, onDelete }: {
  position: Position;
  quote: FinnhubQuote | null | undefined;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const stock    = getStock(position.symbol);
  const region   = stock?.region ?? "US";
  const name     = stock?.name   ?? position.symbol;
  const display  = stock?.display ?? position.symbol;

  const noData  = quote !== undefined && (quote === null || quote.c === 0);
  const loading = quote === undefined;
  const price   = (!loading && !noData && quote) ? quote.c : null;

  const dailyPct = (!noData && quote) ? quote.dp : null;
  const dailyChg = (!noData && quote) ? quote.d  : null;
  const dailyPos = dailyPct !== null && dailyPct >= 0;

  const marketVal = price !== null ? price * position.quantity : null;
  const pnl       = price !== null ? (price - position.avgPrice) * position.quantity : null;
  const pnlPct    = price !== null && position.avgPrice > 0
    ? ((price - position.avgPrice) / position.avgPrice) * 100 : null;

  const pnlPos    = pnl !== null && pnl >= 0;
  const pnlColor  = pnl === null ? "var(--text-muted)" : pnlPos ? "var(--green)" : "var(--red)";
  const badgeClr  = region === "EU" ? "var(--amber)" : "var(--accent)";
  const cur       = region === "EU" ? "€" : "$";

  return (
    <div style={{ ...CARD, display: "flex", flexDirection: "column", gap: "9px" }}>

      {/* Row 1: badge + name + daily % + icons */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1, minWidth: 0 }}>
          <span style={{
            padding: "2px 6px", borderRadius: "4px", flexShrink: 0,
            background: badgeClr + "22", border: `1px solid ${badgeClr}55`,
            fontSize: "9px", fontWeight: 700, color: badgeClr, ...MONO, letterSpacing: "0.05em",
          }}>
            {region}
          </span>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: "12px", fontWeight: 700, color: "var(--text)", margin: 0, ...MONO }}>{display}</p>
            <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: 0, lineHeight: 1.2,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</p>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "2px", flexShrink: 0, marginLeft: "6px" }}>
          {dailyPct !== null && (
            <span style={{
              fontSize: "11px", fontWeight: 700, ...MONO,
              color: dailyPos ? "var(--green)" : "var(--red)",
              background: `${dailyPos ? "var(--green)" : "var(--red)"}18`,
              padding: "2px 5px", borderRadius: "4px", marginRight: "4px",
            }}>
              {dailyPos ? "+" : ""}{dailyPct.toFixed(2)}%
            </span>
          )}
          <button onClick={onEdit} title="Editar" style={{
            background: "none", border: "none", cursor: "pointer",
            color: "var(--text-muted)", padding: "4px", display: "flex", alignItems: "center",
            borderRadius: "4px",
          }}
            onMouseEnter={e => (e.currentTarget.style.color = "var(--accent)")}
            onMouseLeave={e => (e.currentTarget.style.color = "var(--text-muted)")}
          >
            <Pencil size={12} />
          </button>
          <button onClick={onDelete} title="Eliminar" style={{
            background: "none", border: "none", cursor: "pointer",
            color: "var(--text-muted)", padding: "4px", display: "flex", alignItems: "center",
            borderRadius: "4px",
          }}
            onMouseEnter={e => (e.currentTarget.style.color = "var(--red)")}
            onMouseLeave={e => (e.currentTarget.style.color = "var(--text-muted)")}
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      {/* Row 2: price */}
      {loading && (
        <p style={{ ...MONO, fontSize: "19px", color: "var(--text-muted)", margin: 0 }}>—</p>
      )}
      {noData && (
        <p style={{ fontSize: "11px", color: "var(--text-muted)", fontStyle: "italic", margin: 0 }}>
          Sin datos disponibles (plan free)
        </p>
      )}
      {!loading && !noData && quote && (
        <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
          <p style={{ ...MONO, fontSize: "19px", fontWeight: 700, color: "var(--text)", margin: 0, lineHeight: 1 }}>
            {region === "US" ? `$${price!.toFixed(2)}` : `${price!.toFixed(2)} €`}
          </p>
          {dailyChg !== null && (
            <span style={{ ...MONO, fontSize: "11px", color: dailyPos ? "var(--green)" : "var(--red)" }}>
              {dailyPos ? "+" : ""}{dailyChg.toFixed(2)} {cur}
            </span>
          )}
        </div>
      )}

      {/* Divider */}
      <div style={{ borderTop: "1px solid var(--border)" }} />

      {/* Row 3: position info */}
      <div>
        <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: "0 0 3px" }}>
          {position.quantity.toLocaleString("es-ES")} acc · CM:{" "}
          <span style={{ ...MONO, color: "var(--text-mid)" }}>
            {region === "US" ? `$${position.avgPrice.toFixed(2)}` : `${position.avgPrice.toFixed(2)} €`}
          </span>
        </p>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
            Valor:{" "}
            <span style={{ ...MONO, color: "var(--text-mid)" }}>
              {marketVal !== null ? fmtMoney(marketVal, region) : "—"}
            </span>
          </span>
          {pnl !== null && pnlPct !== null ? (
            <span style={{ ...MONO, fontSize: "11px", fontWeight: 700, color: pnlColor }}>
              {fmtMoneySign(pnl, region)} ({fmtPct(pnlPct)})
            </span>
          ) : (
            <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>PyG: —</span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── PositionModal ────────────────────────────────────────────────────────────

function PositionModal({ modal, existingSymbols, onSave, onClose }: {
  modal: ModalState;
  existingSymbols: string[];
  onSave: (id: string, symbol: string, qty: number, avgPrice: number) => void;
  onClose: () => void;
}) {
  const isEdit = modal.mode === "edit";
  const [symbol,   setSymbol]   = useState(modal.symbol);
  const [qty,      setQty]      = useState(modal.qty);
  const [avgPrice, setAvgPrice] = useState(modal.avgPrice);
  const [error,    setError]    = useState("");

  const selectedStock = getStock(symbol);
  const cur = selectedStock?.region === "EU" ? "€" : "$";

  // Stocks available to add (exclude already-added ones, unless editing)
  const available = isEdit
    ? STOCKS
    : STOCKS.filter(s => !existingSymbols.includes(s.symbol));

  const usAvail = available.filter(s => s.region === "US");
  const euAvail = available.filter(s => s.region === "EU");

  function handleSave() {
    const qtyN = parseFloat(qty.replace(",", "."));
    const avgN = parseFloat(avgPrice.replace(",", "."));
    if (!symbol)            { setError("Selecciona un ticker"); return; }
    if (!qty || isNaN(qtyN) || qtyN <= 0)   { setError("Cantidad debe ser mayor que 0"); return; }
    if (!avgPrice || isNaN(avgN) || avgN <= 0) { setError("Precio medio debe ser mayor que 0"); return; }
    onSave(modal.id, symbol, qtyN, avgN);
  }

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.55)",
        display: "flex", alignItems: "center", justifyContent: "center" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ ...CARD, width: 380, maxWidth: "92vw", boxShadow: "0 20px 60px rgba(0,0,0,0.4)" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <p style={{ fontSize: "15px", fontWeight: 600, color: "var(--text)", margin: 0 }}>
            {isEdit ? "Editar posición" : "Nueva posición"}
          </p>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer",
            color: "var(--text-muted)", padding: 0, display: "flex" }}>
            <X size={18} />
          </button>
        </div>

        {/* Ticker */}
        <label style={{ ...LABEL, display: "block", marginBottom: "5px" }}>Ticker</label>
        {available.length === 0 ? (
          <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: "0 0 14px", fontStyle: "italic" }}>
            Ya tienes posición en todos los tickers disponibles.
          </p>
        ) : (
          <select
            value={symbol}
            onChange={e => { setSymbol(e.target.value); setError(""); }}
            disabled={isEdit}
            style={{ ...INPUT, marginBottom: "14px",
              opacity: isEdit ? 0.6 : 1, cursor: isEdit ? "not-allowed" : "default",
              background: "var(--bg)",
            }}
          >
            {usAvail.length > 0 && (
              <optgroup label="🇺🇸 USA">
                {usAvail.map(s => (
                  <option key={s.symbol} value={s.symbol}>{s.display} — {s.name}</option>
                ))}
              </optgroup>
            )}
            {euAvail.length > 0 && (
              <optgroup label="🇪🇺 Europa">
                {euAvail.map(s => (
                  <option key={s.symbol} value={s.symbol}>{s.display} — {s.name}</option>
                ))}
              </optgroup>
            )}
          </select>
        )}

        {/* Quantity */}
        <label style={{ ...LABEL, display: "block", marginBottom: "5px" }}>Cantidad (acciones)</label>
        <input
          type="number" value={qty} onChange={e => { setQty(e.target.value); setError(""); }}
          placeholder="ej: 150" min="0" step="1"
          style={{ ...INPUT, marginBottom: "14px" }}
        />

        {/* Avg price */}
        <label style={{ ...LABEL, display: "block", marginBottom: "5px" }}>
          Precio medio de compra ({cur})
        </label>
        <input
          type="number" value={avgPrice} onChange={e => { setAvgPrice(e.target.value); setError(""); }}
          placeholder={selectedStock?.region === "EU" ? "ej: 9.25" : "ej: 24.10"}
          min="0" step="0.01"
          style={{ ...INPUT, marginBottom: error ? "6px" : "16px" }}
        />

        {error && <p style={{ fontSize: "12px", color: "var(--red)", margin: "0 0 12px" }}>{error}</p>}

        {/* Buttons */}
        <div style={{ display: "flex", gap: "8px" }}>
          <button onClick={onClose} style={{
            flex: 1, padding: "9px", borderRadius: "6px",
            border: "1px solid var(--border)", background: "transparent",
            color: "var(--text-muted)", cursor: "pointer", fontSize: "13px",
          }}>
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={available.length === 0 && !isEdit}
            style={{
              flex: 2, padding: "9px", borderRadius: "6px",
              border: "1px solid var(--accent)", background: "var(--accent)",
              color: "#fff", cursor: "pointer", fontSize: "13px", fontWeight: 600,
            }}
          >
            {isEdit ? "Guardar cambios" : "Añadir posición"}
          </button>
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
    <a href={item.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", display: "block" }}>
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

// ─── MoveToPortfolioModal ─────────────────────────────────────────────────────

function MoveToPortfolioModal({ item, onSave, onClose }: {
  item: WatchlistItem;
  onSave: (symbol: string, name: string, qty: number, avgPrice: number) => void;
  onClose: () => void;
}) {
  const [qty,   setQty]   = useState("");
  const [avg,   setAvg]   = useState("");
  const [error, setError] = useState("");

  function handleSave() {
    const qtyN = parseFloat(qty);
    const avgN = parseFloat(avg.replace(",", "."));
    if (!qty || isNaN(qtyN) || qtyN <= 0) { setError("Cantidad debe ser > 0"); return; }
    if (!avg || isNaN(avgN) || avgN <= 0)  { setError("Precio medio debe ser > 0"); return; }
    onSave(item.symbol, item.name, qtyN, avgN);
  }

  return (
    <div
      style={{ position:"fixed", inset:0, zIndex:300, background:"rgba(0,0,0,0.6)",
        display:"flex", alignItems:"center", justifyContent:"center" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ ...CARD, width:360, maxWidth:"92vw", boxShadow:"0 20px 60px rgba(0,0,0,0.45)" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"12px" }}>
          <p style={{ fontSize:"15px", fontWeight:600, color:"var(--text)", margin:0 }}>
            Mover a cartera —{" "}
            <span style={{ ...MONO, color:"var(--accent)" }}>{item.symbol}</span>
          </p>
          <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer", color:"var(--text-muted)", padding:0, display:"flex" }}>
            <X size={18} />
          </button>
        </div>
        <p style={{ fontSize:"12px", color:"var(--text-muted)", margin:"0 0 18px" }}>{item.name}</p>

        <label style={{ ...LABEL, display:"block", marginBottom:"5px" }}>Cantidad (acciones)</label>
        <input type="number" value={qty} onChange={e => { setQty(e.target.value); setError(""); }}
          placeholder="ej: 50" min="0" step="1"
          style={{ ...INPUT, marginBottom:"12px" }} />

        <label style={{ ...LABEL, display:"block", marginBottom:"5px" }}>Precio medio de compra ($)</label>
        <input type="number" value={avg} onChange={e => { setAvg(e.target.value); setError(""); }}
          placeholder="ej: 380.50" min="0" step="0.01"
          style={{ ...INPUT, marginBottom: error ? "6px" : "16px" }} />

        {error && <p style={{ fontSize:"12px", color:"var(--red)", margin:"0 0 12px" }}>{error}</p>}

        <div style={{ display:"flex", gap:"8px" }}>
          <button onClick={onClose} style={{ flex:1, padding:"9px", borderRadius:"6px", border:"1px solid var(--border)", background:"transparent", color:"var(--text-muted)", cursor:"pointer", fontSize:"13px" }}>
            Cancelar
          </button>
          <button onClick={handleSave} style={{ flex:2, padding:"9px", borderRadius:"6px", border:"1px solid var(--accent)", background:"var(--accent)", color:"#fff", cursor:"pointer", fontSize:"13px", fontWeight:600 }}>
            Añadir a cartera
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── ScreenerTab ──────────────────────────────────────────────────────────────

function ScreenerTab({ watchlist, setWatchlist, positions, onMoveToPortfolio }: {
  watchlist: WatchlistItem[];
  setWatchlist: React.Dispatch<React.SetStateAction<WatchlistItem[]>>;
  positions: Position[];
  onMoveToPortfolio: (item: WatchlistItem) => void;
}) {
  const [query,    setQuery]    = useState("");
  const [results,  setResults]  = useState<SearchResult[]>([]);
  const [loading,  setLoading]  = useState(false);
  const [resQ,     setResQ]     = useState<Record<string, FinnhubQuote | null>>({});
  const [watchQ,   setWatchQ]   = useState<Record<string, FinnhubQuote | null>>({});
  const [editNote, setEditNote] = useState<{ id: string; text: string } | null>(null);
  const [watchLast,setWatchLast]= useState<Date | null>(null);

  const watchlistRef = useRef(watchlist);
  useEffect(() => { watchlistRef.current = watchlist; }, [watchlist]);

  const key = process.env.NEXT_PUBLIC_FINNHUB_KEY;

  // Debounced search
  useEffect(() => {
    if (!query.trim() || query.length < 2) { setResults([]); setResQ({}); return; }
    const t = setTimeout(async () => {
      if (!key) return;
      setLoading(true);
      try {
        const r = await fetch(`https://finnhub.io/api/v1/search?q=${encodeURIComponent(query)}&token=${key}`);
        const data = await r.json();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const filtered: SearchResult[] = (data.result || []).filter((x: any) =>
          ["Common Stock", "ADR", "EQS"].includes(x.type)
        ).slice(0, 9);
        setResults(filtered);
        if (filtered.length > 0) {
          const quotes = await Promise.all(
            filtered.map(s => fetch(`https://finnhub.io/api/v1/quote?symbol=${s.symbol}&token=${key}`)
              .then(r => r.ok ? r.json() : null).catch(() => null))
          );
          const qMap: Record<string, FinnhubQuote | null> = {};
          quotes.forEach((q, i) => { qMap[filtered[i].symbol] = q; });
          setResQ(qMap);
        }
      } catch { setResults([]); }
      finally { setLoading(false); }
    }, 600);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  // Watchlist quotes — interval refresh
  useEffect(() => {
    if (!key) return;
    async function fetchWQ() {
      const syms = watchlistRef.current.map(w => w.symbol);
      if (!syms.length) { setWatchQ({}); return; }
      const quotes = await Promise.all(
        syms.map(s => fetch(`https://finnhub.io/api/v1/quote?symbol=${s}&token=${key}`)
          .then(r => r.ok ? r.json() : null).catch(() => null))
      );
      const qMap: Record<string, FinnhubQuote | null> = {};
      quotes.forEach((q, i) => { qMap[syms[i]] = q; });
      setWatchQ(qMap);
      setWatchLast(new Date());
    }
    fetchWQ();
    const id = setInterval(fetchWQ, 60_000);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Refresh watchlist quotes when items change
  useEffect(() => {
    if (!key || !watchlist.length) { setWatchQ({}); return; }
    const syms = watchlist.map(w => w.symbol);
    Promise.all(syms.map(s => fetch(`https://finnhub.io/api/v1/quote?symbol=${s}&token=${key}`)
      .then(r => r.ok ? r.json() : null).catch(() => null)))
      .then(quotes => {
        const qMap: Record<string, FinnhubQuote | null> = {};
        quotes.forEach((q, i) => { qMap[syms[i]] = q; });
        setWatchQ(qMap);
        setWatchLast(new Date());
      }).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchlist]);

  function addToWatchlist(r: SearchResult) {
    if (watchlist.some(w => w.symbol === r.symbol)) return;
    setWatchlist(prev => [...prev, {
      id: newId(), symbol: r.symbol, name: r.description, note: "", addedAt: Date.now(),
    }]);
  }

  function removeFromWatchlist(id: string) {
    setWatchlist(prev => prev.filter(w => w.id !== id));
  }

  function saveNote(id: string, text: string) {
    setWatchlist(prev => prev.map(w => w.id === id ? { ...w, note: text } : w));
    setEditNote(null);
  }

  const inPortfolio  = (sym: string) => positions.some(p => p.symbol === sym);
  const inWatchlist  = (sym: string) => watchlist.some(w => w.symbol === sym);

  const TH_S = { padding:"10px 14px", textAlign:"left" as const, fontSize:"11px", fontWeight:600,
    letterSpacing:"0.06em", color:"var(--text-muted)", borderBottom:"1px solid var(--border)" };
  const TD_S = { padding:"11px 14px", borderBottom:"1px solid var(--border)", verticalAlign:"top" as const };

  return (
    <div>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>

      {/* Search box */}
      <div style={{ marginBottom:"24px" }}>
        <div style={{ position:"relative", maxWidth:"500px" }}>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Buscar ticker o empresa... (ej: NVDA, Tesla, ARM)"
            style={{
              ...INPUT, padding:"12px 44px 12px 16px", fontSize:"14px",
              borderRadius:"8px", background:"var(--card)",
            }}
          />
          {loading && (
            <div style={{ position:"absolute", right:"14px", top:"50%", transform:"translateY(-50%)" }}>
              <RefreshCw size={15} style={{ color:"var(--text-muted)", animation:"spin 1s linear infinite" }} />
            </div>
          )}
        </div>
        {!key && (
          <p style={{ fontSize:"12px", color:"var(--red)", marginTop:"6px" }}>
            API key de Finnhub no configurada — añádela en .env.local
          </p>
        )}
      </div>

      {/* Search results */}
      {results.length > 0 && (
        <div style={{ marginBottom:"32px" }}>
          <p style={{ ...LABEL, marginBottom:"12px" }}>Resultados de búsqueda</p>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"10px" }}>
            {results.map(r => {
              const q    = resQ[r.symbol];
              const price = q && q.c > 0 ? q.c : null;
              const pct   = q && q.c > 0 ? q.dp : null;
              const isPos = pct !== null && pct >= 0;
              const already = inWatchlist(r.symbol) || inPortfolio(r.symbol);

              return (
                <div key={r.symbol} style={CARD}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"8px" }}>
                    <div style={{ flex:1, minWidth:0 }}>
                      <p style={{ ...MONO, fontSize:"13px", fontWeight:700, color:"var(--text)", margin:0 }}>{r.displaySymbol}</p>
                      <p style={{ fontSize:"11px", color:"var(--text-muted)", margin:"2px 0 0", lineHeight:1.3,
                        overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{r.description}</p>
                    </div>
                    <span style={{ fontSize:"9px", padding:"2px 6px", borderRadius:"4px",
                      background:"var(--accent-dim)", color:"var(--text-muted)", flexShrink:0, marginLeft:"6px" }}>
                      {r.type === "Common Stock" ? "Acción" : r.type}
                    </span>
                  </div>

                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"10px" }}>
                    <p style={{ ...MONO, fontSize:"16px", fontWeight:700, color:"var(--text)", margin:0 }}>
                      {price !== null ? `$${price.toFixed(2)}` : q === undefined ? "—" : "Sin datos"}
                    </p>
                    {pct !== null && (
                      <span style={{ ...MONO, fontSize:"11px", fontWeight:700,
                        color:isPos?"var(--green)":"var(--red)",
                        background:`${isPos?"var(--green)":"var(--red)"}18`,
                        padding:"2px 6px", borderRadius:"4px" }}>
                        {isPos?"+":""}{pct.toFixed(2)}%
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => !already && addToWatchlist(r)}
                    style={{
                      width:"100%", padding:"6px", borderRadius:"5px", fontSize:"11px", fontWeight:600,
                      border:`1px solid ${already?"var(--border)":"var(--accent)"}`,
                      background:"transparent",
                      color:already?"var(--text-muted)":"var(--accent)",
                      cursor:already?"default":"pointer",
                      display:"flex", alignItems:"center", justifyContent:"center", gap:"4px",
                    }}
                  >
                    {inPortfolio(r.symbol) ? "En cartera" : inWatchlist(r.symbol) ? "En watchlist" : <><Plus size={11}/> Añadir a watchlist</>}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {query.length >= 2 && !loading && results.length === 0 && (
        <div style={{ ...CARD, textAlign:"center", padding:"32px", marginBottom:"32px" }}>
          <p style={{ color:"var(--text-muted)", fontSize:"13px", margin:0 }}>Sin resultados para "{query}"</p>
        </div>
      )}

      {/* Watchlist */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"12px" }}>
        <p style={{ ...LABEL, margin:0 }}>
          Watchlist{watchlist.length > 0 ? ` · ${watchlist.length} empresa${watchlist.length !== 1 ? "s" : ""}` : ""}
        </p>
        {watchLast && (
          <span style={{ fontSize:"11px", color:"var(--text-muted)", display:"flex", alignItems:"center", gap:"5px" }}>
            <span style={{ width:6, height:6, borderRadius:"50%", background:"var(--green)", display:"inline-block" }} />
            {watchLast.toLocaleTimeString("es-ES")}
          </span>
        )}
      </div>

      {watchlist.length === 0 ? (
        <div style={{ ...CARD, textAlign:"center", padding:"40px 32px" }}>
          <p style={{ fontSize:"14px", fontWeight:600, color:"var(--text)", margin:"0 0 8px" }}>Tu watchlist está vacía</p>
          <p style={{ fontSize:"13px", color:"var(--text-muted)", margin:0 }}>
            Busca un ticker arriba y pulsa "Añadir a watchlist" para seguirlo.
          </p>
        </div>
      ) : (
        <div style={{ background:"var(--card)", border:"1px solid var(--border)", borderRadius:"8px", overflow:"hidden" }}>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead>
              <tr>
                {["Ticker", "Precio", "Cambio", "Tu nota", ""].map(h => (
                  <th key={h} style={TH_S}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {watchlist.map(item => {
                const q    = watchQ[item.symbol];
                const price = q && q.c > 0 ? q.c : null;
                const pct   = q && q.c > 0 ? q.dp : null;
                const chg   = q && q.c > 0 ? q.d  : null;
                const isPos = pct !== null && pct >= 0;
                const isEditing = editNote?.id === item.id;

                return (
                  <tr key={item.id}>
                    <td style={TD_S}>
                      <p style={{ ...MONO, fontSize:"13px", fontWeight:700, color:"var(--text)", margin:0 }}>{item.symbol}</p>
                      <p style={{ fontSize:"11px", color:"var(--text-muted)", margin:"2px 0 0",
                        maxWidth:"160px", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                        {item.name}
                      </p>
                    </td>
                    <td style={TD_S}>
                      <p style={{ ...MONO, fontSize:"14px", fontWeight:700, color:"var(--text)", margin:0 }}>
                        {price !== null ? `$${price.toFixed(2)}` : "—"}
                      </p>
                    </td>
                    <td style={TD_S}>
                      {pct !== null ? (
                        <div>
                          <p style={{ ...MONO, fontSize:"12px", fontWeight:700, color:isPos?"var(--green)":"var(--red)", margin:0 }}>
                            {isPos?"+":""}{pct.toFixed(2)}%
                          </p>
                          <p style={{ ...MONO, fontSize:"11px", color:"var(--text-muted)", margin:"1px 0 0" }}>
                            {isPos?"+":""}{chg?.toFixed(2)} $
                          </p>
                        </div>
                      ) : (
                        <span style={{ fontSize:"12px", color:"var(--text-muted)" }}>—</span>
                      )}
                    </td>
                    <td style={{ ...TD_S, maxWidth:"220px" }}>
                      {isEditing ? (
                        <textarea
                          autoFocus
                          value={editNote.text}
                          onChange={e => setEditNote({ id:item.id, text:e.target.value })}
                          onBlur={() => saveNote(item.id, editNote.text)}
                          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); saveNote(item.id, editNote.text); }}}
                          style={{ width:"100%", resize:"none", height:"46px", padding:"6px 8px", borderRadius:"4px",
                            border:"1px solid var(--border-accent)", background:"var(--bg)", color:"var(--text)",
                            fontSize:"12px", outline:"none", boxSizing:"border-box" }}
                        />
                      ) : (
                        <p
                          onClick={() => setEditNote({ id:item.id, text:item.note })}
                          title="Clic para editar nota"
                          style={{ fontSize:"12px", color:item.note?"var(--text-mid)":"var(--text-muted)",
                            fontStyle:item.note?"normal":"italic", cursor:"text", margin:0, lineHeight:1.4 }}
                        >
                          {item.note || "Añade una nota..."}
                        </p>
                      )}
                    </td>
                    <td style={{ ...TD_S, whiteSpace:"nowrap" }}>
                      <div style={{ display:"flex", gap:"6px", justifyContent:"flex-end" }}>
                        <button
                          onClick={() => onMoveToPortfolio(item)}
                          style={{ padding:"5px 10px", borderRadius:"5px", fontSize:"11px", fontWeight:600,
                            border:"1px solid var(--accent)", background:"transparent", color:"var(--accent)",
                            cursor:"pointer", display:"flex", alignItems:"center", gap:"4px" }}
                        >
                          <Plus size={11}/> Cartera
                        </button>
                        <button
                          onClick={() => removeFromWatchlist(item.id)}
                          style={{ padding:"5px 8px", borderRadius:"5px", border:"1px solid var(--border)",
                            background:"transparent", color:"var(--text-muted)", cursor:"pointer",
                            display:"flex", alignItems:"center" }}
                        >
                          <Trash2 size={12}/>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
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

const MODAL_CLOSED: ModalState = {
  open: false, mode: "add", id: "", symbol: STOCKS[0].symbol, qty: "", avgPrice: "",
};

export default function MercadoPage() {
  const [tab, setTab] = useState<Tab>("Precios");

  // Crypto state
  const [tickers,    setTickers]    = useState<Record<string, BinanceTicker>>({});
  const [klines,     setKlines]     = useState<Record<string, KlinePoint[]>>({});
  const [cryptoLast, setCryptoLast] = useState<Date | null>(null);

  // Acciones state
  const [stockQuotes,   setStockQuotes]   = useState<Record<string, FinnhubQuote | null>>({});
  const [stocksLast,    setStocksLast]    = useState<Date | null>(null);
  const [stocksLoading, setStocksLoading] = useState(false);
  const [stocksError,   setStocksError]   = useState("");

  // Portfolio positions
  const [positions, setPositions] = useState<Position[]>([]);
  const [hydrated,  setHydrated]  = useState(false);
  const [modal,     setModal]     = useState<ModalState>(MODAL_CLOSED);

  const positionsRef = useRef<Position[]>([]);

  // Watchlist
  const [watchlist,       setWatchlist]       = useState<WatchlistItem[]>([]);
  const [watchlistHydrated, setWatchlistHydrated] = useState(false);
  const [moveItem,        setMoveItem]        = useState<WatchlistItem | null>(null);

  // Noticias state
  const [news,        setNews]        = useState<NewsItem[]>([]);
  const [newsLoading, setNewsLoading] = useState(false);
  const [newsError,   setNewsError]   = useState("");

  // ── Hydration ──────────────────────────────────────────────────────────────

  useEffect(() => {
    setPositions(loadPositions());
    setHydrated(true);
  }, []);

  useEffect(() => {
    setWatchlist(loadWatchlist());
    setWatchlistHydrated(true);
  }, []);

  useEffect(() => {
    positionsRef.current = positions;
  }, [positions]);

  useEffect(() => {
    if (!hydrated) return;
    savePositions(positions);
  }, [positions, hydrated]);

  useEffect(() => {
    if (!watchlistHydrated) return;
    saveWatchlist(watchlist);
  }, [watchlist, watchlistHydrated]);

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

  // ── News fetcher ───────────────────────────────────────────────────────────

  async function fetchNews() {
    const key = process.env.NEXT_PUBLIC_FINNHUB_KEY;
    if (!key) { setNewsError("no_key"); return; }
    setNewsLoading(true); setNewsError("");
    try {
      const r = await fetch(`https://finnhub.io/api/v1/news?category=crypto&token=${key}`);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data = await r.json();
      setNews(Array.isArray(data) ? data.slice(0, 30) : []);
    } catch { setNewsError("fetch_error"); }
    finally { setNewsLoading(false); }
  }

  // ── Effects ────────────────────────────────────────────────────────────────

  useEffect(() => {
    fetchTickers(); fetchKlines();
    const id = setInterval(fetchTickers, 30_000);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Acciones: interval-based refresh using ref (avoids stale closure over positions)
  useEffect(() => {
    if (tab !== "Acciones") return;

    const key = process.env.NEXT_PUBLIC_FINNHUB_KEY;
    if (!key) { setStocksError("no_key"); return; }

    async function doFetch() {
      const syms = [...new Set(positionsRef.current.map(p => p.symbol))];
      if (!syms.length) { setStockQuotes({}); return; }
      setStocksLoading(true); setStocksError("");
      try {
        const results = await Promise.all(
          syms.map(s =>
            fetch(`https://finnhub.io/api/v1/quote?symbol=${s}&token=${key}`)
              .then(r => r.ok ? r.json() : null).catch(() => null)
          )
        );
        const map: Record<string, FinnhubQuote | null> = {};
        results.forEach((r, i) => { map[syms[i]] = r; });
        setStockQuotes(map);
        setStocksLast(new Date());
      } catch { setStocksError("fetch_error"); }
      finally { setStocksLoading(false); }
    }

    doFetch();
    const id = setInterval(doFetch, 60_000);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  // Re-fetch immediately when positions change (add/edit/delete)
  useEffect(() => {
    if (tab !== "Acciones" || !hydrated) return;
    const key = process.env.NEXT_PUBLIC_FINNHUB_KEY;
    if (!key) return;
    const syms = [...new Set(positions.map(p => p.symbol))];
    if (!syms.length) { setStockQuotes({}); return; }
    Promise.all(
      syms.map(s =>
        fetch(`https://finnhub.io/api/v1/quote?symbol=${s}&token=${key}`)
          .then(r => r.ok ? r.json() : null).catch(() => null)
      )
    ).then(results => {
      const map: Record<string, FinnhubQuote | null> = {};
      results.forEach((r, i) => { map[syms[i]] = r; });
      setStockQuotes(map);
      setStocksLast(new Date());
    }).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [positions, hydrated]);

  useEffect(() => {
    if (tab !== "Noticias") return;
    fetchNews();
    const id = setInterval(fetchNews, 5 * 60_000);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  // ── Position handlers ──────────────────────────────────────────────────────

  function openAdd() {
    const available = STOCKS.filter(s => !positions.some(p => p.symbol === s.symbol));
    const defaultSym = available[0]?.symbol ?? STOCKS[0].symbol;
    setModal({ open: true, mode: "add", id: "", symbol: defaultSym, qty: "", avgPrice: "" });
  }

  function openEdit(pos: Position) {
    setModal({
      open: true, mode: "edit", id: pos.id, symbol: pos.symbol,
      qty: pos.quantity.toString(), avgPrice: pos.avgPrice.toString(),
    });
  }

  function handleModalSave(id: string, symbol: string, qty: number, avgPrice: number) {
    if (modal.mode === "add") {
      setPositions(prev => [...prev, { id: newId(), symbol, quantity: qty, avgPrice }]);
    } else {
      setPositions(prev => prev.map(p => p.id === id ? { ...p, quantity: qty, avgPrice } : p));
    }
    setModal(MODAL_CLOSED);
  }

  function handleDelete(id: string) {
    setPositions(prev => prev.filter(p => p.id !== id));
    setStockQuotes(prev => {
      const deleted = positions.find(p => p.id === id);
      if (!deleted) return prev;
      const next = { ...prev };
      // Only remove quote if no other position uses this symbol
      const otherHas = positions.some(p => p.id !== id && p.symbol === deleted.symbol);
      if (!otherHas) delete next[deleted.symbol];
      return next;
    });
  }

  // ── Portfolio totals ───────────────────────────────────────────────────────

  const totals = positions.reduce(
    (acc, pos) => {
      const region = getStock(pos.symbol)?.region ?? "US";
      const q = stockQuotes[pos.symbol];
      const price = q && q.c > 0 ? q.c : null;
      const val   = price !== null ? price * pos.quantity : null;
      const pnl   = price !== null ? (price - pos.avgPrice) * pos.quantity : null;
      if (region === "US") return {
        ...acc,
        usVal:  acc.usVal  + (val  ?? 0),
        usPnl:  acc.usPnl  + (pnl  ?? 0),
        usHas:  acc.usHas  || price !== null,
      };
      return {
        ...acc,
        euVal:  acc.euVal  + (val  ?? 0),
        euPnl:  acc.euPnl  + (pnl  ?? 0),
        euHas:  acc.euHas  || price !== null,
      };
    },
    { usVal: 0, usPnl: 0, usHas: false, euVal: 0, euPnl: 0, euHas: false }
  );

  // ── Move from watchlist to portfolio ──────────────────────────────────────

  function handleMoveToPortfolio(symbol: string, _name: string, qty: number, avgPrice: number) {
    setPositions(prev => [...prev, { id: newId(), symbol, quantity: qty, avgPrice }]);
    setWatchlist(prev => prev.filter(w => w.symbol !== symbol));
    setMoveItem(null);
    setTab("Acciones");
  }

  // ── Tab config ─────────────────────────────────────────────────────────────

  const TABS: [Tab, string][] = [
    ["Precios",  "Crypto"],
    ["Acciones", "Acciones IBKR"],
    ["Screener", "Screener"],
    ["Noticias", "Noticias"],
  ];

  const existingSymbols = positions.map(p => p.symbol);

  return (
    <div style={{ padding: "32px 40px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 600, color: "var(--text)", margin: "0 0 4px" }}>Mercado</h1>
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

      {/* ── TAB 1: Crypto ───────────────────────────────────────────────────── */}
      {tab === "Precios" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "14px" }}>
          {COINS.map(coin => (
            <CoinCard key={coin.pair} coin={coin} ticker={tickers[coin.pair]} klines={klines[coin.pair] ?? []} />
          ))}
        </div>
      )}

      {/* ── TAB 2: Acciones ─────────────────────────────────────────────────── */}
      {tab === "Acciones" && (
        <div>
          {/* Portfolio banner */}
          <div style={{
            ...CARD, display: "flex", alignItems: "center", flexWrap: "wrap",
            gap: "16px", marginBottom: "20px", padding: "14px 20px",
          }}>
            <span style={{ fontSize: "16px" }}>💼</span>

            <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
              {positions.length === 0
                ? "Sin posiciones"
                : `${positions.length} posición${positions.length !== 1 ? "es" : ""}`}
            </span>

            {(totals.usHas || totals.euHas) && (
              <span style={{ fontSize: "11px", color: "var(--border)" }}>·</span>
            )}

            {totals.usHas && (
              <div style={{ display: "flex", gap: "5px", alignItems: "baseline" }}>
                <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>US</span>
                <span style={{ ...MONO, fontSize: "14px", fontWeight: 700, color: "var(--text)" }}>
                  {fmtMoney(totals.usVal, "US")}
                </span>
                <span style={{
                  ...MONO, fontSize: "12px", fontWeight: 700,
                  color: totals.usPnl >= 0 ? "var(--green)" : "var(--red)",
                }}>
                  {fmtMoneySign(totals.usPnl, "US")}
                </span>
              </div>
            )}

            {totals.usHas && totals.euHas && (
              <span style={{ fontSize: "11px", color: "var(--border)" }}>|</span>
            )}

            {totals.euHas && (
              <div style={{ display: "flex", gap: "5px", alignItems: "baseline" }}>
                <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>EU</span>
                <span style={{ ...MONO, fontSize: "14px", fontWeight: 700, color: "var(--text)" }}>
                  {fmtMoney(totals.euVal, "EU")}
                </span>
                <span style={{
                  ...MONO, fontSize: "12px", fontWeight: 700,
                  color: totals.euPnl >= 0 ? "var(--green)" : "var(--red)",
                }}>
                  {fmtMoneySign(totals.euPnl, "EU")}
                </span>
              </div>
            )}

            <button
              onClick={openAdd}
              style={{
                marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: "5px",
                padding: "6px 13px", borderRadius: "6px",
                border: "1px solid var(--accent)", background: "transparent",
                color: "var(--accent)", cursor: "pointer", fontSize: "12px", fontWeight: 600,
              }}
            >
              <Plus size={13} /> Añadir posición
            </button>
          </div>

          {/* Error states */}
          {stocksError === "no_key" && <NoKeyBanner />}
          {stocksError === "fetch_error" && (
            <div style={{ ...CARD, textAlign: "center", padding: "32px" }}>
              <p style={{ color: "var(--text-muted)", margin: "0 0 12px" }}>Error al cargar cotizaciones</p>
              <button
                onClick={() => {
                  const syms = positions.map(p => p.symbol);
                  const key = process.env.NEXT_PUBLIC_FINNHUB_KEY;
                  if (!key || !syms.length) return;
                  Promise.all(syms.map(s =>
                    fetch(`https://finnhub.io/api/v1/quote?symbol=${s}&token=${key}`)
                      .then(r => r.ok ? r.json() : null).catch(() => null)
                  )).then(res => {
                    const map: Record<string, FinnhubQuote | null> = {};
                    res.forEach((r, i) => { map[syms[i]] = r; });
                    setStockQuotes(map); setStocksLast(new Date()); setStocksError("");
                  });
                }}
                style={{ display: "inline-flex", alignItems: "center", gap: "6px",
                  padding: "7px 16px", borderRadius: "5px", border: "1px solid var(--border)",
                  background: "transparent", color: "var(--text-muted)", cursor: "pointer", fontSize: "12px" }}
              >
                <RefreshCw size={13} /> Reintentar
              </button>
            </div>
          )}

          {/* Empty state */}
          {!stocksError && positions.length === 0 && (
            <div style={{ ...CARD, textAlign: "center", padding: "52px 32px" }}>
              <p style={{ fontSize: "15px", fontWeight: 600, color: "var(--text)", margin: "0 0 8px" }}>
                Sin posiciones añadidas
              </p>
              <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: "0 0 20px" }}>
                Añade tu cartera de IBKR para ver el valor y PyG en tiempo real.
              </p>
              <button onClick={openAdd} style={{
                display: "inline-flex", alignItems: "center", gap: "7px",
                padding: "9px 20px", borderRadius: "7px",
                border: "1px solid var(--accent)", background: "var(--accent)",
                color: "#fff", cursor: "pointer", fontSize: "13px", fontWeight: 600,
              }}>
                <Plus size={15} /> Añadir primera posición
              </button>
            </div>
          )}

          {/* Loading initial */}
          {stocksLoading && !stocksError && positions.length > 0 && Object.keys(stockQuotes).length === 0 && (
            <div style={{ textAlign: "center", padding: "32px", color: "var(--text-muted)", fontSize: "13px" }}>
              Cargando cotizaciones…
            </div>
          )}

          {/* Positions grid */}
          {!stocksError && positions.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
              {positions.map(pos => (
                <PositionCard
                  key={pos.id}
                  position={pos}
                  quote={stockQuotes[pos.symbol]}
                  onEdit={() => openEdit(pos)}
                  onDelete={() => handleDelete(pos.id)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 3: Screener ─────────────────────────────────────────────────── */}
      {tab === "Screener" && (
        <ScreenerTab
          watchlist={watchlist}
          setWatchlist={setWatchlist}
          positions={positions}
          onMoveToPortfolio={item => setMoveItem(item)}
        />
      )}

      {/* ── TAB 4: Noticias ─────────────────────────────────────────────────── */}
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

      {/* Position modal (Acciones) */}
      {modal.open && (
        <PositionModal
          key={modal.id + modal.mode}
          modal={modal}
          existingSymbols={existingSymbols}
          onSave={handleModalSave}
          onClose={() => setModal(MODAL_CLOSED)}
        />
      )}

      {/* Move from watchlist to portfolio modal */}
      {moveItem && (
        <MoveToPortfolioModal
          key={moveItem.id}
          item={moveItem}
          onSave={handleMoveToPortfolio}
          onClose={() => setMoveItem(null)}
        />
      )}
    </div>
  );
}
