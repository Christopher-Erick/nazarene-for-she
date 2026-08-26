import { PageIntro } from "@/components/ui/PageIntro";
import { site } from "@/lib/data/site";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Terms",
  description: `Terms for using the ${site.name} website.`,
  path: "/terms",
});

export default function TermsPage() {
  return (
    <>
      <PageIntro kicker="Terms" title="Use this site to understand the work — and to walk with it honestly.">
        <p>These terms cover the public website and its forms.</p>
      </PageIntro>
      <div className="prose-nfs mx-auto max-w-3xl px-5 pb-24 sm:px-8">
        <h2 className="font-display text-3xl">Content</h2>
        <p>
          Draft mission language, unpublished payment details and placeholder stories are
          marked as such. Do not treat placeholders as official organisational commitments.
        </p>
        <h2 className="mt-10 font-display text-3xl">Giving</h2>
        <p>
          Donations should be made only through official details published by the
          organisation. If a field still reads as a placeholder, wait for confirmation before
          sending funds.
        </p>
        <h2 className="mt-10 font-display text-3xl">Stories</h2>
        <p>
          Photographs used as atmosphere are not portraits of named beneficiaries. Published
          personal stories will appear only with consent.
        </p>
      </div>
    </>
  );
}
