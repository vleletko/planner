import { auth } from "@planner/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ProjectSettingsContent } from "./project-settings-content";

type ProjectSettingsPageProps = {
  params: Promise<{ projectId: string }>;
};

export default async function ProjectSettingsPage({
  params,
}: ProjectSettingsPageProps) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/auth/sign-in");
  }

  const { projectId } = await params;

  return (
    <div className="container mx-auto px-4 py-8">
      <ProjectSettingsContent projectId={projectId} />
    </div>
  );
}
