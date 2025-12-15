import {
  AlertCircle,
  Check,
  Loader2,
  Search,
  Shield,
  User,
  UserPlus,
  UserX,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type {
  InviteUserResult,
  InviteUserSearchState,
} from "./hooks/use-invite-user-search";
import { useInviteUserSearch } from "./hooks/use-invite-user-search";

export type InviteMemberRole = "admin" | "member";

// Re-export types for convenience
export type {
  InviteUserResult,
  InviteUserSearchState,
} from "./hooks/use-invite-user-search";

export type InviteMemberDialogProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  onInvite?: (data: { email: string; role: InviteMemberRole }) => void;
  /** Async callback to search for users. Returns array of matching users. */
  onSearchUser?: (query: string) => Promise<InviteUserResult[]>;
  // Controlled state for Storybook (overrides hook)
  controlledSearchState?: InviteUserSearchState;
  isSubmitting?: boolean;
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

type IdleStateProps = Record<string, never>;

function IdleState(_props: IdleStateProps) {
  return (
    <div className="flex flex-col items-center py-6 text-center">
      {/* Decorative icon with animated background */}
      <div className="relative mb-3">
        <div className="absolute inset-0 animate-pulse rounded-full bg-primary/10 blur-xl" />
        <div className="relative flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 ring-1 ring-primary/20">
          <UserPlus className="size-6 text-primary" strokeWidth={1.5} />
        </div>
      </div>
      <p className="text-muted-foreground text-sm">
        Enter an email address to find a user
      </p>
    </div>
  );
}

type SearchingStateProps = Record<string, never>;

function SearchingStateContent(_props: SearchingStateProps) {
  return (
    <div className="flex flex-col items-center py-6 text-center">
      <div className="relative mb-3">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 ring-1 ring-primary/20">
          <Loader2
            className="size-6 animate-spin text-primary"
            strokeWidth={1.5}
          />
        </div>
      </div>
      <p className="text-muted-foreground text-sm">Searching for user...</p>
    </div>
  );
}

// Maximum number of results to display
const MAX_VISIBLE_RESULTS = 3;

type SelectableUserCardProps = {
  user: InviteUserResult;
  isSelected: boolean;
  onSelect: () => void;
  disabled?: boolean;
};

function SelectableUserCard({
  user,
  isSelected,
  onSelect,
  disabled,
}: SelectableUserCardProps) {
  return (
    <button
      className={cn(
        "relative w-full rounded-lg border bg-card p-3 text-left",
        "transition-all duration-200",
        "hover:border-primary/50 hover:bg-muted/50",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20",
        isSelected
          ? [
              "border-primary bg-primary/5",
              "before:absolute before:inset-y-0 before:left-0 before:w-1 before:rounded-l-lg before:bg-primary",
            ]
          : null,
        disabled ? "pointer-events-none opacity-50" : null
      )}
      disabled={disabled}
      onClick={onSelect}
      type="button"
    >
      <div
        className={cn("flex items-center gap-3", isSelected ? "pl-2" : null)}
      >
        <Avatar
          className={cn(
            "size-10 ring-offset-2 ring-offset-background",
            isSelected ? "ring-2 ring-primary/30" : null
          )}
        >
          {user.avatar ? (
            <AvatarImage alt={user.name} src={user.avatar} />
          ) : null}
          <AvatarFallback
            className={cn(
              "font-medium text-sm",
              isSelected
                ? "bg-primary/10 text-primary"
                : "bg-muted text-muted-foreground"
            )}
          >
            {getInitials(user.name)}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-sm">{user.name}</p>
          <p className="truncate text-muted-foreground text-xs">{user.email}</p>
        </div>

        {isSelected ? (
          <div className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <Check className="size-3 text-primary" />
          </div>
        ) : null}
      </div>
    </button>
  );
}

type UserResultsListProps = {
  results: InviteUserResult[];
  selectedUser: InviteUserResult | null;
  onSelectUser: (user: InviteUserResult) => void;
  disabled?: boolean;
};

function UserResultsList({
  results,
  selectedUser,
  onSelectUser,
  disabled,
}: UserResultsListProps) {
  const visibleResults = results.slice(0, MAX_VISIBLE_RESULTS);
  const remainingCount = results.length - MAX_VISIBLE_RESULTS;

  return (
    <div
      className={cn(
        "space-y-2",
        "fade-in slide-in-from-bottom-2 animate-in duration-200"
      )}
    >
      {visibleResults.map((user) => (
        <SelectableUserCard
          disabled={disabled}
          isSelected={selectedUser?.email === user.email}
          key={user.email}
          onSelect={() => onSelectUser(user)}
          user={user}
        />
      ))}
      {remainingCount > 0 ? (
        <p className="text-center text-muted-foreground text-xs">
          and {remainingCount} more result{remainingCount === 1 ? "" : "s"}
        </p>
      ) : null}
    </div>
  );
}

type NotFoundStateProps = Record<string, never>;

function NotFoundState(_props: NotFoundStateProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-amber-500/30 bg-amber-500/5 p-4",
        "fade-in slide-in-from-bottom-2 animate-in duration-200"
      )}
    >
      <div className="flex items-start gap-3">
        <AlertCircle className="mt-0.5 size-5 shrink-0 text-amber-500" />
        <div>
          <p className="font-medium text-sm">User not found</p>
          <p className="mt-0.5 text-muted-foreground text-xs">
            No account exists with this email. They'll need to sign up first.
          </p>
        </div>
      </div>
    </div>
  );
}

type AlreadyMemberCardProps = {
  user: InviteUserResult;
};

function AlreadyMemberCard({ user }: AlreadyMemberCardProps) {
  return (
    <div
      className={cn(
        "relative rounded-lg border border-amber-500/30 bg-amber-500/5 p-4",
        "fade-in slide-in-from-bottom-2 animate-in duration-200"
      )}
    >
      <div className="flex items-center gap-3">
        <Avatar className="size-11 ring-2 ring-amber-500/30 ring-offset-2 ring-offset-background">
          {user.avatar ? (
            <AvatarImage alt={user.name} src={user.avatar} />
          ) : null}
          <AvatarFallback className="bg-amber-500/10 font-medium text-amber-600 text-sm">
            {getInitials(user.name)}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-sm">{user.name}</p>
          <p className="truncate text-muted-foreground text-xs">{user.email}</p>
        </div>

        <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-amber-500/10">
          <UserX className="size-3.5 text-amber-600" />
        </div>
      </div>
      <p className="mt-2 text-amber-600 text-xs">
        Already a member of this project
      </p>
    </div>
  );
}

type ErrorStateProps = Record<string, never>;

function ErrorState(_props: ErrorStateProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-destructive/30 bg-destructive/5 p-4",
        "fade-in slide-in-from-bottom-2 animate-in duration-200"
      )}
    >
      <div className="flex items-start gap-3">
        <AlertCircle className="mt-0.5 size-5 shrink-0 text-destructive" />
        <div>
          <p className="font-medium text-destructive text-sm">Search failed</p>
          <p className="mt-0.5 text-muted-foreground text-xs">
            Unable to search. Please try again.
          </p>
        </div>
      </div>
    </div>
  );
}

type StateContainerProps = {
  searchState: InviteUserSearchState;
  selectedUser: InviteUserResult | null;
  onSelectUser: (user: InviteUserResult) => void;
  disabled?: boolean;
};

function StateContainer({
  searchState,
  selectedUser,
  onSelectUser,
  disabled,
}: StateContainerProps) {
  switch (searchState.status) {
    case "idle":
      return <IdleState />;
    case "searching":
      return <SearchingStateContent />;
    case "success": {
      // Empty results = not found
      if (searchState.results.length === 0) {
        return <NotFoundState />;
      }

      // Separate invitable users from existing members
      const invitableUsers = searchState.results.filter((u) => !u.isMember);
      const existingMembers = searchState.results.filter((u) => u.isMember);

      // If all results are existing members, show the first one
      if (invitableUsers.length === 0 && existingMembers.length > 0) {
        return <AlreadyMemberCard user={existingMembers[0]} />;
      }

      // Show selectable list of invitable users
      return (
        <UserResultsList
          disabled={disabled}
          onSelectUser={onSelectUser}
          results={invitableUsers}
          selectedUser={selectedUser}
        />
      );
    }
    case "error":
      return <ErrorState />;
    default:
      return null;
  }
}

type RoleSelectorProps = {
  selectedRole: InviteMemberRole;
  onRoleChange: (role: InviteMemberRole) => void;
  disabled?: boolean;
};

const roleOptions: {
  value: InviteMemberRole;
  icon: typeof User;
  label: string;
  description: string;
}[] = [
  {
    value: "member",
    icon: User,
    label: "Member",
    description: "Can view and edit project content",
  },
  {
    value: "admin",
    icon: Shield,
    label: "Admin",
    description: "Can manage members and settings",
  },
];

function RoleSelector({
  selectedRole,
  onRoleChange,
  disabled,
}: RoleSelectorProps) {
  return (
    <div
      className={cn(
        "space-y-2",
        "fade-in slide-in-from-bottom-2 animate-in fill-mode-both duration-200",
        "[animation-delay:100ms]"
      )}
    >
      <Label className="font-medium text-sm">Role</Label>
      <div className="grid grid-cols-2 gap-3">
        {roleOptions.map((option) => {
          const Icon = option.icon;
          const isSelected = selectedRole === option.value;
          return (
            <button
              className={cn(
                "relative flex flex-col items-start gap-1 rounded-lg border p-3 text-left",
                "transition-all duration-200",
                "hover:border-primary/50 hover:bg-muted/50",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20",
                isSelected
                  ? ["border-primary bg-primary/5", "ring-2 ring-primary/20"]
                  : null,
                disabled ? "pointer-events-none opacity-50" : null
              )}
              disabled={disabled}
              key={option.value}
              onClick={() => onRoleChange(option.value)}
              type="button"
            >
              <div className="flex items-center gap-2">
                <Icon
                  className={cn(
                    "size-4",
                    isSelected ? "text-primary" : "text-muted-foreground"
                  )}
                />
                <span
                  className={cn(
                    "font-medium text-sm",
                    isSelected ? "text-foreground" : "text-foreground"
                  )}
                >
                  {option.label}
                </span>
              </div>
              <p className="text-muted-foreground text-xs">
                {option.description}
              </p>
              {/* Selection indicator dot */}
              {isSelected ? (
                <div className="absolute top-2 right-2">
                  <div className="zoom-in-50 size-2 animate-in rounded-full bg-primary duration-150" />
                </div>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function InviteMemberDialog({
  isOpen,
  onOpenChange,
  projectId: _projectId,
  onInvite,
  onSearchUser,
  controlledSearchState,
  isSubmitting = false,
}: InviteMemberDialogProps) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<InviteMemberRole>("member");
  const [selectedUser, setSelectedUser] = useState<InviteUserResult | null>(
    null
  );

  // Use the search hook (disabled when controlled state is provided)
  const { searchState: hookSearchState, reset: resetSearch } =
    useInviteUserSearch({
      query: email,
      onSearch: onSearchUser,
      disabled: controlledSearchState !== undefined,
    });

  // Use controlled state if provided, otherwise use hook state
  const searchState = controlledSearchState ?? hookSearchState;

  // Clear selection when search state changes or selected user is no longer in results
  useEffect(() => {
    // Clear selection when not in success state
    if (searchState.status !== "success") {
      setSelectedUser(null);
      return;
    }

    // Clear selection if selected user is no longer in results
    if (selectedUser) {
      const invitableUsers = searchState.results.filter((u) => !u.isMember);
      const isStillInResults = invitableUsers.some(
        (u) => u.email === selectedUser.email
      );
      if (!isStillInResults) {
        setSelectedUser(null);
      }
    }
  }, [searchState, selectedUser]);

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      // Reset form state when closing
      setEmail("");
      setRole("member");
      setSelectedUser(null);
      resetSearch();
    }
    onOpenChange(open);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedUser) {
      return;
    }

    onInvite?.({
      email: selectedUser.email,
      role,
    });
  };

  const canSubmit = selectedUser !== null && !isSubmitting;

  return (
    <Dialog onOpenChange={handleOpenChange} open={isOpen}>
      <DialogContent className="sm:max-w-[440px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="text-left">
            <DialogTitle className="font-semibold text-lg tracking-tight sm:text-xl">
              Invite team member
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm">
              Search by email to add someone to this project.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-4 sm:mt-6">
            {/* Search Input */}
            <div className="space-y-2">
              <Label className="font-medium text-sm" htmlFor="invite-email">
                Email address
              </Label>
              <div className="relative">
                {/* Left icon */}
                <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
                  {searchState.status === "searching" ? (
                    <Loader2 className="size-4 animate-spin text-muted-foreground" />
                  ) : (
                    <Search className="size-4 text-muted-foreground" />
                  )}
                </div>
                <Input
                  autoComplete="off"
                  className={cn(
                    "h-11 pr-4 pl-10",
                    "transition-all duration-200",
                    "focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-0"
                  )}
                  disabled={isSubmitting}
                  id="invite-email"
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter email address..."
                  type="email"
                  value={email}
                />
              </div>
            </div>

            {/* State Container */}
            <div className="min-h-[100px]">
              <StateContainer
                disabled={isSubmitting}
                onSelectUser={setSelectedUser}
                searchState={searchState}
                selectedUser={selectedUser}
              />
            </div>

            {/* Role Selector - Always visible, disabled until user is selected */}
            <RoleSelector
              disabled={!selectedUser || isSubmitting}
              onRoleChange={setRole}
              selectedRole={role}
            />
          </div>

          <DialogFooter className="mt-5 gap-2 sm:mt-6">
            <Button
              disabled={isSubmitting}
              onClick={() => handleOpenChange(false)}
              type="button"
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              className={cn(
                "min-w-0 transition-all duration-200 sm:min-w-[110px]",
                canSubmit ? "hover:shadow-md hover:shadow-primary/20" : null
              )}
              disabled={!canSubmit}
              type="submit"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Inviting...
                </>
              ) : (
                "Send invite"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
