import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import { Toaster } from "@/components/ui/sonner";
import { DeleteProjectDialog } from "./delete-project-dialog";
import { mockImpactData } from "./mock-data";

// Module-level regex patterns (REQUIRED by Biome)
const DELETE_BUTTON = /delete project/i;
const DELETING_BUTTON = /deleting/i;
const CANCEL_BUTTON = /cancel/i;

const meta = {
  title: "Projects/DeleteProjectDialog/Interactions",
  component: DeleteProjectDialog,
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
    projectName: "My Project",
    projectKey: "PROJ",
    impact: mockImpactData,
    onOpenChange: fn(),
    onConfirm: fn(),
  },
} satisfies Meta<typeof DeleteProjectDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Test typing the project name to enable the delete button.
 * Partial name keeps button disabled, exact match enables it.
 */
export const TypeNameToEnableDelete: Story = {
  play: async ({ args }) => {
    // Dialog content renders in portal, use document.body
    const dialogCanvas = within(document.body);

    const input = dialogCanvas.getByRole("textbox");
    const deleteButton = dialogCanvas.getByRole("button", {
      name: DELETE_BUTTON,
    });

    // Initially disabled
    await expect(deleteButton).toBeDisabled();

    // Type partial name - still disabled
    await userEvent.type(input, "My Pro");
    await expect(deleteButton).toBeDisabled();

    // Clear and type full name - enabled
    await userEvent.clear(input);
    await userEvent.type(input, args.projectName);
    await expect(deleteButton).toBeEnabled();
  },
};

/**
 * Test submitting the deletion after typing the correct name.
 * Verifies onConfirm callback is called.
 */
export const SubmitDeletion: Story = {
  play: async ({ args }) => {
    const dialogCanvas = within(document.body);

    const input = dialogCanvas.getByRole("textbox");
    const deleteButton = dialogCanvas.getByRole("button", {
      name: DELETE_BUTTON,
    });

    // Type full name
    await userEvent.type(input, args.projectName);
    await expect(deleteButton).toBeEnabled();

    // Click delete
    await userEvent.click(deleteButton);

    // Verify callback was called
    await expect(args.onConfirm).toHaveBeenCalled();
  },
};

/**
 * Test that name matching is case-sensitive.
 * Wrong case keeps button disabled.
 */
export const CaseSensitiveMatch: Story = {
  play: async ({ args }) => {
    const dialogCanvas = within(document.body);

    const input = dialogCanvas.getByRole("textbox");
    const deleteButton = dialogCanvas.getByRole("button", {
      name: DELETE_BUTTON,
    });

    // Type wrong case - should stay disabled
    await userEvent.type(input, "my project");
    await expect(deleteButton).toBeDisabled();

    // Clear and type correct case - should enable
    await userEvent.clear(input);
    await userEvent.type(input, args.projectName);
    await expect(deleteButton).toBeEnabled();
  },
};

/**
 * Test that clicking cancel closes the dialog without calling onConfirm.
 */
export const CancelDialog: Story = {
  play: async ({ args }) => {
    const dialogCanvas = within(document.body);

    await userEvent.click(
      dialogCanvas.getByRole("button", { name: CANCEL_BUTTON })
    );

    await expect(args.onOpenChange).toHaveBeenCalledWith(false);
    await expect(args.onConfirm).not.toHaveBeenCalled();
  },
};

/**
 * Test that delete button is disabled during submission.
 */
export const SubmitDisabledDuringSubmission: Story = {
  args: {
    isSubmitting: true,
  },
  play: async () => {
    const dialogCanvas = within(document.body);

    const deleteButton = dialogCanvas.getByRole("button", {
      name: DELETING_BUTTON,
    });

    // Should be disabled during submission
    await expect(deleteButton).toBeDisabled();
  },
};
