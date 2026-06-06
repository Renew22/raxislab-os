"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/clientes", label: "Clientes" },
  { href: "/trading", label: "Trading" },
  { href: "/leads", label: "Leads" },
  { href: "/proyectos", label: "Proyectos" },
  { href: "/automatizaciones", label: "Automatizaciones" },
  { href: "/stokers", label: "Stokers Market" },
];

export default function NavLinks() {
  const pathname = usePathname();

  return (
    <ul className="space-y-1">
      {links.map(({ href, label }) => {
        const active = pathname === href || pathname.startsWith(href + "/");
        return (
          <li key={href}>
            <Link
              href={href}
              className="block px-3 py-2 rounded-sm text-sm transition-colors"
              style={
                active
                  ? { background: "rgba(0,200,255,0.08)", color: "#00C8FF", fontWeight: "500" }
                  : { color: "#5A6470" }
              }
            >
              {label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
