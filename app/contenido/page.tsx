"use client";

import { useState } from "react";

const guiones = [
  {
    titulo: "Tu agencia te roba (y no lo sabes)",
    hook: "¿Cuánto te cobra tu agencia por resultados que podrías conseguir tú solo con €50/mes?",
    dolor: "Agencias cobrando 1.500€/mes por gestionar €200 en ads",
    duracion: "8 min",
    estado: "LISTO",
    guion: `HOOK: ¿Tu agencia te cobra más de 500€ y no sabes exactamente qué resultados tienes? Este vídeo te va a molestar.

PROBLEMA: La mayoría de agencias cobran entre 800 y 2.000€/mes por gestionar campañas que cualquier dueño de negocio podría manejar con una semana de formación.

CONTENIDO:
1. Los 3 KPIs que tu agencia NO te enseña a leer
2. El CPL real vs el que te reportan
3. Cómo auditar tu cuenta en 15 minutos

CTA: Si quieres que audite tu cuenta gratis, DM "AUDITORÍA"`,
  },
  {
    titulo: "Andrómeda: la empresa que puede hacer x10 en 3 años",
    hook: "Una empresa de defensa espacial que cotiza a precio de ganga y nadie está mirando.",
    dolor: "Inversores en growth sin saber dónde poner el capital",
    duracion: "12 min",
    estado: "LISTO",
    guion: `HOOK: Hay una empresa americana que tiene contratos con el DoD, opera en órbita baja, y cotiza a menos de 5x ventas. Se llama Andrómeda y probablemente no la conozcas.

ANÁLISIS:
- Modelo de negocio y moat
- Catalizadores próximos 12 meses
- Valoración conservadora vs optimista
- Setup técnico actual

RIESGO: Empresa pre-revenue. Alta volatilidad. Solo para carteras de riesgo.

CTA: Suscríbete a Stokers Market para recibir análisis como este cada semana.`,
  },
  {
    titulo: "El ROAS que te enseñan es una mentira",
    hook: "Tu ROAS de 4x no significa lo que crees. Te explico por qué.",
    dolor: "Anunciantes tomando decisiones basadas en métricas infladas",
    duracion: "6 min",
    estado: "LISTO",
    guion: `HOOK: ROAS 4x. Suena increíble, ¿verdad? Ahora dime: ¿cuánto ganas realmente después de producto, envío y devoluciones?

EL PROBLEMA:
- ROAS reportado vs MER (Marketing Efficiency Ratio)
- Atribución multi-touch que nadie configura bien
- El coste oculto del inventario en CPA real

SOLUCIÓN:
- Cómo calcular tu MER real
- Qué ROAS necesitas según tu margen
- La fórmula que uso con mis clientes

CTA: Plantilla de cálculo MER gratuita en bio.`,
  },
  {
    titulo: "Renuncié sin plan B (y así funcionó)",
    hook: "Dejé mi trabajo sin ahorros, sin clientes y sin plan. 18 meses después tengo esto.",
    dolor: "Gente atrapada en trabajos que odia esperando el 'momento perfecto'",
    duracion: "10 min",
    estado: "LISTO",
    guion: `HOOK: Octubre 2024. Última nómina. Sin clientes. Sin colchón. Solo con un laptop y la certeza de que si no saltaba ahora, nunca lo haría.

MI HISTORIA:
- El error del primer mes: intentar hacer todo
- El primer cliente y cómo lo conseguí
- Los meses malos que nadie enseña
- El sistema actual (agencia + trading + proyectos)

LO QUE APRENDÍ:
1. El plan B te mata la urgencia
2. Vender primero, después perfeccionar
3. La consistencia gana al talento

CTA: Si estás pensando en saltar, DM "SALTO" y hablamos.`,
  },
];

const NICHOS = ["AI Tools / Productividad", "Local Business Marketing", "Meta Ads Avanzado", "Google Ads & SEO"];

const CLIENTES_LIST = ["Identity Peluqueros", "Desancho Estilistas", "Malvarrosa CF", "Matías Benegas Tattoo"];

const episodios = [
  { num:1, titulo:"Cómo monté mi agencia desde 0",                     estado:"GRABADO",        color:"#00E676" },
  { num:2, titulo:"El error que cometí con mi primer cliente",          estado:"EDICIÓN",        color:"#FFB800" },
  { num:3, titulo:"Meta Ads vs Google Ads para negocios locales",       estado:"GUIÓN LISTO",    color:"#00C8FF" },
  { num:4, titulo:"Trading y emprendimiento: ¿son compatibles?",        estado:"PLANIFICADO",    color:"#5A6470" },
  { num:5, titulo:"Automatizaciones con IA: mi stack actual 2026",      estado:"PLANIFICADO",    color:"#5A6470" },
];

const checklistProd = ["Grabar audio","Editar en Audacity","Crear thumbnail","Subir a Spotify/iVoox","Post en redes"];

type Tab = "Videos"|"Blog EN"|"Clientes"|"Podcast";
const TABS: Tab[] = ["Videos","Blog EN","Clientes","Podcast"];

const CARD  = { background:"#111111", border:"1px solid rgba(255,255,255,0.06)", borderRadius:"6px" } as React.CSSProperties;
const LABEL = { fontSize:"11px", fontWeight:600, letterSpacing:"0.08em", textTransform:"uppercase" as const, color:"#5A6470" };

export default function ContenidoPage() {
  const [tab, setTab] = useState<Tab>("Videos");
  const [guionAbierto, setGuionAbierto] = useState<string | null>(null);
  const [nicho, setNicho] = useState(NICHOS[0]);
  const [articuloGenerado, setArticuloGenerado] = useState(false);
  const [clienteSelected, setClienteSelected] = useState(CLIENTES_LIST[0]);
  const [contenidoCliente, setContenidoCliente] = useState<string | null>(null);
  const [checklist, setChecklist] = useState<Record<string, boolean>>({});

  function generarArticulo() {
    setArticuloGenerado(true);
  }

  function generarContenidoCliente(tipo: string) {
    const msgs: Record<string, string> = {
      "Post GBP": `📍 ${clienteSelected}\n\n¿Buscas resultados reales?\n\nTrabajamos contigo desde el primer día con estrategia, creatividad y seguimiento constante.\n\n🔗 Reserva tu consulta gratuita en el enlace de bio.\n\n#MarketingDigital #Resultados`,
      "Reel": `Guión reel 30seg para ${clienteSelected}:\n\n[0-3s] Hook visual: resultado antes/después\n[3-10s] Problema que resuelves\n[10-20s] Tu solución en 3 pasos\n[20-27s] Resultado y social proof\n[27-30s] CTA: "Link en bio"`,
      "Reseña": `Hola, muchas gracias por tu reseña ⭐\n\nNos alegra mucho que hayas quedado satisfecho/a. En ${clienteSelected} trabajamos cada día para darte el mejor servicio.\n\n¡Te esperamos pronto!`,
    };
    setContenidoCliente(msgs[tipo] ?? "");
  }

  return (
    <div style={{ padding:"32px 40px" }}>
      <h1 style={{ fontSize:"24px", fontWeight:600, color:"#FFFFFF", marginBottom:"24px" }}>Contenido</h1>

      {/* Tab bar */}
      <div style={{ display:"inline-flex", gap:"4px", padding:"4px", background:"#0a0a0a", border:"1px solid rgba(255,255,255,0.06)", borderRadius:"8px", marginBottom:"20px" }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding:"7px 16px", borderRadius:"5px", border:"none", cursor:"pointer", fontSize:"13px", fontWeight: tab===t ? 600 : 400, background: tab===t ? "rgba(0,200,255,0.1)" : "transparent", color: tab===t ? "#00C8FF" : "#5A6470", outline: tab===t ? "1px solid rgba(0,200,255,0.2)" : "none" }}>{t}</button>
        ))}
      </div>

      {/* Mis Videos */}
      {tab === "Videos" && (
        <div style={{ display:"flex", flexDirection:"column", gap:"12px" }}>
          {guiones.map(g => (
            <div key={g.titulo} style={{ ...CARD, padding:"20px 24px" }}>
              <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:"16px", marginBottom:"10px" }}>
                <div style={{ flex:1 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:"10px", marginBottom:"6px" }}>
                    <span style={{ fontSize:"11px", fontWeight:600, padding:"2px 7px", borderRadius:"3px", background:"rgba(0,230,118,0.08)", color:"#00E676", border:"1px solid rgba(0,230,118,0.15)" }}>{g.estado}</span>
                    <span style={{ fontSize:"11px", color:"#5A6470", fontFamily:"'Space Mono', monospace" }}>{g.duracion}</span>
                  </div>
                  <h3 style={{ fontSize:"14px", fontWeight:600, color:"#FFFFFF", marginBottom:"4px" }}>{g.titulo}</h3>
                  <p style={{ fontSize:"12px", color:"#5A6470", marginBottom:"4px" }}>Hook: {g.hook}</p>
                  <p style={{ fontSize:"12px", color:"#5A6470" }}>Dolor: {g.dolor}</p>
                </div>
                <button
                  onClick={() => setGuionAbierto(guionAbierto === g.titulo ? null : g.titulo)}
                  style={{ padding:"7px 14px", borderRadius:"5px", border:"1px solid rgba(255,255,255,0.06)", background:"#161616", color:"#9AA3AD", fontSize:"12px", cursor:"pointer", flexShrink:0 }}
                >
                  {guionAbierto === g.titulo ? "Cerrar" : "Ver guión"}
                </button>
              </div>
              {guionAbierto === g.titulo && (
                <pre style={{ marginTop:"10px", padding:"14px", borderRadius:"5px", background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.04)", fontSize:"12px", color:"#9AA3AD", whiteSpace:"pre-wrap", lineHeight:1.6, fontFamily:"inherit" }}>
                  {g.guion}
                </pre>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Blog EN */}
      {tab === "Blog EN" && (
        <div style={{ maxWidth:"560px" }}>
          <div style={{ ...CARD, padding:"24px" }}>
            <p style={{ ...LABEL, marginBottom:"16px" }}>Generar artículo en inglés</p>
            <div style={{ marginBottom:"16px" }}>
              <p style={{ fontSize:"12px", color:"#5A6470", marginBottom:"8px" }}>Nicho</p>
              <div style={{ display:"flex", flexWrap:"wrap", gap:"8px" }}>
                {NICHOS.map(n => (
                  <button key={n} onClick={() => { setNicho(n); setArticuloGenerado(false); }} style={{ padding:"6px 12px", borderRadius:"4px", border:`1px solid ${nicho===n ? "rgba(0,200,255,0.3)" : "rgba(255,255,255,0.06)"}`, background: nicho===n ? "rgba(0,200,255,0.08)" : "transparent", color: nicho===n ? "#00C8FF" : "#5A6470", fontSize:"12px", cursor:"pointer" }}>{n}</button>
                ))}
              </div>
            </div>
            <button onClick={generarArticulo} style={{ width:"100%", padding:"12px", borderRadius:"6px", background:"#00C8FF", color:"#000", fontSize:"13px", fontWeight:600, border:"none", cursor:"pointer", marginBottom: articuloGenerado ? "16px" : "0" }}>
              Generar artículo →
            </button>
            {articuloGenerado && (
              <div style={{ padding:"14px", borderRadius:"5px", background:"rgba(0,200,255,0.04)", border:"1px solid rgba(0,200,255,0.12)" }}>
                <p style={{ fontSize:"13px", fontWeight:600, color:"#FFFFFF", marginBottom:"8px" }}>
                  Title: 7 Proven {nicho.split("/")[0].trim()} Strategies for Local Businesses in 2026
                </p>
                <p style={{ fontSize:"12px", color:"#5A6470", lineHeight:1.6 }}>
                  Introduction: In a world where AI is reshaping how customers find local services, businesses that adapt early will capture the lion&apos;s share of organic traffic...
                  <br /><br />
                  <strong style={{ color:"#9AA3AD" }}>Sections:</strong> Why {nicho.split("/")[0].trim()} matters · Top 7 strategies · Real case studies · Implementation checklist · Tools and pricing
                </p>
                <button onClick={() => alert("Borrador creado en WordPress ✅")} style={{ marginTop:"12px", padding:"7px 14px", borderRadius:"4px", background:"rgba(0,200,255,0.08)", color:"#00C8FF", border:"1px solid rgba(0,200,255,0.2)", fontSize:"12px", cursor:"pointer" }}>
                  Crear borrador WordPress →
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Contenido Clientes */}
      {tab === "Clientes" && (
        <div style={{ maxWidth:"600px" }}>
          <div style={{ ...CARD, padding:"24px" }}>
            <p style={{ ...LABEL, marginBottom:"16px" }}>Contenido para cliente</p>
            <div style={{ marginBottom:"16px" }}>
              <p style={{ fontSize:"12px", color:"#5A6470", marginBottom:"8px" }}>Cliente</p>
              <div style={{ display:"flex", flexWrap:"wrap", gap:"8px" }}>
                {CLIENTES_LIST.map(c => (
                  <button key={c} onClick={() => { setClienteSelected(c); setContenidoCliente(null); }} style={{ padding:"6px 12px", borderRadius:"4px", border:`1px solid ${clienteSelected===c ? "rgba(0,200,255,0.3)" : "rgba(255,255,255,0.06)"}`, background: clienteSelected===c ? "rgba(0,200,255,0.08)" : "transparent", color: clienteSelected===c ? "#00C8FF" : "#5A6470", fontSize:"12px", cursor:"pointer" }}>{c}</button>
                ))}
              </div>
            </div>
            <div style={{ display:"flex", gap:"10px", flexWrap:"wrap", marginBottom:"16px" }}>
              {[["Post GBP","Generar post Google Business"],["Reel","Generar guión de reel"],["Reseña","Responder reseña reciente"]].map(([tipo,label]) => (
                <button key={tipo} onClick={() => generarContenidoCliente(tipo)} style={{ padding:"9px 16px", borderRadius:"5px", border:"1px solid rgba(255,255,255,0.06)", background:"#161616", color:"#9AA3AD", fontSize:"12px", cursor:"pointer", fontWeight:500 }}>{label}</button>
              ))}
            </div>
            {contenidoCliente && (
              <div style={{ padding:"14px", borderRadius:"5px", background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.06)" }}>
                <pre style={{ fontSize:"12px", color:"#9AA3AD", whiteSpace:"pre-wrap", lineHeight:1.6, fontFamily:"inherit" }}>{contenidoCliente}</pre>
                <button onClick={() => navigator.clipboard.writeText(contenidoCliente).then(() => alert("Copiado ✅"))} style={{ marginTop:"10px", padding:"6px 12px", borderRadius:"4px", background:"rgba(0,200,255,0.08)", color:"#00C8FF", border:"1px solid rgba(0,200,255,0.15)", fontSize:"12px", cursor:"pointer" }}>Copiar</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Podcast Jorge */}
      {tab === "Podcast" && (
        <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr", gap:"20px" }}>
          <div>
            <p style={{ ...LABEL, marginBottom:"14px" }}>Episodios planificados</p>
            <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
              {episodios.map(({ num,titulo,estado,color }) => (
                <div key={num} style={{ ...CARD, padding:"14px 18px", display:"flex", alignItems:"center", gap:"14px" }}>
                  <span style={{ fontFamily:"'Space Mono', monospace", fontWeight:700, fontSize:"13px", color:"#5A6470", width:"24px", flexShrink:0 }}>E{num}</span>
                  <span style={{ flex:1, fontSize:"13px", color:"#9AA3AD" }}>{titulo}</span>
                  <span style={{ fontSize:"11px", fontWeight:600, padding:"2px 8px", borderRadius:"3px", color, background:`${color}12`, border:`1px solid ${color}25`, whiteSpace:"nowrap" }}>{estado}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <p style={{ ...LABEL, marginBottom:"14px" }}>Checklist producción</p>
            <div style={{ ...CARD, padding:"16px 20px" }}>
              {checklistProd.map(item => {
                const done = checklist[item] ?? false;
                return (
                  <div key={item} onClick={() => setChecklist(p => ({ ...p, [item]: !done }))} style={{ display:"flex", alignItems:"center", gap:"10px", padding:"8px 0", borderBottom:"1px solid rgba(255,255,255,0.04)", cursor:"pointer" }}>
                    <span style={{ width:"15px", height:"15px", borderRadius:"3px", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", border:`1.5px solid ${done ? "#00E676" : "#2A3040"}`, background: done ? "#00E676" : "transparent" }}>
                      {done && <span style={{ color:"#000", fontSize:"9px", fontWeight:700 }}>✓</span>}
                    </span>
                    <span style={{ fontSize:"12px", color: done ? "#2A3040" : "#9AA3AD", textDecoration: done ? "line-through" : "none" }}>{item}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
