#!/usr/bin/env python3
"""
RaxisLab Signal Logger — A/B tracker Python vs TradingView
Guarda señales en SQLite, hace follow-up de precios 1d/2d/5d,
calcula si llegó al target 5% / 10%.
Desplegar: /opt/raxislab/scanner/signal_logger.py
"""
import os
import json
import sqlite3
import logging
from datetime import datetime, timedelta
from pathlib import Path

import requests

try:
    from dotenv import load_dotenv
    load_dotenv("/opt/raxislab/.env")
except ImportError:
    pass

POLYGON_KEY = os.getenv("POLYGON_API_KEY", "")
DB_PATH     = Path("/opt/raxislab/scanner/logs/signals.db")
LOG_DIR     = Path("/opt/raxislab/scanner/logs")
LOG_DIR.mkdir(parents=True, exist_ok=True)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [LOG] %(message)s",
    handlers=[logging.StreamHandler()],
)
log = logging.getLogger("signal_logger")


# ─── DB SETUP ────────────────────────────────────────────────────────────────

def get_db():
    con = sqlite3.connect(str(DB_PATH))
    con.row_factory = sqlite3.Row
    con.execute("""
        CREATE TABLE IF NOT EXISTS signals (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            ts          TEXT    NOT NULL,
            ticker      TEXT    NOT NULL,
            source      TEXT    NOT NULL,  -- 'python' | 'tradingview'
            signal_type TEXT    NOT NULL,  -- 'WATCH' | 'LONG'
            score       INTEGER,
            price_entry REAL    NOT NULL,
            price_1d    REAL,
            price_2d    REAL,
            price_5d    REAL,
            pct_1d      REAL,
            pct_2d      REAL,
            pct_5d      REAL,
            hit_5pct    INTEGER DEFAULT 0,
            hit_10pct   INTEGER DEFAULT 0,
            catalyst    TEXT,
            notes       TEXT
        )
    """)
    con.commit()
    return con


# ─── LOG SIGNAL ──────────────────────────────────────────────────────────────

def log_signal(ticker, source, signal_type, price_entry, score=None, catalyst=None, notes=None):
    con = get_db()
    con.execute("""
        INSERT INTO signals (ts, ticker, source, signal_type, score, price_entry, catalyst, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (datetime.now().isoformat(), ticker, source, signal_type, score, price_entry, catalyst, notes))
    con.commit()
    con.close()
    log.info(f"Señal guardada: {source} {signal_type} {ticker} @ ${price_entry}")


# ─── PRICE FOLLOW-UP ──────────────────────────────────────────────────────────

def get_current_price(ticker):
    """Precio actual via Polygon snapshot."""
    try:
        r = requests.get(
            f"https://api.polygon.io/v2/snapshot/locale/us/markets/stocks/tickers/{ticker}",
            params={"apiKey": POLYGON_KEY},
            timeout=10,
        )
        if r.ok:
            data = r.json()
            ticker_data = data.get("ticker", {})
            day = ticker_data.get("day", {})
            return day.get("c") or ticker_data.get("lastTrade", {}).get("p")
    except Exception as e:
        log.error(f"get_current_price {ticker}: {e}")
    return None


def get_close_on_date(ticker, date_str):
    """Cierre de una fecha específica via Polygon daily."""
    try:
        r = requests.get(
            f"https://api.polygon.io/v1/open-close/{ticker}/{date_str}",
            params={"apiKey": POLYGON_KEY, "adjusted": "true"},
            timeout=10,
        )
        if r.ok:
            return r.json().get("close")
    except Exception as e:
        log.error(f"get_close {ticker} {date_str}: {e}")
    return None


def update_followups():
    """Actualiza precios 1d/2d/5d para señales pendientes y calcula targets."""
    con = get_db()
    now = datetime.now()

    # Señales sin price_1d y con más de 1 dia de vida
    rows = con.execute("""
        SELECT id, ts, ticker, price_entry
        FROM signals
        WHERE price_1d IS NULL
          AND datetime(ts) < datetime('now', '-24 hours')
    """).fetchall()

    for row in rows:
        ts   = datetime.fromisoformat(row["ts"])
        tick = row["ticker"]
        p0   = row["price_entry"]

        updates = {}

        # 1d
        d1 = (ts + timedelta(days=1)).strftime("%Y-%m-%d")
        p1 = get_close_on_date(tick, d1)
        if p1:
            updates["price_1d"] = p1
            updates["pct_1d"]   = round((p1 - p0) / p0 * 100, 2)

        # 2d
        if (now - ts).days >= 2:
            d2 = (ts + timedelta(days=2)).strftime("%Y-%m-%d")
            p2 = get_close_on_date(tick, d2)
            if p2:
                updates["price_2d"] = p2
                updates["pct_2d"]   = round((p2 - p0) / p0 * 100, 2)

        # 5d
        if (now - ts).days >= 5:
            d5 = (ts + timedelta(days=5)).strftime("%Y-%m-%d")
            p5 = get_close_on_date(tick, d5)
            if p5:
                updates["price_5d"] = p5
                updates["pct_5d"]   = round((p5 - p0) / p0 * 100, 2)

        # Targets — alcanzó alguna vez 5% o 10%?
        best = max(v for k, v in updates.items() if k.startswith("pct_") and v is not None) if updates else 0
        if best >= 5:
            updates["hit_5pct"] = 1
        if best >= 10:
            updates["hit_10pct"] = 1

        if updates:
            set_clause = ", ".join(f"{k} = ?" for k in updates)
            con.execute(
                f"UPDATE signals SET {set_clause} WHERE id = ?",
                list(updates.values()) + [row["id"]],
            )
            log.info(f"Follow-up {tick}: pct_1d={updates.get('pct_1d')} pct_2d={updates.get('pct_2d')}")

    con.commit()
    con.close()


# ─── STATS ────────────────────────────────────────────────────────────────────

def get_stats():
    con = get_db()

    def stats_for(source):
        rows = con.execute("""
            SELECT COUNT(*) total,
                   SUM(hit_5pct) hit5,
                   SUM(hit_10pct) hit10,
                   AVG(pct_1d) avg1d,
                   AVG(pct_2d) avg2d
            FROM signals
            WHERE source = ? AND price_1d IS NOT NULL
        """, (source,)).fetchone()
        return dict(rows) if rows else {}

    result = {
        "python":       stats_for("python"),
        "tradingview":  stats_for("tradingview"),
        "recent":       [dict(r) for r in con.execute("""
            SELECT ts, ticker, source, signal_type, score, price_entry, pct_1d, pct_2d, hit_5pct, hit_10pct, catalyst
            FROM signals ORDER BY id DESC LIMIT 50
        """).fetchall()],
    }
    con.close()
    return result


# ─── API (para Hetzner HTTP simple) ──────────────────────────────────────────

def serve_api(port=8893):
    """Servidor HTTP mínimo que expone /signals y recibe /webhook."""
    from http.server import HTTPServer, BaseHTTPRequestHandler
    import urllib.parse

    class Handler(BaseHTTPRequestHandler):
        def log_message(self, *args):
            pass  # silenciar logs HTTP

        def do_GET(self):
            if self.path.startswith("/signals"):
                data = json.dumps(get_stats(), default=str).encode()
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(data)
            else:
                self.send_response(404)
                self.end_headers()

        def do_POST(self):
            # Webhook de TradingView: POST /webhook con JSON
            # {ticker, signal_type, price, score?, notes?}
            if self.path == "/webhook":
                length = int(self.headers.get("Content-Length", 0))
                body   = json.loads(self.rfile.read(length).decode())
                ticker = body.get("ticker", "").upper()
                price  = float(body.get("price", 0))
                stype  = body.get("signal_type", "LONG")
                score  = body.get("score")
                notes  = body.get("notes", "")
                if ticker and price:
                    log_signal(ticker, "tradingview", stype, price, score=score, notes=notes)
                    self.send_response(200)
                    self.send_header("Content-Type", "application/json")
                    self.end_headers()
                    self.wfile.write(b'{"ok":true}')
                else:
                    self.send_response(400)
                    self.end_headers()
            else:
                self.send_response(404)
                self.end_headers()

    log.info(f"Signal API corriendo en :{port}")
    HTTPServer(("0.0.0.0", port), Handler).serve_forever()


if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1 and sys.argv[1] == "followup":
        update_followups()
    elif len(sys.argv) > 1 and sys.argv[1] == "stats":
        print(json.dumps(get_stats(), indent=2, default=str))
    elif len(sys.argv) > 1 and sys.argv[1] == "serve":
        serve_api()
    else:
        print("Uso: signal_logger.py [followup|stats|serve]")
