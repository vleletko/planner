import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import { Toaster } from "@/components/ui/sonner";
import type { InviteUserSearchState } from "./invite-member-dialog";
import { InviteMemberDialog } from "./invite-member-dialog";
import { mockFoundUser } from "./mock-data";

// Module-level regex patterns for Biome compliance
const INVITE_BUTTON = /send invite/i;
const INVITING_BUTTON = /inviting/i;
const CANCEL_BUTTON = /cancel/i;
// Role buttons include description text, so use partial match
const ADMIN_ROLE = /admin.*manage/i;
const MEMBER_ROLE = /member.*view/i;
const EMAIL_LABEL = /email address/i;
const SEARCHING_TEXT = /searching for user/i;

// Helper to select user from results (needed before role selection)
async function selectUserFromResults(dialogCanvas: ReturnType<typeof within>) {
  const userCard = dialogCanvas.getByRole("button", {
    name: new RegExp(mockFoundUser.name, "i"),
  });
  await userEvent.click(userCard);
}

// Controlled states for interaction tests
const userFoundState: InviteUserSearchState = {
  status: "success",
  results: [mockFoundUser],
};
const idleState: InviteUserSearchState = { status: "idle" };

// Mock search function for full flow test
const createMockSearch = () =>
  fn(async (query: string) => {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    if (query.includes("sarah")) {
      return [mockFoundUser];
    }
    return [];
  });

const meta = {
  title: "Projects/InviteMemberDialog/Interactions",
  component: InviteMemberDialog,
  parameters: {
    layout: "centered",
  },
  decorators: [
    (StoryFn) => (
      <>
        <StoryFn />
        <Toaster />
      </>
    ),
  ],
  args: {
    isOpen: true,
    onOpenChange: fn(),
    onInvite: fn(),
    controlledSearchState: userFoundState,
  },
} satisfies Meta<typeof InviteMemberDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Test selecting admin role - first selects a user, then clicks the admin card
 * and verifies it receives selection styling.
 */
export const SelectAdminRole: Story = {
  play: async () => {
    // Dialog content renders in portal, use document.body
    const dialogCanvas = within(document.body);

    // First, select a user from results to enable role selector
    await selectUserFromResults(dialogCanvas);

    // Find the admin role card button
    const adminCard = dialogCanvas.getByRole("button", { name: ADMIN_ROLE });
    const memberCard = dialogCanvas.getByRole("button", { name: MEMBER_ROLE });

    // Initially member should be selected (default)
    // Click admin to select it
    await userEvent.click(adminCard);

    // Admin card should now have selection ring (primary border)
    await expect(adminCard).toHaveClass("border-primary");

    // Member card should NOT have selection ring
    await expect(memberCard).not.toHaveClass("border-primary");
  },
};

/**
 * Test submitting invitation - selects user, then admin role and submits,
 * verifies onInvite callback is called with correct data.
 */
export const SubmitInvite: Story = {
  play: async ({ args }) => {
    const dialogCanvas = within(document.body);

    // First, select a user from results
    await selectUserFromResults(dialogCanvas);

    // Select admin role
    const adminCard = dialogCanvas.getByRole("button", { name: ADMIN_ROLE });
    await userEvent.click(adminCard);

    // Submit form
    const submitButton = dialogCanvas.getByRole("button", {
      name: INVITE_BUTTON,
    });
    await userEvent.click(submitButton);

    // Verify callback was called with correct data
    await expect(args.onInvite).toHaveBeenCalledWith({
      email: mockFoundUser.email,
      role: "admin",
    });
  },
};

/**
 * Test submitting with default member role.
 */
export const SubmitWithMemberRole: Story = {
  play: async ({ args }) => {
    const dialogCanvas = within(document.body);

    // First, select a user from results
    await selectUserFromResults(dialogCanvas);

    // Submit form without changing role (default is member)
    const submitButton = dialogCanvas.getByRole("button", {
      name: INVITE_BUTTON,
    });
    await userEvent.click(submitButton);

    // Verify callback was called with member role
    await expect(args.onInvite).toHaveBeenCalledWith({
      email: mockFoundUser.email,
      role: "member",
    });
  },
};

/**
 * Test cancel dialog - clicks cancel and verifies
 * onOpenChange is called with false.
 */
export const CancelDialog: Story = {
  play: async ({ args }) => {
    const dialogCanvas = within(document.body);

    const cancelButton = dialogCanvas.getByRole("button", {
      name: CANCEL_BUTTON,
    });
    await userEvent.click(cancelButton);

    await expect(args.onOpenChange).toHaveBeenCalledWith(false);
    await expect(args.onInvite).not.toHaveBeenCalled();
  },
};

/**
 * Test keyboard navigation through the dialog after selecting a user.
 * Role cards are disabled until a user is selected.
 */
export const KeyboardNavigation: Story = {
  play: async () => {
    const dialogCanvas = within(document.body);

    // First, select a user to enable role cards for keyboard navigation
    await selectUserFromResults(dialogCanvas);

    const emailInput = dialogCanvas.getByLabelText(EMAIL_LABEL);
    const memberCard = dialogCanvas.getByRole("button", { name: MEMBER_ROLE });
    const adminCard = dialogCanvas.getByRole("button", { name: ADMIN_ROLE });
    const cancelButton = dialogCanvas.getByRole("button", {
      name: CANCEL_BUTTON,
    });
    const submitButton = dialogCanvas.getByRole("button", {
      name: INVITE_BUTTON,
    });

    // Start by clicking email input
    await userEvent.click(emailInput);
    await expect(emailInput).toHaveFocus();

    // Tab to user card (selected user)
    await userEvent.tab();
    // Skip user card - it's a button that was already clicked

    // Tab to member role card
    await userEvent.tab();
    await expect(memberCard).toHaveFocus();

    // Tab to admin role card
    await userEvent.tab();
    await expect(adminCard).toHaveFocus();

    // Tab to cancel button
    await userEvent.tab();
    await expect(cancelButton).toHaveFocus();

    // Tab to submit button
    await userEvent.tab();
    await expect(submitButton).toHaveFocus();
  },
};

/**
 * Test that submit is disabled when no user is found.
 */
export const SubmitDisabledWhenNoUser: Story = {
  args: {
    controlledSearchState: idleState,
  },
  play: async () => {
    const dialogCanvas = within(document.body);

    const submitButton = dialogCanvas.getByRole("button", {
      name: INVITE_BUTTON,
    });

    // Submit button should be disabled
    await expect(submitButton).toBeDisabled();
  },
};

/**
 * Test that submit is disabled during submission.
 */
export const SubmitDisabledDuringSubmission: Story = {
  args: {
    controlledSearchState: userFoundState,
    isSubmitting: true,
  },
  play: async () => {
    const dialogCanvas = within(document.body);

    const submitButton = dialogCanvas.getByRole("button", {
      name: INVITING_BUTTON,
    });

    // Submit button should be disabled during submission
    await expect(submitButton).toBeDisabled();
  },
};

/**
 * Full flow test: type email → see searching state → user found →
 * select user → select role → submit invitation.
 */
export const FullSearchAndInviteFlow: Story = {
  args: {
    // No controlled state - uses real hook
    controlledSearchState: undefined,
    onSearchUser: createMockSearch(),
  },
  play: async ({ args }) => {
    const dialogCanvas = within(document.body);

    // 1. Initially idle state
    const emailInput = dialogCanvas.getByLabelText(EMAIL_LABEL);
    const submitButton = dialogCanvas.getByRole("button", {
      name: INVITE_BUTTON,
    });
    await expect(submitButton).toBeDisabled();

    // 2. Type email to trigger search
    await userEvent.type(emailInput, "sarah@example.com");

    // 3. Wait for searching state (after debounce)
    await waitFor(
      () => {
        expect(dialogCanvas.getByText(SEARCHING_TEXT)).toBeInTheDocument();
      },
      { timeout: 1000 }
    );

    // 4. Wait for user found state
    await waitFor(
      () => {
        expect(dialogCanvas.getByText(mockFoundUser.name)).toBeInTheDocument();
      },
      { timeout: 2000 }
    );

    // 5. Select the found user from results
    await selectUserFromResults(dialogCanvas);

    // 6. Role selector should now be enabled, select admin
    const adminCard = dialogCanvas.getByRole("button", { name: ADMIN_ROLE });
    await userEvent.click(adminCard);
    await expect(adminCard).toHaveClass("border-primary");

    // 7. Submit should now be enabled
    await expect(submitButton).toBeEnabled();
    await userEvent.click(submitButton);

    // 8. Verify onInvite was called with correct data
    await expect(args.onInvite).toHaveBeenCalledWith({
      email: mockFoundUser.email,
      role: "admin",
    });
  },
};
