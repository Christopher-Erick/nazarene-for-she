import { cn } from "@/lib/cn";

export function SectionLabel({
  kicker,
  className,
}: {
  kicker: string;
  className?: string;
}) {
  return (
    <p className={cn("eyebrow text-accent", className)}>
      {kicker}
    </p>
  );
}
