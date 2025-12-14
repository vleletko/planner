import Link from "next/link";
import { Button } from "../ui/button";
import { HeaderLogo } from "./header-logo";
import { HeaderShell } from "./header-shell";
import { ModeToggle } from "./mode-toggle";

export default function PublicHeader() {
  return (
    <HeaderShell>
      {/* Left: Logo */}
      <HeaderLogo href="/" />

      {/* Right: Theme Toggle & Sign In */}
      <div className="flex items-center gap-4">
        {/* Theme Toggle */}
        <ModeToggle />

        {/* Sign In Button */}
        <Button asChild variant="outline">
          <Link href="/auth/sign-in">Sign In</Link>
        </Button>
      </div>
    </HeaderShell>
  );
}
