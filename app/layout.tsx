import type { Metadata } from "next";
import "./globals.css";
import NavLinks from "./components/nav-links";

export const metadata: Metadata = { title: "Raxislab OS" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Space+Mono:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body style={{ display: "flex", height: "100vh", overflow: "hidden", background: "#000000", color: "#FFFFFF", margin: 0 }}>
        <aside style={{
          width: "240px",
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          background: "#000000",
          borderRight: "1px solid rgba(0,200,255,0.08)",
        }}>
          <div style={{ padding: "20px 24px", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
            <span style={{ fontFamily: "'Space Mono', monospace", fontSize: "13px", fontWeight: 700, letterSpacing: "0.12em" }}>
              <span style={{ color: "#00C8FF" }}>R</span>
              <span style={{ color: "#FFFFFF" }}>AXISLAB OS</span>
            </span>
          </div>
          <nav style={{ flex: 1, padding: "12px 8px", overflowY: "auto" }}>
            <NavLinks />
          </nav>
          <div style={{ padding: "16px 20px", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{
                width: "32px", height: "32px", borderRadius: "50%",
                background: "rgba(0,200,255,0.08)", border: "1px solid rgba(0,200,255,0.2)",
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                <span style={{ fontSize: "11px", fontWeight: 700, color: "#00C8FF", fontFamily: "'Space Mono', monospace" }}>RB</span>
              </div>
              <div>
                <div style={{ fontSize: "13px", fontWeight: 500, color: "#FFFFFF", lineHeight: 1.2 }}>Rene Benegas</div>
                <div style={{ fontSize: "11px", color: "#5A6470", marginTop: "1px" }}>Raxislab Agency</div>
              </div>
            </div>
          </div>
        </aside>
        <main style={{ flex: 1, overflowY: "auto" }}>{children}</main>
      </body>
    </html>
  );
}
