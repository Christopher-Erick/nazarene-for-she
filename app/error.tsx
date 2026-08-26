"use client";

import { ButtonLink } from "@/components/ui/ButtonLink";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section className="mx-auto max-w-3xl px-5 py-24 sm:px-8">
      <p className="eyebrow text-primary">Something paused</p>
      <h1 className="display-md mt-4">This page could not finish loading.</h1>
      <p className="mt-4 text-muted">
        The story is still here. Try again, or return home.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <button type="button" className="btn btn-plum" onClick={reset}>
          Try again
        </button>
        <ButtonLink href="/" variant="ghost">
          Return to Her Story
        </ButtonLink>
      </div>
    </section>
  );
}
