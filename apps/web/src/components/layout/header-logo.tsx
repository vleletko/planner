import type { Route } from "next";
import Link from "next/link";

type HeaderLogoProps = {
  href?: string;
};

export function HeaderLogo({ href = "/dashboard" }: HeaderLogoProps) {
  return (
    <Link className="flex items-center gap-2" href={href as Route}>
      <div className="flex size-8 items-center justify-center rounded-md bg-linear-to-br from-primary to-primary/80 font-bold text-primary-foreground text-sm">
        P
      </div>
      <span className="font-bold text-lg text-primary">Planner</span>
    </Link>
  );
}
