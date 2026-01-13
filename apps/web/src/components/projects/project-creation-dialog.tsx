import {
  PROJECT_CONSTRAINTS,
  PROJECT_KEY_REGEX,
} from "@planner/api/lib/validation/project";
import { AlertCircle, Check, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
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
import { validateProjectName } from "@/lib/validation/project";

const KEY_CHECK_DEBOUNCE_MS = 300;

// Top-level regex patterns for key generation (local to this component)
const WHITESPACE_REGEX = /\s+/;
const ALPHANUMERIC_ONLY_REGEX = /[^A-Z0-9]/g;
const LEADING_DIGITS_REGEX = /^(\d+)/;

/**
 * Generate a project key from a name (Jira-style)
 * Takes first letter of each word, uppercase, max 7 chars
 */
function generateProjectKey(name: string): string {
  return (
    name
      .split(WHITESPACE_REGEX)
      .filter((word) => word.length > 0)
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .replace(ALPHANUMERIC_ONLY_REGEX, "")
      .replace(LEADING_DIGITS_REGEX, "")
      .slice(0, PROJECT_CONSTRAINTS.MAX_KEY_LENGTH) || "PROJ"
  );
}

function validateKey(value: string): string | null {
  if (!value.trim()) {
    return "Project key is required";
  }
  if (value.length > PROJECT_CONSTRAINTS.MAX_KEY_LENGTH) {
    return `Key must be ${PROJECT_CONSTRAINTS.MAX_KEY_LENGTH} characters or less`;
  }
  if (!PROJECT_KEY_REGEX.test(value)) {
    return "Key must be uppercase letters/numbers, starting with a letter";
  }
  return null;
}

type KeyStatusIndicatorProps = {
  isCheckingKey: boolean;
  keyAvailable: boolean | null;
  keyError: string | null;
};

function KeyStatusIndicator({
  isCheckingKey,
  keyAvailable,
  keyError,
}: KeyStatusIndicatorProps) {
  if (isCheckingKey) {
    return (
      <Loader2
        aria-label="Checking key availability"
        className="size-4 animate-spin text-muted-foreground"
      />
    );
  }
  if (keyAvailable === true && !keyError) {
    return <Check className="size-4 text-emerald-500" />;
  }
  if (keyAvailable === false || keyError) {
    return <AlertCircle className="size-4 text-destructive" />;
  }
  return null;
}

type NameFieldProps = {
  name: string;
  nameError: string | null;
  isSubmitting: boolean;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur: () => void;
};

function NameField({
  name,
  nameError,
  isSubmitting,
  inputRef,
  onChange,
  onBlur,
}: NameFieldProps) {
  return (
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
        maxLength={PROJECT_CONSTRAINTS.MAX_NAME_LENGTH}
        onBlur={onBlur}
        onChange={onChange}
        placeholder="e.g., Marketing Campaign Q1"
        ref={inputRef}
        value={name}
      />
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
  );
}

type KeyFieldProps = {
  keyValue: string;
  keyError: string | null;
  keyAvailable: boolean | null;
  isCheckingKey: boolean;
  isSubmitting: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur: () => void;
};

function KeyField({
  keyValue,
  keyError,
  keyAvailable,
  isCheckingKey,
  isSubmitting,
  onChange,
  onBlur,
}: KeyFieldProps) {
  const isValid = keyAvailable === true && !keyError;
  return (
    <div className="space-y-2">
      <Label
        className={cn(
          "font-medium text-sm transition-colors",
          keyError ? "text-destructive" : null
        )}
        htmlFor="project-key"
      >
        Project key<span className="text-destructive">*</span>
      </Label>
      <div className="relative">
        <Input
          aria-describedby={keyError ? "key-error" : "key-hint"}
          aria-invalid={!!keyError}
          autoComplete="off"
          className={cn(
            "pr-10 font-mono uppercase transition-all duration-200",
            "focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-0",
            keyError
              ? "border-destructive focus-visible:ring-destructive/20"
              : null,
            isValid
              ? "border-emerald-500 focus-visible:ring-emerald-500/20"
              : null
          )}
          disabled={isSubmitting}
          id="project-key"
          maxLength={PROJECT_CONSTRAINTS.MAX_KEY_LENGTH}
          onBlur={onBlur}
          onChange={onChange}
          placeholder="e.g., MCQ"
          value={keyValue}
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
          <KeyStatusIndicator
            isCheckingKey={isCheckingKey}
            keyAvailable={keyAvailable}
            keyError={keyError}
          />
        </div>
      </div>
      {keyError ? (
        <p
          className="fade-in animate-in text-destructive text-sm"
          id="key-error"
          role="alert"
        >
          {keyError}
        </p>
      ) : (
        <p className="text-muted-foreground text-xs" id="key-hint">
          1-7 uppercase letters/numbers. Cannot be changed after creation.
        </p>
      )}
    </div>
  );
}

type DescriptionFieldProps = {
  description: string;
  isSubmitting: boolean;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
};

function DescriptionField({
  description,
  isSubmitting,
  onChange,
}: DescriptionFieldProps) {
  const descriptionLength = description.length;
  const isNearLimit =
    descriptionLength >= PROJECT_CONSTRAINTS.MAX_DESCRIPTION_LENGTH * 0.9;
  const isAtLimit =
    descriptionLength === PROJECT_CONSTRAINTS.MAX_DESCRIPTION_LENGTH;

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-2">
        <Label className="font-medium text-sm" htmlFor="project-description">
          Description{" "}
          <span className="font-normal text-muted-foreground text-xs">
            (optional)
          </span>
        </Label>
        <span
          className={cn(
            "text-muted-foreground text-xs tabular-nums transition-colors",
            isNearLimit ? "text-amber-500" : null,
            isAtLimit ? "text-destructive" : null
          )}
        >
          {descriptionLength}/{PROJECT_CONSTRAINTS.MAX_DESCRIPTION_LENGTH}
        </span>
      </div>
      <Textarea
        className={cn(
          "min-h-[80px] resize-none transition-all duration-200 sm:min-h-[100px]",
          "focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-0"
        )}
        disabled={isSubmitting}
        id="project-description"
        maxLength={PROJECT_CONSTRAINTS.MAX_DESCRIPTION_LENGTH}
        onChange={onChange}
        placeholder="Briefly describe what this project is about..."
        value={description}
      />
    </div>
  );
}

export type ProjectCreationDialogProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (project: {
    key: string;
    name: string;
    description?: string;
  }) => void;
  onCheckKeyAvailable?: (key: string, signal?: AbortSignal) => Promise<boolean>;
  isSubmitting?: boolean;
  serverError?: string | null;
};

export function ProjectCreationDialog({
  isOpen,
  onOpenChange,
  onSuccess,
  onCheckKeyAvailable,
  isSubmitting = false,
  serverError = null,
}: ProjectCreationDialogProps) {
  const [name, setName] = useState("");
  const [key, setKey] = useState("");
  const [description, setDescription] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);
  const [keyError, setKeyError] = useState<string | null>(null);
  const [isCheckingKey, setIsCheckingKey] = useState(false);
  const [keyAvailable, setKeyAvailable] = useState<boolean | null>(null);
  const [touched, setTouched] = useState({
    name: false,
    key: false,
    description: false,
  });
  const [keyManuallyEdited, setKeyManuallyEdited] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const keyCheckTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Auto-generate key from name when name changes (unless manually edited)
  useEffect(() => {
    if (!keyManuallyEdited && name) {
      const generatedKey = generateProjectKey(name);
      setKey(generatedKey);
      setKeyAvailable(null);
      setKeyError(null);
    }
  }, [name, keyManuallyEdited]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setName(value);
    if (touched.name) {
      setNameError(validateProjectName(value));
    }
  };

  const handleNameBlur = () => {
    setTouched((prev) => ({ ...prev, name: true }));
    setNameError(validateProjectName(name));
  };

  const handleKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
      .toUpperCase()
      .replace(ALPHANUMERIC_ONLY_REGEX, "");
    setKey(value);
    setKeyManuallyEdited(true);
    setKeyAvailable(null);
    if (touched.key) {
      setKeyError(validateKey(value));
    }
  };

  const checkKeyAvailability = (keyToCheck: string) => {
    if (!onCheckKeyAvailable) {
      return;
    }

    // Cancel any pending timeout
    if (keyCheckTimeoutRef.current) {
      clearTimeout(keyCheckTimeoutRef.current);
    }

    // Cancel any in-flight request
    abortControllerRef.current?.abort();

    keyCheckTimeoutRef.current = setTimeout(() => {
      const controller = new AbortController();
      abortControllerRef.current = controller;

      setIsCheckingKey(true);
      onCheckKeyAvailable(keyToCheck, controller.signal)
        .then((available) => {
          if (controller.signal.aborted) {
            return;
          }
          setKeyAvailable(available);
          if (!available) {
            setKeyError("This key is already taken");
          }
        })
        .catch((err) => {
          // Ignore abort errors - they're intentional
          if (err instanceof Error && err.name === "AbortError") {
            return;
          }
          if (controller.signal.aborted) {
            return;
          }
          setKeyAvailable(null);
        })
        .finally(() => {
          if (!controller.signal.aborted) {
            setIsCheckingKey(false);
          }
        });
    }, KEY_CHECK_DEBOUNCE_MS);
  };

  const handleKeyBlur = () => {
    setTouched((prev) => ({ ...prev, key: true }));
    const error = validateKey(key);
    setKeyError(error);

    if (!error && key) {
      checkKeyAvailability(key);
    }
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

    const nameErr = validateProjectName(name);
    const keyErr = validateKey(key);

    if (nameErr) {
      setNameError(nameErr);
      setTouched({ name: true, key: true, description: true });
      nameInputRef.current?.focus();
      return;
    }

    if (keyErr) {
      setKeyError(keyErr);
      setTouched({ name: true, key: true, description: true });
      return;
    }

    if (keyAvailable === false) {
      setKeyError("This key is already taken");
      return;
    }

    onSuccess?.({
      key: key.trim(),
      name: name.trim(),
      description: description.trim() || undefined,
    });
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setName("");
      setKey("");
      setDescription("");
      setNameError(null);
      setKeyError(null);
      setKeyAvailable(null);
      setIsCheckingKey(false);
      setKeyManuallyEdited(false);
      setTouched({ name: false, key: false, description: false });
      if (keyCheckTimeoutRef.current) {
        clearTimeout(keyCheckTimeoutRef.current);
      }
      // Cancel any in-flight key availability check
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    }
    onOpenChange(open);
  };

  const hasError = nameError || keyError || serverError;
  const canSubmit = !hasError && name.trim() && key.trim();

  return (
    <Dialog onOpenChange={handleOpenChange} open={isOpen}>
      <DialogContent className="sm:max-w-[480px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="text-left">
            <DialogTitle className="font-semibold text-lg tracking-tight sm:text-xl">
              Create new project
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm">
              Give your project a clear name and unique key to get started.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-4 sm:mt-6 sm:space-y-5">
            <NameField
              inputRef={nameInputRef}
              isSubmitting={isSubmitting}
              name={name}
              nameError={nameError}
              onBlur={handleNameBlur}
              onChange={handleNameChange}
            />

            <KeyField
              isCheckingKey={isCheckingKey}
              isSubmitting={isSubmitting}
              keyAvailable={keyAvailable}
              keyError={keyError}
              keyValue={key}
              onBlur={handleKeyBlur}
              onChange={handleKeyChange}
            />

            <DescriptionField
              description={description}
              isSubmitting={isSubmitting}
              onChange={handleDescriptionChange}
            />

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
                canSubmit ? "hover:shadow-md hover:shadow-primary/20" : null
              )}
              disabled={isSubmitting || isCheckingKey}
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
