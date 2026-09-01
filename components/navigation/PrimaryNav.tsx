import Link from "next/link";
import type { HeaderNavItem } from "@/lib/data/navigation";

export function PrimaryNav({
  items,
  pathname,
}: {
  items: HeaderNavItem[];
  pathname: string;
}) {
  return (
    <nav
      aria-label="Primary"
      className="primary-nav hidden shrink-0 items-center gap-x-3 lg:flex xl:gap-x-3.5"
    >
      {items.map((item) => (
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
  );
}
