"use client";

import { useState, useRef, useCallback } from "react";

export default function AnalisisPage() {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<string>("image/png");
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback((file: File) => {
    setMediaType(file.type || "image/png");
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setImagePreview(dataUrl);
      // Strip the data:image/...;base64, prefix
      setImageBase64(dataUrl.split(",")[1]);
      setAnalysis(null);
      setError(null);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const item = Array.from(e.clipboardData.items).find((i) => i.type.startsWith("image/"));
    if (item) {
      const file = item.getAsFile();
      if (file) processFile(file);
    }
  }, [processFile]);

  const analyze = async () => {
    if (!imageBase64) return;
    setLoading(true);
    setError(null);
    setAnalysis(null);
    try {
      const res = await fetch("/api/chart-copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64, mediaType }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setAnalysis(data.analysis);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      onPaste={handlePaste}
      style={{ padding: "24px", maxWidth: 900, margin: "0 auto", outline: "none" }}
      tabIndex={0}
    >
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>
          👁️ Copiloto Visual de Gráficos
        </h1>
        <p style={{ color: "#888", marginTop: 6, fontSize: 14 }}>
          Sube o pega una captura de pantalla. Análisis SMC/ICT + RaxisLab SuperSignal.
        </p>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => fileRef.current?.click()}
        style={{
          border: "2px dashed #333",
          borderRadius: 12,
          padding: "32px 24px",
          textAlign: "center",
          cursor: "pointer",
          background: imagePreview ? "transparent" : "#111",
          marginBottom: 16,
          transition: "border-color 0.2s",
        }}
      >
        {imagePreview ? (
          <img
            src={imagePreview}
            alt="gráfico"
            style={{ maxWidth: "100%", maxHeight: 400, borderRadius: 8, objectFit: "contain" }}
          />
        ) : (
          <>
            <div style={{ fontSize: 36, marginBottom: 8 }}>📊</div>
            <div style={{ color: "#aaa", fontSize: 14 }}>
              Arrastra una imagen, haz clic para seleccionar, o{" "}
              <strong style={{ color: "#fff" }}>Ctrl+V para pegar</strong>
            </div>
          </>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={handleFile}
        />
      </div>

      {imageBase64 && (
        <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
          <button
            onClick={analyze}
            disabled={loading}
            style={{
              padding: "12px 28px",
              background: loading ? "#333" : "#2563eb",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              cursor: loading ? "not-allowed" : "pointer",
              fontWeight: 600,
              fontSize: 15,
              flex: 1,
            }}
          >
            {loading ? "Analizando..." : "⚡ Analizar gráfico"}
          </button>
          <button
            onClick={() => {
              setImagePreview(null);
              setImageBase64(null);
              setAnalysis(null);
              setError(null);
            }}
            style={{
              padding: "12px 20px",
              background: "#1a1a1a",
              color: "#888",
              border: "1px solid #333",
              borderRadius: 8,
              cursor: "pointer",
            }}
          >
            Limpiar
          </button>
        </div>
      )}

      {error && (
        <div style={{ background: "#2d1111", border: "1px solid #7f1d1d", borderRadius: 8, padding: 16, marginBottom: 16, color: "#fca5a5" }}>
          ⚠️ {error}
        </div>
      )}

      {loading && (
        <div style={{ background: "#111", border: "1px solid #333", borderRadius: 12, padding: 32, textAlign: "center", color: "#888" }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🔍</div>
          <div>Analizando estructura SMC, Order Blocks, FVGs...</div>
          <div style={{ fontSize: 12, marginTop: 6, color: "#555" }}>~5-10 segundos</div>
        </div>
      )}

      {analysis && (
        <div
          style={{
            background: "#0a0a0a",
            border: "1px solid #222",
            borderRadius: 12,
            padding: 24,
            fontFamily: "monospace",
            fontSize: 14,
            lineHeight: 1.7,
            whiteSpace: "pre-wrap",
            color: "#e5e5e5",
          }}
        >
          {analysis}
        </div>
      )}
    </div>
  );
}
