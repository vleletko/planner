"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { InviteUserResult } from "@/components/projects/hooks/use-invite-user-search";
import { InviteMemberDialog } from "@/components/projects/invite-member-dialog";
import type { ProjectRole } from "@/components/projects/mock-data";
import type { Member } from "@/components/projects/project-settings/members-tab";
import { MembersTab } from "@/components/projects/project-settings/members-tab";
import { OverviewTab } from "@/components/projects/project-settings/overview-tab";
import {
  ProjectSettingsLayout,
  type ProjectSettingsTab,
} from "@/components/projects/project-settings/project-settings-layout";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { orpc } from "@/utils/orpc";

type ProjectSettingsContentProps = {
  projectId: string;
};

export function ProjectSettingsContent({
  projectId,
}: ProjectSettingsContentProps) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<ProjectSettingsTab>("overview");
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

  const membersQueryOptions = orpc.projects.listMembers.queryOptions({
    input: { projectId },
  });

  const {
    data: membersData,
    isLoading: isMembersLoading,
    error: membersError,
  } = useQuery({
    ...membersQueryOptions,
    enabled: activeTab === "members",
  });

  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteSubmitError, setInviteSubmitError] = useState<string | null>(
    null
  );
  const [memberToRemove, setMemberToRemove] = useState<Member | null>(null);

  const inviteMutation = useMutation({
    mutationFn: (data: { userId: string; role: "admin" | "member" }) =>
      orpc.projects.inviteMember.call({ projectId, ...data }),
    onSuccess: async () => {
      setInviteSubmitError(null);
      await queryClient.invalidateQueries({
        queryKey: membersQueryOptions.queryKey,
      });
      toast.success("User added to project");
      setIsInviteOpen(false);
    },
    onError: (err) => {
      if (
        err.message === "User not found" ||
        err.message === "User is already a member"
      ) {
        setInviteSubmitError(err.message);
        return;
      }
      toast.error(err.message || "Failed to invite user");
    },
  });

  const changeRoleMutation = useMutation({
    mutationFn: (data: { memberId: string; role: "admin" | "member" }) =>
      orpc.projects.changeMemberRole.call({
        projectId,
        userId: data.memberId,
        role: data.role,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: membersQueryOptions.queryKey,
      });
      toast.success("Member role updated");
    },
    onError: (err) => {
      toast.error(err.message || "Failed to update member role");
    },
  });

  const removeMutation = useMutation({
    mutationFn: (memberId: string) =>
      orpc.projects.removeMember.call({ projectId, userId: memberId }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: membersQueryOptions.queryKey,
      });
      toast.success("User removed from project");
      setMemberToRemove(null);
    },
    onError: (err) => {
      toast.error(err.message || "Failed to remove member");
    },
  });

  const members: Member[] = (membersData ?? []).map((member) => ({
    id: member.user.id,
    name: member.user.name,
    email: member.user.email,
    avatar: member.user.image,
    role: member.role,
    addedAt: new Date(member.joinedAt),
  }));

  const handleInviteSearch = (
    query: string,
    signal?: AbortSignal
  ): Promise<InviteUserResult[]> => {
    setInviteSubmitError(null);

    if (signal?.aborted) {
      return Promise.reject(new DOMException("Aborted", "AbortError"));
    }

    const abortPromise = signal
      ? new Promise<never>((_, reject) => {
          signal.addEventListener(
            "abort",
            () => {
              reject(new DOMException("Aborted", "AbortError"));
            },
            { once: true }
          );
        })
      : null;

    const searchPromise = orpc.projects.searchInviteCandidates.call({
      projectId,
      query,
    });

    return abortPromise
      ? Promise.race([searchPromise, abortPromise])
      : searchPromise;
  };

  const handleInvite = (data: {
    email: string;
    role: "admin" | "member";
    userId?: string;
  }) => {
    if (!data.userId) {
      toast.error("Select a user to invite");
      return;
    }

    inviteMutation.mutate({ userId: data.userId, role: data.role });
  };

  const handleRequestRemove = (memberId: string) => {
    const member = members.find((m) => m.id === memberId);
    if (!member) {
      toast.error("Member not found");
      return;
    }

    setMemberToRemove(member);
  };

  const handleChangeRole = (memberId: string, role: ProjectRole) => {
    if (role === "owner") {
      toast.error("Cannot change owner role");
      return;
    }
    changeRoleMutation.mutate({ memberId, role });
  };

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

  let membersTabContent: ReactNode = null;
  if (activeTab === "members") {
    if (isMembersLoading) {
      membersTabContent = (
        <div className="flex min-h-[240px] items-center justify-center">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      );
    } else if (membersError) {
      membersTabContent = (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-destructive text-sm">
          {membersError.message}
        </div>
      );
    } else {
      membersTabContent = (
        <MembersTab
          currentUserRole={project.role}
          isReadOnly={isReadOnly}
          members={members}
          onChangeRole={handleChangeRole}
          onInviteMember={() => setIsInviteOpen(true)}
          onRemoveMember={handleRequestRemove}
        />
      );
    }
  }

  return (
    <ProjectSettingsLayout
      activeTab={activeTab}
      membersContent={
        <div className="space-y-4">
          {membersTabContent}

          <InviteMemberDialog
            isOpen={isInviteOpen}
            isSubmitting={inviteMutation.isPending}
            onInvite={handleInvite}
            onOpenChange={(open) => {
              setIsInviteOpen(open);
              if (!open) {
                setInviteSubmitError(null);
              }
            }}
            onSearchUser={handleInviteSearch}
            searchQueryKeyPrefix={["invite-user-search", projectId]}
            submitError={inviteSubmitError}
          />

          <AlertDialog
            onOpenChange={(open) => {
              if (!open) {
                setMemberToRemove(null);
              }
            }}
            open={memberToRemove !== null}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Remove member?</AlertDialogTitle>
                <AlertDialogDescription>
                  Remove {memberToRemove?.name ?? "this member"} from this
                  project. They will immediately lose access.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={removeMutation.isPending}>
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  disabled={removeMutation.isPending}
                  onClick={() => {
                    if (!memberToRemove) {
                      return;
                    }
                    removeMutation.mutate(memberToRemove.id);
                  }}
                >
                  {removeMutation.isPending ? "Removing…" : "Remove"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      }
      onTabChange={setActiveTab}
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
