import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import { Toaster } from "@/components/ui/sonner";
import { mockTransferableMembers } from "./mock-data";
import { TransferOwnershipDialog } from "./transfer-ownership-dialog";

// Module-level regex patterns (REQUIRED by Biome)
const TRANSFER_BUTTON = /transfer ownership/i;
const CANCEL_BUTTON = /cancel/i;
const BOB_ADMIN_OPTION = /bob admin/i;

const meta = {
  title: "Projects/TransferOwnershipDialog/Interactions",
  component: TransferOwnershipDialog,
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
    projectName: "My Awesome Project",
    currentMembers: mockTransferableMembers,
    onOpenChange: fn(),
    onTransfer: fn(),
  },
} satisfies Meta<typeof TransferOwnershipDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Submit button enables only when both member selected AND checkbox checked.
 */
export const EnablesSubmitWhenBothConditionsMet: Story = {
  play: async () => {
    const dialogCanvas = within(document.body);

    // Select member
    const selectTrigger = dialogCanvas.getByRole("combobox");
    await userEvent.click(selectTrigger);
    await userEvent.click(
      dialogCanvas.getByRole("option", { name: BOB_ADMIN_OPTION })
    );

    // Check confirmation checkbox
    await userEvent.click(dialogCanvas.getByRole("checkbox"));

    // Verify submit is now enabled
    const submitButton = dialogCanvas.getByRole("button", {
      name: TRANSFER_BUTTON,
    });
    await expect(submitButton).toBeEnabled();
  },
};

/**
 * Submitting calls onTransfer with the selected member's ID.
 */
export const SubmitsWithCorrectMemberId: Story = {
  play: async ({ args }) => {
    const dialogCanvas = within(document.body);

    // Select member
    const selectTrigger = dialogCanvas.getByRole("combobox");
    await userEvent.click(selectTrigger);
    await userEvent.click(
      dialogCanvas.getByRole("option", { name: BOB_ADMIN_OPTION })
    );

    // Check checkbox and submit
    await userEvent.click(dialogCanvas.getByRole("checkbox"));
    await userEvent.click(
      dialogCanvas.getByRole("button", { name: TRANSFER_BUTTON })
    );

    // Verify callback received correct member ID
    await expect(args.onTransfer).toHaveBeenCalledWith("member-1");
  },
};

/**
 * Toggling checkbox on/off toggles submit button enabled/disabled state.
 */
export const CheckboxTogglesSubmitState: Story = {
  play: async () => {
    const dialogCanvas = within(document.body);

    // Select member first
    const selectTrigger = dialogCanvas.getByRole("combobox");
    await userEvent.click(selectTrigger);
    await userEvent.click(
      dialogCanvas.getByRole("option", { name: BOB_ADMIN_OPTION })
    );

    const checkbox = dialogCanvas.getByRole("checkbox");
    const submitButton = dialogCanvas.getByRole("button", {
      name: TRANSFER_BUTTON,
    });

    // Initially disabled (checkbox unchecked)
    await expect(submitButton).toBeDisabled();

    // Check → enabled
    await userEvent.click(checkbox);
    await expect(submitButton).toBeEnabled();

    // Uncheck → disabled again
    await userEvent.click(checkbox);
    await expect(submitButton).toBeDisabled();
  },
};

/**
 * Cancel closes dialog without triggering transfer.
 */
export const CancelClosesWithoutTransfer: Story = {
  play: async ({ args }) => {
    const dialogCanvas = within(document.body);

    await userEvent.click(
      dialogCanvas.getByRole("button", { name: CANCEL_BUTTON })
    );

    await expect(args.onOpenChange).toHaveBeenCalledWith(false);
    await expect(args.onTransfer).not.toHaveBeenCalled();
  },
};

/**
 * Submit requires member selection - checkbox alone is not enough.
 */
export const RequiresMemberSelection: Story = {
  play: async () => {
    const dialogCanvas = within(document.body);
    const submitButton = dialogCanvas.getByRole("button", {
      name: TRANSFER_BUTTON,
    });

    // Initially disabled
    await expect(submitButton).toBeDisabled();

    // Only checkbox checked (no member) - still disabled
    await userEvent.click(dialogCanvas.getByRole("checkbox"));
    await expect(submitButton).toBeDisabled();
  },
};

/**
 * Submit requires confirmation checkbox - member selection alone is not enough.
 */
export const RequiresConfirmationCheckbox: Story = {
  play: async () => {
    const dialogCanvas = within(document.body);

    // Select member only
    const selectTrigger = dialogCanvas.getByRole("combobox");
    await userEvent.click(selectTrigger);
    await userEvent.click(
      dialogCanvas.getByRole("option", { name: BOB_ADMIN_OPTION })
    );

    // Verify submit is still disabled without checkbox
    const submitButton = dialogCanvas.getByRole("button", {
      name: TRANSFER_BUTTON,
    });
    await expect(submitButton).toBeDisabled();
  },
};
