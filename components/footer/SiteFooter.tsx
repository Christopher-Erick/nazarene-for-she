import Link from "next/link";
import { BrandMark } from "@/components/ui/BrandMark";
import { footerNav } from "@/lib/data/navigation";
import { site } from "@/lib/data/site";
import { isHttpsPublicUrl } from "@/lib/security";

export function SiteFooter() {
  const year = new Date().getFullYear();
  const social = Object.entries(site.social).filter(
    ([, href]) => typeof href === "string" && href.length > 0 && isHttpsPublicUrl(href),
  );

  return (
    <footer className="bg-plum text-ivory">
      <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
        <div className="flex flex-col gap-6 border-b border-white/10 pb-12 sm:flex-row sm:items-end sm:justify-between">
          <div className="brand-lockup">
            <BrandMark className="brand-mark" />
            <div>
              <p className="font-display text-2xl tracking-tight">{site.name}</p>
              <p className="mt-1 text-sm italic text-accent-soft">{site.tagline}</p>
            </div>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-ivory/65">
            A pad can meet an immediate need. Knowledge, mentorship, faith and skill can change a future.
          </p>
        </div>

        <div className="grid gap-10 py-12 sm:grid-cols-3">
          <FooterList title="Our story" items={footerNav.story} />
          <FooterList title="How we empower" items={footerNav.work} />
          <FooterList title="Walk with her" items={footerNav.involved} />
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-6 text-sm text-ivory/55 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p>
            © {year} {site.name}. Rooted in community. Built toward independence.
          </p>
          <div className="flex flex-wrap gap-4">
            {social.length > 0
              ? social.map(([name, href]) => (
                  <a
                    key={name}
                    href={href}
                    className="capitalize hover:text-accent-soft"
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    {name}
                  </a>
                ))
              : footerNav.legal.map((item) => (
                  <Link key={item.href} href={item.href} className="hover:text-accent-soft">
                    {item.label}
                  </Link>
                ))}
            {social.length > 0
              ? footerNav.legal.map((item) => (
                  <Link key={item.href} href={item.href} className="hover:text-accent-soft">
                    {item.label}
                  </Link>
                ))
              : null}
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterList({
  title,
  items,
}: {
  title: string;
  items: ReadonlyArray<{ href: string; label: string }>;
}) {
  return (
    <div>
      <p className="eyebrow text-accent">{title}</p>
      <ul className="mt-4 space-y-2">
        {items.map((item) => (
          <li key={item.href}>
            <Link href={item.href} className="text-ivory/75 hover:text-ivory">
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
