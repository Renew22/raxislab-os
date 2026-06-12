import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "./components/theme-provider";
import Sidebar from "./components/sidebar";

export const metadata: Metadata = {
  title: "Raxislab OS",
  icons: { icon: "/logo.png" },
};

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
          <Sidebar />
          <main style={{ flex: 1, overflowY: "auto" }}>{children}</main>
        </ThemeProvider>
      </body>
    </html>
  );
}
