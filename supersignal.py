#!/usr/bin/env python3
"""
RaxisLab SuperSignal — Port Python del Pine Script v2.2
Usa velas DIARIAS de Polygon.io (free tier da 200+ velas).
Score 0-7: SMA200 + EMA9>21 + RSI + volSpike + delta + precio>MA20 + RS>SPY
Alertas Telegram: WATCH PRO (score>=4) y LONG CONFIRMADO (score>=5 + volSpike)
Desplegar: /opt/raxislab/scanner/supersignal.py
Cron: cada dia a las 22:30 UTC (despues de cierre mercado US)
"""
import os
import sys
import json
import logging
from datetime import datetime, timedelta
from pathlib import Path

import requests
import numpy as np

# ─── CONFIG ─────────────────────────────────────────────────────────────────

try:
    from dotenv import load_dotenv
    load_dotenv("/opt/raxislab/.env")
except ImportError:
    pass

POLYGON_KEY   = os.getenv("POLYGON_API_KEY", "")
TG_TOKEN      = os.getenv("TELEGRAM_BOT_TOKEN", "")
TG_CHAT       = os.getenv("TELEGRAM_CHAT_ID", "")
ANTHROPIC_KEY = os.getenv("ANTHROPIC_API_KEY", "")

LOG_DIR = Path("/opt/raxislab/scanner/logs")
LOG_DIR.mkdir(parents=True, exist_ok=True)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [SS] %(message)s",
    handlers=[
        logging.FileHandler(LOG_DIR / f"supersignal_{datetime.now():%Y-%m-%d}.log"),
        logging.StreamHandler(),
    ],
)
log = logging.getLogger("supersignal")

# Watchlist — lista-unica.txt René + adicionales (sin crypto: AVAXUSD/XLMUSDT/DOGEUSD)
WATCHLIST = [
    # Lista única René
    "CBRS", "NRGV", "IREN",  "ELE",  "URG",  "RKLB", "DGXX", "MU",
    "AXTI", "RDW",  "QCOM",  "HONA", "AVAV", "IRDM", "ARIS", "IOT",
    "ZIP",  "ABVX", "AMBA",  "VSAT", "LB",   "AEVA", "KEEL",
    "MSTR", "PANW", "NET",   "MLI",  "NNBR", "RTX",  "MRVL", "PWR",
    "VERA", "RCUS", "SWKS",  "NRIX", "MRAM", "INTC", "ON",   "AVGO",
    "BE",   "AII",  "HIMS",  "MNTS", "CRCL", "HOOD", "SPCX", "AMAT",
    "RDDT", "KLAC",
    # Adicionales
    "NVDA", "AMD",  "SMCI",  "PLTR", "TSLA", "META",
    "COIN", "MARA", "CLSK",  "RIOT", "BTBT",
    "SPY",  # benchmark RS — no escanear, solo precio
]

# Parametros Pine Script v2.2
EMA_FAST        = 9
EMA_MID         = 21
EMA_SLOW        = 50
SMA_LONG        = 200
VOL_MULT        = 1.8
VOL_WINDOW      = 20
RSI_LEN         = 14
RSI_OB          = 70
RSI_OS          = 35
MIN_SCORE_WATCH = 4
MIN_SCORE_LONG  = 5

STATE_FILE = LOG_DIR / "supersignal_state.json"


# ─── COOLDOWN ────────────────────────────────────────────────────────────────

def load_state():
    if STATE_FILE.exists():
        try:
            return json.loads(STATE_FILE.read_text())
        except Exception:
            pass
    return {}


def save_state(state):
    STATE_FILE.write_text(json.dumps(state, indent=2))


def already_alerted(state, ticker, signal):
    key = f"{ticker}_{signal}"
    ts = state.get(key)
    if not ts:
        return False
    # cooldown 20h — no repetir en el mismo dia
    return (datetime.now() - datetime.fromisoformat(ts)).total_seconds() < 72000


def mark_alerted(state, ticker, signal):
    state[f"{ticker}_{signal}"] = datetime.now().isoformat()


# ─── POLYGON DATA ─────────────────────────────────────────────────────────────

def get_daily_candles(ticker, days=300):
    """Velas diarias via Polygon.io — free tier da ~205 velas para 300 dias."""
    end   = datetime.now().strftime("%Y-%m-%d")
    start = (datetime.now() - timedelta(days=days)).strftime("%Y-%m-%d")
    url   = f"https://api.polygon.io/v2/aggs/ticker/{ticker}/range/1/day/{start}/{end}"
    try:
        r = requests.get(
            url,
            params={"apiKey": POLYGON_KEY, "limit": 500, "adjusted": "true"},
            timeout=20,
        )
        if not r.ok:
            log.warning(f"{ticker}: Polygon {r.status_code}")
            return []
        results = r.json().get("results", [])
        log.debug(f"{ticker}: {len(results)} velas diarias")
        return results
    except Exception as e:
        log.error(f"{ticker}: get_daily error {e}")
        return []


# ─── INDICADORES ─────────────────────────────────────────────────────────────

def calc_ema(values, period):
    k   = 2.0 / (period + 1)
    ema = np.zeros_like(values)
    ema[0] = values[0]
    for i in range(1, len(values)):
        ema[i] = values[i] * k + ema[i - 1] * (1 - k)
    return ema


def calc_sma(values, period):
    sma = np.full_like(values, np.nan)
    for i in range(period - 1, len(values)):
        sma[i] = values[i - period + 1 : i + 1].mean()
    return sma


def calc_rsi(closes, period=14):
    deltas   = np.diff(closes)
    gains    = np.where(deltas > 0, deltas, 0.0)
    losses   = np.where(deltas < 0, -deltas, 0.0)
    avg_gain = np.zeros(len(closes))
    avg_loss = np.zeros(len(closes))
    if period < len(closes):
        avg_gain[period] = gains[:period].mean()
        avg_loss[period] = losses[:period].mean()
    for i in range(period + 1, len(closes)):
        avg_gain[i] = (avg_gain[i - 1] * (period - 1) + gains[i - 1]) / period
        avg_loss[i] = (avg_loss[i - 1] * (period - 1) + losses[i - 1]) / period
    rs  = np.where(avg_loss == 0, 100.0, avg_gain / avg_loss)
    rsi = 100 - (100 / (1 + rs))
    rsi[:period] = 50
    return rsi


# ─── ANALISIS ────────────────────────────────────────────────────────────────

def analyze(ticker, candles, spy_last=None):
    if len(candles) < SMA_LONG + 5:
        log.debug(f"{ticker}: insuficientes velas ({len(candles)}) — necesita {SMA_LONG + 5}")
        return None

    closes  = np.array([c["c"] for c in candles], dtype=float)
    volumes = np.array([c["v"] for c in candles], dtype=float)
    opens   = np.array([c["o"] for c in candles], dtype=float)

    ema_fast = calc_ema(closes, EMA_FAST)
    ema_mid  = calc_ema(closes, EMA_MID)
    ema_slow = calc_ema(closes, EMA_SLOW)
    sma200   = calc_sma(closes, SMA_LONG)
    ma20     = calc_sma(closes, 20)
    rsi      = calc_rsi(closes, RSI_LEN)
    vol_avg  = calc_sma(volumes, VOL_WINDOW)

    cur  = len(closes) - 1
    prev = cur - 1

    # Delta diario: direccion de las ultimas 5 velas
    delta5 = sum(
        candles[-5 + i]["v"] * (1 if candles[-5 + i]["c"] > candles[-5 + i]["o"] else -1)
        for i in range(5)
    )

    # RS vs SPY
    rs_bull = False
    if spy_last and spy_last > 0:
        rs_cur = closes[cur] / spy_last
        rs_ma  = (closes[-20:] / spy_last).mean() if len(closes) >= 20 else rs_cur
        rs_bull = bool(rs_cur > rs_ma)

    golden_cross = bool(ema_fast[prev] < ema_mid[prev] and ema_fast[cur] > ema_mid[cur])
    vol_spike    = bool(vol_avg[cur] > 0 and volumes[cur] > VOL_MULT * vol_avg[cur])
    above_sma200 = bool(not np.isnan(sma200[cur]) and closes[cur] > sma200[cur])
    above_ma20   = bool(not np.isnan(ma20[cur]) and closes[cur] > ma20[cur])
    delta_pos    = bool(delta5 > 0)
    rsi_ok       = bool(RSI_OS <= rsi[cur] <= RSI_OB)

    # Score 0-7 identico al Pine Script
    score = (
        int(above_sma200) +
        int(ema_fast[cur] > ema_mid[cur]) +
        int(rsi_ok) +
        int(vol_spike) +
        int(delta_pos) +
        int(above_ma20) +
        int(rs_bull)
    )

    # Cambio % en el ultimo dia
    pct_change = round((closes[cur] - closes[prev]) / closes[prev] * 100, 2) if prev >= 0 else 0

    return {
        "ticker":        ticker,
        "price":         round(float(closes[cur]), 2),
        "pct":           pct_change,
        "rsi":           round(float(rsi[cur]), 1),
        "vol_ratio":     round(float(volumes[cur] / vol_avg[cur]), 2) if vol_avg[cur] > 0 else 0.0,
        "score":         score,
        "golden_cross":  golden_cross,
        "vol_spike":     vol_spike,
        "above_sma200":  above_sma200,
        "above_ma20":    above_ma20,
        "delta_pos":     delta_pos,
        "rs_bull":       rs_bull,
        "rsi_ok":        rsi_ok,
        "ema_fast":      round(float(ema_fast[cur]), 2),
        "ema_mid":       round(float(ema_mid[cur]), 2),
        "sma200":        round(float(sma200[cur]), 2) if not np.isnan(sma200[cur]) else 0.0,
    }


# ─── AI RESEARCH ─────────────────────────────────────────────────────────────

def get_news(ticker, limit=5):
    """Ultimas noticias del ticker via Polygon News API."""
    try:
        r = requests.get(
            "https://api.polygon.io/v2/reference/news",
            params={"ticker": ticker, "limit": limit, "apiKey": POLYGON_KEY, "order": "desc"},
            timeout=10,
        )
        if r.ok:
            return r.json().get("results", [])
    except Exception as e:
        log.error(f"news {ticker}: {e}")
    return []


def ai_research(ticker, res, news):
    """Llama a Claude para analizar si la señal tiene catalizador real."""
    if not ANTHROPIC_KEY or not news:
        return None
    try:
        headlines = "\n".join(f"- {n.get('title','')}" for n in news[:5])
        prompt = (
            f"Ticker: {ticker} | Precio: ${res['price']} | Score técnico: {res['score']}/7\n"
            f"Indicadores: RSI {res['rsi']} | Vol {res['vol_ratio']}x | EMA9>{res['ema_fast']} EMA21>{res['ema_mid']} SMA200>{res['sma200']}\n\n"
            f"Noticias recientes:\n{headlines}\n\n"
            "Responde en 3 líneas máximo:\n"
            "1. ¿Hay catalizador fundamental que explique la señal?\n"
            "2. ¿Es probable continuación o trampa técnica?\n"
            "3. Riesgo principal a vigilar."
        )
        import anthropic
        client = anthropic.Anthropic(api_key=ANTHROPIC_KEY)
        msg = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=200,
            messages=[{"role": "user", "content": prompt}],
        )
        return msg.content[0].text.strip()
    except Exception as e:
        log.error(f"ai_research {ticker}: {e}")
    return None


# ─── TELEGRAM ────────────────────────────────────────────────────────────────

def send_tg(msg):
    if not TG_TOKEN or not TG_CHAT:
        log.warning("Telegram no configurado")
        return
    try:
        r = requests.post(
            f"https://api.telegram.org/bot{TG_TOKEN}/sendMessage",
            json={"chat_id": TG_CHAT, "text": msg, "parse_mode": "HTML"},
            timeout=10,
        )
        if not r.ok:
            log.error(f"Telegram {r.status_code}: {r.text[:200]}")
    except Exception as e:
        log.error(f"Telegram: {e}")


def build_alert(r, signal, catalyst=None):
    emoji = "🟢" if signal == "LONG" else "🟡"
    label = "LONG CONFIRMADO" if signal == "LONG" else "WATCH PRO"
    criteria = []
    if r["above_sma200"]: criteria.append("SMA200✅")
    if r["vol_spike"]:    criteria.append(f"Vol {r['vol_ratio']}x✅")
    if r["above_ma20"]:   criteria.append("MA20✅")
    if r["delta_pos"]:    criteria.append("Delta+✅")
    if r["rs_bull"]:      criteria.append("RS>SPY✅")
    if r["rsi_ok"]:       criteria.append(f"RSI {r['rsi']}✅")

    sign = "+" if r["pct"] >= 0 else ""
    lines = [
        f"{emoji} <b>SuperSignal — {label}</b>",
        f"📊 <b>{r['ticker']}</b>  ${r['price']}  ({sign}{r['pct']}%)",
        f"🎯 Score {r['score']}/7  {'🔔 GOLDEN CROSS' if r['golden_cross'] else ''}",
        "  ".join(criteria),
        f"EMA9 {r['ema_fast']} | EMA21 {r['ema_mid']} | SMA200 {r['sma200']}",
    ]
    if catalyst:
        lines.append(f"\n🧠 <i>{catalyst}</i>")
    return "\n".join(filter(None, lines))


# ─── MAIN ────────────────────────────────────────────────────────────────────

def run():
    log.info("=== SuperSignal scan ===")
    state = load_state()

    spy_candles = get_daily_candles("SPY", days=5)
    spy_last    = float(spy_candles[-1]["c"]) if spy_candles else None
    if spy_last:
        log.info(f"SPY: ${spy_last}")

    alerted = 0
    for ticker in WATCHLIST:
        if ticker == "SPY":
            continue
        try:
            candles = get_daily_candles(ticker, days=300)
            res     = analyze(ticker, candles, spy_last)
            if not res:
                continue

            score        = res["score"]
            vol_spike    = res["vol_spike"]
            golden_cross = res["golden_cross"]

            if score >= MIN_SCORE_LONG and vol_spike and golden_cross:
                if not already_alerted(state, ticker, "LONG"):
                    news     = get_news(ticker)
                    catalyst = ai_research(ticker, res, news)
                    send_tg(build_alert(res, "LONG", catalyst))
                    mark_alerted(state, ticker, "LONG")
                    # guardar en DB para A/B tracking
                    try:
                        sys.path.insert(0, "/opt/raxislab/scanner")
                        from signal_logger import log_signal
                        log_signal(ticker, "python", "LONG", res["price"], score=score, catalyst=catalyst)
                    except Exception:
                        pass
                    log.info(f"LONG: {ticker} score={score} vol={res['vol_ratio']}x")
                    alerted += 1
            elif score >= MIN_SCORE_WATCH and not already_alerted(state, ticker, "WATCH"):
                news     = get_news(ticker)
                catalyst = ai_research(ticker, res, news)
                send_tg(build_alert(res, "WATCH", catalyst))
                mark_alerted(state, ticker, "WATCH")
                try:
                    sys.path.insert(0, "/opt/raxislab/scanner")
                    from signal_logger import log_signal
                    log_signal(ticker, "python", "WATCH", res["price"], score=score, catalyst=catalyst)
                except Exception:
                    pass
                log.info(f"WATCH: {ticker} score={score}")
                alerted += 1

        except Exception as e:
            log.error(f"{ticker}: {e}")

    save_state(state)
    log.info(f"=== Fin: {alerted} alertas enviadas ===")


if __name__ == "__main__":
    run()
