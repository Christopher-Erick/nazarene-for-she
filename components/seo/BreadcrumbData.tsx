import { breadcrumbJsonLd } from "@/lib/seo";
import { escapeJsonForScript } from "@/lib/security";

/** Breadcrumb trail for search results (Home › Programmes › Mentorship). Renders no visible UI. */
export function BreadcrumbData({ trail }: { trail: Array<[name: string, path: string]> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: escapeJsonForScript(breadcrumbJsonLd([["Home", "/"], ...trail])) }}
    />
  );
}
