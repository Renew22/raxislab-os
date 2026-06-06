"use client";
import { useState } from "react";

const cartAcciones = [
  { ticker: "SHLS", nombre: "Shoals Technologies", entrada: "12.80", actual: "14.20", valor: "2.340€", pnlEur: "+192€", pnlPct: "+8.2%", pos: true },
  { ticker: "OLO",  nombre: "Olo Inc",             entrada: "9.20",  actual: "8.12",  valor: "1.100€", pnlEur: "-23€",  pnlPct: "-2.1%", pos: false },
  { ticker: "DTM",  nombre: "DT Midstream",         entrada: "45.60", actual: "46.20", valor: "890€",   pnlEur: "+12€",  pnlPct: "+1.3%", pos: true },
  { ticker: "NVDA", nombre: "NVIDIA Corp",           entrada: "95.40", actual: "112.10",valor: "3.200€", pnlEur: "+493€", pnlPct: "+15.4%",pos: true },
];

const cartCrypto = [
  { ticker: "SOL", nombre: "Solana",   entrada: "120.00", actual: "165.20", valor: "1.850€", pnlEur: "+380€", pnlPct: "+20.5%", pos: true,  target: "220€" },
  { ticker: "ETH", nombre: "Ethereum", entrada: "2.800",  actual: "3.120",  valor: "2.100€", pnlEur: "+245€", pnlPct: "+11.7%", pos: true,  target: "4.000€" },
  { ticker: "XRP", nombre: "Ripple",   entrada: "0.65",   actual: "0.58",   valor: "620€",   pnlEur: "-62€",  pnlPct: "-9.1%",  pos: false, target: "0.80€" },
];

const setups = [
  { ticker: "SHLS", razon: "Breakout técnico sobre resistencia semanal con volumen", entrada: "14.20", stop: "13.40", objetivo: "16.50" },
  { ticker: "ASTS", razon: "Catalizador noticias — contrato DoD pendiente resolución", entrada: "22.50", stop: "21.00", objetivo: "26.00" },
  { ticker: "IONQ", razon: "Momentum sector quantum computing tras earnings IBM", entrada: "8.90", stop: "8.20", objetivo: "10.80" },
  { ticker: "MSTR", razon: "Correlación BTC — acumulación institucional visible en OB", entrada: "145.00", stop: "138.00", objetivo: "165.00" },
  { ticker: "RKLB", razon: "Lanzamiento exitoso — setup post-evento técnico limpio", entrada: "11.30", stop: "10.60", objetivo: "13.50" },
];

const diarioOps = [
  { fecha: "2026-06-05", ticker: "NVDA", tipo: "LONG", entrada: "109.40", salida: "112.10", resultado: "+€ 58",  ganancia: true },
  { fecha: "2026-06-04", ticker: "ASTS", tipo: "LONG", entrada: "22.50",  salida: "21.80",  resultado: "-€ 35",  ganancia: false },
  { fecha: "2026-06-03", ticker: "SHLS", tipo: "LONG", entrada: "13.90",  salida: "14.20",  resultado: "+€ 45",  ganancia: true },
  { fecha: "2026-06-02", ticker: "SOL",  tipo: "LONG", entrada: "158.00", salida: "165.20", resultado: "+€ 120", ganancia: true },
];

const dividendos = [
  { ticker: "O",   nombre: "Realty Income",     acciones: 10, precio: "52.40", dividendo: "3.15", frecuencia: "Mensual",     yield: "6.0%", anualEur: "192€" },
  { ticker: "T",   nombre: "AT&T",              acciones: 50, precio: "18.20", dividendo: "1.11", frecuencia: "Trimestral",  yield: "6.1%", anualEur: "254€" },
  { ticker: "MPW", nombre: "Medical Properties", acciones: 30, precio: "4.80",  dividendo: "0.92", frecuencia: "Trimestral",  yield: "9.6%", anualEur: "132€" },
  { ticker: "KO",  nombre: "Coca-Cola",          acciones: 20, precio: "63.10", dividendo: "1.94", frecuencia: "Trimestral",  yield: "3.1%", anualEur: "188€" },
];

const TABS = ["Acciones", "Crypto", "Setups", "Diario", "Dividendos"] as const;
type Tab = (typeof TABS)[number];

const statCards = [
  { label: "P&L Total Hoy",  value: "+€ 188",  color: "#10b981" },
  { label: "Cartera Total",  value: "12.320€", color: "#e2e8f0" },
  { label: "Mejor posición", value: "NVDA +15.4%", color: "#10b981" },
  { label: "Peor posición",  value: "XRP −9.1%",   color: "#ef4444" },
];

export default function TradingPage() {
  const [tab, setTab] = useState<Tab>("Acciones");

  function handlePublicar(ticker: string) {
    alert(`Señal ${ticker} publicada en Telegram ✅`);
  }

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-semibold" style={{ color: "#e2e8f0" }}>Trading</h1>

      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-4">
        {statCards.map(({ label, value, color }) => (
          <div key={label} className="rounded-xl p-5" style={{ background: "#111120", border: "1px solid #1a1a2e" }}>
            <p className="text-xs font-medium uppercase tracking-wider mb-2" style={{ color: "#475569" }}>{label}</p>
            <p className="text-xl font-bold" style={{ color }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 p-1 rounded-lg" style={{ background: "#111120", border: "1px solid #1a1a2e", width: "fit-content" }}>
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="px-4 py-2 rounded-md text-sm font-medium transition-all"
            style={{ background: tab === t ? "#6366f1" : "transparent", color: tab === t ? "#fff" : "#475569" }}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Acciones */}
      {tab === "Acciones" && (
        <div className="rounded-xl p-6" style={{ background: "#111120", border: "1px solid #1a1a2e" }}>
          <h2 className="text-xs font-semibold uppercase tracking-wider mb-5" style={{ color: "#475569" }}>Cartera Acciones — IBKR</h2>
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: "1px solid #1a1a2e" }}>
                {["Ticker", "Nombre", "Entrada", "Actual", "Valor", "P&L €", "P&L %"].map((h) => (
                  <th key={h} className="pb-2 text-left text-xs font-medium" style={{ color: "#475569" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cartAcciones.map(({ ticker, nombre, entrada, actual, valor, pnlEur, pnlPct, pos }) => (
                <tr key={ticker} style={{ borderBottom: "1px solid rgba(26,26,46,0.6)" }}>
                  <td className="py-3 text-sm font-mono font-bold" style={{ color: "#818cf8" }}>{ticker}</td>
                  <td className="py-3 text-sm" style={{ color: "#94a3b8" }}>{nombre}</td>
                  <td className="py-3 text-sm font-mono" style={{ color: "#475569" }}>{entrada}</td>
                  <td className="py-3 text-sm font-mono" style={{ color: "#e2e8f0" }}>{actual}</td>
                  <td className="py-3 text-sm" style={{ color: "#94a3b8" }}>{valor}</td>
                  <td className="py-3 text-sm font-medium" style={{ color: pos ? "#10b981" : "#ef4444" }}>{pnlEur}</td>
                  <td className="py-3 text-sm font-medium" style={{ color: pos ? "#10b981" : "#ef4444" }}>{pnlPct}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ borderTop: "1px solid #1a1a2e" }}>
                <td colSpan={4} className="pt-3 text-sm font-bold" style={{ color: "#e2e8f0" }}>TOTAL</td>
                <td className="pt-3 text-sm font-bold" style={{ color: "#e2e8f0" }}>7.530€</td>
                <td className="pt-3 text-sm font-bold" style={{ color: "#10b981" }}>+674€</td>
                <td className="pt-3 text-sm font-bold" style={{ color: "#10b981" }}>+9.8%</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* Crypto */}
      {tab === "Crypto" && (
        <div className="rounded-xl p-6" style={{ background: "#111120", border: "1px solid #1a1a2e" }}>
          <h2 className="text-xs font-semibold uppercase tracking-wider mb-5" style={{ color: "#475569" }}>Cartera Crypto</h2>
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: "1px solid #1a1a2e" }}>
                {["Token", "Nombre", "Entrada", "Actual", "Valor", "P&L €", "P&L %", "Target"].map((h) => (
                  <th key={h} className="pb-2 text-left text-xs font-medium" style={{ color: "#475569" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cartCrypto.map(({ ticker, nombre, entrada, actual, valor, pnlEur, pnlPct, pos, target }) => (
                <tr key={ticker} style={{ borderBottom: "1px solid rgba(26,26,46,0.6)" }}>
                  <td className="py-3 text-sm font-mono font-bold" style={{ color: "#f59e0b" }}>{ticker}</td>
                  <td className="py-3 text-sm" style={{ color: "#94a3b8" }}>{nombre}</td>
                  <td className="py-3 text-sm font-mono" style={{ color: "#475569" }}>{entrada}</td>
                  <td className="py-3 text-sm font-mono" style={{ color: "#e2e8f0" }}>{actual}</td>
                  <td className="py-3 text-sm" style={{ color: "#94a3b8" }}>{valor}</td>
                  <td className="py-3 text-sm font-medium" style={{ color: pos ? "#10b981" : "#ef4444" }}>{pnlEur}</td>
                  <td className="py-3 text-sm font-medium" style={{ color: pos ? "#10b981" : "#ef4444" }}>{pnlPct}</td>
                  <td className="py-3 text-sm font-mono font-bold" style={{ color: "#818cf8" }}>{target}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Setups */}
      {tab === "Setups" && (
        <div className="rounded-xl p-6" style={{ background: "#111120", border: "1px solid #1a1a2e" }}>
          <h2 className="text-xs font-semibold uppercase tracking-wider mb-5" style={{ color: "#475569" }}>Cazador de Setups — 5 candidatas del día</h2>
          <div className="flex flex-col gap-4">
            {setups.map(({ ticker, razon, entrada, stop, objetivo }) => (
              <div
                key={ticker}
                className="rounded-lg p-4"
                style={{ background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.15)" }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-base font-bold font-mono" style={{ color: "#818cf8" }}>{ticker}</span>
                  <button
                    onClick={() => handlePublicar(ticker)}
                    className="text-xs px-3 py-1.5 rounded-md font-medium transition-opacity hover:opacity-80"
                    style={{ background: "rgba(99,102,241,0.2)", color: "#a5b4fc", border: "1px solid rgba(99,102,241,0.3)" }}
                  >
                    Publicar Telegram
                  </button>
                </div>
                <p className="text-xs mb-3" style={{ color: "#94a3b8" }}>{razon}</p>
                <div className="flex gap-6">
                  <div>
                    <span className="text-xs" style={{ color: "#475569" }}>Entrada </span>
                    <span className="text-xs font-mono font-bold" style={{ color: "#e2e8f0" }}>{entrada}</span>
                  </div>
                  <div>
                    <span className="text-xs" style={{ color: "#475569" }}>Stop </span>
                    <span className="text-xs font-mono font-bold" style={{ color: "#ef4444" }}>{stop}</span>
                  </div>
                  <div>
                    <span className="text-xs" style={{ color: "#475569" }}>Objetivo </span>
                    <span className="text-xs font-mono font-bold" style={{ color: "#10b981" }}>{objetivo}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Diario */}
      {tab === "Diario" && (
        <div className="rounded-xl p-6" style={{ background: "#111120", border: "1px solid #1a1a2e" }}>
          <h2 className="text-xs font-semibold uppercase tracking-wider mb-5" style={{ color: "#475569" }}>Diario Trading — Log de operaciones</h2>
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: "1px solid #1a1a2e" }}>
                {["Fecha", "Ticker", "Tipo", "Entrada", "Salida", "Resultado"].map((h) => (
                  <th key={h} className="pb-2 text-left text-xs font-medium" style={{ color: "#475569" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {diarioOps.map((op, i) => (
                <tr key={i} style={{ borderBottom: "1px solid rgba(26,26,46,0.6)" }}>
                  <td className="py-3 text-xs font-mono" style={{ color: "#475569" }}>{op.fecha}</td>
                  <td className="py-3 text-sm font-mono font-bold" style={{ color: "#818cf8" }}>{op.ticker}</td>
                  <td className="py-3">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded" style={{ background: "rgba(99,102,241,0.1)", color: "#818cf8" }}>{op.tipo}</span>
                  </td>
                  <td className="py-3 text-sm font-mono" style={{ color: "#94a3b8" }}>{op.entrada}</td>
                  <td className="py-3 text-sm font-mono" style={{ color: "#94a3b8" }}>{op.salida}</td>
                  <td className="py-3 text-sm font-bold" style={{ color: op.ganancia ? "#10b981" : "#ef4444" }}>{op.resultado}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Dividendos */}
      {tab === "Dividendos" && (
        <div className="rounded-xl p-6" style={{ background: "#111120", border: "1px solid #1a1a2e" }}>
          <h2 className="text-xs font-semibold uppercase tracking-wider mb-5" style={{ color: "#475569" }}>Cartera Dividendos — Yield anual estimado</h2>
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: "1px solid #1a1a2e" }}>
                {["Ticker", "Nombre", "Acciones", "Precio", "Div/Acción", "Frecuencia", "Yield", "Ingreso Anual"].map((h) => (
                  <th key={h} className="pb-2 text-left text-xs font-medium" style={{ color: "#475569" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dividendos.map(({ ticker, nombre, acciones, precio, dividendo, frecuencia, yield: y, anualEur }) => (
                <tr key={ticker} style={{ borderBottom: "1px solid rgba(26,26,46,0.6)" }}>
                  <td className="py-3 text-sm font-mono font-bold" style={{ color: "#10b981" }}>{ticker}</td>
                  <td className="py-3 text-sm" style={{ color: "#94a3b8" }}>{nombre}</td>
                  <td className="py-3 text-sm font-mono" style={{ color: "#e2e8f0" }}>{acciones}</td>
                  <td className="py-3 text-sm font-mono" style={{ color: "#e2e8f0" }}>${precio}</td>
                  <td className="py-3 text-sm font-mono" style={{ color: "#e2e8f0" }}>${dividendo}</td>
                  <td className="py-3 text-xs" style={{ color: "#475569" }}>{frecuencia}</td>
                  <td className="py-3 text-sm font-bold" style={{ color: "#10b981" }}>{y}</td>
                  <td className="py-3 text-sm font-bold" style={{ color: "#10b981" }}>{anualEur}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ borderTop: "1px solid #1a1a2e" }}>
                <td colSpan={7} className="pt-3 text-sm font-bold" style={{ color: "#e2e8f0" }}>TOTAL ANUAL ESTIMADO</td>
                <td className="pt-3 text-sm font-bold" style={{ color: "#10b981" }}>766€</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}
