import { CountUp } from "@/components/impact/CountUp";
import { PageIntro } from "@/components/ui/PageIntro";
import { publishedImpact } from "@/lib/cms/public-content";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Impact",
  description:
    "Nazarene for She currently supports 600+ girls. Further impact figures are published only when the organisation has verified them.",
  path: "/impact",
});

export default async function ImpactPage() {
  const impactMetrics = await publishedImpact();
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
                {metric.status === "verified" && Number(String(metric.value).replace(/[^\d]/g, "")) ? (
                  <CountUp value={Number(String(metric.value).replace(/[^\d]/g, ""))} suffix={String(metric.value).includes("+") ? "+" : ""} />
                ) : (
                  metric.value
                )}
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
