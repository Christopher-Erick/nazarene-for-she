"use client";

import { usePathname } from "next/navigation";
import { SiteFooter } from "@/components/footer/SiteFooter";
import { SiteHeader } from "@/components/navigation/SiteHeader";
import { JsonLd } from "@/components/seo/JsonLd";
import { HashScroll } from "@/components/ui/HashScroll";
import { SkipLink } from "@/components/ui/SkipLink";

export function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) {
    return children;
  }

  return (
    <>
      <JsonLd />
      <SkipLink />
      <HashScroll />
      <SiteHeader />
      <main id="main" className="flex-1 pt-[var(--header-height)]">
        {children}
      </main>
      <SiteFooter />
    </>
  );
}
