import Image from "next/image";
import { site } from "@/lib/data/site";
import { cn } from "@/lib/cn";

export function BrandLockup({
  className,
  size = "md",
}: {
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const width = size === "lg" ? 280 : size === "sm" ? 168 : 220;

  return (
    <Image
      src="/images/logo.png"
      alt={`${site.name} — ${site.tagline}`}
      width={407}
      height={296}
      className={cn("h-auto", className)}
      style={{ width, height: "auto" }}
      sizes={`${width}px`}
    />
  );
}
