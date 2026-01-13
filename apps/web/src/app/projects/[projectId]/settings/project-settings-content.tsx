"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { OverviewTab } from "@/components/projects/project-settings/overview-tab";
import { ProjectSettingsLayout } from "@/components/projects/project-settings/project-settings-layout";
import { Button } from "@/components/ui/button";
import { orpc } from "@/utils/orpc";

type ProjectSettingsContentProps = {
  projectId: string;
};

export function ProjectSettingsContent({
  projectId,
}: ProjectSettingsContentProps) {
  const queryClient = useQueryClient();
  const [saveSuccess, setSaveSuccess] = useState(false);
  const successTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup timeout on unmount to prevent memory leaks
  useEffect(
    () => () => {
      if (successTimeoutRef.current) {
        clearTimeout(successTimeoutRef.current);
      }
    },
    []
  );

  const {
    data: project,
    isLoading,
    error,
  } = useQuery(orpc.projects.get.queryOptions({ input: { projectId } }));

  const updateMutation = useMutation({
    mutationFn: (data: { name?: string; description?: string }) =>
      orpc.projects.update.call({ projectId, ...data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      setSaveSuccess(true);
      toast.success("Project updated successfully");
      successTimeoutRef.current = setTimeout(() => setSaveSuccess(false), 2000);
    },
    onError: (err) => {
      toast.error(err.message || "Failed to update project");
    },
  });

  if (isLoading) {
    return <ProjectSettingsLoading />;
  }

  if (error) {
    return <ProjectSettingsError error={error} />;
  }

  if (!project) {
    return <ProjectSettingsError error={new Error("Project not found")} />;
  }

  // Role-based permissions
  const isReadOnly = project.role === "member";
  const canEdit = project.role === "owner" || project.role === "admin";

  const handleSave = (data: { name: string; description?: string }) => {
    if (!canEdit) {
      return;
    }
    updateMutation.mutate(data);
  };

  return (
    <ProjectSettingsLayout
      membersContent={
        <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          Member management coming soon
        </div>
      }
      overviewContent={
        <OverviewTab
          initialDescription={project.description ?? ""}
          initialName={project.name}
          isReadOnly={isReadOnly}
          isSaving={updateMutation.isPending}
          onSave={handleSave}
          projectKey={project.key}
          saveSuccess={saveSuccess}
        />
      }
      projectName={project.name}
    />
  );
}

function ProjectSettingsLoading() {
  return (
    <div className="flex min-h-[400px] items-center justify-center">
      <Loader2 className="size-8 animate-spin text-muted-foreground" />
    </div>
  );
}

type ProjectSettingsErrorProps = {
  error: Error;
};

function ProjectSettingsError({ error }: ProjectSettingsErrorProps) {
  const router = useRouter();

  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-destructive/10">
        <AlertCircle className="size-8 text-destructive" />
      </div>
      <h2 className="mt-4 font-semibold text-lg">Error Loading Settings</h2>
      <p className="mt-2 max-w-md text-center text-muted-foreground">
        {error.message}
      </p>
      <Button className="mt-6" onClick={() => router.push("/projects")}>
        Back to Projects
      </Button>
    </div>
  );
}
