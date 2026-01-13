import { auth } from "@planner/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ProjectsContent } from "./projects-content";

export default async function ProjectsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/auth/sign-in");
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <ProjectsContent />
    </div>
  );
}
