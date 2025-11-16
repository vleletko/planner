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
          Link={Link}
          // Cast to Route for typedRoutes compatibility
          // See: https://nextjs.org/docs/app/api-reference/config/typescript#statically-typed-links
          // "For non-literal strings, cast to Route"
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
