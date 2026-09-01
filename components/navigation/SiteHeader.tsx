"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { MobileMenu } from "@/components/navigation/MobileMenu";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { BrandMark } from "@/components/ui/BrandMark";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { cn } from "@/lib/cn";
import { primaryNav, supportCta } from "@/lib/data/navigation";
import { site } from "@/lib/data/site";
import { DEFAULT_THEME, readTheme, type Theme } from "@/lib/theme";

function isPhotoHero(pathname: string) {
  if (pathname === "/") return true;
  if (pathname === "/shop") return true;
  if (/^\/programs\/[^/]+$/.test(pathname)) return true;
  if (/^\/shop\/[^/]+$/.test(pathname)) return true;
  if (/^\/stories\/[^/]+$/.test(pathname)) return true;
  if (/^\/events\/[^/]+$/.test(pathname)) return true;
  return false;
}

function isBandHero(pathname: string) {
  return pathname === "/donate" || pathname === "/get-involved";
}

export function SiteHeader() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState<Theme>(DEFAULT_THEME);
  const overHero = (isPhotoHero(pathname) || isBandHero(pathname)) && !scrolled && !open;
  const onDark = theme === "dark" && overHero;

  useEffect(() => {
    const sync = () => setTheme(readTheme());
    sync();
    document.addEventListener("nfs-theme", sync);
    return () => document.removeEventListener("nfs-theme", sync);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <header
        className="site-header"
        data-theme={theme}
        data-on-dark={onDark ? "true" : "false"}
        data-scrolled={scrolled || open ? "true" : "false"}
        data-menu-open={open ? "true" : "false"}
      >
        <div className="mx-auto flex h-full max-w-6xl items-center justify-between gap-3 overflow-visible px-4 py-2 sm:px-8">
          <Link href="/" className="brand-lockup min-w-0 flex-1 lg:flex-none" aria-label={`${site.name} home`}>
            <BrandMark className="brand-mark" />
            <span className="min-w-0 leading-none">
              <span className="brand-name">
                <span>Nazarene</span>
                <span>for She</span>
              </span>
              <span className="brand-tagline mt-1 hidden text-[0.7rem] italic lg:block">
                {site.shortTagline}
              </span>
            </span>
          </Link>

          <nav aria-label="Primary" className="hidden items-center gap-5 lg:flex">
            {primaryNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="nav-link"
                aria-current={pathname === item.href ? "page" : undefined}
              >
                {item.short}
              </Link>
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <ButtonLink href={supportCta.href} className="header-cta">
              {supportCta.label}
            </ButtonLink>
            <div className="flex items-center gap-1">
              <ThemeToggle />
              <button
                type="button"
                className="menu-toggle"
                aria-expanded={open}
                aria-controls="mobile-menu"
                onClick={() => setOpen((value) => !value)}
              >
                <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
                <span className="flex w-5 flex-col gap-1.5" aria-hidden="true">
                  <span className={cn("h-px w-full bg-current transition", open && "translate-y-[7px] rotate-45")} />
                  <span className={cn("h-px w-full bg-current transition", open && "opacity-0")} />
                  <span className={cn("h-px w-full bg-current transition", open && "-translate-y-[7px] -rotate-45")} />
                </span>
              </button>
            </div>
          </div>
        </div>
      </header>
      <MobileMenu open={open} pathname={pathname} onClose={() => setOpen(false)} />
    </>
  );
}
