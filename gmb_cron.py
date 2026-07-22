#!/usr/bin/env python3
"""
RaxisLab GMB Cron — Hetzner
Corre a las 09:00 UTC diariamente:
1. Detecta blog posts publicados las últimas 24h en DeSancho e Identity
2. Para cada post nuevo → llama a /api/google/gmb-autopost para publicar en GMB
3. Llama a /api/google/gmb-reviews para detectar reseñas sin responder
4. Envía alerta Telegram con reseñas pendientes + borrador Claude
Desplegar: /opt/raxislab/gmb_cron.py
"""
import os
import json
import logging
import base64
from datetime import datetime, timedelta
from pathlib import Path

import requests

try:
    from dotenv import load_dotenv
    load_dotenv("/opt/raxislab/.env")
except ImportError:
    pass

TG_TOKEN  = os.getenv("TELEGRAM_BOT_TOKEN", "")
TG_CHAT   = os.getenv("TELEGRAM_CHAT_ID", "")
OS_URL    = "https://raxislab-os-v2.vercel.app"

LOG_DIR = Path("/opt/raxislab/logs")
LOG_DIR.mkdir(parents=True, exist_ok=True)
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [GMB] %(message)s",
    handlers=[
        logging.FileHandler(LOG_DIR / f"gmb_{datetime.now():%Y-%m-%d}.log"),
        logging.StreamHandler(),
    ],
)
log = logging.getLogger("gmb")

# Clientes
CLIENTS = {
    "desancho": {
        "wp_url":  "https://desancho.com",
        "wp_auth": "ReSancho:Cm1t jk7X zqba OZSP yMLm 4y1B",
        "name":    "DeSancho Estilistas",
    },
    "identity": {
        "wp_url":  "https://identitypeluqueros.com",
        "wp_auth": "renebenegas:f6Jd 9o31 2ytn u1G6 5MEi 0mK9",
        "name":    "Identity Peluqueros",
    },
}

# IDs de Location en GBP (hay que obtenerlos una vez con GET /api/google/business-profile)
# Formato: accounts/{account_id}/locations/{location_id}
# TODO: rellenar cuando tengamos el GBP token
GBP_LOCATIONS = {
    "desancho": os.getenv("GMB_LOCATION_DESANCHO", ""),
    "identity": os.getenv("GMB_LOCATION_IDENTITY", ""),
}


def send_tg(msg):
    if not TG_TOKEN or not TG_CHAT:
        log.warning("Telegram no configurado")
        return
    try:
        requests.post(
            f"https://api.telegram.org/bot{TG_TOKEN}/sendMessage",
            json={"chat_id": TG_CHAT, "text": msg, "parse_mode": "HTML"},
            timeout=10,
        )
    except Exception as e:
        log.error(f"Telegram: {e}")


def get_auth_header(user_pass):
    return base64.b64encode(user_pass.encode()).decode()


def check_new_posts(salon, client):
    """Busca posts publicados en las últimas 25h en WordPress."""
    since = (datetime.utcnow() - timedelta(hours=25)).strftime("%Y-%m-%dT%H:%M:%S")
    wp_url = client["wp_url"]
    auth   = get_auth_header(client["wp_auth"])

    try:
        r = requests.get(
            f"{wp_url}/wp-json/wp/v2/posts",
            headers={"Authorization": f"Basic {auth}", "User-Agent": "Mozilla/5.0"},
            params={"after": since, "status": "publish", "per_page": 5,
                    "_fields": "id,title,excerpt,link,jetpack_featured_media_url"},
            timeout=15,
        )
        if not r.ok:
            log.warning(f"{salon} WP posts: {r.status_code}")
            return []
        return r.json()
    except Exception as e:
        log.error(f"{salon} check_new_posts: {e}")
        return []


def auto_post_gmb(salon, post, location_name):
    """Llama al endpoint de Vercel para publicar en GMB."""
    if not location_name:
        log.info(f"  {salon}: GMB location no configurado — saltando auto-post")
        return False

    try:
        title   = post.get("title", {}).get("rendered", "")
        excerpt = post.get("excerpt", {}).get("rendered", "")
        # Limpiar HTML del excerpt
        excerpt = excerpt.replace("<p>", "").replace("</p>", "").replace("\n", " ").strip()[:400]
        url     = post.get("link", "")
        img     = post.get("jetpack_featured_media_url", "")

        r = requests.post(
            f"{OS_URL}/api/google/gmb-autopost",
            json={"locationName": location_name, "title": title, "excerpt": excerpt,
                  "url": url, "imageUrl": img, "salon": salon},
            timeout=20,
        )
        data = r.json()
        if data.get("success"):
            log.info(f"  {salon}: GMB post publicado — {title[:60]}")
            return True
        else:
            log.error(f"  {salon}: GMB post error — {data.get('error')}")
            return False
    except Exception as e:
        log.error(f"  {salon} auto_post_gmb: {e}")
        return False


def check_reviews(salon, location_name):
    """Pide a Vercel las reseñas pendientes con borradores Claude."""
    if not location_name:
        return []

    try:
        r = requests.get(
            f"{OS_URL}/api/google/gmb-reviews",
            params={"location": location_name},
            timeout=30,
        )
        data = r.json()
        if "error" in data:
            log.error(f"  {salon} reviews: {data['error']}")
            return []
        pending = [rv for rv in data.get("reviews", []) if not rv.get("_hasReply")]
        log.info(f"  {salon}: {len(pending)} reseñas sin responder")
        return pending
    except Exception as e:
        log.error(f"  {salon} check_reviews: {e}")
        return []


def run():
    log.info("=== GMB Cron ===")
    summary_lines = ["🗓️ <b>GMB Daily Report</b>"]
    total_pending = 0

    for salon, client in CLIENTS.items():
        location = GBP_LOCATIONS.get(salon, "")
        log.info(f"Procesando {client['name']}...")

        # 1. Posts nuevos → GMB auto-post
        posts = check_new_posts(salon, client)
        if posts:
            for post in posts:
                title = post.get("title", {}).get("rendered", "")
                ok = auto_post_gmb(salon, post, location)
                if ok:
                    summary_lines.append(f"✅ <b>{client['name']}</b>: GMB post publicado — {title[:50]}")
        else:
            log.info(f"  {salon}: sin posts nuevos hoy")

        # 2. Reseñas pendientes
        pending = check_reviews(salon, location)
        if pending:
            total_pending += len(pending)
            summary_lines.append(f"\n⭐ <b>{client['name']}</b> — {len(pending)} reseña(s) sin responder:")
            for rv in pending[:3]:
                rating  = "⭐" * int(rv.get("starRating", "ONE").count("FIVE") and 5 or
                                     rv.get("starRating", "FOUR") == "FOUR" and 4 or
                                     rv.get("starRating", "THREE") == "THREE" and 3 or
                                     rv.get("starRating", "TWO") == "TWO" and 2 or 1)
                comment = (rv.get("comment", "Sin comentario"))[:100]
                draft   = rv.get("_draft", "")
                summary_lines.append(f"  {rating} <i>{comment}</i>")
                if draft:
                    summary_lines.append(f"  💬 Borrador: <i>{draft[:150]}</i>")
                    summary_lines.append(f"  → Responder en: <a href='https://business.google.com'>business.google.com</a>")

    if total_pending > 0 or len(summary_lines) > 1:
        if total_pending > 0:
            summary_lines.insert(1, f"⚠️ {total_pending} reseña(s) pendientes de respuesta\n")
        send_tg("\n".join(summary_lines))
    else:
        log.info("Sin novedades GMB hoy")

    log.info("=== Fin GMB Cron ===")


if __name__ == "__main__":
    run()
