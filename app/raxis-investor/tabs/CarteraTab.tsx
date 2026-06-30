"use client";

import { useState, useEffect, useRef } from "react";
import { Plus, Pencil, Trash2, X, RefreshCw } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

export type Position = { id:string; symbol:string; quantity:number; avgPrice:number };

type StockCfg = { symbol:string; display:string; name:string; region:"US"|"EU" };
type FinnhubQuote = { c:number; d:number; dp:number; h:number; l:number; o:number; pc:number; t:number };
type ModalState = { open:boolean; mode:"add"|"edit"; id:string; symbol:string; qty:string; avgPrice:string };

// ── Config ────────────────────────────────────────────────────────────────────

export const STOCKS: StockCfg[] = [
  // ── US ────────────────────────────────────────────────────────────────────────
  { symbol:"CRCL",    display:"CRCL", name:"Circle Internet Group",    region:"US" },
  { symbol:"RCUS",    display:"RCUS", name:"Arcus Biosciences",        region:"US" },
  { symbol:"KEEL",    display:"KEEL", name:"Keel Infrastructure Corp", region:"US" },
  { symbol:"MO",      display:"MO",   name:"Altria Group (PHM7/IBKR)", region:"US" },
  { symbol:"AAOI",    display:"AAOI", name:"Applied Optoelectronics",  region:"US" },
  { symbol:"SWKS",    display:"SWKS", name:"Skyworks Solutions",       region:"US" },
  { symbol:"INTC",    display:"INTC", name:"Intel Corp",               region:"US" },
  { symbol:"BE",      display:"BE",   name:"Bloom Energy Corp-A",      region:"US" },
  // ── EU ────────────────────────────────────────────────────────────────────────
  { symbol:"BBVA.MC", display:"BBVA", name:"Banco Bilbao Vizcaya",     region:"EU" },
  { symbol:"AI.PA",   display:"AI",   name:"Air Liquide SA",           region:"EU" },
  { symbol:"ENGI.PA", display:"ENGI", name:"Engie SA",                 region:"EU" },
  { symbol:"LOG.MC",  display:"LOG",  name:"Logista Integral SA",      region:"EU" },
  { symbol:"ENI.MI",  display:"ENI",  name:"ENI SpA",                  region:"EU" },
  { symbol:"REP.MC",  display:"REP",  name:"Repsol SA",                region:"EU" },
];

// ── localStorage ──────────────────────────────────────────────────────────────

export const POSITIONS_KEY = "raxislab_acciones_v1";

// Pre-cargadas con la cartera real de IBKR (actualizado 2026-06-30).
// MO avg en USD ≈ 55.72 EUR avg del IBKR symbol PHM7 — verificar y ajustar si es necesario.
const DEFAULT_POSITIONS: Position[] = [
  { id:"d-crcl",  symbol:"CRCL",    quantity:16,      avgPrice:80.49  },
  { id:"d-rcus",  symbol:"RCUS",    quantity:50,      avgPrice:30.40  },
  { id:"d-keel",  symbol:"KEEL",    quantity:100,     avgPrice:6.77   },
  { id:"d-mo",    symbol:"MO",      quantity:7,       avgPrice:59.50  },
  { id:"d-aaoi",  symbol:"AAOI",    quantity:5,       avgPrice:165.85 },
  { id:"d-swks",  symbol:"SWKS",    quantity:30,      avgPrice:74.43  },
  { id:"d-intc",  symbol:"INTC",    quantity:6.5,     avgPrice:132.73 },
  { id:"d-be",    symbol:"BE",      quantity:6,       avgPrice:319.58 },
  { id:"d-bbva",  symbol:"BBVA.MC", quantity:21.0139, avgPrice:19.08  },
  { id:"d-ai",    symbol:"AI.PA",   quantity:3.7146,  avgPrice:148.82 },
  { id:"d-engi",  symbol:"ENGI.PA", quantity:28.4973, avgPrice:21.42  },
  { id:"d-log",   symbol:"LOG.MC",  quantity:11,      avgPrice:28.14  },
  { id:"d-eni",   symbol:"ENI.MI",  quantity:26.6792, avgPrice:21.45  },
  { id:"d-rep",   symbol:"REP.MC",  quantity:37.3208, avgPrice:20.28  },
];

const VALID_SYMBOLS = new Set(STOCKS.map(s => s.symbol));

export function loadPositions(): Position[] {
  if (typeof window === "undefined") return DEFAULT_POSITIONS;
  try {
    const r = localStorage.getItem(POSITIONS_KEY);
    if (!r) return DEFAULT_POSITIONS;
    const saved: Position[] = JSON.parse(r);
    // Filtra tickers vendidos o no reconocidos; si queda vacío usa defaults
    const filtered = saved.filter(p => VALID_SYMBOLS.has(p.symbol));
    return filtered.length > 0 ? filtered : DEFAULT_POSITIONS;
  }
  catch { return DEFAULT_POSITIONS; }
}
export function savePositions(ps: Position[]) {
  localStorage.setItem(POSITIONS_KEY, JSON.stringify(ps));
}

function newId() { return Date.now().toString(36) + Math.random().toString(36).slice(2,6); }
function getStock(sym: string) { return STOCKS.find(s => s.symbol === sym); }

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtMoney(n: number, region:"US"|"EU") {
  const abs = Math.abs(n);
  const s = abs >= 10000 ? abs.toLocaleString("en-US",{minimumFractionDigits:0,maximumFractionDigits:0}) : abs.toFixed(2);
  return region === "US" ? `${n<0?"−":""}$${s}` : `${n<0?"−":""}${s} €`;
}
function fmtSign(n: number, region:"US"|"EU") {
  const abs = Math.abs(n);
  const s = abs >= 10000 ? abs.toLocaleString("en-US",{minimumFractionDigits:0,maximumFractionDigits:0}) : abs.toFixed(2);
  return region === "US" ? `${n>=0?"+":"−"}$${s}` : `${n>=0?"+":"−"}${s} €`;
}
function fmtPct(n: number) { return `${n>=0?"+":""}${n.toFixed(2)}%`; }

// ── Styles ────────────────────────────────────────────────────────────────────

const CARD: React.CSSProperties = { background:"var(--card)", border:"1px solid var(--border)", borderRadius:"8px", padding:"16px" };
const LABEL: React.CSSProperties = { fontSize:"11px", fontWeight:600, letterSpacing:"0.08em", textTransform:"uppercase", color:"var(--text-muted)" };
const MONO: React.CSSProperties = { fontFamily:"'Space Mono', monospace" };
const INPUT: React.CSSProperties = { width:"100%", padding:"9px 12px", borderRadius:"6px", border:"1px solid var(--border)", background:"var(--bg)", color:"var(--text)", fontSize:"13px", boxSizing:"border-box", outline:"none" };

// ── PositionCard ──────────────────────────────────────────────────────────────

function PositionCard({ position, quote, onEdit, onDelete }: {
  position:Position; quote:FinnhubQuote|null|undefined; onEdit:()=>void; onDelete:()=>void;
}) {
  const stock = getStock(position.symbol);
  const region = stock?.region ?? "US";
  const name = stock?.name ?? position.symbol;
  const display = stock?.display ?? position.symbol;

  const noData = quote !== undefined && (quote === null || quote.c === 0);
  const loading = quote === undefined;
  const price = !loading && !noData && quote ? quote.c : null;
  const dailyPct = !noData && quote ? quote.dp : null;
  const dailyChg = !noData && quote ? quote.d : null;
  const dailyPos = dailyPct !== null && dailyPct >= 0;
  const marketVal = price !== null ? price * position.quantity : null;
  const pnl = price !== null ? (price - position.avgPrice) * position.quantity : null;
  const pnlPct = price !== null && position.avgPrice > 0 ? ((price - position.avgPrice) / position.avgPrice) * 100 : null;
  const pnlPos = pnl !== null && pnl >= 0;
  const pnlColor = pnl === null ? "var(--text-muted)" : pnlPos ? "var(--green)" : "var(--red)";
  const badgeClr = region === "EU" ? "var(--amber)" : "var(--accent)";

  return (
    <div style={{ ...CARD, display:"flex", flexDirection:"column", gap:"9px" }}>
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"8px", flex:1, minWidth:0 }}>
          <span style={{ padding:"2px 6px", borderRadius:"4px", flexShrink:0, background:badgeClr+"22", border:`1px solid ${badgeClr}55`, fontSize:"9px", fontWeight:700, color:badgeClr, ...MONO }}>
            {region}
          </span>
          <div style={{ minWidth:0 }}>
            <p style={{ fontSize:"12px", fontWeight:700, color:"var(--text)", margin:0, ...MONO }}>{display}</p>
            <p style={{ fontSize:"11px", color:"var(--text-muted)", margin:0, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{name}</p>
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:"2px", flexShrink:0 }}>
          {dailyPct !== null && (
            <span style={{ fontSize:"11px", fontWeight:700, ...MONO, color:dailyPos?"var(--green)":"var(--red)", background:`${dailyPos?"var(--green)":"var(--red)"}18`, padding:"2px 5px", borderRadius:"4px", marginRight:"4px" }}>
              {dailyPos?"+":""}{dailyPct.toFixed(2)}%
            </span>
          )}
          <button onClick={onEdit} style={{ background:"none", border:"none", cursor:"pointer", color:"var(--text-muted)", padding:"4px" }}><Pencil size={12}/></button>
          <button onClick={onDelete} style={{ background:"none", border:"none", cursor:"pointer", color:"var(--text-muted)", padding:"4px" }}><Trash2 size={12}/></button>
        </div>
      </div>

      {loading && <p style={{ ...MONO, fontSize:"19px", color:"var(--text-muted)", margin:0 }}>—</p>}
      {noData && <p style={{ fontSize:"11px", color:"var(--text-muted)", fontStyle:"italic", margin:0 }}>Sin datos (plan free)</p>}
      {!loading && !noData && quote && (
        <div style={{ display:"flex", alignItems:"baseline", gap:"8px" }}>
          <p style={{ ...MONO, fontSize:"19px", fontWeight:700, color:"var(--text)", margin:0 }}>
            {region==="US"?`$${price!.toFixed(2)}`:`${price!.toFixed(2)} €`}
          </p>
          {dailyChg !== null && (
            <span style={{ ...MONO, fontSize:"11px", color:dailyPos?"var(--green)":"var(--red)" }}>
              {dailyPos?"+":""}{dailyChg.toFixed(2)} {region==="US"?"$":"€"}
            </span>
          )}
        </div>
      )}

      <div style={{ borderTop:"1px solid var(--border)" }}/>
      <div>
        <p style={{ fontSize:"11px", color:"var(--text-muted)", margin:"0 0 3px" }}>
          {position.quantity.toLocaleString("es-ES")} acc · CM: <span style={{ ...MONO, color:"var(--text-mid)" }}>{region==="US"?`$${position.avgPrice.toFixed(2)}`:`${position.avgPrice.toFixed(2)} €`}</span>
        </p>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <span style={{ fontSize:"11px", color:"var(--text-muted)" }}>Valor: <span style={{ ...MONO, color:"var(--text-mid)" }}>{marketVal!==null?fmtMoney(marketVal,region):"—"}</span></span>
          {pnl!==null&&pnlPct!==null ? (
            <span style={{ ...MONO, fontSize:"11px", fontWeight:700, color:pnlColor }}>{fmtSign(pnl,region)} ({fmtPct(pnlPct)})</span>
          ) : <span style={{ fontSize:"11px", color:"var(--text-muted)" }}>PyG: —</span>}
        </div>
      </div>
    </div>
  );
}

// ── PositionModal ──────────────────────────────────────────────────────────────

function PositionModal({ modal, existingSymbols, onSave, onClose }: {
  modal:ModalState; existingSymbols:string[];
  onSave:(id:string,symbol:string,qty:number,avgPrice:number)=>void; onClose:()=>void;
}) {
  const isEdit = modal.mode === "edit";
  const [symbol, setSymbol] = useState(modal.symbol);
  const [qty, setQty] = useState(modal.qty);
  const [avgPrice, setAvgPrice] = useState(modal.avgPrice);
  const [error, setError] = useState("");
  const available = isEdit ? STOCKS : STOCKS.filter(s => !existingSymbols.includes(s.symbol));
  const us = available.filter(s=>s.region==="US");
  const eu = available.filter(s=>s.region==="EU");
  const cur = getStock(symbol)?.region==="EU"?"€":"$";

  function handleSave() {
    const qN = parseFloat(qty.replace(",",".")), aN = parseFloat(avgPrice.replace(",","."));
    if (!symbol) { setError("Selecciona un ticker"); return; }
    if (!qty||isNaN(qN)||qN<=0) { setError("Cantidad > 0"); return; }
    if (!avgPrice||isNaN(aN)||aN<=0) { setError("Precio medio > 0"); return; }
    onSave(modal.id, symbol, qN, aN);
  }

  return (
    <div style={{ position:"fixed", inset:0, zIndex:200, background:"rgba(0,0,0,0.55)", display:"flex", alignItems:"center", justifyContent:"center" }}
      onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div style={{ ...CARD, width:380, maxWidth:"92vw", boxShadow:"0 20px 60px rgba(0,0,0,0.4)" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"20px" }}>
          <p style={{ fontSize:"15px", fontWeight:600, color:"var(--text)", margin:0 }}>{isEdit?"Editar posición":"Nueva posición"}</p>
          <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer", color:"var(--text-muted)" }}><X size={18}/></button>
        </div>
        <label style={{ ...LABEL, display:"block", marginBottom:"5px" }}>Ticker</label>
        {available.length===0 ? (
          <p style={{ fontSize:"12px", color:"var(--text-muted)", margin:"0 0 14px", fontStyle:"italic" }}>Todas las posiciones ya añadidas.</p>
        ) : (
          <select value={symbol} onChange={e=>{setSymbol(e.target.value);setError("");}} disabled={isEdit}
            style={{ ...INPUT, marginBottom:"14px", opacity:isEdit?0.6:1, cursor:isEdit?"not-allowed":"default" }}>
            {us.length>0 && <optgroup label="🇺🇸 USA">{us.map(s=><option key={s.symbol} value={s.symbol}>{s.display} — {s.name}</option>)}</optgroup>}
            {eu.length>0 && <optgroup label="🇪🇺 Europa">{eu.map(s=><option key={s.symbol} value={s.symbol}>{s.display} — {s.name}</option>)}</optgroup>}
          </select>
        )}
        <label style={{ ...LABEL, display:"block", marginBottom:"5px" }}>Cantidad (acciones)</label>
        <input type="number" value={qty} onChange={e=>{setQty(e.target.value);setError("");}} placeholder="ej: 150" min="0" step="1" style={{ ...INPUT, marginBottom:"14px" }}/>
        <label style={{ ...LABEL, display:"block", marginBottom:"5px" }}>Precio medio ({cur})</label>
        <input type="number" value={avgPrice} onChange={e=>{setAvgPrice(e.target.value);setError("");}} placeholder="ej: 24.10" min="0" step="0.01" style={{ ...INPUT, marginBottom:error?"6px":"16px" }}/>
        {error && <p style={{ fontSize:"12px", color:"var(--red)", margin:"0 0 12px" }}>{error}</p>}
        <div style={{ display:"flex", gap:"8px" }}>
          <button onClick={onClose} style={{ flex:1, padding:"9px", borderRadius:"6px", border:"1px solid var(--border)", background:"transparent", color:"var(--text-muted)", cursor:"pointer", fontSize:"13px" }}>Cancelar</button>
          <button onClick={handleSave} disabled={available.length===0&&!isEdit} style={{ flex:2, padding:"9px", borderRadius:"6px", border:"1px solid var(--accent)", background:"var(--accent)", color:"#fff", cursor:"pointer", fontSize:"13px", fontWeight:600 }}>{isEdit?"Guardar cambios":"Añadir posición"}</button>
        </div>
      </div>
    </div>
  );
}

// ── CarteraTab (main export) ──────────────────────────────────────────────────

const MODAL_CLOSED: ModalState = { open:false, mode:"add", id:"", symbol:STOCKS[0].symbol, qty:"", avgPrice:"" };

export default function CarteraTab() {
  const [positions, setPositions]     = useState<Position[]>([]);
  const [hydrated, setHydrated]       = useState(false);
  const [modal, setModal]             = useState<ModalState>(MODAL_CLOSED);
  const [stockQuotes, setStockQuotes] = useState<Record<string,FinnhubQuote|null>>({});
  const [stocksLast, setStocksLast]   = useState<Date|null>(null);
  const [stocksLoading, setStocksLoading] = useState(false);
  const [stocksError, setStocksError] = useState("");
  const posRef = useRef<Position[]>([]);

  useEffect(() => { setPositions(loadPositions()); setHydrated(true); }, []);
  useEffect(() => { posRef.current = positions; }, [positions]);
  useEffect(() => { if (!hydrated) return; savePositions(positions); }, [positions, hydrated]);

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_FINNHUB_KEY;
    if (!key) { setStocksError("no_key"); return; }
    async function doFetch() {
      const syms = [...new Set(posRef.current.map(p=>p.symbol))];
      if (!syms.length) { setStockQuotes({}); return; }
      setStocksLoading(true); setStocksError("");
      try {
        const results = await Promise.all(syms.map(s=>fetch(`https://finnhub.io/api/v1/quote?symbol=${s}&token=${key}`).then(r=>r.ok?r.json():null).catch(()=>null)));
        const map: Record<string,FinnhubQuote|null> = {};
        results.forEach((r,i)=>{map[syms[i]]=r;});
        setStockQuotes(map); setStocksLast(new Date());
      } catch { setStocksError("fetch_error"); }
      finally { setStocksLoading(false); }
    }
    doFetch();
    const id = setInterval(doFetch, 60000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const key = process.env.NEXT_PUBLIC_FINNHUB_KEY;
    if (!key || !positions.length) return;
    const syms = [...new Set(positions.map(p=>p.symbol))];
    Promise.all(syms.map(s=>fetch(`https://finnhub.io/api/v1/quote?symbol=${s}&token=${key}`).then(r=>r.ok?r.json():null).catch(()=>null)))
      .then(results => {
        const map: Record<string,FinnhubQuote|null> = {};
        results.forEach((r,i)=>{map[syms[i]]=r;});
        setStockQuotes(map); setStocksLast(new Date());
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [positions, hydrated]);

  function openAdd() {
    const avail = STOCKS.filter(s=>!positions.some(p=>p.symbol===s.symbol));
    setModal({open:true,mode:"add",id:"",symbol:avail[0]?.symbol??STOCKS[0].symbol,qty:"",avgPrice:""});
  }
  function openEdit(pos:Position) {
    setModal({open:true,mode:"edit",id:pos.id,symbol:pos.symbol,qty:pos.quantity.toString(),avgPrice:pos.avgPrice.toString()});
  }
  function handleSave(id:string,symbol:string,qty:number,avgPrice:number) {
    if (modal.mode==="add") setPositions(prev=>[...prev,{id:newId(),symbol,quantity:qty,avgPrice}]);
    else setPositions(prev=>prev.map(p=>p.id===id?{...p,quantity:qty,avgPrice}:p));
    setModal(MODAL_CLOSED);
  }
  function handleDelete(id:string) { setPositions(prev=>prev.filter(p=>p.id!==id)); }

  const totals = positions.reduce((acc,pos) => {
    const region = getStock(pos.symbol)?.region??"US";
    const q = stockQuotes[pos.symbol];
    const price = q&&q.c>0?q.c:null;
    const val = price!==null?price*pos.quantity:null;
    const pnl = price!==null?(price-pos.avgPrice)*pos.quantity:null;
    if (region==="US") return {...acc,usVal:acc.usVal+(val??0),usPnl:acc.usPnl+(pnl??0),usHas:acc.usHas||price!==null};
    return {...acc,euVal:acc.euVal+(val??0),euPnl:acc.euPnl+(pnl??0),euHas:acc.euHas||price!==null};
  },{usVal:0,usPnl:0,usHas:false,euVal:0,euPnl:0,euHas:false});

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:"16px" }}>
      {/* Portfolio banner */}
      <div style={{ ...CARD, display:"flex", alignItems:"center", flexWrap:"wrap", gap:"16px", padding:"14px 20px" }}>
        <span style={{ fontSize:"16px" }}>💼</span>
        <span style={{ fontSize:"12px", color:"var(--text-muted)" }}>{positions.length===0?"Sin posiciones":`${positions.length} posición${positions.length!==1?"es":""}`}</span>
        {totals.usHas && <div style={{ display:"flex", gap:"5px", alignItems:"baseline" }}>
          <span style={{ fontSize:"11px", color:"var(--text-muted)" }}>US</span>
          <span style={{ ...MONO, fontSize:"14px", fontWeight:700, color:"var(--text)" }}>{fmtMoney(totals.usVal,"US")}</span>
          <span style={{ ...MONO, fontSize:"12px", fontWeight:700, color:totals.usPnl>=0?"var(--green)":"var(--red)" }}>{fmtSign(totals.usPnl,"US")}</span>
        </div>}
        {totals.euHas && <div style={{ display:"flex", gap:"5px", alignItems:"baseline" }}>
          <span style={{ fontSize:"11px", color:"var(--text-muted)" }}>EU</span>
          <span style={{ ...MONO, fontSize:"14px", fontWeight:700, color:"var(--text)" }}>{fmtMoney(totals.euVal,"EU")}</span>
          <span style={{ ...MONO, fontSize:"12px", fontWeight:700, color:totals.euPnl>=0?"var(--green)":"var(--red)" }}>{fmtSign(totals.euPnl,"EU")}</span>
        </div>}
        {stocksLast && <span style={{ fontSize:"11px", color:"var(--text-muted)", marginLeft:"auto", display:"flex", alignItems:"center", gap:"5px" }}>
          <span style={{ width:6,height:6,borderRadius:"50%",background:"var(--green)",display:"inline-block" }}/>
          {stocksLast.toLocaleTimeString("es-ES")}
        </span>}
        <button onClick={openAdd} style={{ marginLeft:stocksLast?"0":"auto", display:"inline-flex", alignItems:"center", gap:"5px", padding:"6px 13px", borderRadius:"6px", border:"1px solid var(--accent)", background:"transparent", color:"var(--accent)", cursor:"pointer", fontSize:"12px", fontWeight:600 }}>
          <Plus size={13}/> Añadir
        </button>
      </div>

      {stocksError==="no_key" && <div style={{ ...CARD, padding:"32px", textAlign:"center" }}><p style={{ color:"var(--text-muted)" }}>Configura NEXT_PUBLIC_FINNHUB_KEY en Vercel.</p></div>}
      {stocksError==="fetch_error" && <div style={{ ...CARD, padding:"24px", textAlign:"center" }}>
        <p style={{ color:"var(--text-muted)", marginBottom:"12px" }}>Error cargando cotizaciones</p>
        <button onClick={()=>setStocksError("")} style={{ display:"inline-flex",alignItems:"center",gap:"6px",padding:"7px 16px",borderRadius:"5px",border:"1px solid var(--border)",background:"transparent",color:"var(--text-muted)",cursor:"pointer",fontSize:"12px" }}><RefreshCw size={13}/> Reintentar</button>
      </div>}

      {!stocksError && positions.length===0 && (
        <div style={{ ...CARD, padding:"52px 32px", textAlign:"center" }}>
          <p style={{ fontSize:"15px", fontWeight:600, color:"var(--text)", margin:"0 0 8px" }}>Sin posiciones añadidas</p>
          <p style={{ fontSize:"13px", color:"var(--text-muted)", margin:"0 0 20px" }}>Añade tu cartera de IBKR para ver el valor y PyG en tiempo real.</p>
          <button onClick={openAdd} style={{ display:"inline-flex",alignItems:"center",gap:"7px",padding:"9px 20px",borderRadius:"7px",border:"1px solid var(--accent)",background:"var(--accent)",color:"#fff",cursor:"pointer",fontSize:"13px",fontWeight:600 }}>
            <Plus size={15}/> Añadir primera posición
          </button>
        </div>
      )}

      {stocksLoading && !stocksError && positions.length>0 && Object.keys(stockQuotes).length===0 && (
        <div style={{ textAlign:"center", padding:"32px", color:"var(--text-muted)", fontSize:"13px" }}>Cargando cotizaciones…</div>
      )}

      {!stocksError && positions.length>0 && (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"12px" }}>
          {positions.map(pos=>(
            <PositionCard key={pos.id} position={pos} quote={stockQuotes[pos.symbol]} onEdit={()=>openEdit(pos)} onDelete={()=>handleDelete(pos.id)}/>
          ))}
        </div>
      )}

      {modal.open && (
        <PositionModal key={modal.id+modal.mode} modal={modal} existingSymbols={positions.map(p=>p.symbol)} onSave={handleSave} onClose={()=>setModal(MODAL_CLOSED)}/>
      )}
    </div>
  );
}
