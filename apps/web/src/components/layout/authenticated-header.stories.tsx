import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ThemeProvider } from "next-themes";
import { expect, fn, mocked, within } from "storybook/test";
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

const BOARD_LINK = /^board$/i;
const PROJECTS_LINK = /^projects$/i;
const REPORTS_LINK = /^reports$/i;

const meta = {
  title: "Layout/AuthenticatedHeader",
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
  beforeEach() {
    mocked(authClient.useSession).mockReturnValue({
      data: mockSession,
      isPending: false,
      isRefetching: false,
      error: null,
      refetch: fn(),
    });
  },
} satisfies Meta<typeof AuthenticatedHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const boardLink = canvas.getByRole("link", { name: BOARD_LINK });
    const projectsLink = canvas.getByRole("link", { name: PROJECTS_LINK });
    const reportsLink = canvas.getByRole("link", { name: REPORTS_LINK });

    await expect(boardLink).toHaveAttribute("data-active", "true");
    await expect(projectsLink).toHaveAttribute("data-active", "false");
    await expect(reportsLink).toHaveAttribute("data-active", "false");
  },
};

export const OnProjectsPage: Story = {
  parameters: {
    nextjs: {
      appDirectory: true,
      navigation: {
        pathname: "/projects",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const boardLink = canvas.getByRole("link", { name: BOARD_LINK });
    const projectsLink = canvas.getByRole("link", { name: PROJECTS_LINK });
    const reportsLink = canvas.getByRole("link", { name: REPORTS_LINK });

    await expect(boardLink).toHaveAttribute("data-active", "false");
    await expect(projectsLink).toHaveAttribute("data-active", "true");
    await expect(reportsLink).toHaveAttribute("data-active", "false");
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
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const boardLink = canvas.getByRole("link", { name: BOARD_LINK });
    const projectsLink = canvas.getByRole("link", { name: PROJECTS_LINK });
    const reportsLink = canvas.getByRole("link", { name: REPORTS_LINK });

    await expect(boardLink).toHaveAttribute("data-active", "false");
    await expect(projectsLink).toHaveAttribute("data-active", "false");
    await expect(reportsLink).toHaveAttribute("data-active", "true");
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
  beforeEach() {
    mocked(authClient.useSession).mockReturnValue({
      data: {
        user: {
          id: "user-456",
          email: "alexander.maximilian.thompson@example.com",
          name: "Alexander Maximilian Thompson",
          image: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          emailVerified: true,
        },
        session: {
          id: "session-456",
          userId: "user-456",
          createdAt: new Date(),
          updatedAt: new Date(),
          expiresAt: new Date(Date.now() + 86_400_000),
          token: "mock-token",
        },
      },
      isPending: false,
      isRefetching: false,
      error: null,
      refetch: fn(),
    });
  },
};
