import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Skeleton } from "./ui/skeleton";

/**
 * UserMenu component displays user account information and sign out action.
 *
 * Note: The actual component uses authClient.useSession() which requires
 * authentication context. These stories show the visual states using
 * isolated UI components.
 */
const meta = {
  title: "Components/UserMenu",
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const getInitials = (name: string) => {
  const parts = name.trim().split(" ");
  if (parts.length >= 2) {
    const lastPart = parts.at(-1);
    return `${parts[0][0]}${lastPart?.[0] ?? ""}`.toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

export const Loading: Story = {
  render: () => <Skeleton className="h-9 w-24" />,
};

export const NotAuthenticated: Story = {
  render: () => <Button variant="outline">Sign In</Button>,
};

export const Authenticated: Story = {
  render: () => {
    const user = {
      name: "John Doe",
      email: "john.doe@example.com",
    };
    const initials = getInitials(user.name);

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            aria-label="User menu"
            className="gap-2 rounded-full pr-1 pl-1 sm:pl-4"
            variant="outline"
          >
            <span className="hidden sm:inline">{user.name}</span>
            <div className="flex size-7 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/80 font-semibold text-primary-foreground text-xs">
              {initials}
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 bg-card">
          <DropdownMenuLabel>My Account</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-muted-foreground text-sm">
            {user.email}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Button className="w-full" size="sm" variant="destructive">
              Sign Out
            </Button>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  },
};

export const LongName: Story = {
  render: () => {
    const user = {
      name: "Alexander Thompson",
      email: "alexander.thompson@example.com",
    };
    const initials = getInitials(user.name);

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            aria-label="User menu"
            className="gap-2 rounded-full pr-1 pl-1 sm:pl-4"
            variant="outline"
          >
            <span className="hidden sm:inline">{user.name}</span>
            <div className="flex size-7 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/80 font-semibold text-primary-foreground text-xs">
              {initials}
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 bg-card">
          <DropdownMenuLabel>My Account</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-muted-foreground text-sm">
            {user.email}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Button className="w-full" size="sm" variant="destructive">
              Sign Out
            </Button>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  },
};
