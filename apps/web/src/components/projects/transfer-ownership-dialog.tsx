import { AlertTriangle, Loader2, UserCog } from "lucide-react";
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { TransferableMember } from "./mock-data";
import { getInitials } from "./utils";

export type TransferOwnershipDialogProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  projectName: string;
  currentMembers: TransferableMember[];
  onTransfer?: (newOwnerId: string) => void;
  isSubmitting?: boolean;
};

type WarningBannerProps = {
  children: React.ReactNode;
};

function WarningBanner({ children }: WarningBannerProps) {
  return (
    <div
      className={cn(
        "relative rounded-lg border border-amber-500/30 bg-amber-500/5 p-4",
        "before:absolute before:inset-y-0 before:left-0 before:w-1 before:rounded-l-lg before:bg-amber-500"
      )}
    >
      <div className="flex items-start gap-3 pl-2">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-amber-500/10">
          <AlertTriangle className="size-4 text-amber-600" />
        </div>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}

type MemberSelectItemProps = {
  member: TransferableMember;
};

function MemberSelectItem({ member }: MemberSelectItemProps) {
  return (
    <div className="flex items-center gap-3">
      <Avatar className="size-7">
        {member.avatar ? (
          <AvatarImage alt={member.name} src={member.avatar} />
        ) : null}
        <AvatarFallback className="bg-muted font-medium text-muted-foreground text-xs">
          {getInitials(member.name)}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-sm">{member.name}</p>
      </div>
    </div>
  );
}

export function TransferOwnershipDialog({
  isOpen,
  onOpenChange,
  projectName,
  currentMembers,
  onTransfer,
  isSubmitting = false,
}: TransferOwnershipDialogProps) {
  const [selectedMemberId, setSelectedMemberId] = useState<string>("");
  const [confirmationChecked, setConfirmationChecked] = useState(false);

  const selectedMember = currentMembers.find((m) => m.id === selectedMemberId);

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      // Reset form state when closing
      setSelectedMemberId("");
      setConfirmationChecked(false);
    }
    onOpenChange(open);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!(selectedMemberId && confirmationChecked)) {
      return;
    }

    onTransfer?.(selectedMemberId);
  };

  const canSubmit =
    selectedMemberId !== "" && confirmationChecked && !isSubmitting;

  return (
    <Dialog onOpenChange={handleOpenChange} open={isOpen}>
      <DialogContent className="sm:max-w-[550px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="text-left">
            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-500/5 ring-1 ring-amber-500/20">
                <UserCog className="size-5 text-amber-600" strokeWidth={1.5} />
              </div>
              <div>
                <DialogTitle className="font-semibold text-lg tracking-tight">
                  Transfer Ownership
                </DialogTitle>
                <DialogDescription className="text-muted-foreground text-sm">
                  Transfer ownership of{" "}
                  <span className="font-semibold text-foreground">
                    {projectName}
                  </span>{" "}
                  to another member.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="mt-5 space-y-5 sm:mt-6">
            {/* Warning Banner */}
            <WarningBanner>
              <p className="font-semibold text-amber-700 text-sm dark:text-amber-500">
                You will become a regular member after transfer
              </p>
              <p className="mt-1 text-muted-foreground text-xs">
                The new owner will have full control over project settings,
                members, and can delete the project.
              </p>
            </WarningBanner>

            {/* New Owner Selector */}
            <div className="space-y-2">
              <Label
                className="font-medium text-sm"
                htmlFor="new-owner-select-trigger"
              >
                Select new owner
              </Label>
              <Select
                disabled={isSubmitting}
                onValueChange={setSelectedMemberId}
                value={selectedMemberId}
              >
                <SelectTrigger
                  className={cn(
                    "h-11 w-full",
                    "transition-all duration-200",
                    "focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-0"
                  )}
                  id="new-owner-select-trigger"
                >
                  <SelectValue placeholder="Choose a team member...">
                    {selectedMember ? (
                      <MemberSelectItem member={selectedMember} />
                    ) : null}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {currentMembers.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      <MemberSelectItem member={member} />
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Confirmation Checkbox */}
            <div
              className={cn(
                "flex items-start gap-3 rounded-lg border p-4",
                "transition-all duration-200",
                confirmationChecked
                  ? "border-destructive/30 bg-destructive/5"
                  : "border-border bg-muted/30"
              )}
            >
              <Checkbox
                checked={confirmationChecked}
                disabled={isSubmitting}
                id="confirm-transfer"
                onCheckedChange={(checked) =>
                  setConfirmationChecked(checked === true)
                }
              />
              <Label
                className={cn(
                  "cursor-pointer text-sm leading-relaxed",
                  confirmationChecked
                    ? "text-destructive"
                    : "text-muted-foreground"
                )}
                htmlFor="confirm-transfer"
              >
                I understand this action cannot be undone. My role will change
                from Owner to Member.
              </Label>
            </div>
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
                "min-w-0 transition-all duration-200 sm:min-w-[160px]",
                canSubmit ? "hover:shadow-destructive/20 hover:shadow-md" : null
              )}
              disabled={!canSubmit}
              type="submit"
              variant="destructive"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Transferring...
                </>
              ) : (
                "Transfer Ownership"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
