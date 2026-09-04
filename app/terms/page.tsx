import { PageIntro } from "@/components/ui/PageIntro";
import { publishedSitePage } from "@/lib/cms/public-content";
import { sanitizeHtml } from "@/lib/cms/sanitize";
import { site } from "@/lib/data/site";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Terms",
  description: `Terms for using the ${site.name} website.`,
  path: "/terms",
});

export default async function TermsPage() {
  const page = await publishedSitePage("terms");

  return (
    <>
      <PageIntro kicker={page.kicker} title={page.title}>
        <p>{page.excerpt}</p>
      </PageIntro>
      <div
        className="prose-nfs mx-auto max-w-3xl px-5 pb-24 sm:px-8"
        dangerouslySetInnerHTML={{ __html: sanitizeHtml(page.content) }}
      />
    </>
  );
}
