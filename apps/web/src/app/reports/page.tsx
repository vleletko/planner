import { auth } from "@planner/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function ReportsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/auth/sign-in");
  }

  return (
    <div>
      <h1>Reports</h1>
      <p>Reports page - Coming soon</p>
    </div>
  );
}
