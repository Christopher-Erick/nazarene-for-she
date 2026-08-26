import { ButtonLink } from "@/components/ui/ButtonLink";
import { PageIntro } from "@/components/ui/PageIntro";
import { partnershipContent } from "@/lib/data/about";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Partnership",
  description:
    "Churches, NGOs, donors and institutions can partner with Nazarene for She to build pathways to dignity, skills and independence in Kenya.",
  path: "/partnership",
});

export default function PartnershipPage() {
  return (
    <>
      <PageIntro kicker="Partnership" title="You are not simply funding a program.">
        <p>{partnershipContent.intro}</p>
      </PageIntro>
      <div className="mx-auto max-w-6xl px-5 pb-24 sm:px-8">
        <h2 className="font-display text-3xl">Who this page is for</h2>
        <ul className="mt-6 flex flex-wrap gap-3">
          {partnershipContent.audiences.map((audience) => (
            <li key={audience} className="border border-line px-4 py-2">
              {audience}
            </li>
          ))}
        </ul>
        <h2 className="mt-16 font-display text-3xl">Where partnership can land</h2>
        <div className="mt-8 grid gap-8 md:grid-cols-2">
          {partnershipContent.categories.map((category) => (
            <article key={category.name} className="border-t border-line pt-5">
              <h3 className="font-display text-2xl text-primary-dark">{category.name}</h3>
              <p className="mt-3 text-muted">{category.body}</p>
            </article>
          ))}
        </div>
        <div className="mt-16">
          <ButtonLink href="/contact?intent=partnership" variant="plum">
            Start a partnership conversation
          </ButtonLink>
        </div>
      </div>
    </>
  );
}
