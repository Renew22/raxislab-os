"use client";

import { Sun, Moon } from "lucide-react";
import { useTheme } from "./theme-provider";

export default function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const isLight = theme === "light";

  return (
    <button
      onClick={toggle}
      aria-label="Cambiar tema"
      style={{
        position: "relative",
        width: "64px",
        height: "32px",
        borderRadius: "999px",
        background: "var(--card)",
        border: "1px solid var(--border)",
        cursor: "pointer",
        outline: "none",
        padding: 0,
        flexShrink: 0,
      }}
    >
      {/* Sun icon — left side (dimmed, visible in dark mode) */}
      <span style={{
        position: "absolute",
        left: "9px",
        top: "50%",
        transform: "translateY(-50%)",
        display: "flex",
        color: "var(--text-muted)",
        pointerEvents: "none",
        zIndex: 0,
      }}>
        <Sun size={12} strokeWidth={2} />
      </span>

      {/* Moon icon — right side (dimmed, visible in light mode) */}
      <span style={{
        position: "absolute",
        right: "9px",
        top: "50%",
        transform: "translateY(-50%)",
        display: "flex",
        color: "var(--text-muted)",
        pointerEvents: "none",
        zIndex: 0,
      }}>
        <Moon size={12} strokeWidth={2} />
      </span>

      {/* Sliding circle */}
      <span style={{
        position: "absolute",
        top: "3px",
        left: isLight ? "3px" : "35px",
        width: "26px",
        height: "26px",
        borderRadius: "50%",
        background: "var(--accent)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "left 0.25s",
        zIndex: 1,
      }}>
        {isLight
          ? <Sun size={13} color="white" strokeWidth={2.5} />
          : <Moon size={13} color="black" strokeWidth={2.5} />
        }
      </span>
    </button>
  );
}
