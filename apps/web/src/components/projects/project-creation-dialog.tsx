import { Loader2 } from "lucide-react";
import { useRef, useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const MAX_DESCRIPTION_LENGTH = 500;
const MAX_NAME_LENGTH = 100;

export type ProjectCreationDialogProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (project: { name: string; description?: string }) => void;
  isSubmitting?: boolean;
  serverError?: string | null;
};

export function ProjectCreationDialog({
  isOpen,
  onOpenChange,
  onSuccess,
  isSubmitting = false,
  serverError = null,
}: ProjectCreationDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);
  const [touched, setTouched] = useState({ name: false, description: false });
  const nameInputRef = useRef<HTMLInputElement>(null);

  const validateName = (value: string): string | null => {
    if (!value.trim()) {
      return "Project name is required";
    }
    if (value.length > MAX_NAME_LENGTH) {
      return `Name must be ${MAX_NAME_LENGTH} characters or less`;
    }
    return null;
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setName(value);
    if (touched.name) {
      setNameError(validateName(value));
    }
  };

  const handleNameBlur = () => {
    setTouched((prev) => ({ ...prev, name: true }));
    setNameError(validateName(name));
  };

  const handleDescriptionChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    const value = e.target.value;
    if (value.length <= MAX_DESCRIPTION_LENGTH) {
      setDescription(value);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const error = validateName(name);
    if (error) {
      setNameError(error);
      setTouched({ name: true, description: true });
      nameInputRef.current?.focus();
      return;
    }

    onSuccess?.({
      name: name.trim(),
      description: description.trim() || undefined,
    });
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      // Reset form state when closing
      setName("");
      setDescription("");
      setNameError(null);
      setTouched({ name: false, description: false });
    }
    onOpenChange(open);
  };

  const hasError = nameError || serverError;
  const descriptionLength = description.length;
  const isNearLimit = descriptionLength >= MAX_DESCRIPTION_LENGTH * 0.9;

  return (
    <Dialog onOpenChange={handleOpenChange} open={isOpen}>
      <DialogContent className="sm:max-w-[480px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="text-left">
            <DialogTitle className="font-semibold text-lg tracking-tight sm:text-xl">
              Create new project
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm">
              Give your project a clear name to get started.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-4 sm:mt-6 sm:space-y-5">
            {/* Project Name Field */}
            <div className="space-y-2">
              <Label
                className={cn(
                  "font-medium text-sm transition-colors",
                  nameError ? "text-destructive" : null
                )}
                htmlFor="project-name"
              >
                Project name<span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Input
                  aria-describedby={nameError ? "name-error" : ""}
                  aria-invalid={!!nameError}
                  autoComplete="off"
                  className={cn(
                    "transition-all duration-200",
                    "focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-0",
                    nameError
                      ? "border-destructive focus-visible:ring-destructive/20"
                      : null
                  )}
                  disabled={isSubmitting}
                  id="project-name"
                  maxLength={MAX_NAME_LENGTH}
                  onBlur={handleNameBlur}
                  onChange={handleNameChange}
                  placeholder="e.g., Marketing Campaign Q1"
                  ref={nameInputRef}
                  value={name}
                />
                {/* Subtle focus indicator line */}
                <div
                  className={cn(
                    "-bottom-px absolute inset-x-0 h-0.5 scale-x-0 bg-primary transition-transform duration-200",
                    "peer-focus:scale-x-100"
                  )}
                />
              </div>
              {nameError ? (
                <p
                  className="fade-in animate-in text-destructive text-sm"
                  id="name-error"
                  role="alert"
                >
                  {nameError}
                </p>
              ) : null}
            </div>

            {/* Project Description Field */}
            <div className="space-y-2">
              <div className="flex items-baseline justify-between gap-2">
                <Label
                  className="font-medium text-sm"
                  htmlFor="project-description"
                >
                  Description{" "}
                  <span className="font-normal text-muted-foreground text-xs">
                    (optional)
                  </span>
                </Label>
                <span
                  className={cn(
                    "text-muted-foreground text-xs tabular-nums transition-colors",
                    isNearLimit ? "text-amber-500" : null,
                    descriptionLength === MAX_DESCRIPTION_LENGTH
                      ? "text-destructive"
                      : null
                  )}
                >
                  {descriptionLength}/{MAX_DESCRIPTION_LENGTH}
                </span>
              </div>
              <Textarea
                className={cn(
                  "min-h-[80px] resize-none transition-all duration-200 sm:min-h-[100px]",
                  "focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-0"
                )}
                disabled={isSubmitting}
                id="project-description"
                onChange={handleDescriptionChange}
                placeholder="Briefly describe what this project is about..."
                value={description}
              />
            </div>

            {/* Server Error */}
            {serverError ? (
              <div
                className="fade-in slide-in-from-top-1 animate-in rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3"
                role="alert"
              >
                <p className="font-medium text-destructive text-sm">
                  {serverError}
                </p>
              </div>
            ) : null}
          </div>

          <DialogFooter className="mt-5 gap-2 sm:mt-8">
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
                "min-w-0 transition-all duration-200 sm:min-w-[120px]",
                !hasError && name.trim()
                  ? "hover:shadow-md hover:shadow-primary/20"
                  : null
              )}
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create project"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
