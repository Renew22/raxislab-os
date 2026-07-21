"use client";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";

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
    <main style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", padding: "16px", fontFamily: "'Space Grotesk', sans-serif", color: "var(--text)" }}>
      <div style={{ width: "100%", maxWidth: "360px" }}>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div style={{ margin: "0 auto 14px", width: "56px", height: "56px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Image src="/raxislab-icon.svg" alt="Raxislab" width={56} height={56} style={{ display: "block" }} />
          </div>
          <h1 style={{ fontSize: "20px", fontWeight: 700, margin: 0 }}>RaxisLab</h1>
          <p style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "4px" }}>Accede a tu panel</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "12px", padding: "24px" }}>
          <div style={{ marginBottom: "16px" }}>
            <label style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: "6px", letterSpacing: "0.06em", textTransform: "uppercase" }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="negocio@ejemplo.com"
              required
              style={{ width: "100%", padding: "11px 14px", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text)", fontSize: "14px", outline: "none", boxSizing: "border-box" }}
            />
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: "6px", letterSpacing: "0.06em", textTransform: "uppercase" }}>Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              style={{ width: "100%", padding: "11px 14px", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text)", fontSize: "14px", outline: "none", boxSizing: "border-box" }}
            />
          </div>

          {error && (
            <div style={{ background: "rgba(229,57,75,0.1)", border: "1px solid rgba(229,57,75,0.3)", borderRadius: "8px", padding: "10px 14px", marginBottom: "16px", fontSize: "13px", color: "var(--red)" }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{ width: "100%", padding: "12px", background: "var(--accent)", color: "#fff", border: "none", borderRadius: "8px", fontSize: "14px", fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1, fontFamily: "inherit" }}
          >
            {loading ? "Accediendo..." : "Entrar"}
          </button>
        </form>

        <p style={{ textAlign: "center", marginTop: "20px", fontSize: "11px", color: "var(--text-muted)" }}>
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
