import { AlertTriangle, Loader2, Trash2 } from "lucide-react";
import { useState } from "react";
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

export type ProjectImpact = {
  cardCount: number;
  memberCount: number;
  resourceCount: number;
};

export type DeleteProjectDialogProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  projectName: string;
  projectKey: string;
  impact?: ProjectImpact;
  isLoadingImpact?: boolean;
  onConfirm?: () => void;
  isSubmitting?: boolean;
};

type ImpactSummaryProps = {
  impact?: ProjectImpact;
  isLoading?: boolean;
};

function ImpactSummary({ impact, isLoading }: ImpactSummaryProps) {
  const metrics = [
    { count: impact?.cardCount ?? 0, label: "cards" },
    { count: impact?.memberCount ?? 0, label: "members" },
    { count: impact?.resourceCount ?? 0, label: "resources" },
  ];

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg border border-destructive/20",
        "bg-gradient-to-b from-destructive/[0.03] to-transparent"
      )}
    >
      {/* Subtle top accent line */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-destructive/40 to-transparent" />

      <div className="px-3 py-4 sm:px-5 sm:py-5">
        {/* Warning text */}
        <p className="text-center font-medium text-muted-foreground text-sm">
          <AlertTriangle className="mr-1.5 mb-0.5 inline-block size-4 text-destructive/70" />
          This will archive the following
        </p>

        {/* Metrics row */}
        <div className="mt-3 grid grid-cols-3 divide-x divide-destructive/15 sm:mt-4">
          {metrics.map(({ count, label }) => (
            <div className="flex flex-col items-center py-2" key={label}>
              {isLoading ? (
                <Loader2 className="size-6 animate-spin text-muted-foreground sm:size-8" />
              ) : (
                <span className="font-bold text-destructive text-xl tabular-nums tracking-tight sm:text-3xl">
                  {count}
                </span>
              )}
              <span className="mt-1 text-[10px] text-muted-foreground uppercase tracking-wide sm:text-xs">
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function DeleteProjectDialog({
  isOpen,
  onOpenChange,
  projectName,
  projectKey,
  impact,
  isLoadingImpact = false,
  onConfirm,
  isSubmitting = false,
}: DeleteProjectDialogProps) {
  const [confirmationText, setConfirmationText] = useState("");

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      // Reset form state when closing
      setConfirmationText("");
    }
    onOpenChange(open);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (confirmationText !== projectName || isSubmitting || isLoadingImpact) {
      return;
    }

    onConfirm?.();
  };

  // Validation: exact match, case-sensitive
  const canSubmit =
    confirmationText === projectName && !isSubmitting && !isLoadingImpact;
  const hasInput = confirmationText.length > 0;
  const isPartialMatch =
    hasInput && !canSubmit && projectName.startsWith(confirmationText);
  const isMismatch =
    hasInput && !canSubmit && !isPartialMatch && !isLoadingImpact;

  return (
    <Dialog onOpenChange={handleOpenChange} open={isOpen}>
      <DialogContent className="sm:max-w-[550px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="text-left">
            <div className="flex items-center gap-3">
              {/* Destructive gradient badge with subtle pulse animation */}
              <div
                className={cn(
                  "flex size-10 shrink-0 items-center justify-center rounded-xl",
                  "bg-gradient-to-br from-destructive/20 to-destructive/5",
                  "ring-1 ring-destructive/20",
                  "animate-pulse [animation-duration:3s]"
                )}
              >
                <Trash2 className="size-5 text-destructive" strokeWidth={1.5} />
              </div>
              <div>
                <DialogTitle className="font-semibold text-lg tracking-tight">
                  Delete Project
                </DialogTitle>
                <DialogDescription className="text-muted-foreground text-sm">
                  Archive{" "}
                  <span className="font-semibold text-foreground">
                    {projectName}
                  </span>{" "}
                  ({projectKey})
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="mt-5 space-y-5 sm:mt-6">
            {/* Soft-delete info banner */}
            <div
              className={cn(
                "relative rounded-lg border border-amber-500/30 bg-amber-500/5 p-4",
                "before:absolute before:inset-y-0 before:left-0 before:w-1 before:rounded-l-lg before:bg-amber-500"
              )}
            >
              <div className="pl-2">
                <p className="font-semibold text-amber-700 text-sm dark:text-amber-500">
                  Project will be archived for 30 days
                </p>
                <p className="mt-1 text-muted-foreground text-xs">
                  During this period, a system administrator can restore it.
                  After 30 days, the project will be permanently deleted.
                </p>
              </div>
            </div>

            {/* Impact Summary */}
            <ImpactSummary impact={impact} isLoading={isLoadingImpact} />

            {/* Name Confirmation Input */}
            <div className="space-y-2">
              <p className="font-medium text-sm">
                Type{" "}
                <span className="font-semibold text-foreground">
                  {projectName}
                </span>{" "}
                to confirm
              </p>
              <Label className="sr-only" htmlFor="confirm-name">
                Project name confirmation
              </Label>
              <Input
                aria-describedby={isMismatch ? "name-mismatch-error" : ""}
                aria-invalid={isMismatch}
                autoComplete="off"
                className={cn(
                  "transition-all duration-200",
                  "focus-visible:ring-2 focus-visible:ring-offset-0",
                  canSubmit || isMismatch
                    ? "border-destructive focus-visible:ring-destructive/20"
                    : "focus-visible:ring-primary/20"
                )}
                disabled={isSubmitting}
                id="confirm-name"
                onChange={(e) => setConfirmationText(e.target.value)}
                placeholder={projectName}
                value={confirmationText}
              />
              {isMismatch ? (
                <p
                  className="text-destructive text-sm"
                  id="name-mismatch-error"
                  role="alert"
                >
                  Name doesn't match. Please type the exact project name.
                </p>
              ) : null}
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
                "min-w-0 transition-all duration-200 sm:min-w-[140px]",
                canSubmit ? "hover:shadow-destructive/20 hover:shadow-md" : null
              )}
              disabled={!canSubmit}
              type="submit"
              variant="destructive"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Project"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
