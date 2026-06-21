"use client";

import { useState } from "react";

// ── Tabla de precios ──────────────────────────────────────────────────────────

const PRECIOS: Record<string, [number, number, number, number, number, number]> = {
  //                 [pq_min, pq_max, me_min, me_max, pr_min, pr_max]
  Restaurante:    [300,  800,  800,  2000,  2000,  5000],
  Peluquería:     [200,  600,  600,  1500,  1500,  4000],
  Taller:         [300,  800,  800,  2000,  2000,  5000],
  "Logística B2B":[500, 1500, 1500,  5000,  5000, 20000],
  Otro:           [300,  900,  900,  2500,  2500,  8000],
};

const SECTORES  = Object.keys(PRECIOS);
const TAMANOS   = ["Pequeño", "Medio", "Premium"] as const;
type Tamano     = typeof TAMANOS[number];

const SERVICIOS = [
  "Web",
  "SEO",
  "Meta Ads",
  "Google Ads",
  "Diseño / Branding",
  "Planificación de contenido",
  "Grabación y edición de vídeo",
  "Diseño de imágenes / posts",
] as const;

// ── Helpers ───────────────────────────────────────────────────────────────────

function calcRango(sector: string, tamano: Tamano, selected: string[]): [number, number] {
  const row = PRECIOS[sector] ?? PRECIOS["Otro"];
  const idx: Record<Tamano, number> = { Pequeño: 0, Medio: 2, Premium: 4 };
  const base = idx[tamano];
  const rMin = row[base];
  const rMax = row[base + 1];
  const k    = selected.length / SERVICIOS.length;
  if (k === 0) return [0, 0];
  return [Math.round(rMin * k), Math.round(rMax * k)];
}

function fmtEur(n: number): string {
  return n.toLocaleString("es-ES") + "€";
}

// ── Estilos ───────────────────────────────────────────────────────────────────

const CARD: React.CSSProperties  = { background: "#111111", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "8px" };
const LABEL: React.CSSProperties = { fontSize: "11px", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#5A6470" };
const INPUT: React.CSSProperties = { width: "100%", padding: "9px 12px", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.08)", background: "#161616", color: "#FFFFFF", fontSize: "13px", outline: "none", boxSizing: "border-box" };

// ── Componente ────────────────────────────────────────────────────────────────

export default function PropuestasPage() {
  const [sector,   setSector]   = useState<string>("Restaurante");
  const [tamano,   setTamano]   = useState<Tamano>("Pequeño");
  const [selected, setSelected] = useState<string[]>([]);
  const [cliente,  setCliente]  = useState("");
  const [ajuste,   setAjuste]   = useState<string>("");

  function toggleServicio(s: string) {
    setSelected(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
    setAjuste(""); // reset manual override when selection changes
  }

  function selAll()   { setSelected([...SERVICIOS]); setAjuste(""); }
  function clearAll() { setSelected([]); setAjuste(""); }

  const [rMin, rMax] = calcRango(sector, tamano, selected);
  const midpoint     = Math.round((rMin + rMax) / 2);
  const displayPrice = ajuste !== "" ? ajuste : (selected.length > 0 ? String(midpoint) : "");

  return (
    <div style={{ padding: "32px 40px", maxWidth: "1100px" }}>

      {/* Header */}
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: 600, color: "#FFFFFF", margin: 0 }}>Generador de Propuestas</h1>
        <p style={{ fontSize: "13px", color: "#5A6470", marginTop: "6px" }}>Selecciona servicios, sector y tamaño para calcular el precio sugerido.</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "24px", alignItems: "start" }}>

        {/* ── Columna izquierda: servicios ──────────────────────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

          {/* Nombre del cliente */}
          <div style={{ ...CARD, padding: "20px" }}>
            <p style={{ ...LABEL, marginBottom: "8px" }}>Nombre del cliente</p>
            <input
              value={cliente}
              onChange={e => setCliente(e.target.value)}
              placeholder="Ej: Beauty Studio Valencia"
              style={INPUT}
            />
          </div>

          {/* Servicios */}
          <div style={{ ...CARD, padding: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
              <p style={LABEL}>Servicios — {selected.length}/{SERVICIOS.length} seleccionados</p>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  onClick={selAll}
                  style={{ fontSize: "11px", padding: "3px 10px", borderRadius: "4px", border: "1px solid rgba(0,200,255,0.2)", background: "rgba(0,200,255,0.06)", color: "#00C8FF", cursor: "pointer" }}
                >
                  Todo
                </button>
                <button
                  onClick={clearAll}
                  style={{ fontSize: "11px", padding: "3px 10px", borderRadius: "4px", border: "1px solid rgba(255,255,255,0.06)", background: "transparent", color: "#5A6470", cursor: "pointer" }}
                >
                  Limpiar
                </button>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
              {SERVICIOS.map(s => {
                const on = selected.includes(s);
                return (
                  <div
                    key={s}
                    onClick={() => toggleServicio(s)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "12px 14px",
                      borderRadius: "6px",
                      border: `1px solid ${on ? "rgba(0,200,255,0.25)" : "rgba(255,255,255,0.06)"}`,
                      background: on ? "rgba(0,200,255,0.06)" : "#161616",
                      cursor: "pointer",
                      transition: "all 0.12s",
                    }}
                  >
                    <div style={{
                      width: "16px", height: "16px", borderRadius: "4px", flexShrink: 0,
                      border: `1.5px solid ${on ? "#00C8FF" : "#2A3040"}`,
                      background: on ? "#00C8FF" : "transparent",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      {on && <span style={{ color: "#000", fontSize: "10px", fontWeight: 800, lineHeight: 1 }}>✓</span>}
                    </div>
                    <span style={{ fontSize: "13px", color: on ? "#FFFFFF" : "#9AA3AD", fontWeight: on ? 500 : 400 }}>
                      {s}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Columna derecha: configuración + precio ────────────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

          {/* Sector */}
          <div style={{ ...CARD, padding: "20px" }}>
            <p style={{ ...LABEL, marginBottom: "10px" }}>Sector</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {SECTORES.map(s => (
                <button
                  key={s}
                  onClick={() => { setSector(s); setAjuste(""); }}
                  style={{
                    padding: "9px 14px",
                    borderRadius: "6px",
                    border: `1px solid ${sector === s ? "rgba(0,200,255,0.3)" : "rgba(255,255,255,0.06)"}`,
                    background: sector === s ? "rgba(0,200,255,0.08)" : "transparent",
                    color: sector === s ? "#00C8FF" : "#9AA3AD",
                    fontSize: "13px",
                    fontWeight: sector === s ? 600 : 400,
                    textAlign: "left",
                    cursor: "pointer",
                    transition: "all 0.12s",
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Tamaño */}
          <div style={{ ...CARD, padding: "20px" }}>
            <p style={{ ...LABEL, marginBottom: "10px" }}>Tamaño del cliente</p>
            <div style={{ display: "flex", gap: "8px" }}>
              {TAMANOS.map(t => (
                <button
                  key={t}
                  onClick={() => { setTamano(t); setAjuste(""); }}
                  style={{
                    flex: 1,
                    padding: "9px 6px",
                    borderRadius: "6px",
                    border: `1px solid ${tamano === t ? "rgba(0,200,255,0.3)" : "rgba(255,255,255,0.06)"}`,
                    background: tamano === t ? "rgba(0,200,255,0.08)" : "transparent",
                    color: tamano === t ? "#00C8FF" : "#9AA3AD",
                    fontSize: "12px",
                    fontWeight: tamano === t ? 600 : 400,
                    cursor: "pointer",
                    transition: "all 0.12s",
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
            {/* Referencia de rango base */}
            {selected.length > 0 && (
              <div style={{ marginTop: "12px", padding: "10px 12px", borderRadius: "6px", background: "#161616", border: "1px solid rgba(255,255,255,0.04)" }}>
                <p style={{ fontSize: "11px", color: "#2A3040", marginBottom: "3px" }}>Rango sugerido ({selected.length}/{SERVICIOS.length} servicios)</p>
                <p style={{ fontSize: "16px", fontWeight: 700, color: "#FFFFFF", fontFamily: "'Space Mono', monospace" }}>
                  {fmtEur(rMin)} – {fmtEur(rMax)}
                </p>
              </div>
            )}
          </div>

          {/* Precio final */}
          <div style={{ ...CARD, padding: "20px", border: "1px solid rgba(0,200,255,0.12)" }}>
            <p style={{ ...LABEL, marginBottom: "10px", color: "#00C8FF" }}>Precio final (€)</p>
            <input
              type="number"
              value={displayPrice}
              onChange={e => setAjuste(e.target.value)}
              placeholder={selected.length > 0 ? String(midpoint) : "Selecciona servicios..."}
              style={{ ...INPUT, fontSize: "22px", fontWeight: 700, fontFamily: "'Space Mono', monospace", color: "#FFFFFF", padding: "12px 14px", letterSpacing: "0.02em" }}
            />
            {ajuste !== "" && (
              <button
                onClick={() => setAjuste("")}
                style={{ marginTop: "8px", fontSize: "11px", color: "#5A6470", background: "none", border: "none", cursor: "pointer", padding: 0 }}
              >
                ↩ Restaurar sugerido
              </button>
            )}

            {/* Resumen */}
            {selected.length > 0 && (
              <div style={{ marginTop: "14px", display: "flex", flexDirection: "column", gap: "6px" }}>
                {[
                  { label: "Cliente",   value: cliente || "—" },
                  { label: "Sector",    value: sector },
                  { label: "Tamaño",    value: tamano },
                  { label: "Servicios", value: `${selected.length} seleccionados` },
                ].map(({ label, value }) => (
                  <div key={label} style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                    <span style={{ color: "#5A6470" }}>{label}</span>
                    <span style={{ color: "#9AA3AD", fontWeight: 500 }}>{value}</span>
                  </div>
                ))}
              </div>
            )}

            {/* CTA Fase 2 */}
            <div style={{ marginTop: "16px" }}>
              <button
                disabled
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: "6px",
                  background: "rgba(0,200,255,0.06)",
                  border: "1px solid rgba(0,200,255,0.12)",
                  color: "#2A3040",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "not-allowed",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                }}
              >
                <span>📄</span> Generar propuesta en PDF
                <span style={{ fontSize: "10px", fontWeight: 400, color: "#2A3040", marginLeft: "4px" }}>próximamente</span>
              </button>
            </div>
          </div>

          {/* Tabla referencia */}
          <div style={{ ...CARD, padding: "16px" }}>
            <p style={{ ...LABEL, marginBottom: "10px" }}>Tabla de referencia — {sector}</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "6px" }}>
              {TAMANOS.map(t => {
                const row = PRECIOS[sector];
                if (!row) return null;
                const idx: Record<Tamano, number> = { Pequeño: 0, Medio: 2, Premium: 4 };
                const b = idx[t];
                const isActive = tamano === t;
                return (
                  <div
                    key={t}
                    style={{
                      padding: "10px 8px",
                      borderRadius: "6px",
                      textAlign: "center",
                      background: isActive ? "rgba(0,200,255,0.06)" : "#161616",
                      border: `1px solid ${isActive ? "rgba(0,200,255,0.2)" : "rgba(255,255,255,0.04)"}`,
                    }}
                  >
                    <p style={{ fontSize: "10px", color: "#5A6470", marginBottom: "5px", fontWeight: 600 }}>{t.toUpperCase()}</p>
                    <p style={{ fontSize: "11px", fontFamily: "'Space Mono', monospace", color: isActive ? "#00C8FF" : "#5A6470", fontWeight: isActive ? 700 : 400 }}>
                      {row[b].toLocaleString()}–{row[b + 1].toLocaleString()}€
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
