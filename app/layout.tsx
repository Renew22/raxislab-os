import type { Metadata } from "next";
import "./globals.css";
import NavLinks from "./components/nav-links";

export const metadata: Metadata = {
  title: "Raxislab OS",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="h-full">
      <body className="h-full flex" style={{ backgroundColor: "#000000", color: "#FFFFFF" }}>
        <aside
          className="w-60 flex-shrink-0 flex flex-col"
          style={{ background: "#080808", borderRight: "1px solid rgba(0,200,255,0.10)" }}
        >
          <div className="px-6 py-5" style={{ borderBottom: "1px solid rgba(0,200,255,0.10)" }}>
            <span
              className="text-xs font-bold tracking-widest uppercase"
              style={{ color: "#00C8FF", fontFamily: "'Space Mono', monospace" }}
            >
              Raxislab OS
            </span>
          </div>
          <nav className="flex-1 px-3 py-4">
            <NavLinks />
          </nav>
          <div className="px-6 py-4" style={{ borderTop: "1px solid rgba(0,200,255,0.10)" }}>
            <span className="text-sm" style={{ color: "#5A6470" }}>Rene Benegas</span>
          </div>
        </aside>
        <main className="flex-1 overflow-auto">{children}</main>
      </body>
    </html>
  );
}
