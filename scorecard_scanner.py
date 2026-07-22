#!/usr/bin/env python3
"""
RaxisLab Scorecard Scanner — Institucional
6 criterios C1-C6 por sector. Output: HTML dark mode + JSON histórico.
Fuentes: yfinance (precios/SMA/vol) + Finviz (fundamentales) + Polygon (técnico).
Desplegar: /opt/raxislab/scanner/scorecard_scanner.py
Uso: python3 scorecard_scanner.py [--tickers AAPL,NVDA,...] [--output /ruta/output.html]
"""
import os
import sys
import json
import time
import logging
import argparse
from datetime import datetime, date
from pathlib import Path

try:
    from dotenv import load_dotenv
    load_dotenv("/opt/raxislab/.env")
except ImportError:
    pass

POLYGON_KEY   = os.getenv("POLYGON_API_KEY", "")
ANTHROPIC_KEY = os.getenv("ANTHROPIC_API_KEY", "")

LOG_DIR = Path("/opt/raxislab/scanner/logs")
LOG_DIR.mkdir(parents=True, exist_ok=True)

logging.basicConfig(level=logging.INFO, format="%(asctime)s [SC] %(message)s",
                    handlers=[logging.StreamHandler()])
log = logging.getLogger("scorecard")

OUTPUT_DIR  = Path("/opt/raxislab/scanner/reports")
HISTORY_DIR = Path("/opt/raxislab/scanner/history")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
HISTORY_DIR.mkdir(parents=True, exist_ok=True)

# Watchlist completa René
DEFAULT_TICKERS = [
    "CBRS","NRGV","IREN","ELE","URG","RKLB","DGXX","MU","AXTI","RDW",
    "QCOM","HONA","AVAV","IRDM","ARIS","IOT","ZIP","ABVX","AMBA","VSAT",
    "LB","AEVA","KEEL","MSTR","PANW","NET","MLI","NNBR","RTX","MRVL",
    "PWR","VERA","RCUS","SWKS","NRIX","MRAM","INTC","ON","AVGO","BE",
    "AII","HIMS","MNTS","CRCL","HOOD","SPCX","AMAT","RDDT","KLAC",
    "NVDA","AMD","SMCI","PLTR","TSLA","COIN","MARA","CLSK","RIOT",
]

# Clasificación de sector por ticker (manual, expandible)
SECTOR_MAP = {
    "ABVX":"biotech", "VERA":"biotech", "RCUS":"biotech", "NRIX":"biotech",
    "HIMS":"biotech", "MNTS":"biotech", "IRDM":"defensa",
    "AVAV":"defensa", "RTX":"defensa", "RKLB":"defensa",
    "URG":"mineria", "NRGV":"energia", "ELE":"energia", "BE":"energia",
    "AXTI":"semiconductores", "MU":"semiconductores", "QCOM":"semiconductores",
    "INTC":"semiconductores", "ON":"semiconductores", "AVGO":"semiconductores",
    "AMAT":"semiconductores", "KLAC":"semiconductores", "MRVL":"semiconductores",
    "SWKS":"semiconductores", "SMCI":"semiconductores",
    "IREN":"cripto-mineria", "MARA":"cripto-mineria", "CLSK":"cripto-mineria",
    "RIOT":"cripto-mineria", "MSTR":"cripto-mineria",
    "PANW":"ciberseguridad", "NET":"ciberseguridad",
    "IOT":"saas", "RDDT":"tech", "PLTR":"tech","TSLA":"tech",
    "COIN":"cripto-exchange", "HOOD":"fintech",
}


# ─── YFINANCE DATA ────────────────────────────────────────────────────────────

def get_yf_data(ticker):
    """Obtiene precio, SMA200, volumen relativo, fundamentales via yfinance."""
    try:
        import yfinance as yf
        t = yf.Ticker(ticker)
        info = t.info or {}
        hist = t.history(period="1y")

        if hist.empty:
            return None

        price = float(hist["Close"].iloc[-1])
        vol   = float(hist["Volume"].iloc[-1])

        sma200 = float(hist["Close"].rolling(200).mean().iloc[-1]) if len(hist) >= 200 else None
        vol20  = float(hist["Volume"].rolling(20).mean().iloc[-1]) if len(hist) >= 20 else None
        rvol   = round(vol / vol20, 2) if vol20 else None

        # Cambio % 5d y 20d
        pct5d  = round((price - float(hist["Close"].iloc[-5])) / float(hist["Close"].iloc[-5]) * 100, 2) if len(hist) >= 5 else None
        pct20d = round((price - float(hist["Close"].iloc[-20])) / float(hist["Close"].iloc[-20]) * 100, 2) if len(hist) >= 20 else None

        return {
            "ticker":         ticker,
            "price":          round(price, 2),
            "sma200":         round(sma200, 2) if sma200 else None,
            "above_sma200":   price > sma200 if sma200 else None,
            "rvol":           rvol,
            "pct5d":          pct5d,
            "pct20d":         pct20d,
            "market_cap":     info.get("marketCap"),
            "sector":         info.get("sector", SECTOR_MAP.get(ticker, "general")),
            "industry":       info.get("industry", ""),
            "pe_ratio":       info.get("trailingPE"),
            "pb_ratio":       info.get("priceToBook"),
            "ev_revenue":     info.get("enterpriseToRevenue"),
            "gross_margin":   info.get("grossMargins"),
            "rev_growth":     info.get("revenueGrowth"),
            "debt_ebitda":    None,  # yfinance no lo da directamente
            "inst_ownership": info.get("institutionalOwnershipPercentage") or info.get("heldPercentInstitutions"),
            "short_ratio":    info.get("shortRatio"),
            "name":           info.get("longName", ticker),
            "description":    (info.get("longBusinessSummary", "") or "")[:300],
        }
    except Exception as e:
        log.error(f"yf {ticker}: {e}")
        return None


# ─── SCORECARD C1-C6 ──────────────────────────────────────────────────────────

def calc_score(data):
    """Aplica los 6 criterios institucionales según el sector."""
    sector = (data.get("sector") or "").lower()
    is_biotech = any(s in sector for s in ["biotech", "pharmaceutical", "health"])
    is_mining  = any(s in sector for s in ["mineria", "mining", "materials"])
    is_defense = any(s in sector for s in ["defensa", "defense", "aerospace"])

    results = {}
    score   = 0

    # C1 — Backlog / Catalizador / Reservas (por sector)
    if is_biotech:
        label = "Pipeline visible (fase 3 / PDUFA)"
        val   = "pendiente — verificar en SEC/IR"
        met   = None  # requiere investigación manual
    elif is_mining:
        label = "Reservas probadas + offtake"
        val   = "pendiente — verificar en 10-K"
        met   = None
    elif is_defense:
        label = "Contratos DoD confirmados"
        val   = "pendiente — verificar en filings"
        met   = None
    else:
        label = "Backlog >2 años de ingresos"
        val   = "pendiente — verificar en IR"
        met   = None
    results["C1"] = {"label": label, "value": val, "met": met}
    # No sumamos C1 automáticamente — requiere dato manual

    # C2 — Institutional ownership >50%
    inst = data.get("inst_ownership")
    if inst is not None:
        inst_pct = inst * 100 if inst < 1 else inst
        met = inst_pct > 50
        results["C2"] = {"label": "Inst. ownership >50%", "value": f"{inst_pct:.1f}%", "met": met}
        if met: score += 1
    else:
        results["C2"] = {"label": "Inst. ownership >50%", "value": "pendiente", "met": None}

    # C3 — Deuda (Debt/EBITDA <2x)
    de = data.get("debt_ebitda")
    if de is not None:
        met = de < 2
        results["C3"] = {"label": "Deuda D/EBITDA <2x", "value": f"{de:.1f}x", "met": met}
        if met: score += 1
    else:
        results["C3"] = {"label": "Deuda D/EBITDA <2x", "value": "pendiente", "met": None}

    # C4 — Gross margin >25%
    gm = data.get("gross_margin")
    if gm is not None:
        gm_pct = gm * 100 if gm < 1 else gm
        if is_mining:
            # Para minería usar margen operativo (gross_margin es proxy)
            met = gm_pct > 15
            results["C4"] = {"label": "Margen operativo >15% (minería)", "value": f"{gm_pct:.1f}%", "met": met}
        elif is_biotech:
            # Biotech: cash runway >18m — no disponible en yfinance directamente
            results["C4"] = {"label": "Cash runway >18m", "value": "pendiente — verificar balance", "met": None}
        else:
            met = gm_pct > 25
            results["C4"] = {"label": "Gross margin >25%", "value": f"{gm_pct:.1f}%", "met": met}
            if met: score += 1
    else:
        results["C4"] = {"label": "Gross margin", "value": "pendiente", "met": None}

    # C5 — Valoración EV/Sales fwd <3x si crecimiento >30%
    ev_rev  = data.get("ev_revenue")
    rev_g   = data.get("rev_growth")
    if is_biotech:
        results["C5"] = {"label": "EV/Sales (biotech: ver cash runway C4)", "value": "ver C4", "met": None}
    elif ev_rev is not None:
        if rev_g is not None and rev_g > 0.30:
            met = ev_rev < 3
            results["C5"] = {"label": f"EV/Sales <3x (growth {rev_g*100:.0f}%)", "value": f"{ev_rev:.1f}x", "met": met}
            if met: score += 1
        else:
            met = ev_rev < 5
            results["C5"] = {"label": "EV/Sales <5x", "value": f"{ev_rev:.1f}x", "met": met}
            if met: score += 1
    else:
        results["C5"] = {"label": "EV/Sales <3x fwd", "value": "pendiente", "met": None}

    # C6 — Técnico: Price > SMA200 + RVOL >1.2x
    above = data.get("above_sma200")
    rvol  = data.get("rvol")
    if above is not None and rvol is not None:
        met = above and rvol >= 1.2
        sma_label = "✅ >SMA200" if above else "❌ <SMA200"
        results["C6"] = {"label": "Price>SMA200 + RVOL>1.2x", "value": f"{sma_label} | RVOL {rvol}x", "met": met}
        if met: score += 1
    elif above is not None:
        results["C6"] = {"label": "Price>SMA200 + RVOL>1.2x", "value": "✅ >SMA200" if above else "❌ <SMA200", "met": above}
        if above: score += 0.5
    else:
        results["C6"] = {"label": "Price>SMA200 + RVOL>1.2x", "value": "pendiente", "met": None}

    return score, results


# ─── AI TESIS ────────────────────────────────────────────────────────────────

def ai_thesis(ticker, data, score_results):
    """Claude genera tesis breve + catalizador + riesgo para el informe."""
    if not ANTHROPIC_KEY:
        return None
    try:
        import anthropic
        known = {k: v for k, v in {
            "nombre":    data.get("name"),
            "sector":    data.get("sector"),
            "industria": data.get("industry"),
            "precio":    data.get("price"),
            "pct_5d":    data.get("pct5d"),
            "rv":        data.get("rvol"),
            "ev_rev":    data.get("ev_revenue"),
            "gm":        data.get("gross_margin"),
            "inst_own":  data.get("inst_ownership"),
            "score":     sum(1 for v in score_results.values() if v.get("met") is True),
        }.items() if v is not None}

        prompt = (
            f"Ticker: {ticker} | {json.dumps(known, ensure_ascii=False)}\n\n"
            "Escribe en español, exactamente 3 líneas:\n"
            "1. Tesis (2 frases): qué hace la empresa y por qué podría moverse\n"
            "2. Catalizador próximo (1 frase): qué evento concreto en los próximos 60-90 días\n"
            "3. Riesgo principal (1 frase): el mayor riesgo para esta tesis\n"
            "No inventes datos financieros. Si no tienes información suficiente, indícalo."
        )
        client = anthropic.Anthropic(api_key=ANTHROPIC_KEY)
        msg = client.messages.create(
            model="claude-haiku-4-5-20251001", max_tokens=250,
            messages=[{"role": "user", "content": prompt}],
        )
        return (msg.content[0]).text.strip()
    except Exception as e:
        log.error(f"ai_thesis {ticker}: {e}")
        return None


# ─── ENTRY/SL/TP ──────────────────────────────────────────────────────────────

def calc_rr(data):
    """Calcula niveles técnicos básicos."""
    price = data.get("price")
    sma200 = data.get("sma200")
    if not price:
        return {}

    if sma200 and price > sma200:
        stop = max(sma200 * 0.98, price * 0.90)
    else:
        stop = price * 0.90

    risk   = price - stop
    tp1    = price + risk * 2.5
    tp2    = price + risk * 4.0
    rr     = round((tp1 - price) / risk, 1) if risk > 0 else 0

    return {
        "entry": round(price, 2),
        "stop":  round(stop, 2),
        "tp1":   round(tp1, 2),
        "tp2":   round(tp2, 2),
        "rr":    rr,
        "risk_pct": round((price - stop) / price * 100, 1),
    }


# ─── HTML REPORT ──────────────────────────────────────────────────────────────

def score_color(s):
    if s >= 4: return "#4ade80"
    if s >= 3: return "#facc15"
    if s >= 2: return "#f97316"
    return "#ef4444"


def criterion_badge(crit):
    met = crit.get("met")
    if met is True:   return '<span style="color:#4ade80">✅</span>'
    if met is False:  return '<span style="color:#ef4444">❌</span>'
    return '<span style="color:#a3a3a3">⏳</span>'


def generate_html(results, date_str, output_path):
    scored   = [r for r in results if r["score"] > 2]
    discarded = [r for r in results if r["score"] <= 2]
    conf_bot  = [r for r in results if r.get("in_bot_list")]

    scored.sort(key=lambda x: -x["score"])

    cards_html = ""
    for r in scored:
        sc   = r["score"]
        lv   = calc_rr(r["data"])
        crits = r["scorecard"]
        tesis = r.get("thesis", "—")
        conf  = "⭐⭐ BOT+FUNDAMENTAL" if r.get("in_bot_list") else ""
        pos_max = "300€" if sc < 4 else "600€"

        crit_rows = "".join(
            f'<tr><td style="color:#a3a3a3;padding:3px 8px;font-size:11px">{criterion_badge(v)} {k}</td>'
            f'<td style="padding:3px 8px;font-size:11px;color:#e5e5e5">{v["label"]}</td>'
            f'<td style="padding:3px 8px;font-size:11px;color:#a3a3a3">{v["value"]}</td></tr>'
            for k, v in crits.items()
        )

        cards_html += f"""
<div style="background:#1a1a1a;border:1px solid #2a2a2a;border-radius:12px;padding:20px;margin-bottom:16px;border-left:4px solid {score_color(sc)}">
  <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:8px;margin-bottom:12px">
    <div>
      <span style="font-size:20px;font-weight:800;color:#fff">{r['ticker']}</span>
      <span style="margin-left:10px;font-size:13px;color:#a3a3a3">{r['data'].get('name','')} · {r['data'].get('sector','')}</span>
      {f'<span style="margin-left:10px;font-size:11px;color:#facc15;font-weight:700">{conf}</span>' if conf else ''}
    </div>
    <div style="text-align:right">
      <span style="font-size:22px;font-weight:800;color:{score_color(sc)}">{sc:.1f}/6</span>
      <div style="font-size:11px;color:#a3a3a3">Score</div>
    </div>
  </div>
  <!-- Precio y niveles -->
  <div style="display:flex;gap:16px;flex-wrap:wrap;margin-bottom:14px">
    <div><div style="font-size:10px;color:#737373;text-transform:uppercase">Precio</div><div style="font-size:16px;font-weight:700">${r['data'].get('price','—')}</div></div>
    <div><div style="font-size:10px;color:#737373;text-transform:uppercase">5d</div><div style="font-size:16px;font-weight:700;color:{'#4ade80' if (r['data'].get('pct5d') or 0) > 0 else '#ef4444'}">{('+' if (r['data'].get('pct5d') or 0) > 0 else '')}{r['data'].get('pct5d','—')}%</div></div>
    <div><div style="font-size:10px;color:#737373;text-transform:uppercase">RVOL</div><div style="font-size:16px;font-weight:700">{r['data'].get('rvol','—')}x</div></div>
    <div><div style="font-size:10px;color:#737373;text-transform:uppercase">Entry</div><div style="font-size:16px;font-weight:700">${lv.get('entry','—')}</div></div>
    <div><div style="font-size:10px;color:#737373;text-transform:uppercase">Stop</div><div style="font-size:16px;font-weight:700;color:#ef4444">${lv.get('stop','—')} ({lv.get('risk_pct','—')}%)</div></div>
    <div><div style="font-size:10px;color:#737373;text-transform:uppercase">TP1</div><div style="font-size:16px;font-weight:700;color:#4ade80">${lv.get('tp1','—')}</div></div>
    <div><div style="font-size:10px;color:#737373;text-transform:uppercase">TP2</div><div style="font-size:16px;font-weight:700;color:#4ade80">${lv.get('tp2','—')}</div></div>
    <div><div style="font-size:10px;color:#737373;text-transform:uppercase">R:R</div><div style="font-size:16px;font-weight:700;color:#a78bfa">{lv.get('rr','—')}:1</div></div>
    <div><div style="font-size:10px;color:#737373;text-transform:uppercase">Pos. máx</div><div style="font-size:16px;font-weight:700">{pos_max}</div></div>
  </div>
  <!-- Scorecard table -->
  <table style="width:100%;margin-bottom:12px"><tbody>{crit_rows}</tbody></table>
  <!-- Tesis -->
  {f'<div style="background:#111;border-radius:6px;padding:10px 12px;font-size:12px;color:#d4d4d4;line-height:1.7;white-space:pre-wrap">{tesis}</div>' if tesis else ''}
</div>"""

    # Confluencia bot + fundamental
    conf_section = ""
    if conf_bot:
        items = "".join(f'<li style="margin:4px 0;font-size:13px"><strong>{r["ticker"]}</strong> — score {r["score"]:.1f}/6 · ${r["data"].get("price","—")}</li>' for r in conf_bot)
        conf_section = f'<div style="background:#1a1a2e;border:1px solid #3730a3;border-radius:10px;padding:20px;margin-bottom:24px"><h2 style="color:#818cf8;margin:0 0 12px">⭐⭐ Confluencia Bot + Fundamental</h2><ul style="margin:0;padding-left:20px">{items}</ul></div>'

    # Descartados
    disc_html = ""
    if discarded:
        rows = "".join(f'<tr><td style="padding:6px 8px;font-size:12px">{r["ticker"]}</td><td style="padding:6px 8px;font-size:12px;color:#737373">{r["data"].get("sector","")}</td><td style="padding:6px 8px;font-size:12px;color:#ef4444">{r["score"]:.1f}/6</td><td style="padding:6px 8px;font-size:12px;color:#737373">{r["data"].get("price","—")}</td></tr>' for r in sorted(discarded, key=lambda x: -x["score"]))
        disc_html = f'<details style="margin-top:32px"><summary style="cursor:pointer;color:#737373;font-size:13px">Descartados ({len(discarded)}) — score ≤2/6</summary><table style="width:100%;margin-top:10px;border-collapse:collapse"><thead><tr><th style="text-align:left;padding:6px 8px;font-size:11px;color:#737373">Ticker</th><th style="text-align:left;padding:6px 8px;font-size:11px;color:#737373">Sector</th><th style="text-align:left;padding:6px 8px;font-size:11px;color:#737373">Score</th><th style="text-align:left;padding:6px 8px;font-size:11px;color:#737373">Precio</th></tr></thead><tbody>{rows}</tbody></table></details>'

    html = f"""<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>RaxisLab Scorecard — {date_str}</title>
  <style>
    * {{ box-sizing: border-box; margin: 0; padding: 0; }}
    body {{ font-family: system-ui, -apple-system, sans-serif; background: #0a0a0a; color: #e5e5e5; padding: 24px; max-width: 1100px; margin: 0 auto; }}
    h1 {{ font-size: 24px; font-weight: 800; margin-bottom: 4px; }}
    h2 {{ font-size: 16px; margin-bottom: 16px; }}
    table {{ border-collapse: collapse; }}
    details summary {{ outline: none; }}
    @media(max-width:600px) {{ body {{ padding: 12px; }} }}
  </style>
</head>
<body>
  <h1>RaxisLab Scorecard Institucional</h1>
  <p style="color:#737373;font-size:13px;margin-bottom:24px">
    Generado: {date_str} · {len(scored)} oportunidades · {len(discarded)} descartados · 6 criterios C1-C6
  </p>
  {conf_section}
  <h2 style="color:#a3a3a3;text-transform:uppercase;letter-spacing:1px;font-size:12px;margin-bottom:16px">
    Ranking — Score >2/6
  </h2>
  {cards_html}
  {disc_html}
  <p style="margin-top:32px;font-size:11px;color:#525252">
    ⚠️ Informativo — no es recomendación de compra. Stop siempre definido antes de entrar. Posición máx 600€ (300€ especulativa).
    Los criterios C1 marcados como ⏳ requieren verificación manual en IR/SEC/filings.
  </p>
</body>
</html>"""

    Path(output_path).write_text(html, encoding="utf-8")
    log.info(f"Informe guardado: {output_path}")
    return output_path


# ─── MAIN ────────────────────────────────────────────────────────────────────

def run(tickers=None, output_path=None):
    if tickers is None:
        tickers = DEFAULT_TICKERS

    today    = datetime.now().strftime("%Y-%m-%d")
    out_file = output_path or str(OUTPUT_DIR / f"scorecard_{today}.html")

    log.info(f"=== Scorecard {today} — {len(tickers)} tickers ===")
    all_results = []

    for i, ticker in enumerate(tickers):
        log.info(f"[{i+1}/{len(tickers)}] {ticker}")
        data = get_yf_data(ticker)
        if not data:
            log.warning(f"  {ticker}: sin datos — skip")
            continue

        score, scorecard = calc_score(data)
        thesis = ai_thesis(ticker, data, scorecard) if score >= 3 else None

        result = {
            "ticker":      ticker,
            "score":       score,
            "data":        data,
            "scorecard":   scorecard,
            "thesis":      thesis,
            "in_bot_list": ticker in DEFAULT_TICKERS[:57],  # todos en la lista René
            "ts":          today,
        }
        all_results.append(result)

        # Rate limit yfinance
        time.sleep(0.5)

    # Guardar histórico JSON
    hist_file = HISTORY_DIR / f"scorecard_{today}.json"
    hist_file.write_text(json.dumps(all_results, indent=2, default=str), encoding="utf-8")
    log.info(f"Histórico JSON: {hist_file}")

    # Generar HTML
    generate_html(all_results, today, out_file)

    # Resumen Telegram
    try:
        import requests as req
        tg_token = os.getenv("TELEGRAM_BOT_TOKEN", "")
        tg_chat  = os.getenv("TELEGRAM_CHAT_ID", "")
        if tg_token and tg_chat:
            top5 = sorted([r for r in all_results if r["score"] > 2], key=lambda x: -x["score"])[:5]
            lines = [f"📊 <b>Scorecard {today}</b>"]
            for r in top5:
                lines.append(f"  {r['ticker']} — {r['score']:.1f}/6 · ${r['data'].get('price','—')}")
            req.post(f"https://api.telegram.org/bot{tg_token}/sendMessage",
                     json={"chat_id": tg_chat, "text": "\n".join(lines), "parse_mode": "HTML"}, timeout=10)
    except Exception:
        pass

    log.info(f"=== Fin: informe en {out_file} ===")
    return out_file


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--tickers", help="Lista separada por coma: AAPL,NVDA,...")
    parser.add_argument("--output",  help="Ruta del HTML de salida")
    args = parser.parse_args()

    tlist = args.tickers.split(",") if args.tickers else None
    run(tlist, args.output)
