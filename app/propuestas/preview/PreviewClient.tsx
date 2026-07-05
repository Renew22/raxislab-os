"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";

// ── Types ─────────────────────────────────────────────────────────────────────

interface ProposalData {
  cliente: string;
  sector:  string;
  tamano:  string;
  selected: string[];
  precio:  number;
  pago:    string;
}

// ── Static content ────────────────────────────────────────────────────────────

const DESC: Record<string, string> = {
  "Web":                         "Diseño y desarrollo web profesional, adaptado a móvil y optimizado para motores de búsqueda.",
  "SEO":                         "Posicionamiento orgánico: auditoría técnica, estrategia de keywords y optimización on-page.",
  "Meta Ads":                    "Gestión integral de campañas en Facebook e Instagram con seguimiento de conversiones y optimización continua.",
  "Google Ads":                  "Campañas en Google Search, Display y YouTube orientadas a maximizar el retorno de la inversión.",
  "Diseño / Branding":           "Identidad visual corporativa completa: logotipo, paleta de colores, tipografía y manual de marca.",
  "Planificación de contenido":  "Estrategia editorial mensual, calendario de publicaciones y guía de tono de comunicación.",
  "Grabación y edición de vídeo":"Producción audiovisual profesional para redes sociales, web y materiales de presentación.",
  "Diseño de imágenes / posts":  "Creatividades optimizadas para redes sociales, stories y piezas publicitarias.",
};

function fmt(d: Date): string {
  return d.toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" });
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

// ── Preview inner (needs useSearchParams → must be inside Suspense) ───────────

function Preview() {
  const params  = useSearchParams();
  const [data,  setData]  = useState<ProposalData | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving,setSaving]= useState(false);
  const [error, setError] = useState("");

  const today    = new Date();
  const fechaStr = fmt(today);
  const validStr = fmt(addDays(today, 15));

  useEffect(() => {
    const raw = params.get("data");
    if (!raw) return;
    try { setData(JSON.parse(atob(raw))); } catch { setError("Datos de propuesta inválidos."); }
  }, [params]);

  async function guardarNotion() {
    if (!data) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/notion/propuesta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, fecha: fechaStr, validez: validStr }),
      });
      if (res.ok) { setSaved(true); }
      else {
        const j = await res.json().catch(() => ({}));
        setError(j.error || "Error al guardar en Notion.");
      }
    } catch {
      setError("Error de red al guardar en Notion.");
    } finally {
      setSaving(false);
    }
  }

  if (!data && !error) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>
      <p style={{ color: "#666" }}>Cargando...</p>
    </div>
  );

  if (error && !data) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>
      <p style={{ color: "#e53e3e" }}>{error}</p>
    </div>
  );

  return (
    <>
      {/* ── Toolbar (visible en pantalla, oculto en impresión) ── */}
      <div
        className="no-print"
        style={{
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 10000,
          background: "#111827", borderBottom: "1px solid rgba(255,255,255,0.08)",
          padding: "10px 32px", display: "flex", alignItems: "center", gap: "10px",
        }}
      >
        <span style={{ fontSize: "13px", color: "#9CA3AF", flex: 1 }}>
          Propuesta para <strong style={{ color: "#F9FAFB" }}>{data!.cliente || "Sin nombre"}</strong>
          <span style={{ marginLeft: "8px", color: "#6B7280" }}>·</span>
          <span style={{ marginLeft: "8px", color: "#6B7280" }}>{fechaStr}</span>
        </span>
        {error && <span style={{ fontSize: "12px", color: "#F87171" }}>{error}</span>}
        <button
          onClick={guardarNotion}
          disabled={saving || saved}
          style={{
            padding: "7px 16px", borderRadius: "6px", fontSize: "12px", fontWeight: 600,
            border: `1px solid ${saved ? "rgba(52,211,153,0.4)" : "rgba(30,155,240,0.4)"}`,
            background: saved ? "rgba(52,211,153,0.1)" : "rgba(30,155,240,0.1)",
            color: saved ? "#34D399" : "#1E9BF0",
            cursor: saving || saved ? "default" : "pointer",
          }}
        >
          {saved ? "✓ Guardado en Notion" : saving ? "Guardando..." : "Guardar en Notion"}
        </button>
        <button
          onClick={() => window.print()}
          style={{
            padding: "7px 20px", borderRadius: "6px",
            background: "#1E9BF0", color: "#fff",
            fontSize: "13px", fontWeight: 600, border: "none", cursor: "pointer",
          }}
        >
          Guardar PDF
        </button>
      </div>

      {/* ── Propuesta imprimible ── */}
      <div
        id="proposal"
        style={{
          maxWidth: "820px", margin: "0 auto", padding: "80px 56px 64px",
          fontFamily: "'Georgia', 'Times New Roman', serif",
          background: "#fff", minHeight: "100vh", color: "#1a1a2e",
          paddingTop: "80px",
        }}
      >
        {/* Cabecera */}
        <div style={{
          display: "flex", alignItems: "flex-start", justifyContent: "space-between",
          paddingBottom: "28px", marginBottom: "40px",
          borderBottom: "3px solid #1E9BF0",
        }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <Image src="/logo.png" alt="Raxislab" width={52} height={52} style={{ borderRadius: "10px" }} />
            <div style={{ fontSize: "11px", letterSpacing: "0.12em", color: "#6B7280", fontFamily: "Arial, sans-serif" }}>
              RAXISLAB AGENCY
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "26px", fontWeight: 700, color: "#1E9BF0", letterSpacing: "-0.02em", fontFamily: "Arial, sans-serif" }}>
              PROPUESTA DE SERVICIOS
            </div>
            <div style={{ fontSize: "13px", color: "#6B7280", marginTop: "8px", fontFamily: "Arial, sans-serif" }}>
              Fecha: {fechaStr}
            </div>
            <div style={{ fontSize: "13px", color: "#6B7280", fontFamily: "Arial, sans-serif" }}>
              Válida hasta: {validStr}
            </div>
          </div>
        </div>

        {/* Para */}
        <div style={{ marginBottom: "40px" }}>
          <div style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.12em", color: "#1E9BF0", textTransform: "uppercase", marginBottom: "8px", fontFamily: "Arial, sans-serif" }}>
            Preparado para
          </div>
          <div style={{ fontSize: "26px", fontWeight: 700, color: "#0F172A", fontFamily: "Arial, sans-serif" }}>
            {data!.cliente || "—"}
          </div>
          <div style={{ fontSize: "14px", color: "#64748B", marginTop: "4px", fontFamily: "Arial, sans-serif" }}>
            {data!.sector} · {data!.tamano}
          </div>
        </div>

        {/* Servicios */}
        <div style={{ marginBottom: "40px" }}>
          <div style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.12em", color: "#1E9BF0", textTransform: "uppercase", marginBottom: "20px", fontFamily: "Arial, sans-serif" }}>
            Servicios incluidos
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {data!.selected.map((s, i) => (
              <div key={s} style={{
                display: "flex", gap: "20px",
                padding: "14px 0",
                borderBottom: "1px solid #EFF2F5",
              }}>
                <div style={{
                  width: "28px", height: "28px", borderRadius: "50%",
                  background: "#1E9BF0", color: "#fff",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "12px", fontWeight: 700, flexShrink: 0,
                  fontFamily: "Arial, sans-serif",
                }}>
                  {i + 1}
                </div>
                <div>
                  <div style={{ fontSize: "15px", fontWeight: 600, color: "#0F172A", marginBottom: "3px", fontFamily: "Arial, sans-serif" }}>{s}</div>
                  <div style={{ fontSize: "13px", color: "#64748B", lineHeight: 1.6 }}>{DESC[s] ?? ""}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Inversión */}
        <div style={{
          marginBottom: "40px", padding: "28px 32px",
          background: "#F0F7FF", borderRadius: "10px",
          border: "1px solid #BFDBFE",
        }}>
          <div style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.12em", color: "#1E9BF0", textTransform: "uppercase", marginBottom: "20px", fontFamily: "Arial, sans-serif" }}>
            Inversión mensual
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
            <div style={{ fontFamily: "Arial, sans-serif" }}>
              <div style={{ fontSize: "14px", color: "#475569", marginBottom: "8px" }}>
                {data!.selected.length} servicio{data!.selected.length !== 1 ? "s" : ""} · {data!.sector} {data!.tamano}
              </div>
              <div style={{ fontSize: "13px", color: "#64748B" }}>
                <strong style={{ color: "#334155" }}>Forma de pago:</strong>{" "}
                {data!.pago || "50% a la firma · 50% inicio del segundo mes"}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "44px", fontWeight: 700, color: "#1E9BF0", fontFamily: "Arial, sans-serif", lineHeight: 1 }}>
                {Number(data!.precio).toLocaleString("es-ES")}€
              </div>
              <div style={{ fontSize: "13px", color: "#94A3B8", fontFamily: "Arial, sans-serif" }}>/ mes · sin IVA</div>
            </div>
          </div>
        </div>

        {/* Condiciones */}
        <div style={{ marginBottom: "48px" }}>
          <div style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.12em", color: "#1E9BF0", textTransform: "uppercase", marginBottom: "14px", fontFamily: "Arial, sans-serif" }}>
            Condiciones
          </div>
          {[
            "Propuesta válida 15 días desde la fecha de emisión.",
            "Contrato mínimo de 3 meses. Renovación automática mensual.",
            "Facturación mensual por anticipado.",
            "Precios sin IVA. Se añadirá el 21% de IVA correspondiente en factura.",
          ].map(t => (
            <div key={t} style={{ display: "flex", gap: "10px", marginBottom: "6px" }}>
              <span style={{ color: "#1E9BF0", flexShrink: 0, fontWeight: 700 }}>·</span>
              <span style={{ fontSize: "13px", color: "#475569", lineHeight: 1.6, fontFamily: "Arial, sans-serif" }}>{t}</span>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{
          borderTop: "2px solid #1E9BF0", paddingTop: "22px",
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <div style={{ fontFamily: "Arial, sans-serif" }}>
            <div style={{ fontSize: "13px", fontWeight: 700, color: "#1E9BF0", marginBottom: "3px" }}>RAXISLAB AGENCY</div>
            <div style={{ fontSize: "12px", color: "#94A3B8" }}>raxislab.com · hola@raxislab.com</div>
          </div>
          <div style={{ fontSize: "11px", color: "#CBD5E1", fontFamily: "Arial, sans-serif" }}>
            Generado el {fechaStr}
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body        { margin: 0 !important; padding: 0 !important; }
          #proposal   { padding-top: 32px !important; }
        }
        body { margin: 0; background: #E5E7EB; }
      `}</style>
    </>
  );
}

// ── Page export ───────────────────────────────────────────────────────────────

export default function PreviewPage() {
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "#E5E7EB", overflowY: "auto",
    }}>
      <Suspense fallback={
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>
          <p style={{ color: "#666" }}>Cargando propuesta...</p>
        </div>
      }>
        <Preview />
      </Suspense>
    </div>
  );
}
