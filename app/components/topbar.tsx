"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Bell, Wallet } from "lucide-react";
import { useState } from "react";
import ThemeToggle from "./theme-toggle";

const SECTIONS: Record<string, string> = {
  "/dashboard":        "Dashboard",
  "/clientes":         "Clientes",
  "/contenido":        "Contenido",
  "/trading":          "Trading",
  "/stokers":          "Stokers",
  "/raxis-investor":   "Raxis Investor",
  "/leads":            "Leads",
  "/proyectos":        "Proyectos",
  "/automatizaciones": "Automatizaciones",
  "/plan":             "Plan",
  "/finanzas":         "Finanzas",
};

const ALERT_COUNT = 3;

export default function Topbar() {
  const pathname = usePathname();
  const [search, setSearch] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [bellHovered, setBellHovered] = useState(false);
  const [walletHovered, setWalletHovered] = useState(false);

  const section =
    Object.entries(SECTIONS).find(
      ([path]) => pathname === path || (path !== "/" && pathname.startsWith(path))
    )?.[1] ?? "Raxislab OS";

  const iconBtn = (hovered: boolean): React.CSSProperties => ({
    width: "34px",
    height: "34px",
    borderRadius: "8px",
    border: `1px solid ${hovered ? "var(--border-accent)" : "var(--border)"}`,
    background: hovered ? "var(--accent-dim)" : "transparent",
    color: hovered ? "var(--accent)" : "var(--text-muted)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    transition: "border 0.15s, background 0.15s, color 0.15s",
    padding: 0,
  });

  return (
    <header style={{
      height: "56px",
      flexShrink: 0,
      display: "flex",
      alignItems: "center",
      padding: "0 24px",
      gap: "16px",
      background: "var(--surface)",
      borderBottom: "1px solid var(--border)",
      position: "sticky",
      top: 0,
      zIndex: 10,
    }}>

      {/* ── Breadcrumb ── */}
      <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
        <span style={{ fontSize: "11px", color: "var(--text-muted)", fontFamily: "'Space Grotesk', sans-serif" }}>
          Raxislab
        </span>
        <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>/</span>
        <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)", fontFamily: "'Space Grotesk', sans-serif" }}>
          {section}
        </span>
      </div>

      {/* ── Search ── */}
      <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
        <div style={{ position: "relative", width: "100%", maxWidth: "380px" }}>
          <Search
            size={14}
            style={{
              position: "absolute",
              left: "10px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--text-muted)",
              pointerEvents: "none",
            }}
          />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            placeholder="Buscar..."
            style={{
              width: "100%",
              padding: "7px 12px 7px 32px",
              borderRadius: "6px",
              border: `1px solid ${searchFocused ? "var(--border-accent)" : "var(--border)"}`,
              background: "var(--card)",
              color: "var(--text)",
              fontSize: "13px",
              outline: "none",
              fontFamily: "'Space Grotesk', sans-serif",
              boxSizing: "border-box",
              transition: "border 0.15s",
            }}
          />
        </div>
      </div>

      {/* ── Right actions ── */}
      <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>

        {/* Bell */}
        <button
          style={{ ...iconBtn(bellHovered), position: "relative" }}
          title="Notificaciones"
          onMouseEnter={() => setBellHovered(true)}
          onMouseLeave={() => setBellHovered(false)}
        >
          <Bell size={16} strokeWidth={1.8} />
          {ALERT_COUNT > 0 && (
            <span style={{
              position: "absolute",
              top: "6px",
              right: "6px",
              width: "7px",
              height: "7px",
              borderRadius: "50%",
              background: "var(--red)",
              border: "1.5px solid var(--surface)",
            }} />
          )}
        </button>

        {/* Wallet → /finanzas */}
        <Link href="/finanzas" style={{ textDecoration: "none" }}>
          <button
            style={iconBtn(walletHovered)}
            title="Finanzas"
            onMouseEnter={() => setWalletHovered(true)}
            onMouseLeave={() => setWalletHovered(false)}
          >
            <Wallet size={16} strokeWidth={1.8} />
          </button>
        </Link>

        {/* ThemeToggle */}
        <ThemeToggle />

        {/* Avatar */}
        <div style={{
          width: "32px",
          height: "32px",
          borderRadius: "50%",
          background: "var(--accent-dim)",
          border: "1px solid var(--border-accent)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          cursor: "pointer",
        }}>
          <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--accent)", fontFamily: "'Space Mono', monospace" }}>
            RB
          </span>
        </div>
      </div>
    </header>
  );
}
