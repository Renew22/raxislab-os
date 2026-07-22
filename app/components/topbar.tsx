"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Search, Bell, Wallet, Menu } from "lucide-react";
import { useState } from "react";
import ThemeToggle from "./theme-toggle";

const SECTIONS: Record<string, string> = {
  "/dashboard":        "Dashboard",
  "/clientes":         "Clientes",
  "/campanas":         "Campañas",
  "/google":           "Google",
  "/contenido":        "Contenido",
  "/propuestas":       "Propuestas",
  "/trading":          "Trading",
  "/stokers":          "Stokers",
  "/raxis-investor":   "Raxis Investor",
  "/leads":            "Leads",
  "/proyectos":        "Proyectos",
  "/automatizaciones": "Automatizaciones",
  "/plan":             "Plan",
  "/finanzas":         "Finanzas",
  "/mercado":          "Mercado",
};

interface TopbarProps {
  onMenuClick?: () => void;
}

export default function Topbar({ onMenuClick }: TopbarProps) {
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
    flexShrink: 0,
  });

  return (
    <header style={{
      height: "56px",
      flexShrink: 0,
      display: "flex",
      alignItems: "center",
      padding: "0 16px",
      gap: "10px",
      background: "var(--surface)",
      borderBottom: "1px solid var(--border)",
      position: "sticky",
      top: 0,
      zIndex: 10,
    }}>

      {/* ── Hamburger — mobile only ── */}
      <button
        className="topbar-hamburger"
        onClick={onMenuClick}
        aria-label="Abrir menú"
        style={{
          width: "34px",
          height: "34px",
          borderRadius: "8px",
          border: "1px solid var(--border)",
          background: "transparent",
          color: "var(--text-muted)",
          display: "none",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          padding: 0,
          flexShrink: 0,
        }}
      >
        <Menu size={16} strokeWidth={1.8} />
      </button>

      {/* ── Logo + Breadcrumb ── */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
        <Image src="/raxislab-icon.svg" alt="Raxislab" width={24} height={24} style={{ flexShrink: 0 }} />
        <span className="topbar-brand" style={{ fontSize: "11px", color: "var(--text-muted)", fontFamily: "'Space Grotesk', sans-serif" }}>
          Raxislab
        </span>
        <span className="topbar-brand" style={{ fontSize: "11px", color: "var(--text-muted)" }}>/</span>
        <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)", fontFamily: "'Space Grotesk', sans-serif" }}>
          {section}
        </span>
      </div>

      {/* ── Search ── */}
      <div className="topbar-search" style={{ flex: 1, display: "flex", justifyContent: "center" }}>
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

      {/* ── Spacer on mobile ── */}
      <div style={{ flex: 1 }} className="topbar-spacer" />

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
        </button>

        {/* Wallet → /finanzas — hidden on mobile */}
        <Link href="/finanzas" style={{ textDecoration: "none" }} className="topbar-wallet">
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
          border: "1px solid var(--border-accent)",
          flexShrink: 0,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}>
          <Image src="/raxislab-icon.svg" alt="Raxislab" width={26} height={26} style={{ display: "block" }} />
        </div>
      </div>
    </header>
  );
}
