"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

function scrollToHash() {
  const id = decodeURIComponent(window.location.hash.replace(/^#/, ""));
  if (!id) return;
  document.getElementById(id)?.scrollIntoView();
}

export function HashScroll() {
  const pathname = usePathname();

  useEffect(() => {
    const timer = window.setTimeout(scrollToHash, 50);
    window.addEventListener("hashchange", scrollToHash);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("hashchange", scrollToHash);
    };
  }, [pathname]);

  return null;
}
