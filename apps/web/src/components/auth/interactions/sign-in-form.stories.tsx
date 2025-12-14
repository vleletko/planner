import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, mocked, userEvent, within } from "storybook/test";
import { authClient } from "@/lib/auth-client";
import { Toaster } from "../../ui/sonner";
import SignInForm from "../sign-in-form";

const NEED_ACCOUNT_PATTERN = /need an account/i;

const mockSessionIdle = {
  isPending: false,
  isRefetching: false,
  data: null,
  error: null,
  refetch: fn(),
} as const;

const meta = {
  title: "Auth/SignInForm/Interactions",
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

export const SuccessfulSubmit: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    const emailInput = canvas.getByLabelText("Email");
    const passwordInput = canvas.getByLabelText("Password");
    const submitButton = canvas.getByRole("button", { name: "Sign In" });

    await userEvent.type(emailInput, "test@example.com");
    await userEvent.type(passwordInput, "password123");
    await userEvent.click(submitButton);

    await expect(authClient.signIn.email).toHaveBeenCalledOnce();
    await expect(args.onSwitchToSignUp).not.toHaveBeenCalled();
  },
};

export const SwitchToSignUp: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    const switchLink = canvas.getByRole("button", {
      name: NEED_ACCOUNT_PATTERN,
    });
    await userEvent.click(switchLink);

    await expect(args.onSwitchToSignUp).toHaveBeenCalledOnce();
  },
};
