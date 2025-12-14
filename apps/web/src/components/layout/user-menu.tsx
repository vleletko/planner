"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { authClient } from "@/lib/auth-client";
import { Button } from "../ui/button";
import { Skeleton } from "../ui/skeleton";

export default function UserMenu() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  if (isPending) {
    return <Skeleton className="h-9 w-24" />;
  }

  if (!session) {
    return (
      <Button asChild variant="outline">
        <Link href="/auth/sign-in">Sign In</Link>
      </Button>
    );
  }

  // Get user initials for avatar
  const getInitials = (name: string | null) => {
    if (!name) {
      return "?";
    }
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      const lastPart = parts.at(-1);
      return `${parts[0][0]}${lastPart?.[0] ?? ""}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const initials = getInitials(session.user.name);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          aria-label="User menu"
          className="gap-2 rounded-full pr-1 pl-1 sm:pl-4"
          variant="outline"
        >
          <span className="hidden sm:inline">{session.user.name}</span>
          <div className="flex size-7 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/80 font-semibold text-primary-foreground text-xs">
            {initials}
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 bg-card">
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-muted-foreground text-sm">
          {session.user.email}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Button
            className="w-full"
            onClick={() => {
              authClient.signOut({
                fetchOptions: {
                  onSuccess: () => {
                    router.push("/");
                  },
                },
              });
            }}
            size="sm"
            variant="destructive"
          >
            Sign Out
          </Button>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
