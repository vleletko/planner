"use client";
import { Menu, Plus } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Button } from "../ui/button";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "../ui/navigation-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../ui/sheet";
import { ModeToggle } from "./mode-toggle";
import UserMenu from "./user-menu";

type AuthenticatedHeaderProps = {
  user: {
    id: string;
    email: string;
    name: string;
    image?: string | null;
  };
};

export default function AuthenticatedHeader({
  user: _user,
}: AuthenticatedHeaderProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const links = [
    { to: "/dashboard", label: "Board" },
    { to: "/projects", label: "Projects" },
    { to: "/reports", label: "Reports" },
  ] as const;

  return (
    <header className="fixed top-0 right-0 left-0 z-50 border-b bg-background">
      <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between gap-6 px-6">
        {/* Left: Mobile Menu, Logo & Navigation */}
        <div className="flex items-center gap-4 md:gap-8">
          {/* Mobile Menu Button - Only visible on mobile */}
          <Sheet onOpenChange={setMobileMenuOpen} open={mobileMenuOpen}>
            <SheetTrigger asChild>
              <Button
                aria-label="Open navigation menu"
                className="-ml-2 md:hidden"
                size="icon"
                variant="ghost"
              >
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left">
              <SheetHeader>
                <SheetTitle>Navigation</SheetTitle>
              </SheetHeader>
              <nav className="mt-6 flex flex-col gap-4">
                {links.map(({ to, label }) => (
                  <Link
                    className={`flex items-center rounded-md px-3 py-2 font-medium text-base transition-colors hover:bg-accent hover:text-accent-foreground ${
                      pathname === to
                        ? "bg-accent text-accent-foreground"
                        : "text-foreground"
                    }`}
                    href={to}
                    key={to}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {label}
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>

          {/* Logo - grouped together on mobile, separated on desktop */}
          <Link className="flex items-center gap-2" href="/dashboard">
            <div className="flex size-8 items-center justify-center rounded-md bg-gradient-to-br from-primary to-primary/80 font-bold text-primary-foreground text-sm">
              P
            </div>
            <span className="font-bold text-lg text-primary">Planner</span>
          </Link>

          {/* Desktop Navigation - larger gap from logo on desktop */}
          <NavigationMenu className="hidden md:flex" viewport={false}>
            <NavigationMenuList>
              {links.map(({ to, label }) => (
                <NavigationMenuItem key={to}>
                  <NavigationMenuLink active={pathname === to} asChild>
                    <Link className="h-9 px-4 py-2" href={to}>
                      {label}
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        {/* Right: Actions & User Menu */}
        <div className="flex items-center gap-4">
          {/* Primary Action - New Card Button */}
          <Button className="gap-2" size="sm">
            <Plus className="size-4" />
            <span className="hidden sm:inline">New Card</span>
          </Button>

          {/* Theme Toggle */}
          <ModeToggle />

          {/* User Menu */}
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
