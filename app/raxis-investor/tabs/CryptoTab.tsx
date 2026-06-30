"use client";

import { useState, useEffect } from "react";
import { LineChart, Line, ResponsiveContainer } from "recharts";

type CoinCfg = { symbol:string; pair:string; name:string; color:string };
type BinanceTicker = { symbol:string; lastPrice:string; priceChangePercent:string; quoteVolume:string; highPrice:string; lowPrice:string };
type KlinePoint = { c:number };

const COINS: CoinCfg[] = [
  { symbol:"BTC", pair:"BTCUSDT", name:"Bitcoin",  color:"#F7931A" },
  { symbol:"ETH", pair:"ETHUSDT", name:"Ethereum", color:"#627EEA" },
  { symbol:"SOL", pair:"SOLUSDT", name:"Solana",   color:"#9945FF" },
  { symbol:"XRP", pair:"XRPUSDT", name:"Ripple",   color:"#00AAE4" },
  { symbol:"DOGE",pair:"DOGEUSDT",name:"Dogecoin", color:"#C2A633" },
  { symbol:"BNB", pair:"BNBUSDT", name:"BNB",      color:"#F0B90B" },
];

type CryptoItem = { coin:string; nombre:string; cantidad:number; valor:number; pnl:number; pnlPct:number; estado:string; target:string };
const CRYPTO_KEY = "raxislab_cartera_snap_crypto";

const CARD: React.CSSProperties  = { background:"var(--card)", border:"1px solid var(--border)", borderRadius:"8px", padding:"16px" };
const LABEL: React.CSSProperties = { fontSize:"11px", fontWeight:600, letterSpacing:"0.08em", textTransform:"uppercase", color:"var(--text-muted)" };
const MONO: React.CSSProperties  = { fontFamily:"'Space Mono', monospace" };
const TH = { padding:"10px 14px", textAlign:"left" as const, fontSize:"11px", fontWeight:600, letterSpacing:"0.06em", color:"var(--text-muted)", borderBottom:"1px solid var(--border)" };
const TD = { padding:"11px 14px", borderBottom:"1px solid var(--border)" };

function fmtPrice(p:string) {
  const n = parseFloat(p);
  if (n>=1000) return `$${n.toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2})}`;
  if (n>=1) return `$${n.toFixed(4)}`;
  return `$${n.toFixed(5)}`;
}
function fmtVol(v:string) {
  const n = parseFloat(v);
  if (n>=1e9) return `$${(n/1e9).toFixed(2)}B`;
  if (n>=1e6) return `$${(n/1e6).toFixed(2)}M`;
  return `$${(n/1000).toFixed(2)}K`;
}

function MiniLine({ data, color }: { data:KlinePoint[]; color:string }) {
  if (!data?.length) return <div style={{ height:48 }}/>;
  return (
    <ResponsiveContainer width="100%" height={48}>
      <LineChart data={data} margin={{ top:4, right:0, bottom:4, left:0 }}>
        <Line type="monotone" dataKey="c" stroke={color} strokeWidth={1.5} dot={false} isAnimationActive={false}/>
      </LineChart>
    </ResponsiveContainer>
  );
}

function CoinCard({ coin, ticker, klines }: { coin:CoinCfg; ticker:BinanceTicker|undefined; klines:KlinePoint[] }) {
  const pct = ticker ? parseFloat(ticker.priceChangePercent) : 0;
  const isPos = pct >= 0;
  return (
    <div style={CARD}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"10px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
          <span style={{ width:34,height:34,borderRadius:"50%",background:coin.color+"22",border:`1px solid ${coin.color}55`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"9px",fontWeight:700,color:coin.color,...MONO,flexShrink:0 }}>
            {coin.symbol}
          </span>
          <div>
            <p style={{ ...LABEL, margin:0 }}>{coin.symbol}</p>
            <p style={{ fontSize:"11px", color:"var(--text-muted)", margin:0, lineHeight:1.3 }}>{coin.name}</p>
          </div>
        </div>
        <span style={{ fontSize:"12px", fontWeight:700, ...MONO, color:isPos?"var(--green)":"var(--red)", background:`${isPos?"var(--green)":"var(--red)"}18`, padding:"2px 8px", borderRadius:"4px" }}>
          {isPos?"+":""}{pct.toFixed(2)}%
        </span>
      </div>
      <p style={{ ...MONO, fontSize:"21px", fontWeight:700, color:"var(--text)", margin:"0 0 2px", lineHeight:1 }}>
        {ticker ? fmtPrice(ticker.lastPrice) : "—"}
      </p>
      <MiniLine data={klines} color={coin.color}/>
      <div style={{ marginTop:"4px", display:"flex", gap:"20px" }}>
        <div>
          <p style={{ ...LABEL, fontSize:"10px", margin:"0 0 1px" }}>Vol 24h</p>
          <p style={{ fontSize:"11px", ...MONO, color:"var(--text-mid)", margin:0 }}>{ticker?fmtVol(ticker.quoteVolume):"—"}</p>
        </div>
        <div>
          <p style={{ ...LABEL, fontSize:"10px", margin:"0 0 1px" }}>Máx/Mín</p>
          <p style={{ fontSize:"11px", ...MONO, color:"var(--text-mid)", margin:0 }}>
            {ticker?`${fmtPrice(ticker.highPrice)} / ${fmtPrice(ticker.lowPrice)}`:"—"}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function CryptoTab() {
  const [tickers, setTickers]   = useState<Record<string,BinanceTicker>>({});
  const [klines, setKlines]     = useState<Record<string,KlinePoint[]>>({});
  const [last, setLast]         = useState<Date|null>(null);
  const [cartera, setCartera]   = useState<CryptoItem[]>([]);
  const [editing, setEditing]   = useState(false);
  const [newItem, setNewItem]   = useState({ coin:"", nombre:"", cantidad:"", valor:"", pnl:"", target:"", estado:"MANTENER" });

  useEffect(() => {
    const c = localStorage.getItem(CRYPTO_KEY);
    if (c) setCartera(JSON.parse(c));
  }, []);

  async function fetchTickers() {
    try {
      const results = await Promise.all(COINS.map(c=>fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${c.pair}`).then(r=>r.json())));
      const map: Record<string,BinanceTicker> = {};
      results.forEach((r,i)=>{map[COINS[i].pair]=r;});
      setTickers(map); setLast(new Date());
    } catch { /* silent */ }
  }

  async function fetchKlines() {
    try {
      const results = await Promise.all(COINS.map(c=>fetch(`https://api.binance.com/api/v3/klines?symbol=${c.pair}&interval=1h&limit=24`).then(r=>r.json())));
      const map: Record<string,KlinePoint[]> = {};
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      results.forEach((arr:any[],i)=>{map[COINS[i].pair]=arr.map((k:any[])=>({c:parseFloat(k[4])}));});
      setKlines(map);
    } catch { /* silent */ }
  }

  useEffect(() => {
    fetchTickers(); fetchKlines();
    const id = setInterval(fetchTickers, 30000);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function saveCartera(next:CryptoItem[]) {
    setCartera(next);
    localStorage.setItem(CRYPTO_KEY, JSON.stringify(next));
  }
  function addItem() {
    if (!newItem.coin) return;
    const pnlN = parseFloat(newItem.pnl||"0");
    saveCartera([...cartera, { coin:newItem.coin.toUpperCase(), nombre:newItem.nombre, cantidad:parseFloat(newItem.cantidad||"0"), valor:parseFloat(newItem.valor||"0"), pnl:pnlN, pnlPct:parseFloat(newItem.valor||"1")>0?pnlN/(parseFloat(newItem.valor||"1")-pnlN)*100:0, estado:newItem.estado, target:newItem.target||"—" }]);
    setNewItem({ coin:"", nombre:"", cantidad:"", valor:"", pnl:"", target:"", estado:"MANTENER" });
  }
  function removeItem(idx:number) { saveCartera(cartera.filter((_,i)=>i!==idx)); }

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:"24px" }}>
      {/* Live prices */}
      <div>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"12px" }}>
          <p style={LABEL}>Precios en vivo — Binance</p>
          {last && <span style={{ fontSize:"11px", color:"var(--text-muted)", display:"flex", alignItems:"center", gap:"5px" }}>
            <span style={{ width:6,height:6,borderRadius:"50%",background:"var(--green)",display:"inline-block" }}/>
            {last.toLocaleTimeString("es-ES")}
          </span>}
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"14px" }}>
          {COINS.map(coin=><CoinCard key={coin.pair} coin={coin} ticker={tickers[coin.pair]} klines={klines[coin.pair]??[]}/>)}
        </div>
      </div>

      {/* Manual crypto portfolio */}
      <div>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"12px" }}>
          <p style={LABEL}>Cartera Crypto — snapshot manual</p>
          <button onClick={()=>setEditing(e=>!e)} style={{ padding:"6px 14px", borderRadius:"4px", background:"var(--accent-dim)", color:"var(--accent)", border:"1px solid var(--border-accent)", fontSize:"12px", fontWeight:600, cursor:"pointer" }}>
            {editing?"Cerrar edición":"Editar cartera"}
          </button>
        </div>

        {editing && (
          <div style={{ ...CARD, marginBottom:"12px", display:"flex", gap:"8px", flexWrap:"wrap", alignItems:"flex-end" }}>
            {[["Coin","coin","SOL","70px"],["Nombre","nombre","Solana","120px"],["Cantidad","cantidad","10.5","90px"],["Valor $","valor","650","90px"],["PnL $","pnl","-100","90px"],["Target","target","$500","90px"]].map(([l,k,ph,w])=>(
              <div key={k}>
                <p style={{ fontSize:"11px", color:"var(--text-muted)", marginBottom:"3px" }}>{l}</p>
                <input value={(newItem as Record<string,string>)[k]} onChange={e=>setNewItem(p=>({...p,[k]:e.target.value}))} placeholder={ph as string}
                  style={{ width:w as string, padding:"6px 8px", borderRadius:"4px", border:"1px solid var(--border)", background:"var(--card-hover)", color:"var(--text)", fontSize:"12px", outline:"none" }}/>
              </div>
            ))}
            <div>
              <p style={{ fontSize:"11px", color:"var(--text-muted)", marginBottom:"3px" }}>Estado</p>
              <select value={newItem.estado} onChange={e=>setNewItem(p=>({...p,estado:e.target.value}))} style={{ padding:"6px 8px", borderRadius:"4px", border:"1px solid var(--border)", background:"var(--card-hover)", color:"var(--text)", fontSize:"12px", outline:"none" }}>
                <option>MANTENER</option><option>LIQUIDEZ</option><option>TOMAR PARCIALES</option><option>REVISAR TESIS</option>
              </select>
            </div>
            <button onClick={addItem} style={{ padding:"7px 14px", borderRadius:"4px", background:"var(--accent)", color:"#fff", fontSize:"12px", fontWeight:600, border:"none", cursor:"pointer" }}>+ Añadir</button>
          </div>
        )}

        <div style={{ background:"var(--card)", border:"1px solid var(--border)", borderRadius:"6px", overflow:"hidden" }}>
          {cartera.length===0 ? (
            <div style={{ padding:"40px", textAlign:"center", color:"var(--text-muted)", fontSize:"13px" }}>
              Cartera vacía. Pulsa «Editar cartera» para añadir posiciones.
            </div>
          ) : (
            <table style={{ width:"100%", borderCollapse:"collapse" }}>
              <thead><tr>{["Coin","Nombre","Cantidad","Valor $","PnL $","PnL %","Target","Estado",editing?"":""].map((h,i)=><th key={i} style={TH}>{h}</th>)}</tr></thead>
              <tbody>
                {cartera.map((item,idx)=>{
                  const pColor = item.pnl>0?"var(--green)":item.pnl<0?"var(--red)":"var(--text-mid)";
                  const sign = item.pnl>0?"+":"";
                  const badge: React.CSSProperties = item.estado==="MANTENER"?{background:"var(--accent-dim)",color:"var(--accent)",border:"1px solid var(--border-accent)"}:item.estado==="TOMAR PARCIALES"?{background:"rgba(255,184,0,0.12)",color:"var(--amber)",border:"1px solid rgba(255,184,0,0.25)"}:{background:"rgba(255,61,113,0.12)",color:"var(--red)",border:"1px solid rgba(255,61,113,0.25)"};
                  return (
                    <tr key={idx}>
                      <td style={{ ...TD, ...MONO, fontWeight:700, color:"var(--amber)" }}>{item.coin}</td>
                      <td style={{ ...TD, fontSize:"13px", color:"var(--text-muted)" }}>{item.nombre}</td>
                      <td style={{ ...TD, ...MONO, fontSize:"12px", color:"var(--text-mid)" }}>{item.cantidad}</td>
                      <td style={{ ...TD, ...MONO, fontSize:"13px", color:"var(--text)" }}>${item.valor.toFixed(2)}</td>
                      <td style={{ ...TD, ...MONO, fontWeight:700, color:pColor }}>{sign}${Math.abs(item.pnl).toFixed(2)}</td>
                      <td style={{ ...TD, ...MONO, fontWeight:700, color:pColor }}>{sign}{Math.abs(item.pnlPct).toFixed(1)}%</td>
                      <td style={{ ...TD, fontSize:"12px", color:"var(--accent)" }}>{item.target}</td>
                      <td style={TD}><span style={{ fontSize:"10px", fontWeight:700, padding:"2px 7px", borderRadius:"3px", ...badge }}>{item.estado}</span></td>
                      {editing && <td style={TD}><button onClick={()=>removeItem(idx)} style={{ fontSize:"11px", padding:"2px 8px", borderRadius:"3px", background:"rgba(255,61,113,0.12)", color:"var(--red)", border:"1px solid rgba(255,61,113,0.25)", cursor:"pointer" }}>✕</button></td>}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
