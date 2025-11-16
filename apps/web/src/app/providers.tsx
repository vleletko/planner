"use client";

import { AuthUIProvider } from "@daveyplate/better-auth-ui";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { queryClient } from "@/utils/orpc";
import { ThemeProvider } from "../components/theme-provider";
import { Toaster } from "../components/ui/sonner";

export default function Providers({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      storageKey="planner-theme"
    >
      <QueryClientProvider client={queryClient}>
        <AuthUIProvider
          authClient={authClient}
          // Wrapper for typedRoutes compatibility
          // See: https://github.com/daveyplate/better-auth-ui/issues/140#issuecomment-2208878371
          Link={(props) => (
            <Link className={props.className} href={props.href as Route}>
              {props.children}
            </Link>
          )}
          navigate={(href) => router.push(href as Route)}
          onSessionChange={() => router.refresh()}
          replace={(href) => router.replace(href as Route)}
        >
          {children}
        </AuthUIProvider>
        <ReactQueryDevtools />
      </QueryClientProvider>
      <Toaster richColors />
    </ThemeProvider>
  );
}
