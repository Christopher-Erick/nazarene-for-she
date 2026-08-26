"use client";

import Link from "next/link";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { primaryNav, supportCta } from "@/lib/data/navigation";

export function MobileMenu({
  open,
  pathname,
  onClose,
}: {
  open: boolean;
  pathname: string;
  onClose: () => void;
}) {
  return (
    <div id="mobile-menu" className={`mobile-menu ${open ? "is-open" : ""}`} hidden={!open}>
      <button type="button" className="mobile-menu-scrim" aria-label="Close menu" onClick={onClose} />
      <div className="mobile-menu-sheet" role="dialog" aria-modal="true" aria-label="Site menu">
        <div className="mobile-menu-sheet-head">
          <p className="eyebrow text-accent">Menu</p>
        </div>

        <nav aria-label="Mobile">
          <ul className="mobile-menu-list">
            {primaryNav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onClose}
                  className="mobile-menu-link"
                  aria-current={pathname === item.href ? "page" : undefined}
                >
                  <span>{item.short}</span>
                  <span className="mobile-menu-arrow" aria-hidden="true">
                    →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="mobile-menu-footer">
          <ThemeToggle className="self-end" />
          <span onClick={onClose} className="contents">
            <ButtonLink href={supportCta.href} className="mobile-menu-cta">
              {supportCta.label}
            </ButtonLink>
          </span>
          <div className="mobile-menu-extras">
            <Link href="/contact" onClick={onClose}>
              Contact
            </Link>
            <Link href="/get-involved#pray" onClick={onClose}>
              Pray
            </Link>
            <Link href="/partnership" onClick={onClose}>
              Partner
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
