"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  ChevronLeft, ChevronRight,
  LayoutDashboard, Users, Megaphone, Globe, Package, Sparkles,
  TrendingUp, Target, FolderKanban, Workflow, Calendar, Wallet, FileText, Zap, Eye, Crosshair, ShieldCheck,
} from "lucide-react";

const NAV = [
  { href: "/dashboard",        label: "Dashboard",        Icon: LayoutDashboard },
  { href: "/clientes",         label: "Clientes",         Icon: Users           },
  { href: "/campanas",         label: "Campañas",         Icon: Megaphone       },
  { href: "/google",           label: "Google",           Icon: Globe           },
  { href: "/last-mile",        label: "Last Mile",        Icon: Package         },
  { href: "/propuestas",       label: "Propuestas",       Icon: FileText        },
  { href: "/contenido",        label: "Contenido",        Icon: Sparkles        },
  { href: "/captacion",        label: "Captación",        Icon: Crosshair       },
  { href: "/raxis-investor",       label: "Raxis Investor",   Icon: TrendingUp      },
  { href: "/raxis-investor/analisis", label: "Copiloto Visual",  Icon: Eye             },
  { href: "/score-engine",     label: "Score Engine",     Icon: Zap             },
  { href: "/proyectos",        label: "Proyectos",        Icon: FolderKanban    },
  { href: "/finanzas",         label: "Finanzas",         Icon: Wallet          },
  { href: "/fondeo",           label: "Fondeo",           Icon: ShieldCheck     },
  { href: "/automatizaciones", label: "Automatizaciones", Icon: Workflow        },
];

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export default function Sidebar({ mobileOpen = false, onMobileClose = () => {} }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [hoveredHref, setHoveredHref] = useState<string | null>(null);
  const [tooltipY, setTooltipY] = useState(0);
  const asideRef = useRef<HTMLElement>(null);
  const pathname = usePathname();
  const closeMobileRef = useRef(onMobileClose);
  closeMobileRef.current = onMobileClose;

  // Close mobile drawer on route change
  useEffect(() => {
    closeMobileRef.current();
  }, [pathname]);

  function handleNavEnter(href: string, e: React.MouseEvent<HTMLDivElement>) {
    setHoveredHref(href);
    if (collapsed && asideRef.current) {
      const asideRect = asideRef.current.getBoundingClientRect();
      const itemRect  = e.currentTarget.getBoundingClientRect();
      setTooltipY(itemRect.top - asideRect.top + itemRect.height / 2);
    }
  }

  const tooltipLabel = NAV.find(n => n.href === hoveredHref)?.label;

  return (
    <aside
      ref={asideRef}
      className="sidebar-root"
      data-mobile-open={mobileOpen ? "true" : "false"}
      style={{
        width: collapsed ? "64px" : "220px",
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        background: "var(--surface)",
        borderRight: "1px solid var(--border)",
        transition: "width 0.22s ease",
        position: "relative",
        zIndex: 1,
      }}
    >
      {/* ── Logo header ── */}
      <div style={{
        height: "64px",
        padding: "0 16px",
        borderBottom: "1px solid var(--border)",
        display: "flex",
        alignItems: "center",
        gap: "10px",
        overflow: "hidden",
        flexShrink: 0,
      }}>
        <Image
          src="/logo.png"
          alt="Raxislab"
          width={32}
          height={32}
          style={{ borderRadius: "6px", flexShrink: 0 }}
        />
        <span style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: "14px",
          fontWeight: 700,
          color: "var(--text)",
          letterSpacing: "0.04em",
          whiteSpace: "nowrap",
          opacity: collapsed ? 0 : 1,
          maxWidth: collapsed ? "0px" : "160px",
          overflow: "hidden",
          transition: "opacity 0.15s ease, max-width 0.22s ease",
        }}>
          RAXISLAB OS
        </span>

        {/* Toggle button — desktop only */}
        <button
          onClick={() => setCollapsed(c => !c)}
          aria-label={collapsed ? "Expandir sidebar" : "Colapsar sidebar"}
          className="sidebar-toggle-btn"
          style={{
            position: "absolute",
            right: "-12px",
            top: "20px",
            width: "24px",
            height: "24px",
            borderRadius: "50%",
            border: "1px solid var(--border)",
            background: "var(--card)",
            color: "var(--text-muted)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            zIndex: 20,
            padding: 0,
          }}
        >
          {collapsed
            ? <ChevronRight size={11} strokeWidth={2.5} />
            : <ChevronLeft  size={11} strokeWidth={2.5} />
          }
        </button>
      </div>

      {/* ── Nav ── */}
      <nav style={{ flex: 1, padding: "8px 0", overflowY: "auto", overflowX: "hidden" }}>
        {NAV.map(({ href, label, Icon }) => {
          const active    = pathname === href || (href !== "/" && pathname.startsWith(href));
          const isHovered = hoveredHref === href;

          return (
            <div
              key={href}
              style={{ margin: "1px 8px" }}
              onMouseEnter={e => handleNavEnter(href, e)}
              onMouseLeave={() => setHoveredHref(null)}
            >
              <Link href={href} style={{ textDecoration: "none", display: "block" }}>
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: collapsed ? "10px 0" : "9px 12px",
                  justifyContent: collapsed ? "center" : "flex-start",
                  borderRadius: "6px",
                  borderLeft: active ? "2px solid var(--accent)" : "2px solid transparent",
                  background: active
                    ? "var(--accent-dim)"
                    : isHovered
                    ? "var(--card-hover)"
                    : "transparent",
                  color: active ? "var(--accent)" : isHovered ? "var(--text)" : "var(--text-muted)",
                  transition: "background 0.12s, color 0.12s",
                }}>
                  <Icon size={18} strokeWidth={active ? 2.2 : 1.8} style={{ flexShrink: 0 }} />
                  <span style={{
                    fontSize: "13px",
                    fontWeight: active ? 600 : 400,
                    fontFamily: "'Space Grotesk', sans-serif",
                    whiteSpace: "nowrap",
                    opacity: collapsed ? 0 : 1,
                    maxWidth: collapsed ? "0px" : "160px",
                    overflow: "hidden",
                    transition: "opacity 0.15s ease, max-width 0.22s ease",
                  }}>
                    {label}
                  </span>
                </div>
              </Link>
            </div>
          );
        })}
      </nav>

      {/* ── Tooltip — rendered outside nav to avoid overflow clipping ── */}
      {collapsed && hoveredHref && tooltipLabel && (
        <div style={{
          position: "absolute",
          left: "72px",
          top: tooltipY,
          transform: "translateY(-50%)",
          background: "var(--card)",
          border: "1px solid var(--border)",
          borderRadius: "6px",
          padding: "5px 10px",
          fontSize: "12px",
          fontWeight: 500,
          color: "var(--text)",
          whiteSpace: "nowrap",
          zIndex: 100,
          pointerEvents: "none",
          boxShadow: "0 4px 16px rgba(0,0,0,0.25)",
        }}>
          {tooltipLabel}
        </div>
      )}

      {/* ── User footer ── */}
      <div style={{
        padding: collapsed ? "14px 0" : "14px 16px",
        borderTop: "1px solid var(--border)",
        display: "flex",
        alignItems: "center",
        gap: "10px",
        justifyContent: collapsed ? "center" : "flex-start",
        overflow: "hidden",
        flexShrink: 0,
      }}>
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
        }}>
          <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--accent)", fontFamily: "'Space Mono', monospace" }}>RB</span>
        </div>
        <div style={{
          opacity: collapsed ? 0 : 1,
          maxWidth: collapsed ? "0px" : "200px",
          overflow: "hidden",
          whiteSpace: "nowrap",
          transition: "opacity 0.15s ease, max-width 0.22s ease",
        }}>
          <div style={{ fontSize: "13px", fontWeight: 500, color: "var(--text)", lineHeight: 1.2 }}>Rene Benegas</div>
          <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "1px" }}>Raxislab Agency</div>
        </div>
      </div>
    </aside>
  );
}
