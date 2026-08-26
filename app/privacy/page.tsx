import { PageIntro } from "@/components/ui/PageIntro";
import { site } from "@/lib/data/site";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Privacy",
  description: `How ${site.name} treats information shared through this website.`,
  path: "/privacy",
});

export default function PrivacyPage() {
  return (
    <>
      <PageIntro kicker="Privacy" title="We collect only what we need to walk with you.">
        <p>
          This policy covers the public website. It does not invent practices the organisation
          has not confirmed.
        </p>
      </PageIntro>
      <div className="prose-nfs mx-auto max-w-3xl px-5 pb-24 sm:px-8">
        <h2 className="font-display text-3xl">What we ask for</h2>
        <p>
          Contact and donation-inquiry forms may collect your name, email, optional phone
          number, organisation, and a message. We use that information to respond to your
          inquiry.
        </p>
        <h2 className="mt-10 font-display text-3xl">What we do not do</h2>
        <p>
          We do not sell personal data. We do not publish beneficiary identities without
          consent. We do not collect more personal information than a form requires.
        </p>
        <h2 className="mt-10 font-display text-3xl">Analytics</h2>
        <p>
          Privacy-conscious analytics may record actions such as donation CTA clicks or form
          submissions. They should not collect unnecessary personal data.
        </p>
        <h2 className="mt-10 font-display text-3xl">Contact</h2>
        <p>
          For privacy questions, use the contact form or the official email once it is
          published on this site.
        </p>
      </div>
    </>
  );
}
