import { Check, Loader2 } from "lucide-react";
import { useState } from "react";
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

const MAX_DESCRIPTION_LENGTH = 500;
const MAX_NAME_LENGTH = 100;

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
  initialName: string;
  initialDescription?: string;
  onSave?: (data: { name: string; description?: string }) => void;
  isSaving?: boolean;
  saveSuccess?: boolean;
};

export function OverviewTab({
  initialName,
  initialDescription = "",
  onSave,
  isSaving = false,
  saveSuccess = false,
}: OverviewTabProps) {
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);
  const [nameError, setNameError] = useState<string | null>(null);

  const hasChanges = name !== initialName || description !== initialDescription;
  const showUnsavedIndicator = hasChanges && !isSaving && !saveSuccess;
  const descriptionLength = description.length;
  const isNearLimit = descriptionLength >= MAX_DESCRIPTION_LENGTH * 0.9;

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
    if (nameError) {
      setNameError(validateName(value));
    }
  };

  const handleNameBlur = () => {
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
      return;
    }

    onSave?.({
      name: name.trim(),
      description: description.trim() || undefined,
    });
  };

  return (
    <div className="space-y-6">
      {/* Project Details Card */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Project Details</CardTitle>
          <CardDescription>
            Update your project's name and description.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
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
                    : null
                )}
                disabled={isSaving}
                id="settings-project-name"
                maxLength={MAX_NAME_LENGTH}
                onBlur={handleNameBlur}
                onChange={handleNameChange}
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
                <span
                  className={cn(
                    "text-muted-foreground text-xs tabular-nums",
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
                  "min-h-[100px] resize-none transition-all duration-200",
                  "focus-visible:ring-primary/30 focus-visible:ring-offset-0"
                )}
                disabled={isSaving}
                id="settings-project-description"
                onChange={handleDescriptionChange}
                placeholder="Describe what this project is about..."
                value={description}
              />
            </div>

            {/* Save Button */}
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
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
