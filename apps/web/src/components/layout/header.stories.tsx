import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ThemeProvider } from "next-themes";
import { fn, mocked } from "storybook/test";
import { authClient } from "@/lib/auth-client";
import Header from "./header";

const mockUser = {
  id: "user-123",
  email: "john.doe@example.com",
  name: "John Doe",
  emailVerified: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  image: null,
};

const mockSession = {
  id: "session-123",
  userId: "user-123",
  expiresAt: new Date(Date.now() + 86_400_000),
  createdAt: new Date(),
  updatedAt: new Date(),
  token: "mock-token",
};

const meta = {
  title: "Layout/Header",
  component: Header,
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
    (StoryComponent) => (
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        disableTransitionOnChange
        enableSystem
      >
        <StoryComponent />
      </ThemeProvider>
    ),
  ],
  beforeEach() {
    mocked(authClient.useSession).mockReturnValue({
      isPending: false,
      isRefetching: false,
      data: null,
      error: null,
      refetch: fn(),
    });
  },
} satisfies Meta<typeof Header>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Unauthenticated: Story = {};

export const Authenticated: Story = {
  beforeEach() {
    mocked(authClient.useSession).mockReturnValue({
      isPending: false,
      isRefetching: false,
      data: { user: mockUser, session: mockSession },
      error: null,
      refetch: fn(),
    });
  },
};

export const AuthenticatedWithLongName: Story = {
  beforeEach() {
    mocked(authClient.useSession).mockReturnValue({
      isPending: false,
      isRefetching: false,
      data: {
        user: {
          ...mockUser,
          id: "user-456",
          email: "alexander.thompson@example.com",
          name: "Alexander Thompson",
        },
        session: mockSession,
      },
      error: null,
      refetch: fn(),
    });
  },
};
