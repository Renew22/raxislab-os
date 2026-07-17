"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Client {
  id: string; name: string; slug: string; sector: string;
  plan: string; status: string; mrr: number; city?: string;
  website?: string;
  _count?: { users: number };
}

const C = {
  bg: "#0A0A0F", card: "#13131A", border: "#1E1E2E",
  accent: "#C8F542", green: "#00C864", red: "#FF3232", amber: "#FFAA00",
  text: "#E8E8F0", mid: "#9898B0", muted: "#5A5A70",
};

const SECTOR_EMOJI: Record<string, string> = {
  PELUQUERIA: "✂️", RESTAURANTE: "🍽️", TALLER: "🔧", LOGISTICA: "🚛",
  CLUB_DEPORTIVO: "⚽", TIENDA: "🛍️", CLINICA: "🏥", INMOBILIARIA: "🏠",
  ECOMMERCE: "🛒", TECNOLOGIA: "💻", HOSTELERIA: "🏨", BELLEZA: "💅",
  EDUCACION: "🎓", CONSTRUCCION: "🏗️", TRANSPORTE: "🚚", OTROS: "🏢",
};

const STATUS_COLOR: Record<string, string> = {
  TRIAL: C.amber, ACTIVE: C.green, PAUSED: C.mid, CANCELLED: C.red,
};

export default function AdminSaasPage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [totalMrr, setTotalMrr] = useState(0);

  useEffect(() => {
    fetch("/api/auth/me").then(r => {
      if (!r.ok) router.push("/login-saas");
    });
    loadClients();
  }, [router]);

  async function loadClients() {
    const r = await fetch("/api/saas/admin/clients");
    if (r.ok) {
      const data = await r.json();
      setClients(data);
      setTotalMrr(data.reduce((sum: number, c: Client) => sum + (c.mrr ?? 0), 0));
    }
    setLoading(false);
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login-saas");
  }

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "'Space Grotesk', sans-serif", color: C.text }}>

      {/* Header */}
      <header style={{ background: C.card, borderBottom: `1px solid ${C.border}`, padding: "0 32px", height: "60px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ width: "36px", height: "36px", background: C.accent, borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, color: "#000" }}>R</div>
          <div>
            <p style={{ fontSize: "15px", fontWeight: 700, margin: 0 }}>RaxisLab Admin</p>
            <p style={{ fontSize: "11px", color: C.muted, margin: 0 }}>Panel de control</p>
          </div>
        </div>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <Link href="/" style={{ fontSize: "12px", color: C.mid, textDecoration: "none" }}>← OS</Link>
          <button
            onClick={() => setShowAdd(true)}
            style={{ padding: "8px 16px", background: C.accent, color: "#000", border: "none", borderRadius: "8px", fontWeight: 700, fontSize: "13px", cursor: "pointer", fontFamily: "inherit" }}
          >
            + Nuevo cliente
          </button>
          <button onClick={logout} style={{ fontSize: "12px", color: C.muted, background: "none", border: "none", cursor: "pointer" }}>Salir</button>
        </div>
      </header>

      <main style={{ padding: "32px", maxWidth: "1200px", margin: "0 auto" }}>

        {/* KPIs globales */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "32px" }}>
          {[
            { label: "Clientes activos", value: clients.filter(c => c.status === "ACTIVE").length, color: C.green },
            { label: "En prueba", value: clients.filter(c => c.status === "TRIAL").length, color: C.amber },
            { label: "Total clientes", value: clients.length, color: C.accent },
            { label: "MRR", value: `${totalMrr}€`, color: C.accent },
          ].map(s => (
            <div key={s.label} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "12px", padding: "20px" }}>
              <p style={{ fontSize: "11px", color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "8px" }}>{s.label}</p>
              <p style={{ fontSize: "30px", fontWeight: 800, color: s.color, fontFamily: "'Space Mono', monospace", margin: 0 }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Lista clientes */}
        <div>
          <p style={{ fontSize: "12px", color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "16px" }}>Clientes</p>
          {loading ? (
            <div style={{ textAlign: "center", padding: "60px", color: C.muted }}>Cargando...</div>
          ) : clients.length === 0 ? (
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "12px", padding: "48px", textAlign: "center" }}>
              <p style={{ color: C.mid, marginBottom: "16px" }}>Sin clientes aún</p>
              <button onClick={() => setShowAdd(true)} style={{ padding: "10px 24px", background: C.accent, color: "#000", border: "none", borderRadius: "8px", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Crear primer cliente</button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {clients.map(c => (
                <div key={c.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "12px", padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                    <span style={{ fontSize: "24px" }}>{SECTOR_EMOJI[c.sector] ?? "🏢"}</span>
                    <div>
                      <p style={{ fontSize: "14px", fontWeight: 600, margin: 0 }}>{c.name}</p>
                      <p style={{ fontSize: "12px", color: C.muted, margin: "2px 0 0" }}>{c.city ?? "—"} · {c.sector.replace(/_/g, " ")}</p>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
                    <div style={{ textAlign: "right" }}>
                      <p style={{ fontSize: "13px", fontWeight: 700, color: C.accent, margin: 0 }}>{c.mrr > 0 ? `${c.mrr}€/mes` : "—"}</p>
                      <p style={{ fontSize: "11px", color: C.muted, margin: "2px 0 0" }}>{c.plan}</p>
                    </div>
                    <span style={{ fontSize: "11px", fontWeight: 700, color: STATUS_COLOR[c.status] ?? C.mid, background: (STATUS_COLOR[c.status] ?? C.mid) + "18", padding: "4px 10px", borderRadius: "6px" }}>
                      {c.status}
                    </span>
                    <Link
                      href={`/cliente/${c.slug}`}
                      style={{ padding: "7px 14px", background: "transparent", color: C.accent, border: `1px solid ${C.accent}44`, borderRadius: "7px", fontSize: "12px", fontWeight: 600, textDecoration: "none" }}
                    >
                      Ver panel →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Modal nuevo cliente */}
      {showAdd && <AddClientModal onClose={() => setShowAdd(false)} onAdded={loadClients} />}
    </div>
  );
}

function AddClientModal({ onClose, onAdded }: { onClose: () => void; onAdded: () => void }) {
  const [form, setForm] = useState({
    name: "", slug: "", email: "", password: "", sector: "OTROS",
    plan: "BASICO", mrr: "", website: "", city: "",
    metaAccountId: "", googleAdsId: "", ga4Id: "", siteUrl: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const sectors = [
    "PELUQUERIA","RESTAURANTE","TALLER","LOGISTICA","CLUB_DEPORTIVO",
    "TIENDA","CLINICA","INMOBILIARIA","ECOMMERCE","TECNOLOGIA",
    "HOSTELERIA","BELLEZA","EDUCACION","CONSTRUCCION","TRANSPORTE","OTROS",
  ];

  function autoSlug(name: string) {
    return name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);

    const r = await fetch("/api/saas/admin/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await r.json();
    setSaving(false);

    if (!r.ok) { setError(data.error ?? "Error al crear cliente"); return; }
    onAdded();
    onClose();
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999, padding: "16px" }}>
      <div style={{ background: "#13131A", border: "1px solid #1E1E2E", borderRadius: "16px", padding: "32px", width: "100%", maxWidth: "560px", maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <h2 style={{ fontSize: "18px", fontWeight: 700, margin: 0, color: "#E8E8F0" }}>Nuevo cliente</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#5A5A70", fontSize: "20px", cursor: "pointer" }}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
            <Field label="Nombre negocio" value={form.name} onChange={v => setForm(p => ({ ...p, name: v, slug: autoSlug(v) }))} required />
            <Field label="Slug URL" value={form.slug} onChange={v => setForm(p => ({ ...p, slug: v }))} required placeholder="identity-peluqueros" />
            <div style={{ gridColumn: "1/-1" }}>
              <label style={labelStyle}>Sector</label>
              <select value={form.sector} onChange={e => setForm(p => ({ ...p, sector: e.target.value }))} style={inputStyle}>
                {sectors.map(s => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
              </select>
            </div>
            <Field label="Email acceso cliente" type="email" value={form.email} onChange={v => setForm(p => ({ ...p, email: v }))} required />
            <Field label="Contraseña" type="password" value={form.password} onChange={v => setForm(p => ({ ...p, password: v }))} required />
            <Field label="Web" value={form.website} onChange={v => setForm(p => ({ ...p, website: v }))} placeholder="https://..." />
            <Field label="Ciudad" value={form.city} onChange={v => setForm(p => ({ ...p, city: v }))} />
            <div>
              <label style={labelStyle}>Plan</label>
              <select value={form.plan} onChange={e => setForm(p => ({ ...p, plan: e.target.value }))} style={inputStyle}>
                <option value="BASICO">BÁSICO — 99€</option>
                <option value="PRO">PRO — 199€</option>
                <option value="AGENCIA">AGENCIA — 399€</option>
              </select>
            </div>
            <Field label="MRR (€/mes)" type="number" value={form.mrr} onChange={v => setForm(p => ({ ...p, mrr: v }))} placeholder="199" />

            <p style={{ gridColumn: "1/-1", fontSize: "11px", color: "#5A5A70", textTransform: "uppercase", letterSpacing: "0.08em", margin: "8px 0 0" }}>Integraciones (opcional)</p>
            <Field label="Meta Account ID" value={form.metaAccountId} onChange={v => setForm(p => ({ ...p, metaAccountId: v }))} placeholder="act_386268..." />
            <Field label="Google Ads ID" value={form.googleAdsId} onChange={v => setForm(p => ({ ...p, googleAdsId: v }))} placeholder="739-542-7320" />
            <Field label="GA4 Property ID" value={form.ga4Id} onChange={v => setForm(p => ({ ...p, ga4Id: v }))} placeholder="262734277" />
            <Field label="Search Console URL" value={form.siteUrl} onChange={v => setForm(p => ({ ...p, siteUrl: v }))} placeholder="https://dominio.com" />
          </div>

          {error && <p style={{ color: "#FF6666", fontSize: "13px", marginTop: "16px" }}>{error}</p>}

          <button type="submit" disabled={saving}
            style={{ width: "100%", marginTop: "24px", padding: "12px", background: "#C8F542", color: "#000", border: "none", borderRadius: "8px", fontWeight: 700, fontSize: "14px", cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1, fontFamily: "inherit" }}>
            {saving ? "Creando..." : "Crear cliente"}
          </button>
        </form>
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = { fontSize: "11px", fontWeight: 600, color: "#5A5A70", display: "block", marginBottom: "5px", textTransform: "uppercase", letterSpacing: "0.06em" };
const inputStyle: React.CSSProperties = { width: "100%", padding: "10px 12px", background: "#0A0A0F", border: "1px solid #1E1E2E", borderRadius: "7px", color: "#E8E8F0", fontSize: "13px", outline: "none", boxSizing: "border-box", fontFamily: "inherit" };

function Field({ label, value, onChange, type = "text", required = false, placeholder = "" }: { label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean; placeholder?: string }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} required={required} placeholder={placeholder}
        style={inputStyle} />
    </div>
  );
}
