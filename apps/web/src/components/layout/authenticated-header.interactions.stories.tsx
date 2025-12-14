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
  title: "Layout/Header/Authenticated/Interactions",
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

export const SignOut: Story = {
  beforeEach() {
    mocked(authClient.signOut).mockResolvedValue({ success: true });
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);

    const userMenuButton = canvas.getByRole("button", {
      name: USER_MENU_PATTERN,
    });
    await userEvent.click(userMenuButton);

    const signOutMenuItem = await body.findByRole("menuitem", {
      name: SIGN_OUT_PATTERN,
    });
    await userEvent.click(signOutMenuItem);

    await expect(mocked(authClient.signOut)).toHaveBeenCalled();
  },
};
