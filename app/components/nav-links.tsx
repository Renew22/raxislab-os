"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/dashboard",        label: "Dashboard" },
  { href: "/clientes",         label: "Clientes" },
  { href: "/contenido",        label: "Contenido" },
  { href: "/trading",          label: "Trading" },
  { href: "/stokers",          label: "Stokers Market" },
  { href: "/raxis-investor",   label: "Raxis Investor" },
  { href: "/leads",            label: "Leads" },
  { href: "/proyectos",        label: "Proyectos" },
  { href: "/automatizaciones", label: "Automatizaciones" },
  { href: "/plan",             label: "Plan Personal" },
];

export default function NavLinks() {
  const pathname = usePathname();

  return (
    <ul style={{ listStyle: "none" }}>
      {links.map(({ href, label }) => {
        const active = pathname === href || pathname.startsWith(href + "/");
        return (
          <li key={href}>
            <Link
              href={href}
              style={{
                display: "block",
                padding: "8px 12px",
                paddingLeft: active ? "10px" : "12px",
                marginBottom: "2px",
                borderRadius: "4px",
                fontSize: "13px",
                fontWeight: active ? 500 : 400,
                color: active ? "var(--text)" : "var(--text-muted)",
                borderLeft: active ? "2px solid var(--accent)" : "2px solid transparent",
                background: active ? "var(--accent-dim)" : "transparent",
                textDecoration: "none",
                transition: "color 0.15s, background 0.15s",
              }}
            >
              {label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
