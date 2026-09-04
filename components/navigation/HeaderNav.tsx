"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { primaryNav } from "@/lib/data/navigation";

export function HeaderNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Primary" className="hidden items-center gap-4 lg:flex xl:gap-5">
      {primaryNav.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="nav-link shrink-0"
          aria-current={pathname === item.href ? "page" : undefined}
        >
          {item.short}
        </Link>
      ))}
    </nav>
  );
}
