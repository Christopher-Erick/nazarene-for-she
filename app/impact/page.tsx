import { CountUp } from "@/components/impact/CountUp";
import { PageIntro } from "@/components/ui/PageIntro";
import { impactMetrics } from "@/lib/data/impact";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Impact",
  description:
    "Nazarene for She currently supports 600+ girls. Further impact figures are published only when the organisation has verified them.",
  path: "/impact",
});

export default function ImpactPage() {
  return (
    <>
      <PageIntro kicker="Impact" title="We would rather show a blank than invent a number.">
        <p>
          The only verified figure on this site today is the number of girls currently
          supported. Everything else is a ledger waiting for organisational confirmation.
        </p>
      </PageIntro>
      <div className="mx-auto max-w-6xl px-5 pb-24 sm:px-8">
        <div className="impact-grid">
          {impactMetrics.map((metric) => (
            <article key={metric.id} className="impact-card">
              <p className="impact-card-value">
                {metric.id === "girls-supported" ? <CountUp value={600} suffix="+" /> : metric.value}
              </p>
              <h2>{metric.label}</h2>
              {metric.status === "awaiting-verification" ? (
                <p className="placeholder-chip impact-card-status">Awaiting verification</p>
              ) : (
                <p className="impact-card-status impact-card-note">{metric.note}</p>
              )}
            </article>
          ))}
        </div>
      </div>
    </>
  );
}
