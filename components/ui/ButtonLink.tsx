import Link from "next/link";
import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

type Props = Omit<ComponentProps<typeof Link>, "className"> & {
  variant?: "gold" | "ivory" | "ghost" | "plum";
  className?: string;
};

export function ButtonLink({ href, children, variant = "gold", className, ...props }: Props) {
  return (
    <Link href={href} className={cn("btn", `btn-${variant}`, className)} {...props}>
      {children}
    </Link>
  );
}
