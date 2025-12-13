import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ThemeProvider } from "next-themes";
import { expect, fn, mocked, userEvent, within } from "storybook/test";

import { authClient } from "@/lib/auth-client";
import AuthenticatedHeader from "./authenticated-header";

const mockUser = {
  id: "user-123",
  email: "john.doe@example.com",
  name: "John Doe",
  image: null,
};

const mockSession = {
  user: {
    ...mockUser,
    createdAt: new Date(),
    updatedAt: new Date(),
    emailVerified: true,
  },
  session: {
    id: "session-123",
    userId: mockUser.id,
    createdAt: new Date(),
    updatedAt: new Date(),
    expiresAt: new Date(Date.now() + 86_400_000),
    token: "mock-token",
  },
};

const USER_MENU_PATTERN = /user menu/i;
const SIGN_OUT_PATTERN = /sign out/i;

const meta = {
  title: "Components/AuthenticatedHeader",
  component: AuthenticatedHeader,
  parameters: {
    layout: "fullscreen",
    nextjs: {
      appDirectory: true,
      navigation: {
        pathname: "/dashboard",
      },
    },
  },
  tags: ["autodocs"],
  decorators: [
    (StoryFn) => (
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        disableTransitionOnChange
        enableSystem
      >
        <StoryFn />
      </ThemeProvider>
    ),
  ],
  args: {
    user: mockUser,
  },
} satisfies Meta<typeof AuthenticatedHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const OnProjectsPage: Story = {
  parameters: {
    nextjs: {
      appDirectory: true,
      navigation: {
        pathname: "/projects",
      },
    },
  },
};

export const OnReportsPage: Story = {
  parameters: {
    nextjs: {
      appDirectory: true,
      navigation: {
        pathname: "/reports",
      },
    },
  },
};

export const WithContent: Story = {
  decorators: [
    (StoryFn) => (
      <>
        <StoryFn />
        <main className="px-6 pt-20">
          <div className="mx-auto max-w-[1280px]">
            <h1 className="font-bold text-2xl">Dashboard</h1>
            <p className="mt-4 text-muted-foreground">
              Welcome back! Here's an overview of your projects.
            </p>
          </div>
        </main>
      </>
    ),
  ],
};

export const LongUserName: Story = {
  args: {
    user: {
      id: "user-456",
      email: "alexander.maximilian.thompson@example.com",
      name: "Alexander Maximilian Thompson",
      image: null,
    },
  },
};

export const SignOutInteraction: Story = {
  beforeEach() {
    mocked(authClient.useSession).mockReturnValue({
      data: mockSession,
      isPending: false,
      isRefetching: false,
      error: null,
      refetch: fn(),
    });
    mocked(authClient.signOut).mockResolvedValue({ success: true });
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Use document.body for portal elements (dropdown menus)
    const body = within(document.body);

    // Click on user menu button
    const userMenuButton = canvas.getByRole("button", {
      name: USER_MENU_PATTERN,
    });
    await userEvent.click(userMenuButton);

    // Click on Sign Out menu item (rendered in portal)
    const signOutMenuItem = await body.findByRole("menuitem", {
      name: SIGN_OUT_PATTERN,
    });
    await userEvent.click(signOutMenuItem);

    // Verify signOut was called
    await expect(mocked(authClient.signOut)).toHaveBeenCalled();
  },
};
