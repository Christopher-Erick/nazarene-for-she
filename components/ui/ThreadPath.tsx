import { cn } from "@/lib/cn";

export function ThreadPath({ className }: { className?: string }) {
  return (
    <svg
      className={cn("pointer-events-none absolute inset-y-0 left-[7%] hidden w-[46px] lg:block", className)}
      viewBox="0 0 46 1600"
      aria-hidden="true"
      preserveAspectRatio="none"
    >
      <path
        className="thread-stroke opacity-70"
        d="M23 0 C 38 120, 8 220, 23 340 C 40 470, 6 590, 23 720 C 42 860, 7 980, 23 1120 C 36 1260, 12 1400, 23 1600"
      />
    </svg>
  );
}
