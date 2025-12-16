import { MoreHorizontal, UserPlus, Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { ProjectRole } from "../mock-data";
import { formatDate, getInitials } from "../utils";

export type Member = {
  id: string;
  name: string;
  email: string;
  avatar?: string | null;
  role: ProjectRole;
  addedAt: Date;
};

export type MembersTabProps = {
  members: Member[];
  currentUserRole: ProjectRole;
  onInviteMember?: () => void;
  onRemoveMember?: (memberId: string) => void;
  onTransferOwnership?: (memberId: string) => void;
  onChangeRole?: (memberId: string, newRole: ProjectRole) => void;
};

const roleConfig: Record<
  ProjectRole,
  {
    variant: "default" | "secondary" | "outline";
    label: string;
    ringClass: string;
  }
> = {
  owner: {
    variant: "default",
    label: "Owner",
    ringClass: "ring-2 ring-primary/50 ring-offset-2 ring-offset-background",
  },
  admin: {
    variant: "secondary",
    label: "Admin",
    ringClass:
      "ring-2 ring-muted-foreground/30 ring-offset-2 ring-offset-background",
  },
  member: { variant: "outline", label: "Member", ringClass: "" },
};

type MemberRowProps = {
  member: Member;
  index: number;
  isOwner: boolean;
  canManageMembers: boolean;
  onRemoveMember?: (memberId: string) => void;
  onTransferOwnership?: (memberId: string) => void;
  onChangeRole?: (memberId: string, newRole: ProjectRole) => void;
};

function MemberRow({
  member,
  index,
  isOwner,
  canManageMembers,
  onRemoveMember,
  onTransferOwnership,
  onChangeRole,
}: MemberRowProps) {
  const { variant, label, ringClass } = roleConfig[member.role];
  const isNotOwnerRole = member.role !== "owner";
  const canRemove =
    canManageMembers && isNotOwnerRole && (isOwner || member.role === "member");
  const canTransfer = isOwner && isNotOwnerRole;
  const showActions = canRemove || canTransfer;

  return (
    <div
      className={cn(
        "group relative flex items-center justify-between gap-3 px-4 py-3 transition-all sm:gap-4 sm:px-6 sm:py-4",
        "hover:bg-muted/50",
        // Left accent bar on hover (like ProjectCard)
        "before:absolute before:inset-y-0 before:left-0 before:w-1 before:bg-primary/0 before:transition-all before:duration-200",
        "hover:before:bg-primary",
        "fade-in animate-in fill-mode-both"
      )}
      style={{
        animationDelay: `${index * 50}ms`,
        animationDuration: "300ms",
      }}
    >
      {/* Member Info */}
      <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
        <Avatar
          className={cn(
            "size-9 shrink-0 transition-transform duration-200 group-hover:scale-105 sm:size-10",
            ringClass
          )}
        >
          {member.avatar ? (
            <AvatarImage alt={member.name} src={member.avatar} />
          ) : null}
          <AvatarFallback className="bg-primary/10 font-medium text-primary text-xs sm:text-sm">
            {getInitials(member.name)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="truncate font-medium text-sm">{member.name}</p>
            {/* Role badge inline with name on mobile */}
            <Badge
              className="font-medium text-[9px] uppercase tracking-wider sm:hidden"
              variant={variant}
            >
              {label}
            </Badge>
          </div>
          <p className="hidden truncate text-muted-foreground text-xs sm:block">
            {member.email}
          </p>
        </div>
      </div>

      {/* Right Side: Role + Actions */}
      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        {/* Role badge on desktop */}
        <Badge
          className="hidden font-medium text-[10px] uppercase tracking-wider sm:inline-flex"
          variant={variant}
        >
          {label}
        </Badge>
        <span className="hidden text-muted-foreground text-xs lg:inline">
          Added {formatDate(member.addedAt)}
        </span>

        {/* Actions Dropdown */}
        {showActions ? (
          <MemberActions
            canRemove={canRemove}
            canTransfer={canTransfer}
            isOwner={isOwner}
            member={member}
            onChangeRole={onChangeRole}
            onRemoveMember={onRemoveMember}
            onTransferOwnership={onTransferOwnership}
          />
        ) : (
          <div className="hidden size-8 sm:block" />
        )}
      </div>
    </div>
  );
}

type MemberActionsProps = {
  member: Member;
  isOwner: boolean;
  canRemove: boolean;
  canTransfer: boolean;
  onRemoveMember?: (memberId: string) => void;
  onTransferOwnership?: (memberId: string) => void;
  onChangeRole?: (memberId: string, newRole: ProjectRole) => void;
};

function MemberActions({
  member,
  isOwner,
  canRemove,
  canTransfer,
  onRemoveMember,
  onTransferOwnership,
  onChangeRole,
}: MemberActionsProps) {
  const isNotOwnerRole = member.role !== "owner";
  const showRoleChange = isOwner && isNotOwnerRole;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          className={cn(
            "size-8 opacity-0 transition-opacity",
            "focus:opacity-100 group-hover:opacity-100"
          )}
          size="icon"
          variant="ghost"
        >
          <MoreHorizontal className="size-4" />
          <span className="sr-only">Actions for {member.name}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {showRoleChange ? (
          <>
            <DropdownMenuItem
              onClick={() =>
                onChangeRole?.(
                  member.id,
                  member.role === "admin" ? "member" : "admin"
                )
              }
            >
              {member.role === "admin"
                ? "Demote to Member"
                : "Promote to Admin"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        ) : null}
        {canTransfer ? (
          <DropdownMenuItem onClick={() => onTransferOwnership?.(member.id)}>
            Transfer ownership
          </DropdownMenuItem>
        ) : null}
        {canRemove ? (
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={() => onRemoveMember?.(member.id)}
          >
            Remove from project
          </DropdownMenuItem>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function MembersTab({
  members,
  currentUserRole,
  onInviteMember,
  onRemoveMember,
  onTransferOwnership,
  onChangeRole,
}: MembersTabProps) {
  const canManageMembers =
    currentUserRole === "owner" || currentUserRole === "admin";
  const isOwner = currentUserRole === "owner";

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="px-4 pb-2 sm:px-6 sm:pb-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <div>
              <CardTitle className="text-base">Team Members</CardTitle>
              <CardDescription>
                {members.length} {members.length === 1 ? "member" : "members"}{" "}
                in this project
              </CardDescription>
            </div>
            {canManageMembers ? (
              <Button
                className="gap-2 self-start sm:self-auto"
                onClick={onInviteMember}
                size="sm"
              >
                <UserPlus className="size-4" />
                Invite member
              </Button>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="border-t p-0">
          <div className="divide-y">
            {members.map((member, index) => (
              <MemberRow
                canManageMembers={canManageMembers}
                index={index}
                isOwner={isOwner}
                key={member.id}
                member={member}
                onChangeRole={onChangeRole}
                onRemoveMember={onRemoveMember}
                onTransferOwnership={onTransferOwnership}
              />
            ))}
          </div>

          {members.length === 0 ? (
            <div className="flex flex-col items-center px-4 py-10 text-center sm:px-6 sm:py-16">
              {/* Decorative icon */}
              <div className="relative mb-4">
                <div className="absolute inset-0 animate-pulse rounded-full bg-primary/10 blur-xl" />
                <div className="relative flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 ring-1 ring-primary/20">
                  <Users className="size-7 text-primary" strokeWidth={1.5} />
                </div>
              </div>
              <p className="mb-1 font-medium text-foreground text-sm">
                No team members yet
              </p>
              <p className="max-w-[240px] text-muted-foreground text-sm">
                Invite collaborators to work together on this project.
              </p>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
