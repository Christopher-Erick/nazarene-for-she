import Link from "next/link";
import { cn } from "@/lib/cn";

type Props = {
  href: string;
  children: React.ReactNode;
  variant?: "gold" | "ivory" | "ghost" | "plum";
  className?: string;
};

export function ButtonLink({ href, children, variant = "gold", className }: Props) {
  return (
    <Link href={href} className={cn("btn", `btn-${variant}`, className)}>
      {children}
    </Link>
  );
}
