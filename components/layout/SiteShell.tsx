import { PublicChrome } from "@/components/layout/PublicChrome";
import { SiteFooter } from "@/components/footer/SiteFooter";
import { SiteHeader } from "@/components/navigation/SiteHeader";
import { JsonLd } from "@/components/seo/JsonLd";
import { HashScroll } from "@/components/ui/HashScroll";
import { SkipLink } from "@/components/ui/SkipLink";

/**
 * Server component: the footer and JSON-LD render on the server and ship no JS.
 * PublicChrome (client) only decides whether to show them, since admin pages
 * share the root layout but bring their own shell.
 */
export function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <PublicChrome
      header={
        <>
          <JsonLd />
          <SkipLink />
          <HashScroll />
          <SiteHeader />
        </>
      }
      footer={<SiteFooter />}
    >
      {children}
    </PublicChrome>
  );
}
