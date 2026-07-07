"use client";
import { useState, useEffect } from "react";

type ClienteTab = "Identity" | "Desancho" | "Malvarrosa CF" | "Matías Tattoo" | "Otro cliente";
type TipoContenido = "Stories" | "Reel" | "Carrusel" | "Post feed";
type Tono = "Profesional" | "Cercano" | "Urgencia" | "Inspiracional";
type SeccionPrincipal = "Social" | "Blog";

type HistorialItem = {
  id: string;
  cliente: string;
  tipo: TipoContenido;
  tema: string;
  tono: Tono;
  result: string;
  createdAt: number;
};

type ParsedResult = {
  caption: string;
  hashtags: string;
  hora_publicacion: string;
};

const CLIENTES_INFO: Record<ClienteTab, { nombre: string; sector: string; web?: string }> = {
  "Identity":      { nombre: "Identity Peluqueros", sector: "Peluquería y estética" },
  "Desancho":      { nombre: "Desancho Estilistas",  sector: "Peluquería y estética canina" },
  "Malvarrosa CF": { nombre: "Malvarrosa CF",         sector: "Club de fútbol / Deporte" },
  "Matías Tattoo": { nombre: "Matías Benegas Tattoo", sector: "Estudio de tatuaje" },
  "Otro cliente":  { nombre: "", sector: "" },
};

const TIPOS: TipoContenido[] = ["Stories", "Reel", "Carrusel", "Post feed"];
const TONOS: Tono[]          = ["Profesional", "Cercano", "Urgencia", "Inspiracional"];
const TABS: ClienteTab[]     = ["Identity", "Desancho", "Malvarrosa CF", "Matías Tattoo", "Otro cliente"];
const HISTORIAL_KEY = "raxislab_contenido_historial_v1";

function loadHistorial(): HistorialItem[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(HISTORIAL_KEY) ?? "[]"); } catch { return []; }
}
function saveHistorial(items: HistorialItem[]) {
  localStorage.setItem(HISTORIAL_KEY, JSON.stringify(items));
}
function newId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

const CARD: React.CSSProperties  = { background: "var(--card)", border: "1px solid var(--border)", borderRadius: "8px", padding: "20px" };
const LABEL: React.CSSProperties = { fontSize: "11px", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)" };
const INPUT: React.CSSProperties = { width: "100%", padding: "9px 12px", borderRadius: "6px", border: "1px solid var(--border)", background: "var(--bg)", color: "var(--text)", fontSize: "13px", outline: "none", boxSizing: "border-box" };

function tryParseResult(text: string): ParsedResult | null {
  try { return JSON.parse(text) as ParsedResult; } catch { return null; }
}

export default function ContenidoPage() {
  const [seccion, setSeccion]       = useState<SeccionPrincipal>("Social");
  const [tab, setTab]               = useState<ClienteTab>("Identity");
  const [tipo, setTipo]             = useState<TipoContenido>("Stories");
  const [tema, setTema]             = useState("");
  const [tono, setTono]             = useState<Tono>("Cercano");
  const [otroNombre, setOtroNombre] = useState("");
  const [otroSector, setOtroSector] = useState("");
  const [loading, setLoading]       = useState(false);
  const [result, setResult]         = useState<string | null>(null);
  const [historial, setHistorial]   = useState<HistorialItem[]>([]);
  const [hydrated, setHydrated]     = useState(false);

  // Blog section state
  const [blogCliente, setBlogCliente] = useState<ClienteTab>("Identity");
  const [blogTopic, setBlogTopic]     = useState("");
  const [blogKeyword, setBlogKeyword] = useState("");
  const [blogIdioma, setBlogIdioma]   = useState<"ES" | "EN">("ES");
  const [blogLoading, setBlogLoading] = useState(false);
  const [blogResult, setBlogResult]   = useState("");

  useEffect(() => {
    setHistorial(loadHistorial());
    setHydrated(true);
  }, []);

  useEffect(() => { setResult(null); }, [tab]);

  function getClienteNombre() {
    if (tab === "Otro cliente") return otroNombre.trim() || "Cliente";
    return CLIENTES_INFO[tab].nombre;
  }
  function getClienteSector() {
    if (tab === "Otro cliente") return otroSector.trim() || "negocio local";
    return CLIENTES_INFO[tab].sector;
  }

  const captionWords: Record<TipoContenido, string> = {
    "Stories":  "60-80",
    "Reel":     "80-120",
    "Carrusel": "100-150",
    "Post feed":"150-200",
  };

  async function generar() {
    const cliente = getClienteNombre();
    const sector  = getClienteSector();
    const prompt  = `Eres un experto en social media marketing para negocios locales españoles.

Genera contenido para ${cliente} (${sector}).
Tipo de contenido: ${tipo}
Tema / Servicio: ${tema.trim() || "servicios principales del negocio"}
Tono: ${tono}

Devuelve EXACTAMENTE este JSON (sin markdown, sin texto fuera del JSON):
{
  "caption": "texto del caption listo para publicar, entre ${captionWords[tipo]} palabras, en español",
  "hashtags": "#hashtag1 #hashtag2 ... (10-15 hashtags relevantes para España)",
  "hora_publicacion": "HH:MM — razón breve de por qué esa hora es óptima para ${tipo}"
}`;

    setLoading(true);
    setResult(null);
    try {
      const res  = await fetch("/api/claude/generate", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ type: "social_caption_custom", data: { prompt } }),
      });
      const json = await res.json();
      const text = (json.content ?? "") as string;
      setResult(text);
      const item: HistorialItem = { id: newId(), cliente, tipo, tema: tema.trim(), tono, result: text, createdAt: Date.now() };
      const updated = [item, ...historial].slice(0, 5);
      setHistorial(updated);
      saveHistorial(updated);
    } catch {
      setResult("Error generando contenido. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  function deleteHistorialItem(id: string) {
    const updated = historial.filter(h => h.id !== id);
    setHistorial(updated);
    saveHistorial(updated);
  }

  function copyText(text: string) {
    navigator.clipboard.writeText(text).then(() => alert("Copiado ✅"));
  }

  function resultCopyText(text: string): string {
    const parsed = tryParseResult(text);
    return parsed ? `${parsed.caption}\n\n${parsed.hashtags}` : text;
  }

  async function generarBlog() {
    if (!blogTopic.trim()) return;
    const clienteInfo = CLIENTES_INFO[blogCliente];
    const nombre  = blogCliente === "Otro cliente" ? otroNombre || "el negocio" : clienteInfo.nombre;
    const sector  = blogCliente === "Otro cliente" ? otroSector || "negocio local" : clienteInfo.sector;
    setBlogLoading(true); setBlogResult("");
    try {
      const prompt = blogIdioma === "ES"
        ? `Eres un experto en marketing de contenidos para negocios locales españoles.

Escribe un artículo de blog profesional en español para ${nombre} (${sector}).
Tema: "${blogTopic.trim()}"
${blogKeyword ? `Keyword objetivo: "${blogKeyword}"` : ""}

Estructura:
- Título atractivo (H1) con la keyword
- Introducción (2-3 frases, engancha al lector)
- 3 secciones con subtítulo H2 y 2-3 párrafos cada una
- Conclusión con CTA sutil (reservar cita / contactar / visitar)

Tono: experto pero cercano, español de España. Máximo 700 palabras. Sin relleno, información útil y accionable.

Escribe el artículo completo directamente:`
        : `Write a professional blog article in English for ${nombre} (${sector}).
Topic: "${blogTopic.trim()}"
${blogKeyword ? `Target keyword: "${blogKeyword}"` : ""}

Structure:
- Engaging H1 title with keyword
- Intro (2-3 sentences)
- 3 sections with H2 headers and 2-3 paragraphs each
- Conclusion with subtle CTA

Tone: expert but approachable. Max 700 words. No fluff.

Write the full article directly:`;

      const res = await fetch("/api/claude/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "social_caption_custom", data: { prompt } }),
      });
      const j = await res.json();
      setBlogResult(j.content || j.error || "Error generando");
    } catch { setBlogResult("Error de conexión"); }
    finally { setBlogLoading(false); }
  }

  return (
    <div style={{ padding: "32px 40px" }}>
      <h1 style={{ fontSize: "24px", fontWeight: 600, color: "var(--text)", marginBottom: "24px" }}>Contenido</h1>

      {/* Sección principal: Social / Blog */}
      <div style={{ display: "inline-flex", gap: "4px", padding: "4px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "8px", marginBottom: "20px" }}>
        {(["Social", "Blog"] as SeccionPrincipal[]).map(s => (
          <button key={s} onClick={() => setSeccion(s)} style={{ padding: "7px 24px", borderRadius: "5px", border: "none", cursor: "pointer", fontSize: "13px", fontWeight: seccion === s ? 600 : 400, background: seccion === s ? "var(--accent-dim)" : "transparent", color: seccion === s ? "var(--accent)" : "var(--text-muted)", outline: seccion === s ? "1px solid var(--border-accent)" : "none" }}>{s === "Social" ? "Redes Sociales" : "Blog / Artículos"}</button>
        ))}
      </div>

      {/* Tab bar clientes — solo en Social */}
      {seccion === "Social" && (
      <div style={{ display: "inline-flex", gap: "4px", padding: "4px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "8px", marginBottom: "28px", marginLeft: "12px" }}>
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: "7px 16px", borderRadius: "5px", border: "none", cursor: "pointer",
              fontSize: "13px", fontWeight: tab === t ? 600 : 400,
              background: tab === t ? "var(--accent-dim)" : "transparent",
              color:      tab === t ? "var(--accent)"     : "var(--text-muted)",
              outline:    tab === t ? "1px solid var(--border-accent)" : "none",
            }}
          >
            {t}
          </button>
        ))}
      </div>
      )}

      {/* ═══════════ SECCIÓN BLOG ═══════════ */}
      {seccion === "Blog" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
          {/* Panel izquierdo — configuración */}
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div style={CARD}>
              <p style={{ ...LABEL, marginBottom: "14px" }}>Cliente</p>
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "18px" }}>
                {TABS.map(t => (
                  <button key={t} onClick={() => setBlogCliente(t)} style={{ padding: "6px 14px", borderRadius: "5px", border: `1px solid ${blogCliente===t?"var(--border-accent)":"var(--border)"}`, background: blogCliente===t?"var(--accent-dim)":"transparent", color: blogCliente===t?"var(--accent)":"var(--text-muted)", fontSize: "12px", fontWeight: blogCliente===t?600:400, cursor: "pointer" }}>{t}</button>
                ))}
              </div>
              {blogCliente === "Otro cliente" && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "16px" }}>
                  <div>
                    <p style={{ ...LABEL, marginBottom: "6px" }}>Nombre</p>
                    <input value={otroNombre} onChange={e => setOtroNombre(e.target.value)} placeholder="Taller García" style={INPUT} />
                  </div>
                  <div>
                    <p style={{ ...LABEL, marginBottom: "6px" }}>Sector</p>
                    <input value={otroSector} onChange={e => setOtroSector(e.target.value)} placeholder="Taller mecánico" style={INPUT} />
                  </div>
                </div>
              )}

              <p style={{ ...LABEL, marginBottom: "8px" }}>Tema / Título tentativo</p>
              <input value={blogTopic} onChange={e => setBlogTopic(e.target.value)} placeholder="Ej: Cómo elegir el corte de pelo perfecto para tu tipo de cara" style={{ ...INPUT, marginBottom: "14px" }} />

              <p style={{ ...LABEL, marginBottom: "8px" }}>Keyword SEO (opcional)</p>
              <input value={blogKeyword} onChange={e => setBlogKeyword(e.target.value)} placeholder="Ej: peluquería Valencia, corte de pelo hombre" style={{ ...INPUT, marginBottom: "16px" }} />

              <p style={{ ...LABEL, marginBottom: "10px" }}>Idioma</p>
              <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
                {(["ES", "EN"] as const).map(l => (
                  <button key={l} onClick={() => setBlogIdioma(l)} style={{ padding: "7px 20px", borderRadius: "5px", border: `1px solid ${blogIdioma===l?"var(--border-accent)":"var(--border)"}`, background: blogIdioma===l?"var(--accent-dim)":"transparent", color: blogIdioma===l?"var(--accent)":"var(--text-muted)", fontSize: "13px", fontWeight: blogIdioma===l?600:400, cursor: "pointer" }}>
                    {l === "ES" ? "Español" : "English"}
                  </button>
                ))}
              </div>

              <button onClick={generarBlog} disabled={!blogTopic.trim()||blogLoading} style={{ width: "100%", padding: "13px", borderRadius: "8px", border: "none", background: blogLoading||!blogTopic.trim()?"var(--surface)":"var(--accent)", color: blogLoading||!blogTopic.trim()?"var(--text-muted)":"#fff", fontSize: "14px", fontWeight: 600, cursor: blogLoading||!blogTopic.trim()?"not-allowed":"pointer" }}>
                {blogLoading ? "Generando artículo…" : "Generar artículo →"}
              </button>
            </div>

            <div style={{ ...CARD, padding: "14px 16px", background: "var(--accent-dim)", borderColor: "var(--border-accent)" }}>
              <p style={{ ...LABEL, marginBottom: "8px" }}>Dónde publicar</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {[
                  { label: "WordPress (cliente)", hint: "Copiar artículo → Entradas → Nueva entrada → pegar" },
                  { label: "Blog raxislab.com", hint: "Copiar → pegar en blog/ → rebuild wrangler" },
                  { label: "Google Business Post", hint: "Google Business → Publicaciones → Crear → Novedades" },
                  { label: "LinkedIn Article", hint: "LinkedIn → Escribir artículo → pegar" },
                ].map(({label,hint}) => (
                  <div key={label} style={{ padding: "8px 10px", borderRadius: "5px", background: "var(--card)", border: "1px solid var(--border)" }}>
                    <p style={{ fontSize: "12px", fontWeight: 600, color: "var(--text)", marginBottom: "2px" }}>{label}</p>
                    <p style={{ fontSize: "11px", color: "var(--text-muted)" }}>{hint}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Panel derecho — preview artículo */}
          <div style={{ ...CARD, padding: "20px 24px", display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <p style={LABEL}>Artículo generado</p>
              {blogResult && (
                <button onClick={() => navigator.clipboard.writeText(blogResult).then(() => alert("Artículo copiado ✅"))} style={{ fontSize: "11px", padding: "4px 12px", borderRadius: "4px", background: "var(--accent-dim)", color: "var(--accent)", border: "1px solid var(--border-accent)", cursor: "pointer", fontWeight: 600 }}>
                  Copiar todo
                </button>
              )}
            </div>
            {blogLoading && (
              <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontSize: "13px", minHeight: "400px" }}>
                Redactando artículo con Claude…
              </div>
            )}
            {!blogLoading && !blogResult && (
              <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontSize: "13px", minHeight: "400px" }}>
                Configura el tema y genera el artículo.
              </div>
            )}
            {!blogLoading && blogResult && (
              <div style={{ overflowY: "auto", maxHeight: "70vh" }}>
                <pre style={{ fontFamily: "inherit", fontSize: "13px", color: "var(--text-mid)", lineHeight: 1.8, whiteSpace: "pre-wrap", margin: 0 }}>
                  {blogResult}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════ SECCIÓN SOCIAL ═══════════ */}
      {seccion === "Social" && <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: "20px", alignItems: "start" }}>

        {/* ── Left: Generar ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

          {/* Otro cliente inputs */}
          {tab === "Otro cliente" && (
            <div style={{ ...CARD, display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div>
                <p style={{ ...LABEL, marginBottom: "8px" }}>Nombre del cliente</p>
                <input value={otroNombre} onChange={e => setOtroNombre(e.target.value)} placeholder="Ej: Taller García" style={INPUT} />
              </div>
              <div>
                <p style={{ ...LABEL, marginBottom: "8px" }}>Sector / Descripción</p>
                <input value={otroSector} onChange={e => setOtroSector(e.target.value)} placeholder="Ej: Taller mecánico" style={INPUT} />
              </div>
            </div>
          )}

          <div style={CARD}>
            {/* Tipo */}
            <p style={{ ...LABEL, marginBottom: "12px" }}>Tipo de contenido</p>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "20px" }}>
              {TIPOS.map(t => (
                <button
                  key={t}
                  onClick={() => setTipo(t)}
                  style={{
                    padding: "8px 16px", borderRadius: "6px", cursor: "pointer",
                    border:      `1px solid ${tipo === t ? "var(--border-accent)" : "var(--border)"}`,
                    background:  tipo === t ? "var(--accent-dim)" : "transparent",
                    color:       tipo === t ? "var(--accent)"     : "var(--text-muted)",
                    fontSize:    "13px",
                    fontWeight:  tipo === t ? 600 : 400,
                  }}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Tema */}
            <p style={{ ...LABEL, marginBottom: "8px" }}>Servicio / Tema</p>
            <input
              value={tema}
              onChange={e => setTema(e.target.value)}
              placeholder="Ej: Corte con tratamiento, Nueva temporada primavera, Oferta especial..."
              style={{ ...INPUT, marginBottom: "20px" }}
            />

            {/* Tono */}
            <p style={{ ...LABEL, marginBottom: "12px" }}>Tono</p>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "24px" }}>
              {TONOS.map(t => (
                <button
                  key={t}
                  onClick={() => setTono(t)}
                  style={{
                    padding: "7px 14px", borderRadius: "6px", cursor: "pointer",
                    border:     `1px solid ${tono === t ? "var(--border-accent)" : "var(--border)"}`,
                    background:  tono === t ? "var(--accent-dim)" : "transparent",
                    color:       tono === t ? "var(--accent)"     : "var(--text-muted)",
                    fontSize:   "12px",
                    fontWeight:  tono === t ? 600 : 400,
                  }}
                >
                  {t}
                </button>
              ))}
            </div>

            <button
              onClick={generar}
              disabled={loading}
              style={{
                width: "100%", padding: "13px", borderRadius: "8px", border: "none",
                background:  loading ? "var(--surface)" : "var(--accent)",
                color:       loading ? "var(--text-muted)" : "#fff",
                fontSize:    "14px", fontWeight: 600,
                cursor:      loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Generando con IA..." : "Generar con IA →"}
            </button>
          </div>

          {/* Result */}
          {result && (() => {
            const parsed = tryParseResult(result);
            return (
              <div style={{ ...CARD, background: "var(--accent-dim)", borderColor: "var(--border-accent)" }}>
                {parsed ? (
                  <>
                    <div style={{ marginBottom: "16px" }}>
                      <p style={{ ...LABEL, marginBottom: "8px" }}>Caption</p>
                      <p style={{ fontSize: "13px", lineHeight: 1.7, color: "var(--text)", whiteSpace: "pre-wrap" }}>{parsed.caption}</p>
                    </div>
                    <div style={{ marginBottom: "16px" }}>
                      <p style={{ ...LABEL, marginBottom: "8px" }}>Hashtags</p>
                      <p style={{ fontSize: "12px", color: "var(--accent)", fontFamily: "'Space Mono', monospace", lineHeight: 1.7 }}>{parsed.hashtags}</p>
                    </div>
                    <div style={{ marginBottom: "20px", padding: "10px 12px", borderRadius: "6px", background: "var(--card)", border: "1px solid var(--border)" }}>
                      <span style={{ ...LABEL, marginRight: "8px" }}>Hora sugerida</span>
                      <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>{parsed.hora_publicacion}</span>
                    </div>
                    <button
                      onClick={() => copyText(`${parsed.caption}\n\n${parsed.hashtags}`)}
                      style={{ padding: "9px 18px", borderRadius: "6px", background: "var(--accent)", color: "#fff", fontSize: "12px", fontWeight: 600, border: "none", cursor: "pointer" }}
                    >
                      Copiar caption + hashtags
                    </button>
                  </>
                ) : (
                  <>
                    <pre style={{ fontSize: "12px", color: "var(--text-mid)", whiteSpace: "pre-wrap", lineHeight: 1.6, fontFamily: "inherit", marginBottom: "14px" }}>{result}</pre>
                    <button onClick={() => copyText(result)} style={{ padding: "9px 18px", borderRadius: "6px", background: "var(--accent)", color: "#fff", fontSize: "12px", fontWeight: 600, border: "none", cursor: "pointer" }}>Copiar</button>
                  </>
                )}
              </div>
            );
          })()}
        </div>

        {/* ── Right: Historial ── */}
        <div>
          <p style={{ ...LABEL, marginBottom: "14px" }}>Historial reciente</p>
          {!hydrated || historial.length === 0 ? (
            <div style={{ ...CARD, padding: "28px", textAlign: "center" }}>
              <p style={{ fontSize: "12px", color: "var(--text-muted)", lineHeight: 1.6 }}>
                Las últimas 5 generaciones aparecerán aquí.
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {historial.map(h => {
                const parsed  = tryParseResult(h.result);
                const preview = (parsed?.caption ?? h.result).slice(0, 90) + "…";
                return (
                  <div key={h.id} style={{ ...CARD, padding: "14px 16px" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "8px", marginBottom: "6px" }}>
                      <div>
                        <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--accent)", marginRight: "8px" }}>{h.tipo}</span>
                        <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>{h.tono}</span>
                      </div>
                      <span style={{ fontSize: "10px", color: "var(--text-muted)", fontFamily: "'Space Mono', monospace", whiteSpace: "nowrap" }}>
                        {new Date(h.createdAt).toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit" })}
                      </span>
                    </div>
                    <p style={{ fontSize: "11px", color: "var(--text-mid)", marginBottom: "6px", lineHeight: 1.5 }}>{preview}</p>
                    <p style={{ fontSize: "10px", color: "var(--text-muted)", marginBottom: "10px" }}>
                      {h.cliente}{h.tema ? ` · ${h.tema}` : ""}
                    </p>
                    <div style={{ display: "flex", gap: "6px" }}>
                      <button
                        onClick={() => copyText(resultCopyText(h.result))}
                        style={{ flex: 1, padding: "6px", borderRadius: "4px", background: "var(--accent-dim)", color: "var(--accent)", border: "1px solid var(--border-accent)", fontSize: "11px", cursor: "pointer" }}
                      >
                        Copiar
                      </button>
                      <button
                        onClick={() => deleteHistorialItem(h.id)}
                        style={{ padding: "6px 10px", borderRadius: "4px", background: "transparent", color: "var(--text-muted)", border: "1px solid var(--border)", fontSize: "11px", cursor: "pointer" }}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>}
    </div>
  );
}
