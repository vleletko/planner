import { auth } from "@planner/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function ProjectsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/auth/sign-in");
  }

  return (
    <div>
      <h1>Projects</h1>
      <p>Projects page - Coming soon</p>
    </div>
  );
}
