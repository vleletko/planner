import { FolderPlus, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ProjectRole } from "./mock-data";
import { ProjectCard, ProjectCardSkeleton } from "./project-card";

export type Project = {
  id: string;
  name: string;
  description?: string;
  memberCount: number;
  createdAt: Date;
  role: ProjectRole;
};

export type ProjectsListProps = {
  projects: Project[];
  isLoading?: boolean;
  onProjectClick?: (projectId: string) => void;
  onCreateProject?: () => void;
};

export function ProjectsList({
  projects,
  isLoading = false,
  onProjectClick,
  onCreateProject,
}: ProjectsListProps) {
  if (isLoading) {
    return <ProjectsListSkeleton />;
  }

  if (projects.length === 0) {
    return <ProjectsEmptyState onCreateProject={onCreateProject} />;
  }

  return (
    <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
      {projects.map((project, index) => (
        <div
          className="fade-in slide-in-from-bottom-2 w-full animate-in fill-mode-both sm:w-[320px] md:w-[360px] lg:w-[380px]"
          key={project.id}
          style={{
            animationDelay: `${index * 50}ms`,
            animationDuration: "300ms",
          }}
        >
          <ProjectCard
            {...project}
            {...(onProjectClick
              ? { onClick: () => onProjectClick(project.id) }
              : {})}
          />
        </div>
      ))}
    </div>
  );
}

type ProjectsEmptyStateProps = {
  onCreateProject?: () => void;
};

function ProjectsEmptyState({ onCreateProject }: ProjectsEmptyStateProps) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center rounded-xl border border-muted-foreground/25 border-dashed bg-muted/30 px-4 py-8 sm:px-6 sm:py-16">
      {/* Icon with subtle animation */}
      <div className="relative mb-4 sm:mb-6">
        <div className="absolute inset-0 animate-pulse rounded-full bg-primary/10 blur-xl" />
        <div className="relative flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 ring-1 ring-primary/20">
          <Layers className="size-8 text-primary" strokeWidth={1.5} />
        </div>
      </div>

      {/* Copy */}
      <h3 className="mb-2 font-semibold text-base tracking-tight sm:text-lg">
        No projects yet
      </h3>
      <p className="mb-4 max-w-xs text-center text-muted-foreground text-sm leading-relaxed sm:mb-6 sm:max-w-sm">
        Projects help you organize work into manageable workflows. Create your
        first project to get started.
      </p>

      {/* CTA */}
      <Button className="gap-2" onClick={onCreateProject} size="lg">
        <FolderPlus className="size-4" />
        Create your first project
      </Button>
    </div>
  );
}

const SKELETON_COUNT = 6;

function ProjectsListSkeleton() {
  return (
    <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
      {Array.from({ length: SKELETON_COUNT }).map((_, index) => (
        <div
          className="fade-in w-full animate-in fill-mode-both sm:w-[320px] md:w-[360px] lg:w-[380px]"
          key={`skeleton-${index}`}
          style={{
            animationDelay: `${index * 75}ms`,
            animationDuration: "400ms",
          }}
        >
          <ProjectCardSkeleton />
        </div>
      ))}
    </div>
  );
}

export { ProjectsEmptyState, ProjectsListSkeleton };
