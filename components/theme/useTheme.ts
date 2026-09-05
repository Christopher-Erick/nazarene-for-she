"use client";

import { useEffect, useState } from "react";
import { DEFAULT_THEME, readTheme, type Theme } from "@/lib/theme";

export function useTheme(): Theme {
  const [theme, setTheme] = useState<Theme>(DEFAULT_THEME);

  useEffect(() => {
    const sync = () => setTheme(readTheme());
    sync();
    document.addEventListener("nfs-theme", sync);
    return () => document.removeEventListener("nfs-theme", sync);
  }, []);

  return theme;
}
