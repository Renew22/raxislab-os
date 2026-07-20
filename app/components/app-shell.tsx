"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { ThemeProvider } from "./theme-provider";
import Sidebar from "./Sidebar";
import Topbar from "./topbar";

const NO_SHELL_ROUTES = ["/comercial"];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const noShell = NO_SHELL_ROUTES.some(r => pathname.startsWith(r));

  const close = () => setMobileOpen(false);

  if (noShell) {
    return <ThemeProvider><div style={{ flex: 1, overflowY: "auto" }}>{children}</div></ThemeProvider>;
  }

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
