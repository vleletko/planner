import { AlertTriangle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type DangerZoneProps = {
  projectName: string;
  onDeleteProject?: () => void;
  canDelete?: boolean;
};

export function DangerZone({
  projectName,
  onDeleteProject,
  canDelete = true,
}: DangerZoneProps) {
  return (
    <Card
      className={cn(
        "relative overflow-hidden border-destructive/30 bg-destructive/5",
        // Subtle animated border glow
        "before:absolute before:inset-0 before:rounded-xl before:border before:border-destructive/20",
        "before:animate-pulse before:[animation-duration:3s]"
      )}
    >
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2.5">
          {/* Warning icon badge */}
          <div className="flex size-8 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="size-4 text-destructive" />
          </div>
          <CardTitle className="font-semibold text-base text-destructive">
            Danger Zone
          </CardTitle>
        </div>
        <CardDescription className="mt-1.5">
          Irreversible actions that affect the entire project.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-3 rounded-lg border border-destructive/20 bg-background p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:p-4">
          <div className="space-y-1">
            <p className="font-medium text-sm">Delete this project</p>
            <p className="text-muted-foreground text-sm">
              Permanently delete{" "}
              <span className="font-medium text-destructive/80">
                {projectName}
              </span>{" "}
              and all its data.
            </p>
          </div>
          <Button
            className={cn(
              "shrink-0 gap-2 transition-all duration-200",
              "hover:shadow-destructive/20 hover:shadow-lg"
            )}
            disabled={!canDelete}
            onClick={onDeleteProject}
            variant="destructive"
          >
            <Trash2 className="size-4" />
            Delete project
          </Button>
        </div>

        {canDelete ? null : (
          <p className="mt-3 text-muted-foreground text-xs">
            Only project owners can delete projects.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
