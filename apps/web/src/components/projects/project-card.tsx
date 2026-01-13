import { Calendar, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { ProjectRole } from "./mock-data";
import { formatDate } from "./utils";

export type ProjectCardProps = {
  projectKey: string;
  name: string;
  description?: string;
  memberCount: number;
  createdAt: Date;
  role: ProjectRole;
  onClick?: () => void;
};

const roleConfig: Record<
  ProjectRole,
  { variant: "default" | "secondary" | "outline"; label: string }
> = {
  owner: { variant: "default", label: "Owner" },
  admin: { variant: "secondary", label: "Admin" },
  member: { variant: "outline", label: "Member" },
};

export function ProjectCard({
  projectKey,
  name,
  description,
  memberCount,
  createdAt,
  role,
  onClick,
}: ProjectCardProps) {
  const { variant, label } = roleConfig[role];

  return (
    <Card
      className={cn(
        "group relative h-full overflow-hidden transition-all duration-200",
        // Light mode: shadow elevation
        "hover:border-primary/30 hover:shadow-lg",
        // Dark mode: teal border (no shadow - doesn't work on dark backgrounds)
        "dark:shadow-none dark:hover:border-primary",
        // Left accent bar
        "before:absolute before:inset-y-0 before:left-0 before:w-1 before:bg-primary/0 before:transition-all before:duration-200",
        "hover:before:bg-primary",
        onClick
          ? "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          : null
      )}
      onClick={onClick}
      onKeyDown={(e) => {
        if ((e.key === "Enter" || e.key === " ") && onClick) {
          e.preventDefault();
          onClick();
        }
      }}
      {...(onClick
        ? { role: "button", tabIndex: 0, "aria-label": `Open project ${name}` }
        : {})}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-1">
            <span className="inline-flex w-fit rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground uppercase tracking-wider">
              {projectKey}
            </span>
            <CardTitle className="line-clamp-1 font-semibold text-sm tracking-tight sm:text-base">
              {name}
            </CardTitle>
          </div>
          <Badge
            className="shrink-0 font-medium text-[10px] uppercase tracking-wider"
            variant={variant}
          >
            {label}
          </Badge>
        </div>
        {description ? (
          <CardDescription className="line-clamp-2 text-sm leading-relaxed">
            {description}
          </CardDescription>
        ) : null}
      </CardHeader>

      <CardContent className="pt-0">
        <div className="flex items-center gap-3 text-muted-foreground text-xs sm:gap-4">
          <div className="flex items-center gap-1.5">
            <Users aria-hidden="true" className="size-3.5" />
            <span>
              {memberCount} {memberCount === 1 ? "member" : "members"}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Calendar aria-hidden="true" className="size-3.5" />
            <time dateTime={createdAt.toISOString()}>
              {formatDate(createdAt)}
            </time>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function ProjectCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-5 w-14 rounded-full" />
        </div>
        <Skeleton className="mt-2 h-4 w-full" />
        <Skeleton className="mt-1 h-4 w-3/4" />
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center gap-4">
          <Skeleton className="h-3.5 w-20" />
          <Skeleton className="h-3.5 w-24" />
        </div>
      </CardContent>
    </Card>
  );
}
