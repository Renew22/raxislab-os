"use client";

const portfolio = [
  { ticker: "SHLS", valor: "2.340€", pnlEur: "+192€", pnlPct: "+8.2%", pos: true },
  { ticker: "OLO",  valor: "1.100€", pnlEur: "-23€",  pnlPct: "-2.1%", pos: false },
  { ticker: "DTM",  valor: "890€",   pnlEur: "+12€",  pnlPct: "+1.3%", pos: true },
  { ticker: "NVDA", valor: "3.200€", pnlEur: "+493€", pnlPct: "+15.4%", pos: true },
];

const signals = [
  { ticker: "SHLS", razon: "Breakout técnico", entrada: "14.20", stop: "13.40" },
  { ticker: "ASTS", razon: "Catalizador noticias", entrada: "22.50", stop: "21.00" },
  { ticker: "IONQ", razon: "Momentum sector", entrada: "8.90", stop: "8.20" },
];

const briefing = `📊 Mercados EE.UU. — Hoy

SP500 +0.4% pre-market. Fed sin comentarios esta semana. Sector semiconductores liderando con NVDA +2.1% en afterhours tras resultados.

Small caps: SHLS reporta mañana — volumen acumulando. ASTS mantiene soporte clave en $21. DTM movimiento lateral, esperar confirmación.

Sentimiento general: ALCISTA moderado. VIX 14.2 (−1.3).`;

export default function TradingPage() {
  function handlePublicar(ticker: string) {
    alert(`Señal ${ticker} publicada en Telegram ✅`);
  }

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-semibold" style={{ color: "#e2e8f0" }}>Trading</h1>

      <div className="grid gap-6" style={{ gridTemplateColumns: "3fr 2fr" }}>
        {/* Cartera */}
        <div className="rounded-xl p-6" style={{ background: "#111120", border: "1px solid #1a1a2e" }}>
          <h2 className="text-xs font-semibold uppercase tracking-wider mb-5" style={{ color: "#475569" }}>
            Cartera IBKR
          </h2>
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: "1px solid #1a1a2e" }}>
                {["Ticker", "Valor", "P&L €", "P&L %"].map((h) => (
                  <th key={h} className="pb-2 text-left text-xs font-medium" style={{ color: "#475569" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {portfolio.map(({ ticker, valor, pnlEur, pnlPct, pos }) => (
                <tr key={ticker} style={{ borderBottom: "1px solid rgba(26,26,46,0.6)" }}>
                  <td className="py-3 text-sm font-mono font-bold" style={{ color: "#e2e8f0" }}>{ticker}</td>
                  <td className="py-3 text-sm" style={{ color: "#94a3b8" }}>{valor}</td>
                  <td className="py-3 text-sm font-medium" style={{ color: pos ? "#10b981" : "#ef4444" }}>{pnlEur}</td>
                  <td className="py-3 text-sm font-medium" style={{ color: pos ? "#10b981" : "#ef4444" }}>{pnlPct}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ borderTop: "1px solid #1a1a2e" }}>
                <td className="pt-3 text-sm font-bold" style={{ color: "#e2e8f0" }}>TOTAL</td>
                <td className="pt-3 text-sm font-bold" style={{ color: "#e2e8f0" }}>7.530€</td>
                <td className="pt-3 text-sm font-bold" style={{ color: "#10b981" }}>+674€</td>
                <td className="pt-3 text-sm font-bold" style={{ color: "#10b981" }}>+9.8%</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Cazador de Empresas */}
        <div className="rounded-xl p-6" style={{ background: "#111120", border: "1px solid #1a1a2e" }}>
          <h2 className="text-xs font-semibold uppercase tracking-wider mb-5" style={{ color: "#475569" }}>
            Cazador de Empresas
          </h2>
          <div className="flex flex-col gap-3">
            {signals.map(({ ticker, razon, entrada, stop }) => (
              <div
                key={ticker}
                className="rounded-lg p-4"
                style={{ background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.15)" }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold font-mono" style={{ color: "#818cf8" }}>{ticker}</span>
                  <button
                    onClick={() => handlePublicar(ticker)}
                    className="text-xs px-2.5 py-1 rounded-md font-medium transition-opacity hover:opacity-80"
                    style={{ background: "rgba(99,102,241,0.2)", color: "#a5b4fc", border: "1px solid rgba(99,102,241,0.3)" }}
                  >
                    Publicar Telegram
                  </button>
                </div>
                <p className="text-xs mb-3" style={{ color: "#475569" }}>{razon}</p>
                <div className="flex gap-4">
                  <div>
                    <span className="text-xs" style={{ color: "#475569" }}>Entrada </span>
                    <span className="text-xs font-mono font-medium" style={{ color: "#10b981" }}>{entrada}</span>
                  </div>
                  <div>
                    <span className="text-xs" style={{ color: "#475569" }}>Stop </span>
                    <span className="text-xs font-mono font-medium" style={{ color: "#ef4444" }}>{stop}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Briefing diario */}
      <div className="rounded-xl p-6" style={{ background: "#111120", border: "1px solid #1a1a2e" }}>
        <h2 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: "#475569" }}>
          Briefing diario
        </h2>
        <pre className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "#94a3b8", fontFamily: "inherit" }}>
          {briefing}
        </pre>
      </div>
    </div>
  );
}
