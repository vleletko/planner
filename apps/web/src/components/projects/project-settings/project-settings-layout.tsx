import { ArrowLeft, Settings, Users } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export type ProjectSettingsTab = "overview" | "members";

export type ProjectSettingsLayoutProps = {
  projectName: string;
  activeTab?: ProjectSettingsTab;
  onTabChange?: (tab: ProjectSettingsTab) => void;
  overviewContent: ReactNode;
  membersContent: ReactNode;
};

function getProjectInitial(name: string): string {
  return name.charAt(0).toUpperCase();
}

export function ProjectSettingsLayout({
  projectName,
  activeTab = "overview",
  onTabChange,
  overviewContent,
  membersContent,
}: ProjectSettingsLayoutProps) {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 sm:px-0">
      {/* Back Link */}
      <Link
        aria-label="Back to projects"
        className="mb-4 inline-flex items-center gap-1.5 text-muted-foreground text-sm transition-colors hover:text-foreground"
        href="/projects"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        <span>Back to projects</span>
      </Link>

      {/* Header */}
      <div className="relative mb-4 pb-4 sm:mb-6 sm:pb-5">
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Project Avatar */}
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/70 font-semibold text-lg text-primary-foreground shadow-md shadow-primary/20 sm:size-12 sm:text-xl">
            {getProjectInitial(projectName)}
          </div>
          <div>
            <h1 className="font-semibold text-xl tracking-tight sm:text-2xl">
              Project Settings
            </h1>
            <p className="mt-0.5 text-muted-foreground text-sm">
              Manage settings for{" "}
              <span className="font-medium text-foreground">{projectName}</span>
            </p>
          </div>
        </div>
        {/* Gradient accent line */}
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-primary/50 via-primary/20 to-transparent" />
      </div>

      {/* Tabs */}
      <Tabs
        defaultValue={activeTab}
        onValueChange={(value) => onTabChange?.(value as ProjectSettingsTab)}
      >
        <TabsList className="mb-4 h-auto gap-1 bg-transparent p-0 sm:mb-6">
          <TabsTrigger
            className="gap-2 rounded-lg border border-transparent px-4 py-2 text-muted-foreground transition-all duration-200 hover:bg-muted/50 hover:text-foreground data-[state=active]:border-border data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
            value="overview"
          >
            <Settings className="size-4" />
            <span>Overview</span>
          </TabsTrigger>
          <TabsTrigger
            className="gap-2 rounded-lg border border-transparent px-4 py-2 text-muted-foreground transition-all duration-200 hover:bg-muted/50 hover:text-foreground data-[state=active]:border-border data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
            value="members"
          >
            <Users className="size-4" />
            <span>Members</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent
          className="fade-in slide-in-from-left-2 animate-in duration-200"
          value="overview"
        >
          {overviewContent}
        </TabsContent>

        <TabsContent
          className="fade-in slide-in-from-right-2 animate-in duration-200"
          value="members"
        >
          {membersContent}
        </TabsContent>
      </Tabs>
    </div>
  );
}
