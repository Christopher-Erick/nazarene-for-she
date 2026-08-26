"use client";

import { useEffect, useState } from "react";
import { applyTheme, DEFAULT_THEME, readTheme, type Theme } from "@/lib/theme";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const [theme, setTheme] = useState<Theme>(DEFAULT_THEME);

  useEffect(() => {
    const sync = () => setTheme(readTheme());
    sync();
    document.addEventListener("nfs-theme", sync);
    return () => document.removeEventListener("nfs-theme", sync);
  }, []);

  const next: Theme = theme === "light" ? "dark" : "light";

  return (
    <button
      type="button"
      className={`theme-toggle ${className}`.trim()}
      aria-label={next === "dark" ? "Switch to dark mode" : "Switch to light mode"}
      aria-pressed={theme === "dark"}
      onClick={() => applyTheme(next)}
    >
      {theme === "light" ? <MoonIcon /> : <SunIcon />}
    </button>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" className="theme-toggle-icon" aria-hidden="true">
      <path
        fill="currentColor"
        d="M17.75 15.5A7.25 7.25 0 0 1 9.1 6.2 7.25 7.25 0 1 0 17.75 15.5Z"
      />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" className="theme-toggle-icon" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 7.25A4.75 4.75 0 1 1 7.25 12 4.75 4.75 0 0 1 12 7.25Zm0-4.5a.75.75 0 0 1 .75.75v1.4a.75.75 0 0 1-1.5 0V3.5A.75.75 0 0 1 12 2.75Zm0 16.1a.75.75 0 0 1 .75.75v1.4a.75.75 0 0 1-1.5 0v-1.4a.75.75 0 0 1 .75-.75ZM21.5 12a.75.75 0 0 1-.75.75h-1.4a.75.75 0 0 1 0-1.5h1.4A.75.75 0 0 1 21.5 12ZM4.65 12a.75.75 0 0 1-.75.75H2.5a.75.75 0 0 1 0-1.5h1.4A.75.75 0 0 1 4.65 12Zm13.4-6.66a.75.75 0 0 1 0 1.06l-1 1a.75.75 0 1 1-1.06-1.06l1-1a.75.75 0 0 1 1.06 0ZM6.66 16.6a.75.75 0 0 1 0 1.06l-1 1A.75.75 0 1 1 4.6 17.6l1-1a.75.75 0 0 1 1.06 0Zm11.94 1.06a.75.75 0 0 1-1.06 0l-1-1a.75.75 0 1 1 1.06-1.06l1 1a.75.75 0 0 1 0 1.06ZM6.66 6.34a.75.75 0 0 1 0 1.06l-1 1A.75.75 0 0 1 4.6 7.34l1-1a.75.75 0 0 1 1.06 0Z"
      />
    </svg>
  );
}
