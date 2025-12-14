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

const NAV_LINKS = [BOARD_LINK, PROJECTS_LINK, REPORTS_LINK] as const;

/** Verifies only the expected link has data-active="true" */
const verifyActiveLink =
  (activeLink: RegExp) =>
  async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    const canvas = within(canvasElement);
    for (const link of NAV_LINKS) {
      const element = canvas.getByRole("link", { name: link });
      const expectedValue = link === activeLink ? "true" : "false";
      await expect(element).toHaveAttribute("data-active", expectedValue);
    }
  };

const meta = {
  title: "Layout/Header/Authenticated",
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
  play: verifyActiveLink(BOARD_LINK),
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
  play: verifyActiveLink(PROJECTS_LINK),
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
  play: verifyActiveLink(REPORTS_LINK),
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
