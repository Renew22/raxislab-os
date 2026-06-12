import type { Metadata } from "next";
import "./globals.css";
import NavLinks from "./components/nav-links";
import { ThemeProvider } from "./components/theme-provider";
import ThemeToggle from "./components/theme-toggle";

export const metadata: Metadata = { title: "Raxislab OS" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" data-theme="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Space+Mono:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body style={{ display: "flex", height: "100vh", overflow: "hidden", margin: 0 }}>
        <ThemeProvider>
          <aside style={{
            width: "240px",
            flexShrink: 0,
            display: "flex",
            flexDirection: "column",
            background: "var(--surface)",
            borderRight: "1px solid var(--border)",
          }}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border)" }}>
              <span style={{ fontFamily: "'Space Mono', monospace", fontSize: "13px", fontWeight: 700, letterSpacing: "0.12em" }}>
                <span style={{ color: "var(--accent)" }}>R</span>
                <span style={{ color: "var(--text)" }}>AXISLAB OS</span>
              </span>
            </div>

            <div style={{ padding: "12px 20px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "center" }}>
              <ThemeToggle />
            </div>

            <nav style={{ flex: 1, padding: "12px 8px", overflowY: "auto" }}>
              <NavLinks />
            </nav>

            <div style={{ padding: "16px 20px", borderTop: "1px solid var(--border)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{
                  width: "32px", height: "32px", borderRadius: "50%",
                  background: "var(--accent-dim)", border: "1px solid var(--border-accent)",
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                  <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--accent)", fontFamily: "'Space Mono', monospace" }}>RB</span>
                </div>
                <div>
                  <div style={{ fontSize: "13px", fontWeight: 500, color: "var(--text)", lineHeight: 1.2 }}>Rene Benegas</div>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "1px" }}>Raxislab Agency</div>
                </div>
              </div>
            </div>
          </aside>
          <main style={{ flex: 1, overflowY: "auto" }}>{children}</main>
        </ThemeProvider>
      </body>
    </html>
  );
}
