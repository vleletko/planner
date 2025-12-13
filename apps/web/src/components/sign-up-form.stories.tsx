import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn, mocked } from "storybook/test";
import { authClient } from "@/lib/auth-client";
import SignUpForm from "./sign-up-form";
import { Toaster } from "./ui/sonner";

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
  title: "Components/SignUpForm",
  component: SignUpForm,
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
    onSwitchToSignIn: fn(),
  },
  beforeEach() {
    mocked(authClient.useSession).mockReturnValue(mockSessionIdle);
    mocked(authClient.signUp.email).mockResolvedValue({
      data: null,
      error: null,
    });
  },
} satisfies Meta<typeof SignUpForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Loading: Story = {
  beforeEach() {
    mocked(authClient.useSession).mockReturnValue(mockSessionPending);
  },
};

export const SignUpError: Story = {
  beforeEach() {
    mocked(authClient.useSession).mockReturnValue(mockSessionIdle);
    mocked(authClient.signUp.email).mockImplementation(
      (_credentials, options) => {
        options?.onError?.({
          error: {
            status: 409,
            statusText: "Conflict",
            message: "Email already exists",
          },
        } as unknown as Parameters<NonNullable<typeof options.onError>>[0]);
        return Promise.resolve({
          data: null,
          error: { message: "Email already exists" },
        });
      }
    );
  },
};
