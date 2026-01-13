"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FolderPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { ProjectCreationDialog } from "@/components/projects/project-creation-dialog";
import type { Project } from "@/components/projects/projects-list";
import { ProjectsList } from "@/components/projects/projects-list";
import { Button } from "@/components/ui/button";
import { orpc } from "@/utils/orpc";

export function ProjectsContent() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const { data: projectsData, isLoading } = useQuery(
    orpc.projects.list.queryOptions()
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

  const projects: Project[] =
    projectsData?.map((p) => ({
      id: p.id,
      key: p.key,
      name: p.name,
      description: p.description ?? undefined,
      memberCount: p.memberCount,
      createdAt: new Date(p.createdAt),
      role: p.role,
    })) ?? [];

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

      <ProjectsList
        isLoading={isLoading}
        onCreateProject={handleCreateProject}
        onProjectClick={handleProjectClick}
        projects={projects}
      />

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
