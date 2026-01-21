"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FolderPlus } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { ProjectCreationDialog } from "@/components/projects/project-creation-dialog";
import type { Project } from "@/components/projects/projects-list";
import { ProjectsList } from "@/components/projects/projects-list";
import {
  FilteredEmptyState,
  type ProjectStatusFilter,
  ProjectsListFilter,
} from "@/components/projects/projects-list-filter";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { orpc } from "@/utils/orpc";

export function ProjectsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // Filter state (URL-persisted)
  const [nameFilter, setNameFilter] = useState(
    () => searchParams.get("q") ?? ""
  );
  const [statusFilter, setStatusFilter] = useState<ProjectStatusFilter>(
    () => (searchParams.get("status") as ProjectStatusFilter) ?? "active"
  );

  // Track restoring project IDs
  const [restoringIds, setRestoringIds] = useState<Set<string>>(new Set());

  // Get current user's role from session
  // Note: admin plugin adds role field to user at runtime, but type inference
  // across module boundaries doesn't include it - use type assertion
  const { data: session } = authClient.useSession();
  const userRole = (session?.user as { role?: string } | undefined)?.role;
  const isAdmin = userRole === "admin";

  // Fetch projects with filter params
  const { data: projectsData, isLoading } = useQuery(
    orpc.projects.list.queryOptions({
      input: {
        name: nameFilter || undefined,
        status: statusFilter,
      },
    })
  );

  // Update URL when filters change
  const updateUrlParams = useCallback(
    (name: string, status: ProjectStatusFilter) => {
      const params = new URLSearchParams();
      if (name) {
        params.set("q", name);
      }
      if (status !== "active") {
        params.set("status", status);
      }
      const search = params.toString();
      router.replace(search ? `?${search}` : "/projects", { scroll: false });
    },
    [router]
  );

  const handleNameFilterChange = useCallback(
    (value: string) => {
      setNameFilter(value);
      updateUrlParams(value, statusFilter);
    },
    [statusFilter, updateUrlParams]
  );

  const handleStatusFilterChange = useCallback(
    (value: ProjectStatusFilter) => {
      setStatusFilter(value);
      updateUrlParams(nameFilter, value);
    },
    [nameFilter, updateUrlParams]
  );

  const handleClearFilters = useCallback(() => {
    setNameFilter("");
    setStatusFilter("active");
    router.replace("/projects", { scroll: false });
  }, [router]);

  // Restore mutation for archived projects
  const restoreMutation = useMutation({
    mutationFn: (projectId: string) =>
      orpc.projects.restore.call({ projectId }),
    onMutate: (projectId) => {
      setRestoringIds((prev) => new Set(prev).add(projectId));
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success(`Project "${result.name}" restored`);
    },
    onError: (error, projectId) => {
      toast.error(error.message || "Failed to restore project");
      setRestoringIds((prev) => {
        const next = new Set(prev);
        next.delete(projectId);
        return next;
      });
    },
    onSettled: (_data, _error, projectId) => {
      setRestoringIds((prev) => {
        const next = new Set(prev);
        next.delete(projectId);
        return next;
      });
    },
  });

  const handleRestore = useCallback(
    (projectId: string) => {
      restoreMutation.mutate(projectId);
    },
    [restoreMutation]
  );

  const createMutation = useMutation({
    mutationFn: (data: { key: string; name: string; description?: string }) =>
      orpc.projects.create.call(data),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      setIsDialogOpen(false);
      setServerError(null);
      toast.success(`Project "${result.name}" created`);
      router.push(`/projects/${result.id}/settings`);
    },
    onError: (error) => {
      const message = error.message || "Failed to create project";
      if (
        message.includes("key") ||
        message.includes("name") ||
        message.includes("unique")
      ) {
        setServerError(message);
      } else {
        toast.error(message);
      }
    },
  });

  const checkKeyMutation = useMutation({
    mutationFn: (key: string) => orpc.projects.checkKeyAvailable.call({ key }),
  });

  const handleCheckKeyAvailable = async (
    key: string,
    signal?: AbortSignal
  ): Promise<boolean> => {
    // Check if already aborted before starting
    if (signal?.aborted) {
      throw new DOMException("Aborted", "AbortError");
    }

    // Create a promise that rejects when signal aborts
    const abortPromise = signal
      ? new Promise<never>((_, reject) => {
          signal.addEventListener("abort", () => {
            reject(new DOMException("Aborted", "AbortError"));
          });
        })
      : null;

    // Race between the mutation and abort signal
    const mutationPromise = checkKeyMutation.mutateAsync(key);
    const result = await (abortPromise
      ? Promise.race([mutationPromise, abortPromise])
      : mutationPromise);

    return result.available;
  };

  const handleProjectClick = (projectId: string) => {
    router.push(`/projects/${projectId}/settings`);
  };

  const handleCreateProject = () => {
    setServerError(null);
    setIsDialogOpen(true);
  };

  const handleSuccess = (project: {
    key: string;
    name: string;
    description?: string;
  }) => {
    createMutation.mutate(project);
  };

  const projects: Project[] = useMemo(
    () =>
      projectsData?.map((p) => ({
        id: p.id,
        key: p.key,
        name: p.name,
        description: p.description ?? undefined,
        memberCount: p.memberCount,
        createdAt: new Date(p.createdAt),
        role: p.role,
        deletedAt: p.deletedAt ? new Date(p.deletedAt) : null,
      })) ?? [],
    [projectsData]
  );

  // Check if filters are active (for showing empty state vs no results)
  const hasActiveFilters = nameFilter.length > 0 || statusFilter !== "active";

  return (
    <>
      <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-semibold text-2xl tracking-tight sm:text-3xl">
            Projects
          </h1>
          <p className="mt-1 text-muted-foreground text-sm">
            Manage your projects and collaborate with your team
          </p>
        </div>
        <Button className="gap-2" onClick={handleCreateProject}>
          <FolderPlus className="size-4" />
          Create project
        </Button>
      </div>

      {/* Filter bar */}
      <ProjectsListFilter
        className="mb-6"
        isAdmin={isAdmin}
        nameFilter={nameFilter}
        onNameFilterChange={handleNameFilterChange}
        onStatusFilterChange={handleStatusFilterChange}
        statusFilter={statusFilter}
      />

      {/* Show filtered empty state when no results with active filters */}
      {!isLoading && projects.length === 0 && hasActiveFilters ? (
        <FilteredEmptyState
          nameFilter={nameFilter}
          onClearFilters={handleClearFilters}
          statusFilter={statusFilter}
        />
      ) : (
        <ProjectsList
          isLoading={isLoading}
          onCreateProject={handleCreateProject}
          onProjectClick={handleProjectClick}
          onRestore={isAdmin ? handleRestore : null}
          projects={projects}
          restoringIds={restoringIds}
        />
      )}

      <ProjectCreationDialog
        isOpen={isDialogOpen}
        isSubmitting={createMutation.isPending}
        onCheckKeyAvailable={handleCheckKeyAvailable}
        onOpenChange={setIsDialogOpen}
        onSuccess={handleSuccess}
        serverError={serverError}
      />
    </>
  );
}
