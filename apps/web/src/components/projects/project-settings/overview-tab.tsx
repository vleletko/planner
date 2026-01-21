import { PROJECT_CONSTRAINTS } from "@planner/api/lib/validation/project";
import { Check, Eye, Loader2, Lock, Trash2 } from "lucide-react";
import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { validateProjectName } from "@/lib/validation/project";

function SaveButtonContent({
  isSaving,
  saveSuccess,
}: {
  isSaving: boolean;
  saveSuccess: boolean;
}) {
  if (isSaving) {
    return (
      <>
        <Loader2 className="mr-2 size-4 animate-spin" />
        Saving...
      </>
    );
  }
  if (saveSuccess) {
    return (
      <>
        <Check className="zoom-in-50 mr-2 size-4 animate-in duration-200" />
        <span className="fade-in animate-in duration-200">Saved</span>
      </>
    );
  }
  return "Save changes";
}

export type OverviewTabProps = {
  projectKey: string;
  initialName: string;
  initialDescription?: string;
  onSave?: (data: { name: string; description?: string }) => void;
  isSaving?: boolean;
  saveSuccess?: boolean;
  isReadOnly?: boolean;
  canDelete?: boolean;
  onDelete?: () => void;
};

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Form component with read-only mode requires branching logic
export function OverviewTab({
  projectKey,
  initialName,
  initialDescription = "",
  onSave,
  isSaving = false,
  saveSuccess = false,
  isReadOnly = false,
  canDelete = false,
  onDelete,
}: OverviewTabProps) {
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);
  const [nameError, setNameError] = useState<string | null>(null);

  const hasChanges = name !== initialName || description !== initialDescription;
  const showUnsavedIndicator = hasChanges && !isSaving && !saveSuccess;
  const descriptionLength = description.length;
  const isNearLimit =
    descriptionLength >= PROJECT_CONSTRAINTS.MAX_DESCRIPTION_LENGTH * 0.9;

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setName(value);
    if (nameError) {
      setNameError(validateProjectName(value));
    }
  };

  const handleNameBlur = () => {
    setNameError(validateProjectName(name));
  };

  const handleDescriptionChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    const value = e.target.value;
    if (value.length <= PROJECT_CONSTRAINTS.MAX_DESCRIPTION_LENGTH) {
      setDescription(value);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const error = validateProjectName(name);
    if (error) {
      setNameError(error);
      return;
    }

    onSave?.({
      name: name.trim(),
      description: description.trim() || undefined,
    });
  };

  return (
    <div className="space-y-6">
      {/* Read-only Alert */}
      {isReadOnly ? (
        <Alert className="border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/30">
          <Eye className="size-4 text-blue-600 dark:text-blue-400" />
          <AlertDescription className="text-blue-700 dark:text-blue-300">
            You have view-only access to this project. Only project owners and
            admins can edit settings.
          </AlertDescription>
        </Alert>
      ) : null}

      {/* Project Details Card */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Project Details</CardTitle>
          <CardDescription>
            {isReadOnly
              ? "View your project's name and description."
              : "Update your project's name and description."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            {/* Project Key Field (Read-only) */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label className="text-sm" htmlFor="settings-project-key">
                  Project key
                </Label>
                <span
                  className="inline-flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 text-muted-foreground text-xs"
                  title="Project key cannot be changed after creation"
                >
                  <Lock className="size-3" />
                  Locked
                </span>
              </div>
              <Input
                className="cursor-not-allowed bg-muted/50 font-mono uppercase"
                disabled
                id="settings-project-key"
                readOnly
                value={projectKey}
              />
              <p className="text-muted-foreground text-xs">
                Project key cannot be changed after creation.
              </p>
            </div>

            {/* Name Field */}
            <div className="space-y-2">
              <Label
                className={cn("text-sm", nameError ? "text-destructive" : null)}
                htmlFor="settings-project-name"
              >
                Project name
              </Label>
              <Input
                aria-describedby={nameError ? "settings-name-error" : ""}
                aria-invalid={!!nameError}
                className={cn(
                  "transition-all duration-200",
                  "focus-visible:ring-primary/30 focus-visible:ring-offset-0",
                  nameError
                    ? "border-destructive focus-visible:ring-destructive/30"
                    : null,
                  isReadOnly ? "cursor-not-allowed bg-muted/50" : null
                )}
                disabled={isSaving || isReadOnly}
                id="settings-project-name"
                maxLength={PROJECT_CONSTRAINTS.MAX_NAME_LENGTH}
                onBlur={handleNameBlur}
                onChange={handleNameChange}
                readOnly={isReadOnly}
                value={name}
              />
              {nameError ? (
                <p
                  className="text-destructive text-sm"
                  id="settings-name-error"
                  role="alert"
                >
                  {nameError}
                </p>
              ) : null}
            </div>

            {/* Description Field */}
            <div className="space-y-2">
              <div className="flex items-baseline justify-between gap-2">
                <Label htmlFor="settings-project-description">
                  Description
                </Label>
                {isReadOnly ? null : (
                  <span
                    className={cn(
                      "text-muted-foreground text-xs tabular-nums",
                      isNearLimit ? "text-amber-500" : null,
                      descriptionLength ===
                        PROJECT_CONSTRAINTS.MAX_DESCRIPTION_LENGTH
                        ? "text-destructive"
                        : null
                    )}
                  >
                    {descriptionLength}/
                    {PROJECT_CONSTRAINTS.MAX_DESCRIPTION_LENGTH}
                  </span>
                )}
              </div>
              <Textarea
                className={cn(
                  "min-h-[100px] resize-none transition-all duration-200",
                  "focus-visible:ring-primary/30 focus-visible:ring-offset-0",
                  isReadOnly ? "cursor-not-allowed bg-muted/50" : null
                )}
                disabled={isSaving || isReadOnly}
                id="settings-project-description"
                maxLength={PROJECT_CONSTRAINTS.MAX_DESCRIPTION_LENGTH}
                onChange={handleDescriptionChange}
                placeholder={
                  isReadOnly
                    ? "No description provided"
                    : "Describe what this project is about..."
                }
                readOnly={isReadOnly}
                value={description}
              />
            </div>

            {/* Save Button - hidden in read-only mode */}
            {isReadOnly ? null : (
              <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:items-center sm:gap-3">
                <Button
                  className={cn(
                    "min-w-[100px] transition-all duration-200",
                    "hover:shadow-md hover:shadow-primary/20",
                    saveSuccess
                      ? "bg-emerald-600 hover:bg-emerald-600 hover:shadow-emerald-600/20"
                      : null
                  )}
                  disabled={isSaving || !hasChanges || !!nameError}
                  type="submit"
                >
                  <SaveButtonContent
                    isSaving={isSaving}
                    saveSuccess={saveSuccess}
                  />
                </Button>
                {showUnsavedIndicator ? (
                  <span className="flex items-center gap-2 text-muted-foreground text-sm">
                    <span className="relative flex size-2">
                      <span className="absolute inline-flex size-full animate-ping rounded-full bg-amber-400 opacity-75" />
                      <span className="relative inline-flex size-2 rounded-full bg-amber-500" />
                    </span>
                    Unsaved changes
                  </span>
                ) : null}
              </div>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Danger Zone - only visible to project owners */}
      {canDelete ? (
        <Card className="border-destructive/30">
          <CardHeader className="pb-4">
            <CardTitle className="text-base text-destructive">
              Danger Zone
            </CardTitle>
            <CardDescription>
              Irreversible actions that affect your entire project.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <p className="font-medium text-sm">Delete this project</p>
                <p className="text-muted-foreground text-xs">
                  Archive this project. It can be restored within 30 days.
                </p>
              </div>
              <Button
                className="gap-2"
                onClick={onDelete}
                type="button"
                variant="destructive"
              >
                <Trash2 className="size-4" />
                Delete Project
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
