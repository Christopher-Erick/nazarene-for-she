import { ContactForm } from "@/components/forms/ContactForm";
import { PageIntro } from "@/components/ui/PageIntro";
import { PlaceholderNote } from "@/components/ui/PlaceholderNote";
import { site } from "@/lib/data/site";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Start a Conversation",
  description:
    "Contact Nazarene for She for partnership, mentorship, donations or general questions. Official email and phone appear when the organisation publishes them.",
  path: "/contact",
});

export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<{ intent?: string }>;
}) {
  const { intent } = await searchParams;
  return (
    <>
      <PageIntro kicker="Start a conversation" title="Write to us. We will answer through official channels.">
        <p>
          Use this form for partnership, mentorship, donation questions or general contact. We
          do not publish private personal numbers here.
        </p>
      </PageIntro>
      <div className="mx-auto grid max-w-6xl gap-12 px-5 pb-24 sm:px-8 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <ContactForm initialIntent={intent} />
        </div>
        <aside className="lg:col-span-5">
          <div className="border border-line bg-surface p-8">
            <h2 className="font-display text-3xl">Direct details</h2>
            <dl className="mt-6 space-y-5">
              <div>
                <dt className="eyebrow text-primary">Email</dt>
                <dd className="mt-2 text-lg">
                  {site.contact.email || (
                    <>
                      Awaiting official address
                      <PlaceholderNote>Set NEXT_PUBLIC_CONTACT_EMAIL when ready.</PlaceholderNote>
                    </>
                  )}
                </dd>
              </div>
              <div>
                <dt className="eyebrow text-primary">Phone</dt>
                <dd className="mt-2 text-lg">
                  {site.contact.phone || (
                    <>
                      Awaiting official number
                      <PlaceholderNote>Set NEXT_PUBLIC_CONTACT_PHONE when ready.</PlaceholderNote>
                    </>
                  )}
                </dd>
              </div>
              <div>
                <dt className="eyebrow text-primary">Where we work</dt>
                <dd className="mt-2 text-lg text-muted">{site.contact.location}</dd>
              </div>
            </dl>
          </div>
        </aside>
      </div>
    </>
  );
}
