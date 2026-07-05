# RAXISLAB — CLAUDE.md
> Contexto global para todas las sesiones de Claude Code. Cubre todos los proyectos.
> Última actualización: 2026-07-05

---

## 👤 QUIÉN ES RENÉ

Luis René Benegas Vera — ingeniero informático paraguayo, fundador de RaxisLab, base en España.
Diferencial: **ingeniero haciendo marketing con IA**, no otra agencia.
Email: `renebenegas.rb@gmail.com` | WA: `+34 654 835 593`
Clientes activos en España, Paraguay, Canadá.

---

## 🚨 REGLAS GLOBALES — NUNCA IGNORAR

1. **AVISAR** antes de cualquier llamada a Claude API u OpenAI API (coste real)
2. **NUNCA Windsor.ai** — Meta siempre desde Meta Ads API directa
3. **NUNCA n8n** — toda automatización corre en Hetzner
4. **NUNCA tocar `/opt/raxislab/scanner/` ni `/opt/raxislab/trading/`** sin autorización explícita de René
5. **Ripieno siempre por puerto 8080** — NUNCA el 80 (es trading/webhook)
6. **NUNCA activar campañas Meta** sin confirmación explícita
7. Tokens reales (Meta, Brevo, Telegram) **van a .env directamente desde el editor o Claude Code — nunca al chat**
8. **SSH Hetzner: puerto 2222** (no el 22), key `~/.ssh/raxislab_ed25519`, host `rene@167.233.72.200`
9. WordPress Identity: siempre `User-Agent: Mozilla/5.0` o Wordfence da 403
10. **BREVO: dos keys distintas** — General para RaxisLab+clientes, LMD exclusiva para Last Mile. NUNCA mezclar.

---

## 🗺️ MAPA DE PROYECTOS

| # | Proyecto | URL / Ubicación | Stack | Estado |
|---|---|---|---|---|
| 1 | **RaxisLab OS** | raxislab-os.vercel.app | Next.js 16 / Vercel | 🟡 Desarrollo activo |
| 2 | **RaxisLab Web** | raxislab.com | HTML / CF Workers | 🟡 Live, pendientes menores |
| 3 | **SuperSignal** | Hetzner 167.233.72.200 | Python / Docker | 🟡 Live, bugs menores |
| 4 | **Ripieno Ibiza** | ripieno.raxislab.com | Express / Docker | 🟢 Live (SMTP pendiente) |
| 5 | **Last Mile Landing** | lastmile-ads CF Worker | HTML / CF Workers | 🟢 Live |
| 6 | **Last Mile WordPress** | lastmiledist.com | WP / 10Web / Brevo LMD | 🟡 Live, pendientes |
| 7 | **DeSancho Estilistas** | desancho.com | WP / Elementor Pro | 🟡 Desarrollo activo |
| 8 | **Identity Peluqueros** | identitypeluqueros.com | WP / Salient / WPBakery | 🟡 Desarrollo activo |
| 9 | **Raxis Club** | OneDrive\Escritorio\raxis-club | Next.js 14 / Supabase | 🔴 Local only |
| 10 | **SIFEN Service** | OneDrive\Escritorio\sifen-service | Node.js / Express | ❓ Sin verificar |

---

## 1. RAXISLAB OS

**Repo local:** `C:\Users\rene0\raxislab-os`
**GitHub:** `Renew22/raxislab-os` → auto-deploy Vercel
**Stack:** Next.js 16 / React 19 / TypeScript

### Clientes en clients-data.ts
| ID código | Nombre | MRR | Meta env var |
|---|---|---|---|
| identity-peluqueros | Identity Peluqueros | 550€ | META_ACCOUNT_IDENTITY_PELUQUEROS |
| desancho-estilistas | Desancho Estilistas | 550€ | META_ACCOUNT_DESANCHO |
| malvarrosa-cf | Malvarrosa CF | 300€ | META_ACCOUNT_CFMALVARROSA |
| matias-benegas-tattoo | Matías Benegas Tattoo | 300€ | META_ACCOUNT_BENEGASTATTOOS |
| last-mile-distribution | Last Mile Distribution | 0€ | META_ACCOUNT_LAST_MILE |
| ripieno-ibiza | Ripieno Ibiza | 0€ | — |
| discobolovalencia | Discóbolo Valencia | 0€ | — |
| campus-paco-alcacer | Campus Paco Alcácer | 0€ | — |

### Variables de entorno Vercel — estado
| Variable | Estado | Notas |
|---|---|---|
| ANTHROPIC_API_KEY | ✅ | Claude flows |
| META_ACCESS_TOKEN | ✅ RENOVADO 2026-07-05 | Token largo EAAUG6iZBI8... añadido a Production + Preview. App 1414977773171281 |
| META_APP_ID / META_APP_SECRET | ✅ | Confirmados en Vercel (Production + Preview) |
| META_ACCOUNT_DESANCHO | ✅ | act_386268642951204 |
| META_ACCOUNT_IDENTITY_PELUQUEROS | ✅ | act_1784662885533732 |
| META_ACCOUNT_CFMALVARROSA | ✅ | act_925429943227041 |
| META_ACCOUNT_LAST_MILE | ✅ | act_1244692137856631 |
| META_ACCOUNT_BENEGASTATTOOS | ✅ | act_933810958804673 |
| META_ACCOUNT_MARTA_SARMIENTO | ✅ AÑADIDA 2026-07-05 | act_1203877137635628 — Production + Preview |
| POLYGON_API_KEY | ✅ | Plan Starter ($29/mes) |
| NEXT_PUBLIC_FINNHUB_KEY | ✅ | Earnings, dividends, financials |
| GOOGLE_CLIENT_ID/SECRET | ✅ | OAuth — 884261846704-pdo38... |
| GOOGLE_REFRESH_TOKEN | ⚠️ Pendiente validar | Puede haber expirado. Regenerar desde /api/auth/google si GSC/GA4 dan 401 |
| GOOGLE_ADS_DEVELOPER_TOKEN | ❌ FALTA — ÚNICO BLOQUEADOR | René: Google Ads → Herramientas → Centro de la API → copiar Developer Token → `vercel env add GOOGLE_ADS_DEVELOPER_TOKEN production` + preview. El código (`/api/google/metrics`) ya está completo y funcional, solo espera este token. |
| HETZNER_URL / HETZNER_DATA_KEY | ✅ | Proxy datos dashboard. Key: rxl_dash_k9m4p7q2x8 |
| NOTION_BRIEFING_DB_ID | ✅ | — |
| BREVO_API_KEY | ❌ FALTA | Key GENERAL (sufijo `...QfQxDjxUlGiOADXW`). Archivo: `brevo.txt`. ⚠️ Brevo tiene IP restriction — desactivar en Brevo → Account → Security → Authorised IPs |
| TELEGRAM_BOT_TOKEN / CHAT_ID | ❌ FALTA | Para /automatizaciones |
| RIPIENO_API_URL / RIPIENO_ADMIN_KEY | ✅ | — |
| WINDSOR_API_KEY | ✅ presente | NO USAR — regla: Meta siempre por API directa |

### Páginas — estado
| Página | Estado |
|---|---|
| /dashboard | ✅ Real — HOOD, Briefing Notion, M7/M9/NearMiss Hetzner |
| /clientes | ✅ Real — Meta API, reservas Ripieno |
| /campanas | 🔴 ROTO — Meta token expirado + env vars a verificar |
| /google | ✅ Real — GSC + GA4 + GBP por cliente |
| /finanzas | ✅ Real — gastos fijos actualizados |
| /contenido | ✅ Real — Claude API, copies, blog workflow |
| /automatizaciones | 🟡 Flows OK, Telegram sin env vars |
| /mercado | ✅ Crypto Binance + 30 acciones Finnhub |
| /trading | ✅ SMA/EMA/RSI Polygon, portfolio editable, diario, calendario |
| /stokers | ✅ Live — conectado a M9 Hetzner con badge LIVE |
| /raxis-investor | ✅ Dashboard unificado, analista imagen Claude Vision |
| /last-mile | ✅ CRM B2B completo (localStorage) |
| /fondeo | ✅ Prop firm tracker — FTMO/Apex/TopStep/E8, calculadora lotes/contratos |
| /leads | 🟡 localStorage — sin backend persistente |
| /propuestas | 🟡 Sin persistencia |
| /proyectos | 🔴 Datos ficticios hardcoded |
| /plan | 🔴 Hardcoded estático |

### Clientes — Google Ads Customer IDs
| Cliente | Google Ads Customer ID | GSC URL | GA4 Property ID |
|---|---|---|---|
| Desancho Estilistas | 739-542-7320 | https://desancho.com/ | ❌ pendiente |
| Identity Peluqueros | ❌ pendiente | https://identitypeluqueros.com/ | ❌ pendiente |
| Last Mile Distribution | 949-709-1021 | — | ❌ pendiente |
| Malvarrosa CF | — | — | ❌ pendiente |

### Pendientes RaxisLab OS
- 🔴 GOOGLE_ADS_DEVELOPER_TOKEN — René: Google Ads → Herramientas → Centro de la API → copiar token → `vercel env add GOOGLE_ADS_DEVELOPER_TOKEN production` + preview. Desbloquea /google métricas Ads para TODOS los clientes
- 🔴 GA4 Property IDs — René debe copiar de GA4 → Admin → Propiedad → ID para cada cliente y añadirlos en /google (se guardan en localStorage automáticamente)
- 🔴 Identity Google Ads Customer ID — formato XXX-XXX-XXXX, añadir en clients-data.ts adAccounts.googleCustomerId
- 🔴 Añadir BREVO_API_KEY en Vercel (key General) + desactivar IP restriction en Brevo
- 🔴 Añadir TELEGRAM_BOT_TOKEN/CHAT_ID (automatizaciones)
- 🔴 desancho.com HTTP 500 — WordPress error crítico. Opción A: email Recovery Mode en Gmail. Opción B: Hostinger hPanel → File Manager → renombrar plugins/ → plugins-backup/
- 🟡 /trading → conectar MEXEM (posiciones reales)
- 🟡 /leads → backend Notion (persistencia)
- 🟡 GOOGLE_REFRESH_TOKEN (validar, puede estar caducado — probar /google en OS)
- ⬜ /proyectos → datos reales
- ⬜ /plan → bloques horarios dinámicos

---

## 2. RAXISLAB WEB (raxislab.com)

**Fuente:** `C:\Users\rene0\OneDrive\Escritorio\raxislab-web\`
**Deploy folder:** `C:\Users\rene0\AppData\Local\Temp\raxislab-web-fix\`
**Token:** `C:\Users\rene0\OneDrive\Escritorio\could.txt` (línea 2)

**Procedimiento deploy:**
```
1. Editar fuente en raxislab-web\
2. Copiar archivos editados a raxislab-web-fix\
3. cd C:\Users\rene0\AppData\Local\Temp\raxislab-web-fix
4. npx wrangler deploy
```

### Pendientes
- 🟡 cases.html — casos Discóbolo y Campus Alcácer (cuando haya métricas)
- 🟡 sitemap.xml — actualizar con nuevas páginas periódicamente
- 🟡 contact.html — verificar que los mails llegan
- 🟡 client-portal.html — confirmar si tiene backend real

---

## 3. SUPERSIGNAL (Hetzner)

**Servidor:** `rene@167.233.72.200:2222`
**Key SSH:** `~/.ssh/raxislab_ed25519`
**Ruta principal:** `/opt/raxislab/`
**Scanner .env:** `/opt/raxislab/scanner/.env` (EnvironmentFile del servicio systemd)
**Scanner logs:** `/opt/raxislab/scanner/logs/scanner_YYYY-MM-DD.log`
**Disco:** 4.7G / 38G (holgado)

### Servicios activos
| Servicio systemd | Estado |
|---|---|
| raxislab-scanner.service | activo (venv propio: `/opt/raxislab/scanner/venv`) |
| raxislab-enricher.service | activo |
| uvicorn (trading API) | Docker, puerto 8000 → nginx port 80 |
| ripieno-backend (Docker) | 127.0.0.1:3001 → nginx port 8080 |

### Módulos scanner — estado
| Módulo | Estado |
|---|---|
| M1 — NewsAPI | 🔴 ROTO (429 permanente) |
| M2 — Contratos DoD | ✅ 23:15 diario |
| M3 — EDGAR Form 4 | ✅ Cada hora |
| M6 — Investor Pro | 🔴 ROTO (revisar dependencias) |
| M7 — Futuros CoinEx | ✅ Cada 3 min |
| M9 — Radar mercado | ✅ 8:00, 13:00, 18:30 L-V |
| M10a — Trades MEXEM | ✅ integrado en M14 |
| M11 — Vigilante noticias | ✅ Cada 15 min (Finnhub) |
| M12 — Calendario macro | ✅ 19:00 diario |
| M14 — Diario bot | ✅ Cada 2 min |
| M15 — Pre-señales EMA | ✅ Código listo. Brevo: añadir vars en scanner .env |
| Briefing semanal | ✅ Domingos 16:00 UTC — Notion OK |
| Scanner Polygon | ✅ Plan Starter — activo continuo |

### Endpoint datos dashboard
```
GET http://167.233.72.200/data/dashboard?key=rxl_dash_k9m4p7q2x8
→ retorna: M7 cooldowns, M9 candidatos, Near-Miss, Posiciones
```

### Comandos útiles Hetzner
```bash
sudo systemctl restart raxislab-scanner
systemctl is-active raxislab-scanner
journalctl -u raxislab-scanner -n 50 --no-pager
```

### Pendientes Hetzner
- 🟡 M15 Brevo — añadir en `/opt/raxislab/scanner/.env`: `BREVO_API_KEY` (General), `BREVO_ALERT_FROM`, `BREVO_ALERT_TO`
- 🟡 M7 bugs (6) — RSI bypass, cooldown opuesto, bare except (requiere OK explícito de René)
- 🔴 M6 — revisar dependencias faltantes

---

## 4. LAST MILE DISTRIBUTION

**WordPress:** `https://lastmiledist.com` (10Web hosting)
**IMPORTANTE:** Cloudflare de lastmiledist.com es de 10Web — NO accesible con tokens CF de René
**Acceso WP REST:** user `renebenegas.rb@gmail.com`, app password en `pass.txt`
**Landing fuente:** `C:\Users\rene0\OneDrive\Escritorio\lastmile-landing\`
**Landing token:** `C:\Users\rene0\OneDrive\Escritorio\couldlast.txt`
**Brevo:** key LMD exclusiva (sufijo `...o2GBILJ0vGgN6msB`) — ver sección Brevo

**Deploy landing:**
```
cd C:\Users\rene0\OneDrive\Escritorio\lastmile-landing
npx wrangler deploy
```

### Estado WordPress
- ✅ CF7 form 704, redirect /gracias/, WA +34654835593
- ✅ GTM-TWJL8NHF, Brevo API v3 conectada
- ✅ /catalogo-completo/ (password: LMD2026)
- ✅ Brevo listas: LM Distribuidores PY(11), HORECA(12), Compradores(13), Comerciales(14)
- ✅ Snippet ID:16: `[catalogo_email to="EMAIL" nombre="NOMBRE"]`

### Pendientes Last Mile
- 🔴 GTM conversión — Ads 949-709-1021 → Herramientas → Conversiones → copiar ID → crear tag en GTM-TWJL8NHF
- 🔴 WP Mail SMTP — Brevo → SMTP Keys → nueva key → configurar WP Mail SMTP (smtp-relay.brevo.com:587)
- 🟡 Secuencias email Brevo — drip 3 emails (inmediato, día 3, día 7)
- 🟡 10Web caché — René: my.10web.io → sitio → Performance → Flush Cache (blog móvil)

---

## 5. DESANCHO ESTILISTAS

**URL:** `https://desancho.com`
**Stack:** Elementor 4.1.4 Pro + Astra Pro + WPML | 26 plugins | Sin SSH
**Acceso REST API:** user `DeSancho`, app password en `C:\Users\rene0\OneDrive\Escritorio\pass.txt`

### Estado
- ✅ SEO técnico (H1, meta descriptions, redirects 301 — Snippet ID:9)
- ✅ Home colección "1978" live, /coleccion-live026/ completa (NOINDEX)
- ✅ 12 páginas de servicio con hero foto real (reemplazó mockup tablet)
- ✅ Bug Elementor `_elementor_edit_mode` resuelto

### Datos técnicos clave
- Promoción del mes home → publicar en cat **Promociones** (ID:85)
- Blog home → publicar en cat **Blog** (ID:8)
- Yoast meta → `update_post_meta()` via Code Snippets PHP
- Elementor data → `update_post_meta(id, '_elementor_data', wp_slash(json_encode($data)))`
- Snippet permanente activo: ID:9 `RAXIS_SEO_redirects_301`

### ⚠️ DeSancho — SITIO CAÍDO 2026-07-05
`curl https://desancho.com` → HTTP 500. WordPress error crítico PHP (todos los endpoints, incluyendo wp-admin y wp-json). CSS estático OK = problema en PHP/plugins, no en servidor LiteSpeed/Hostinger.

**Fix inmediato (René):**
1. Revisar Gmail (renebenegas.rb@gmail.com) → email de WordPress "Recovery Mode" → enlace para entrar al wp-admin sin plugins
2. O bien: hpanel.hostinger.com → File Manager → public_html/wp-content/ → renombrar `plugins` → `plugins-backup` → verificar → entrar wp-admin → reactivar uno a uno

### Pendientes DeSancho
- 🔴 URGENTE: sitio caído HTTP 500 — ver fix arriba
- 🔴 René: vaciar papelera (26 páginas en trash)
- 🔴 René: actualizar plugins premium via wp-admin (Astra Pro, Elementor Pro, WPML) — probablemente esta actualización causó el 500
- 🟡 Elfsight Google Reviews — home + /servicios-desancho/
- 🟡 /mechas-balayage/ — sin hero (estructura diferente, revisar)
- 🟡 Auditoría SEO final

---

## 6. IDENTITY PELUQUEROS

**URL:** `https://identitypeluqueros.com`
**Stack:** Salient theme + WPBakery v8.6.1 + Wordfence 8.1.3 + Yoast 26.6 | 23 plugins | Sin SSH
**Acceso REST API:** user `renebenegas`, app password en `pass.txt`
**CRÍTICO:** User-Agent `Mozilla/5.0` obligatorio en todas las requests REST

### Estado
- ✅ /salon/ sección equipo live (Christian Vendrell + 4 placeholders)
- ✅ 13 fotos trabajos como blog posts (cat Trabajos ID:25) — posts 743-767
- ✅ Home "ÚLTIMAS OBRAS" sección (6 posts más recientes de cat Trabajos)
- ✅ Categorías: Trabajos(25), Equipo(26), Tendencias(27)

### Pendientes Identity
- 🔴 René URGENTE: Wordfence 8.1.3→8.2.2 (vulnerabilidad seguridad — via wp-admin)
- 🔴 René: Quote real de Richard Ashforth en /salon/
- 🟡 Elfsight Google Reviews — home + /salon/
- 🟡 Portfolio page /portfolio/ (ID:111) — René añade CPTs via wp-admin (CPT Salient)
- 🟡 Más posts SEO Christian Vendrell, schema markup

---

## 7. RIPIENO IBIZA

**URL:** `https://ripieno.raxislab.com`
**Backend Docker:** container `ripieno-backend`, 127.0.0.1:3001 → nginx:8080
**Fuente local:** `C:\Users\rene0\ripieno-backend\server.js`
**Fuente Hetzner:** `/home/rene/ripieno-backend/server.js`
**Menú fuente:** `C:\Users\rene0\ripieno\index.html`
**Admin key:** Vercel → RIPIENO_ADMIN_KEY

### Estado
- ✅ Menú bilingüe ES/EN
- ✅ Panel admin en /clientes → Ripieno (reservas, stats)
- ✅ Reservas SQLite funcionando
- 🔴 SMTP — `SMTP_PASS=PENDIENTE_CONFIGURAR`. Para emails necesita SMTP propio (no Brevo — Brevo es de clientes)
- 🔴 Formulario reservas eliminado del menú público

---

## 8. RAXIS CLUB (SaaS fidelización)

**Ubicación:** `C:\Users\rene0\OneDrive\Escritorio\raxis-club`
**Stack:** Next.js 14 / Supabase / Tailwind / shadcn/ui
**Estado:** MVP completo localmente — NO desplegado

### Para activar (5 pasos)
1. Crear proyecto en supabase.com
2. Pegar `supabase/schema.sql` en SQL Editor
3. Rellenar `.env.local` (NEXT_PUBLIC_SUPABASE_URL, ANON_KEY, SERVICE_ROLE_KEY)
4. Reemplazar `USER_ID_AQUI` en schema.sql con UUID del owner
5. Deploy en Vercel → club.raxislab.com

---

## 🔐 CUENTAS Y ACCESOS CENTRALIZADOS

> Todo lo que necesitas para arrancar un nuevo chat sin preguntar nada.

---

### VERCEL

| Campo | Valor |
|---|---|
| Cuenta | renebenegasrb-3069 |
| Equipo | raxislab-s-projects |
| Team ID | team_u7fizFcEmoR4QR0OXeOoewR8 |
| Proyecto OS | raxislab-os |
| Project ID | prj_p3RYdHfKTaRRHVG4uVn8ZdPMF7VF |
| Plan | Hobby |
| URL producción | https://raxislab-os.vercel.app |
| Login CLI | `vercel login` (OAuth browser) |
| Link proyecto | `vercel link --yes --project raxislab-os` desde `C:\Users\rene0\raxislab-os` |

---

### SUPABASE

| Campo | Valor |
|---|---|
| Personal Access Token | `C:\Users\rene0\OneDrive\Escritorio\baseapi.txt` |
| Login CLI | `$env:SUPABASE_ACCESS_TOKEN = "<PAT>"; supabase projects list` |
| CLI versión | 2.109.0 (instalado global npm) |

**Proyectos:**

| Nombre | Ref/ID | Región | Org | Quién lo usa |
|---|---|---|---|---|
| Renew22's Project | `jdcnjcmyudenthtuojdk` | eu-central-1 | cyynespphijisdpfxvlq | Uso interno / Raxis Club |
| supabase-aero-xylophone | `wrwznqnvkrwwtpxxgbsa` | us-east-1 | vercel_icfg_iWwCSxHGHZHnkE6OCJulzWSd | **Integración Vercel ↔ raxislab-os** |

⚠️ Supabase plan gratuito pausa proyectos tras ~7 días sin uso. Si Vercel da `Resource provisioning failed`, restaurar con:
```powershell
$h = @{ Authorization = "Bearer <PAT>"; "Content-Type" = "application/json" }
Invoke-RestMethod -Uri "https://api.supabase.com/v1/projects/wrwznqnvkrwwtpxxgbsa/restore" -Method POST -Headers $h -Body "{}"
Invoke-RestMethod -Uri "https://api.supabase.com/v1/projects/jdcnjcmyudenthtuojdk/restore" -Method POST -Headers $h -Body "{}"
```

---

### META ADS

| Campo | Valor |
|---|---|
| App ID | `1414977773171281` |
| App Secret | Vercel: `META_APP_SECRET` |
| Access Token | Vercel: `META_ACCESS_TOKEN` (renovado 2026-07-05, expira ~60 días) |
| Renovar token | developers.facebook.com/tools/explorer → App 1414977773171281 → permisos `ads_read, ads_management, business_management` → Generate Token |
| Archivo token | `C:\Users\rene0\OneDrive\Escritorio\meta.txt` |

**Cuentas publicitarias (todas en Vercel como env vars):**

| Cliente | Env Var | Account ID |
|---|---|---|
| Desancho Estilistas | META_ACCOUNT_DESANCHO | act_386268642951204 |
| Identity Peluqueros | META_ACCOUNT_IDENTITY_PELUQUEROS | act_1784662885533732 |
| Malvarrosa CF | META_ACCOUNT_CFMALVARROSA | act_925429943227041 |
| Last Mile Distribution | META_ACCOUNT_LAST_MILE | act_1244692137856631 |
| Matías Benegas Tattoo | META_ACCOUNT_BENEGASTATTOOS | act_933810958804673 |
| Marta Sarmiento | META_ACCOUNT_MARTA_SARMIENTO | act_1203877137635628 |

---

### GOOGLE

| Campo | Valor |
|---|---|
| OAuth Client ID | `884261846704-pdo38lblku5rfn6kj644in6um56oofh6.apps.googleusercontent.com` |
| OAuth Client Secret | Vercel: `GOOGLE_CLIENT_SECRET` |
| Refresh Token | Vercel: `GOOGLE_REFRESH_TOKEN` (puede caducar — regenerar en /api/auth/google) |
| Developer Token Ads | Vercel: `GOOGLE_ADS_DEVELOPER_TOKEN` ❌ **FALTA** — obtener en Google Ads → Herramientas → Centro de la API |
| Email cuenta | renebenegas.rb@gmail.com |

**Google Ads Customer IDs (formato XXX-XXX-XXXX):**

| Cliente | Customer ID | Estado en código |
|---|---|---|
| Desancho Estilistas | `739-542-7320` | ✅ en clients-data.ts |
| Last Mile Distribution | `949-709-1021` | ✅ en clients-data.ts |
| Identity Peluqueros | ❌ pendiente | ❌ falta añadir |

**GA4 Property IDs y GSC URLs:**

| Cliente | GSC URL | GA4 Property ID |
|---|---|---|
| Identity Peluqueros | `https://identitypeluqueros.com/` | ❌ pendiente |
| Desancho Estilistas | `https://desancho.com/` | ❌ pendiente |
| Malvarrosa CF | ❌ pendiente | ❌ pendiente |
| Matías Benegas Tattoo | ❌ pendiente | ❌ pendiente |

> GSC URLs y GA4 IDs se guardan en localStorage del browser vía `/google` — una vez introducidos persisten sin tocar código.

---

### HETZNER (SuperSignal)

| Campo | Valor |
|---|---|
| Host | `rene@167.233.72.200` puerto `2222` |
| SSH key | `~/.ssh/raxislab_ed25519` |
| Directorio raíz | `/opt/raxislab/` |
| Dashboard data endpoint | `GET http://167.233.72.200/data/dashboard?key=rxl_dash_k9m4p7q2x8` |
| Disco | 4.7G / 38G usado |
| Ripieno backend | `127.0.0.1:3001 → nginx:8080` (NUNCA tocar puerto 80 = trading) |

---

### BREVO ⚠️ NUNCA MEZCLAR KEYS

| Key | Para quién | Archivo fuente |
|---|---|---|
| **General** (sufijo `...QfQxDjxUlGiOADXW`) | RaxisLab + Identity + DeSancho + Ripieno + M15 | `C:\Users\rene0\OneDrive\Escritorio\brevo.txt` |
| **LMD** (sufijo `...o2GBILJ0vGgN6msB`) | EXCLUSIVA Last Mile Distribution | `C:\Users\rene0\OneDrive\Escritorio\brevo.txt` |

⚠️ Brevo tiene IP restriction activada — desactivar en Brevo → Account → Security → Authorised IPs para que funcione desde Vercel.

---

### WORDPRESS CLIENTES

| Cliente | URL | Stack | User REST API | App Password |
|---|---|---|---|---|
| DeSancho Estilistas | https://desancho.com | Elementor Pro + Astra Pro + WPML / Hostinger | `DeSancho` | `C:\Users\rene0\OneDrive\Escritorio\pass.txt` línea 2 |
| Identity Peluqueros | https://identitypeluqueros.com | Salient + WPBakery / Hostinger | `renebenegas` | `C:\Users\rene0\OneDrive\Escritorio\pass.txt` línea 1 |
| Last Mile WP | https://lastmiledist.com | WP / 10Web (NO Cloudflare de René) | renebenegas.rb@gmail.com | `C:\Users\rene0\OneDrive\Escritorio\pass.txt` |

⚠️ Identity: SIEMPRE `User-Agent: Mozilla/5.0` en requests REST o Wordfence da 403.

---

### CLOUDFLARE

| Proyecto | Token | Archivo |
|---|---|---|
| raxislab.com (Workers) | deploy token | `C:\Users\rene0\OneDrive\Escritorio\could.txt` línea 2 |
| Last Mile landing | deploy token | `C:\Users\rene0\OneDrive\Escritorio\couldlast.txt` |
| DNS general | DNS token | `C:\Users\rene0\OneDrive\Escritorio\dns.txt` |

Deploy raxislab.com: editar en `raxislab-web\` → copiar a `C:\Users\rene0\AppData\Local\Temp\raxislab-web-fix\` → `npx wrangler deploy`

---

### NOTION

| Campo | Valor |
|---|---|
| Token | Vercel: `notion_token` |
| Briefing DB ID | Vercel: `NOTION_BRIEFING_DB_ID` |
| Propuestas page ID | Vercel: `NOTION_PROPOSALS_PAGE_ID` |

---

### OTROS

| Servicio | Dato | Ubicación |
|---|---|---|
| Ripieno admin key | `ripieno_admin_8a58d7c4a58ba181619ae091` | Vercel: RIPIENO_ADMIN_KEY |
| Raxis AI plugin | ZIP instalable WP | `C:\Users\rene0\OneDrive\Escritorio\raxis-ai-v1.0.zip` |
| Windsor API key | `7dbc3c3fa8a629e48f73458a8860ce436f29` | **NO USAR** — Meta siempre por API directa |
| Polygon API | Plan Starter $29/mes | Vercel: POLYGON_API_KEY |
| Finnhub | plan gratuito | Vercel: NEXT_PUBLIC_FINNHUB_KEY |
| Anthropic | API para Claude flows | Vercel: ANTHROPIC_API_KEY |

---

## 📋 BACKLOG GLOBAL PRIORIZADO

### 🔴 BLOQUEADO EN RENÉ (acción manual necesaria)
1. **desancho.com caído HTTP 500** — Recovery Mode email en Gmail O Hostinger hPanel → renombrar plugins/
2. **GOOGLE_ADS_DEVELOPER_TOKEN** — Google Ads → Herramientas → Centro de la API → copiar token → `vercel env add GOOGLE_ADS_DEVELOPER_TOKEN production` y preview. Desbloquea métricas Google Ads en /google para TODOS los clientes
3. **GA4 Property IDs** — GA4 → Admin → Propiedad para cada cliente (Identity, Desancho, etc.) → añadir en /google UI (localStorage)
4. **Identity Google Ads Customer ID** — formato XXX-XXX-XXXX → añadir en clients-data.ts
5. **BREVO_API_KEY en Vercel** — key General + desactivar IP restriction en Brevo. Desbloquea leads Last Mile y flujos email OS
6. **TELEGRAM_BOT_TOKEN/CHAT_ID en Vercel** — desbloquea /automatizaciones
7. **Wordfence Identity** — actualizar 8.1.3→8.2.2 ⚠️ urgente seguridad via wp-admin
8. **GTM conversión Last Mile** — Google Ads 949-709-1021 → obtener Conversion ID → tag en GTM
9. **WP Mail SMTP Last Mile** — crear SMTP key en Brevo → WP Mail SMTP smtp-relay.brevo.com:587
10. **DeSancho papelera** — vaciar las 26 páginas en trash
11. **10Web caché flush** — my.10web.io → Last Mile → Performance → Flush Cache

### 🟡 TÉCNICO — LISTO PARA EJECUTAR
10. **Raxis AI Plugin** — instalar `raxis-ai-v1.0.zip` en Identity como piloto (Brevo key General)
11. **M15 Brevo email** — 3 vars en `/opt/raxislab/scanner/.env`: `BREVO_API_KEY`, `BREVO_ALERT_FROM`, `BREVO_ALERT_TO`
12. **M7 bugs (6)** — requiere OK explícito de René antes de tocar
13. **Elfsight Google Reviews** — Identity (home + /salon/) y DeSancho (home + /servicios-desancho/)
14. **/trading → MEXEM** — conectar posiciones_acciones.json reales
15. **/leads → Notion** — backend persistente

### ⬜ BACKLOG FUTURO
16. Raxis Club — conectar Supabase `jdcnjcmyudenthtuojdk` y deployar en club.raxislab.com
17. Secuencias email Brevo — drip 3 emails para Last Mile nuevos contactos
18. GA4 Property IDs — rellenar tabla en sección CUENTAS para activar analytics en /google
19. Portfolio Identity — /portfolio/ CPTs via wp-admin (René)
20. DeSancho auditoría SEO final (cuando el sitio vuelva de HTTP 500)
21. RaxisLab.com — landing pages por sector (peluquería, restaurante)
22. cases.html — casos Discóbolo y Campus Alcácer (cuando haya métricas)
23. SIFEN Service — verificar estado, posible deploy para cliente PY
24. /proyectos OS — datos reales
25. /plan OS — bloques dinámicos
26. Agente central Raxislab — orquestar Meta + Google + Hetzner + Notion desde lenguaje natural (arquitectura diseñada 2026-07-05)
