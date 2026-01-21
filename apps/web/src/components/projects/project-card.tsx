import { Archive, Calendar, Loader2, RotateCcw, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  /** Whether the project is archived (soft-deleted) */
  isArchived?: boolean;
  /** When the project was archived - used to calculate days until permanent deletion */
  deletedAt?: Date;
  /** Callback when user clicks restore - only shown for archived projects */
  onRestore?: () => void;
  /** Whether restore is in progress */
  isRestoring?: boolean;
};

const roleConfig: Record<
  ProjectRole,
  { variant: "default" | "secondary" | "outline"; label: string }
> = {
  owner: { variant: "default", label: "Owner" },
  admin: { variant: "secondary", label: "Admin" },
  member: { variant: "outline", label: "Member" },
};

const ARCHIVE_RETENTION_DAYS = 30;

/**
 * Calculate days remaining until permanent deletion
 */
function getDaysUntilDeletion(deletedAt: Date): number {
  const now = new Date();
  const deletedTime = new Date(deletedAt).getTime();
  const elapsedMs = now.getTime() - deletedTime;
  const elapsedDays = Math.floor(elapsedMs / (1000 * 60 * 60 * 24));
  return Math.max(0, ARCHIVE_RETENTION_DAYS - elapsedDays);
}

/** Role badge for active projects */
function RoleBadge({ role }: { role: ProjectRole }) {
  const { variant, label } = roleConfig[role];
  return (
    <Badge
      className="shrink-0 font-medium text-[10px] uppercase tracking-wider"
      variant={variant}
    >
      {label}
    </Badge>
  );
}

/** Archived badge for soft-deleted projects */
function ArchivedBadge() {
  return (
    <Badge
      className="gap-1 font-medium text-[10px] uppercase tracking-wider"
      variant="outline"
    >
      <Archive className="size-3" />
      Archived
    </Badge>
  );
}

/** Footer for archived projects showing days remaining and restore button */
type ArchivedFooterProps = {
  daysRemaining: number;
  onRestore?: () => void;
  isRestoring: boolean;
};

function ArchivedFooter({
  daysRemaining,
  onRestore,
  isRestoring,
}: ArchivedFooterProps) {
  const isUrgent = daysRemaining <= 7;

  const handleRestore = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRestore?.();
  };

  const warningText =
    daysRemaining === 0
      ? "Permanent deletion imminent"
      : `Permanently deleted in ${daysRemaining} day${daysRemaining === 1 ? "" : "s"}`;

  return (
    <div className="mt-3 flex items-center justify-between gap-2 border-muted border-t pt-3">
      <span
        className={cn(
          "text-xs",
          isUrgent
            ? "font-medium text-amber-600 dark:text-amber-500"
            : "text-muted-foreground"
        )}
      >
        {warningText}
      </span>
      {onRestore ? (
        <Button
          className="gap-1.5"
          disabled={isRestoring}
          onClick={handleRestore}
          size="sm"
          variant="outline"
        >
          {isRestoring ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <RotateCcw className="size-3.5" />
          )}
          {isRestoring ? "Restoring..." : "Restore"}
        </Button>
      ) : null}
    </div>
  );
}

export function ProjectCard({
  projectKey,
  name,
  description,
  memberCount,
  createdAt,
  role,
  onClick,
  isArchived = false,
  deletedAt,
  onRestore,
  isRestoring = false,
}: ProjectCardProps) {
  const daysRemaining = deletedAt ? getDaysUntilDeletion(deletedAt) : null;

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
          : null,
        // Archived state: muted appearance
        isArchived
          ? "opacity-75 before:bg-muted-foreground/30 hover:opacity-100 hover:before:bg-muted-foreground/50"
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
          <div className="flex shrink-0 flex-col items-end gap-1">
            {isArchived ? <ArchivedBadge /> : <RoleBadge role={role} />}
          </div>
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

        {/* Archived project footer: days warning + restore button */}
        {isArchived === true && daysRemaining !== null ? (
          <ArchivedFooter
            daysRemaining={daysRemaining}
            isRestoring={isRestoring}
            onRestore={onRestore}
          />
        ) : null}
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
