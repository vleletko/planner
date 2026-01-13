import { redirect } from "next/navigation";

type ProjectPageProps = {
  params: Promise<{ projectId: string }>;
};

/**
 * Project overview page - redirects to settings.
 * The overview page is reserved for future use (project-scoped resources, etc.)
 * See: _bmad-output/implementation-artifacts/epic-2-retrospective-topics.md
 */
export default async function ProjectPage({ params }: ProjectPageProps) {
  const { projectId } = await params;
  redirect(`/projects/${projectId}/settings`);
}
