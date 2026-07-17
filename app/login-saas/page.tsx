"use client";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const C = {
  bg: "#0A0A0F", card: "#13131A", border: "#1E1E2E",
  accent: "#C8F542", text: "#E8E8F0", mid: "#9898B0", muted: "#5A5A70",
};

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") ?? "";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) { setError(data.error || "Error al iniciar sesión"); return; }

    if (data.role === "ADMIN") {
      router.push(next || "/admin-saas");
    } else {
      router.push(next || `/cliente/${data.clientSlug}`);
    }
  }

  return (
    <main style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px", fontFamily: "'Space Grotesk', sans-serif" }}>
      <div style={{ width: "100%", maxWidth: "360px" }}>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div style={{ width: "48px", height: "48px", background: C.accent, borderRadius: "10px", margin: "0 auto 14px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: "22px", fontWeight: 900, color: "#000" }}>R</span>
          </div>
          <h1 style={{ fontSize: "20px", fontWeight: 700, color: C.text, margin: 0 }}>RaxisLab</h1>
          <p style={{ fontSize: "13px", color: C.muted, marginTop: "4px" }}>Accede a tu panel</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "12px", padding: "24px" }}>
          <div style={{ marginBottom: "16px" }}>
            <label style={{ fontSize: "11px", fontWeight: 600, color: C.muted, display: "block", marginBottom: "6px", letterSpacing: "0.06em", textTransform: "uppercase" }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="negocio@ejemplo.com"
              required
              style={{ width: "100%", padding: "11px 14px", background: C.bg, border: `1px solid ${C.border}`, borderRadius: "8px", color: C.text, fontSize: "14px", outline: "none", boxSizing: "border-box" }}
            />
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label style={{ fontSize: "11px", fontWeight: 600, color: C.muted, display: "block", marginBottom: "6px", letterSpacing: "0.06em", textTransform: "uppercase" }}>Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              style={{ width: "100%", padding: "11px 14px", background: C.bg, border: `1px solid ${C.border}`, borderRadius: "8px", color: C.text, fontSize: "14px", outline: "none", boxSizing: "border-box" }}
            />
          </div>

          {error && (
            <div style={{ background: "rgba(255,50,50,0.1)", border: "1px solid rgba(255,50,50,0.3)", borderRadius: "8px", padding: "10px 14px", marginBottom: "16px", fontSize: "13px", color: "#FF6666" }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{ width: "100%", padding: "12px", background: C.accent, color: "#000", border: "none", borderRadius: "8px", fontSize: "14px", fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1, fontFamily: "inherit" }}
          >
            {loading ? "Accediendo..." : "Entrar"}
          </button>
        </form>

        <p style={{ textAlign: "center", marginTop: "20px", fontSize: "11px", color: C.muted }}>
          ¿Problemas? Contacta con RaxisLab
        </p>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
