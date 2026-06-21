"use client";

import { useState } from "react";

// ── Tabla de precios ──────────────────────────────────────────────────────────

const PRECIOS: Record<string, [number, number, number, number, number, number]> = {
  Restaurante:     [300,  800,  800,  2000,  2000,  5000],
  Peluquería:      [200,  600,  600,  1500,  1500,  4000],
  Taller:          [300,  800,  800,  2000,  2000,  5000],
  "Logística B2B": [500, 1500, 1500,  5000,  5000, 20000],
  Otro:            [300,  900,  900,  2500,  2500,  8000],
};

const SECTORES = Object.keys(PRECIOS);
const TAMANOS  = ["Pequeño", "Medio", "Premium"] as const;
type Tamano    = typeof TAMANOS[number];

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
  const b   = idx[tamano];
  const k   = selected.length / SERVICIOS.length;
  if (k === 0) return [0, 0];
  return [Math.round(row[b] * k), Math.round(row[b + 1] * k)];
}

function fmtEur(n: number) { return n.toLocaleString("es-ES") + "€"; }

// ── Componente ────────────────────────────────────────────────────────────────

export default function PropuestasPage() {
  const [sector,   setSector]   = useState("Restaurante");
  const [tamano,   setTamano]   = useState<Tamano>("Pequeño");
  const [selected, setSelected] = useState<string[]>([]);
  const [cliente,  setCliente]  = useState("");
  const [ajuste,   setAjuste]   = useState("");

  function toggle(s: string) {
    setSelected(p => p.includes(s) ? p.filter(x => x !== s) : [...p, s]);
    setAjuste("");
  }

  const [rMin, rMax] = calcRango(sector, tamano, selected);
  const midpoint     = Math.round((rMin + rMax) / 2);
  const displayPrice = ajuste !== "" ? ajuste : (selected.length > 0 ? String(midpoint) : "");

  // PDF link data
  const pdfData = selected.length > 0 ? btoa(JSON.stringify({
    cliente, sector, tamano,
    selected: [...selected],
    precio: Number(displayPrice) || midpoint,
    pago: "50% a la firma · 50% inicio del segundo mes",
  })) : "";

  return (
    <div style={{ padding: "32px 40px", maxWidth: "1100px" }}>

      {/* Header */}
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: 600, color: "var(--text)" }}>
          Generador de Propuestas
        </h1>
        <p style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "6px" }}>
          Selecciona servicios, sector y tamaño para calcular el precio sugerido.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: "24px", alignItems: "start" }}>

        {/* ── Izquierda ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

          {/* Cliente */}
          <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "8px", padding: "20px" }}>
            <p style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "8px" }}>
              Nombre del cliente
            </p>
            <input
              value={cliente}
              onChange={e => setCliente(e.target.value)}
              placeholder="Ej: Beauty Studio Valencia"
              style={{
                width: "100%", padding: "9px 12px", borderRadius: "6px",
                border: "1px solid var(--border)",
                background: "var(--card-hover)",
                color: "var(--text)",
                fontSize: "13px", outline: "none", boxSizing: "border-box",
              }}
            />
          </div>

          {/* Servicios */}
          <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "8px", padding: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
              <p style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)" }}>
                Servicios — {selected.length}/{SERVICIOS.length}
              </p>
              <div style={{ display: "flex", gap: "6px" }}>
                <button onClick={() => { setSelected([...SERVICIOS]); setAjuste(""); }}
                  style={{ fontSize: "11px", padding: "3px 10px", borderRadius: "4px", border: "1px solid var(--border-accent)", background: "var(--accent-dim)", color: "var(--accent)", cursor: "pointer" }}>
                  Todo
                </button>
                <button onClick={() => { setSelected([]); setAjuste(""); }}
                  style={{ fontSize: "11px", padding: "3px 10px", borderRadius: "4px", border: "1px solid var(--border)", background: "transparent", color: "var(--text-muted)", cursor: "pointer" }}>
                  Limpiar
                </button>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
              {SERVICIOS.map(s => {
                const on = selected.includes(s);
                return (
                  <div key={s} onClick={() => toggle(s)} style={{
                    display: "flex", alignItems: "center", gap: "10px",
                    padding: "12px 14px", borderRadius: "6px", cursor: "pointer",
                    border: `1px solid ${on ? "var(--border-accent)" : "var(--border)"}`,
                    background: on ? "var(--accent-dim)" : "var(--card-hover)",
                    transition: "all 0.12s",
                  }}>
                    <div style={{
                      width: "16px", height: "16px", borderRadius: "4px", flexShrink: 0,
                      border: `1.5px solid ${on ? "var(--accent)" : "var(--text-muted)"}`,
                      background: on ? "var(--accent)" : "transparent",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      {on && <span style={{ color: "#000", fontSize: "10px", fontWeight: 800, lineHeight: 1 }}>✓</span>}
                    </div>
                    <span style={{ fontSize: "13px", color: on ? "var(--text)" : "var(--text-mid)", fontWeight: on ? 500 : 400 }}>
                      {s}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Derecha ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>

          {/* Sector */}
          <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "8px", padding: "18px" }}>
            <p style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "10px" }}>
              Sector
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
              {SECTORES.map(s => (
                <button key={s} onClick={() => { setSector(s); setAjuste(""); }} style={{
                  padding: "8px 12px", borderRadius: "6px", textAlign: "left", cursor: "pointer",
                  border: `1px solid ${sector === s ? "var(--border-accent)" : "var(--border)"}`,
                  background: sector === s ? "var(--accent-dim)" : "transparent",
                  color: sector === s ? "var(--accent)" : "var(--text-mid)",
                  fontSize: "13px", fontWeight: sector === s ? 600 : 400,
                  transition: "all 0.12s",
                }}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Tamaño */}
          <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "8px", padding: "18px" }}>
            <p style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "10px" }}>
              Tamaño
            </p>
            <div style={{ display: "flex", gap: "6px" }}>
              {TAMANOS.map(t => (
                <button key={t} onClick={() => { setTamano(t); setAjuste(""); }} style={{
                  flex: 1, padding: "8px 4px", borderRadius: "6px", cursor: "pointer",
                  border: `1px solid ${tamano === t ? "var(--border-accent)" : "var(--border)"}`,
                  background: tamano === t ? "var(--accent-dim)" : "transparent",
                  color: tamano === t ? "var(--accent)" : "var(--text-mid)",
                  fontSize: "12px", fontWeight: tamano === t ? 600 : 400,
                  transition: "all 0.12s",
                }}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Precio */}
          <div style={{ background: "var(--card)", border: "1px solid var(--border-accent)", borderRadius: "8px", padding: "18px" }}>
            <p style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--accent)", marginBottom: "10px" }}>
              Precio final (€)
            </p>

            {selected.length > 0 && (
              <div style={{ marginBottom: "10px", padding: "8px 10px", borderRadius: "6px", background: "var(--surface)", border: "1px solid var(--border)" }}>
                <p style={{ fontSize: "10px", color: "var(--text-muted)", marginBottom: "2px" }}>
                  Rango sugerido ({selected.length}/{SERVICIOS.length} servicios)
                </p>
                <p style={{ fontSize: "15px", fontWeight: 700, color: "var(--text)", fontFamily: "var(--font-mono)" }}>
                  {fmtEur(rMin)} – {fmtEur(rMax)}
                </p>
              </div>
            )}

            <input
              type="number"
              value={displayPrice}
              onChange={e => setAjuste(e.target.value)}
              placeholder={selected.length > 0 ? String(midpoint) : "Selecciona servicios..."}
              style={{
                width: "100%", padding: "12px 14px", borderRadius: "6px",
                border: "1px solid var(--border-accent)",
                background: "var(--card-hover)",
                color: "var(--text)",
                fontSize: "22px", fontWeight: 700,
                fontFamily: "var(--font-mono)",
                outline: "none", boxSizing: "border-box",
              }}
            />

            {ajuste !== "" && (
              <button onClick={() => setAjuste("")}
                style={{ marginTop: "6px", fontSize: "11px", color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                ↩ Restaurar sugerido
              </button>
            )}

            {selected.length > 0 && (
              <div style={{ marginTop: "14px", display: "flex", flexDirection: "column", gap: "5px" }}>
                {[
                  ["Cliente",   cliente || "—"],
                  ["Sector",    sector],
                  ["Tamaño",    tamano],
                  ["Servicios", `${selected.length} seleccionados`],
                ].map(([l, v]) => (
                  <div key={l} style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                    <span style={{ color: "var(--text-muted)" }}>{l}</span>
                    <span style={{ color: "var(--text-mid)", fontWeight: 500 }}>{v}</span>
                  </div>
                ))}
              </div>
            )}

            <div style={{ marginTop: "14px" }}>
              {pdfData ? (
                <a
                  href={`/propuestas/preview?data=${encodeURIComponent(pdfData)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                    width: "100%", padding: "11px",
                    borderRadius: "6px", textDecoration: "none",
                    background: "var(--accent)", color: "#000",
                    fontSize: "13px", fontWeight: 600,
                  }}
                >
                  📄 Generar propuesta en PDF
                </a>
              ) : (
                <button disabled style={{
                  width: "100%", padding: "11px", borderRadius: "6px",
                  background: "var(--accent-dim)", border: "1px solid var(--border-accent)",
                  color: "var(--text-muted)", fontSize: "13px", fontWeight: 600, cursor: "not-allowed",
                }}>
                  📄 Generar propuesta en PDF
                </button>
              )}
            </div>
          </div>

          {/* Tabla referencia sector */}
          <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "8px", padding: "16px" }}>
            <p style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "10px" }}>
              Referencia — {sector}
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "6px" }}>
              {TAMANOS.map(t => {
                const row = PRECIOS[sector];
                if (!row) return null;
                const idx: Record<Tamano, number> = { Pequeño: 0, Medio: 2, Premium: 4 };
                const b = idx[t];
                const active = tamano === t;
                return (
                  <div key={t} style={{
                    padding: "10px 6px", borderRadius: "6px", textAlign: "center",
                    background: active ? "var(--accent-dim)" : "var(--card-hover)",
                    border: `1px solid ${active ? "var(--border-accent)" : "var(--border)"}`,
                  }}>
                    <p style={{ fontSize: "10px", color: "var(--text-muted)", marginBottom: "4px", fontWeight: 600 }}>{t.toUpperCase()}</p>
                    <p style={{ fontSize: "11px", fontFamily: "var(--font-mono)", color: active ? "var(--accent)" : "var(--text-muted)", fontWeight: active ? 700 : 400 }}>
                      {row[b].toLocaleString()}–{row[b+1].toLocaleString()}€
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
