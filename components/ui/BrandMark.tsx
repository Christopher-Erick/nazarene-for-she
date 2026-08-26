import { cn } from "@/lib/cn";

export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn("inline-block bg-current", className)}
      style={{
        maskImage: "url(/images/logo-mark.png?v=3)",
        WebkitMaskImage: "url(/images/logo-mark.png?v=3)",
        maskSize: "contain",
        WebkitMaskSize: "contain",
        maskRepeat: "no-repeat",
        WebkitMaskRepeat: "no-repeat",
        maskPosition: "center",
        WebkitMaskPosition: "center",
      }}
    />
  );
}
