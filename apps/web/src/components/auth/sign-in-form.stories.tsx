import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn, mocked } from "storybook/test";
import { authClient } from "@/lib/auth-client";
import { Toaster } from "../ui/sonner";
import SignInForm from "./sign-in-form";

const mockSessionIdle = {
  isPending: false,
  isRefetching: false,
  data: null,
  error: null,
  refetch: fn(),
} as const;

const mockSessionPending = {
  isPending: true,
  isRefetching: false,
  data: null,
  error: null,
  refetch: fn(),
} as const;

const meta = {
  title: "Auth/SignInForm",
  component: SignInForm,
  parameters: {
    layout: "centered",
    nextjs: {
      appDirectory: true,
      navigation: {
        pathname: "/auth",
      },
    },
  },
  tags: ["autodocs"],
  decorators: [
    (StoryComponent) => (
      <>
        <StoryComponent />
        <Toaster />
      </>
    ),
  ],
  args: {
    onSwitchToSignUp: fn(),
  },
  beforeEach() {
    mocked(authClient.useSession).mockReturnValue(mockSessionIdle);
    mocked(authClient.signIn.email).mockResolvedValue({
      data: null,
      error: null,
    });
  },
} satisfies Meta<typeof SignInForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Loading: Story = {
  beforeEach() {
    mocked(authClient.useSession).mockReturnValue(mockSessionPending);
  },
};

export const SignInError: Story = {
  beforeEach() {
    mocked(authClient.useSession).mockReturnValue(mockSessionIdle);
    mocked(authClient.signIn.email).mockImplementation(
      (_credentials, options) => {
        // Cast to unknown to satisfy complex ErrorContext type in stories
        options?.onError?.({
          error: {
            status: 401,
            statusText: "Unauthorized",
            message: "Invalid email or password",
          },
        } as unknown as Parameters<NonNullable<typeof options.onError>>[0]);
        return Promise.resolve({
          data: null,
          error: { message: "Invalid email or password" },
        });
      }
    );
  },
};
