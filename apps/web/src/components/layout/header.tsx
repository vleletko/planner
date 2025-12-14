"use client";
import { authClient } from "@/lib/auth-client";
import AuthenticatedHeader from "./authenticated-header";
import PublicHeader from "./public-header";

export default function Header() {
  const { data: session } = authClient.useSession();

  if (session?.user) {
    return <AuthenticatedHeader />;
  }

  return <PublicHeader />;
}
