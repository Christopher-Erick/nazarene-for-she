import { ButtonLink } from "@/components/ui/ButtonLink";

export default function NotFound() {
  return (
    <section className="bleed-hero flex min-h-[80vh] flex-col justify-center theme-band px-5 py-24 sm:px-8">
      <div className="mx-auto max-w-3xl">
        <p className="eyebrow text-accent">A different path</p>
        <h1 className="display-lg mt-6">Looks like you&apos;ve taken a different path.</h1>
        <p className="mt-6 max-w-xl text-lg theme-muted">
          This page is not part of her story — yet. Return to the journey, or start a
          conversation if you were looking for a way to walk with us.
        </p>
        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <ButtonLink href="/">Return to Her Story</ButtonLink>
          <ButtonLink href="/contact" variant="ghost">
            Start a Conversation
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
