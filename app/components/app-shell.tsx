"use client";

import { useState } from "react";
import { ThemeProvider } from "./theme-provider";
import Sidebar from "./sidebar";
import Topbar from "./topbar";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const close = () => setMobileOpen(false);

  return (
    <ThemeProvider>
      {mobileOpen && (
        <div
          onClick={close}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.55)",
            zIndex: 45,
          }}
        />
      )}
      <Sidebar mobileOpen={mobileOpen} onMobileClose={close} />
      <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>
        <Topbar onMenuClick={() => setMobileOpen(o => !o)} />
        <div style={{ flex: 1, overflowY: "auto" }}>{children}</div>
      </main>
    </ThemeProvider>
  );
}
