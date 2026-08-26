import Link from "next/link";
import { impactMetrics } from "@/lib/data/impact";
import { CountUp } from "@/components/impact/CountUp";
import { Reveal } from "@/components/experience/Reveal";

export function ImpactSection() {
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
                {metric.status === "verified" ? (
                  <CountUp value={600} suffix="+" />
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
