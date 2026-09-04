import Link from "next/link";
import { publishedImpact } from "@/lib/cms/public-content";
import { CountUp } from "@/components/impact/CountUp";
import { Reveal } from "@/components/experience/Reveal";

function metricNumber(value: string) {
  return Number(String(value).replace(/[^\d]/g, "")) || 0;
}

export async function ImpactSection() {
  const impactMetrics = await publishedImpact();
  return (
    <section className="bg-background">
      <div className="mx-auto max-w-6xl px-5 py-24 sm:px-8 lg:py-32">
        <Reveal>
          <p className="section-kicker text-primary">
            <b>11</b>
            Impact
          </p>
          <div className="mt-5 flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <h2 className="display-lg max-w-3xl">Numbers we will only publish when they are true.</h2>
            <Link href="/impact" className="nav-link text-primary">
              View the impact ledger
            </Link>
          </div>
        </Reveal>
        <div className="impact-grid mt-14">
          {impactMetrics.map((metric) => (
            <article key={metric.id} className="impact-card">
              <p className="impact-card-value">
                {metric.status === "verified" && metricNumber(metric.value) ? (
                  <CountUp
                    value={metricNumber(metric.value)}
                    suffix={String(metric.value).includes("+") ? "+" : ""}
                  />
                ) : (
                  metric.value
                )}
              </p>
              <h3>{metric.label}</h3>
              {metric.status === "awaiting-verification" ? (
                <p className="placeholder-chip impact-card-status">Awaiting verification</p>
              ) : (
                <p className="impact-card-status impact-card-note">{metric.note}</p>
              )}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
