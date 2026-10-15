"use client";

import { usePathname } from "next/navigation";

export function PublicChrome({
  header,
  footer,
  children,
}: {
  header: React.ReactNode;
  footer: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) {
    return children;
  }

  return (
    <>
      {header}
      <main id="main" className="flex-1 pt-[var(--header-height)]">
        {children}
      </main>
      {footer}
    </>
  );
}
