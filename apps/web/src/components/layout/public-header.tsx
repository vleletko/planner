import Link from "next/link";
import { Button } from "../ui/button";
import { ModeToggle } from "./mode-toggle";

export default function PublicHeader() {
  return (
    <header className="fixed top-0 right-0 left-0 z-50 border-b bg-background">
      <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between gap-6 px-6">
        {/* Left: Logo */}
        <Link className="flex items-center gap-2" href="/auth/sign-in">
          <div className="flex size-8 items-center justify-center rounded-md bg-gradient-to-br from-primary to-primary/80 font-bold text-primary-foreground text-sm">
            P
          </div>
          <span className="font-bold text-lg text-primary">Planner</span>
        </Link>

        {/* Right: Theme Toggle & Sign In */}
        <div className="flex items-center gap-4">
          {/* Theme Toggle */}
          <ModeToggle />

          {/* Sign In Button */}
          <Button asChild variant="outline">
            <Link href="/auth/sign-in">Sign In</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
