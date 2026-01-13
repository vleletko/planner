import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import { Toaster } from "@/components/ui/sonner";
import { ProjectCreationDialog } from "./project-creation-dialog";

// Module-level regex patterns for Biome compliance
const PROJECT_NAME_LABEL = /project name/i;
const PROJECT_KEY_LABEL = /project key/i;
const DESCRIPTION_LABEL = /description/i;
const CREATE_BUTTON = /create project/i;
const CANCEL_BUTTON = /cancel/i;
const NAME_REQUIRED_ERROR = /project name is required/i;
const KEY_TAKEN_ERROR = /this key is already taken/i;

const meta = {
  title: "Projects/ProjectCreationDialog/Interactions",
  component: ProjectCreationDialog,
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
    onSuccess: fn(),
  },
} satisfies Meta<typeof ProjectCreationDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const FillAndSubmit: Story = {
  play: async ({ args }) => {
    // Dialog content renders in portal, use document.body
    const dialogCanvas = within(document.body);

    const nameInput = dialogCanvas.getByLabelText(PROJECT_NAME_LABEL);
    const keyInput = dialogCanvas.getByLabelText(PROJECT_KEY_LABEL);
    const descriptionInput = dialogCanvas.getByLabelText(DESCRIPTION_LABEL);
    const submitButton = dialogCanvas.getByRole("button", {
      name: CREATE_BUTTON,
    });

    // Type project details
    await userEvent.type(nameInput, "Q1 Marketing Campaign");
    // Key should be auto-generated as "QMC" from name initials
    await expect(keyInput).toHaveValue("QMC");

    await userEvent.type(
      descriptionInput,
      "Track all marketing initiatives for Q1"
    );

    // Submit form
    await userEvent.click(submitButton);

    // Verify callback was called with correct data (including auto-generated key)
    await expect(args.onSuccess).toHaveBeenCalledWith({
      key: "QMC",
      name: "Q1 Marketing Campaign",
      description: "Track all marketing initiatives for Q1",
    });
  },
};

export const SubmitWithNameOnly: Story = {
  play: async ({ args }) => {
    const dialogCanvas = within(document.body);

    const nameInput = dialogCanvas.getByLabelText(PROJECT_NAME_LABEL);
    const keyInput = dialogCanvas.getByLabelText(PROJECT_KEY_LABEL);
    const submitButton = dialogCanvas.getByRole("button", {
      name: CREATE_BUTTON,
    });

    await userEvent.type(nameInput, "Simple Project");
    // Key should be auto-generated as "SP" from name initials
    await expect(keyInput).toHaveValue("SP");

    await userEvent.click(submitButton);

    await expect(args.onSuccess).toHaveBeenCalledWith({
      key: "SP",
      name: "Simple Project",
      description: undefined,
    });
  },
};

export const ValidationError: Story = {
  play: async ({ args }) => {
    const dialogCanvas = within(document.body);

    const nameInput = dialogCanvas.getByLabelText(PROJECT_NAME_LABEL);
    const submitButton = dialogCanvas.getByRole("button", {
      name: CREATE_BUTTON,
    });

    // Try to submit with empty name
    await userEvent.click(submitButton);

    // Check for validation error
    const errorMessage = await dialogCanvas.findByText(NAME_REQUIRED_ERROR);
    await expect(errorMessage).toBeInTheDocument();

    // Verify onSuccess was NOT called
    await expect(args.onSuccess).not.toHaveBeenCalled();

    // Verify input has error styling (aria-invalid)
    await expect(nameInput).toHaveAttribute("aria-invalid", "true");
  },
};

export const ClearErrorOnInput: Story = {
  play: async () => {
    const dialogCanvas = within(document.body);

    const nameInput = dialogCanvas.getByLabelText(PROJECT_NAME_LABEL);
    const submitButton = dialogCanvas.getByRole("button", {
      name: CREATE_BUTTON,
    });

    // Trigger validation error
    await userEvent.click(submitButton);
    await expect(
      dialogCanvas.getByText(NAME_REQUIRED_ERROR)
    ).toBeInTheDocument();

    // Type to clear error
    await userEvent.type(nameInput, "Valid Project Name");

    // Error should be cleared
    await expect(
      dialogCanvas.queryByText(NAME_REQUIRED_ERROR)
    ).not.toBeInTheDocument();
    await expect(nameInput).toHaveAttribute("aria-invalid", "false");
  },
};

export const CancelDialog: Story = {
  play: async ({ args }) => {
    const dialogCanvas = within(document.body);

    const cancelButton = dialogCanvas.getByRole("button", {
      name: CANCEL_BUTTON,
    });

    await userEvent.click(cancelButton);

    await expect(args.onOpenChange).toHaveBeenCalledWith(false);
    await expect(args.onSuccess).not.toHaveBeenCalled();
  },
};

export const CharacterCounter: Story = {
  play: async () => {
    const dialogCanvas = within(document.body);

    const descriptionInput = dialogCanvas.getByLabelText(DESCRIPTION_LABEL);

    // Check initial counter
    await expect(dialogCanvas.getByText("0/500")).toBeInTheDocument();

    // Type some text
    await userEvent.type(descriptionInput, "Hello world");

    // Counter should update
    await expect(dialogCanvas.getByText("11/500")).toBeInTheDocument();
  },
};

export const KeyboardNavigation: Story = {
  play: async () => {
    const dialogCanvas = within(document.body);

    const nameInput = dialogCanvas.getByLabelText(PROJECT_NAME_LABEL);
    const keyInput = dialogCanvas.getByLabelText(PROJECT_KEY_LABEL);
    const descriptionInput = dialogCanvas.getByLabelText(DESCRIPTION_LABEL);
    const cancelButton = dialogCanvas.getByRole("button", {
      name: CANCEL_BUTTON,
    });
    const submitButton = dialogCanvas.getByRole("button", {
      name: CREATE_BUTTON,
    });

    // Focus should start on first input
    await userEvent.click(nameInput);
    await expect(nameInput).toHaveFocus();

    // Tab to key field
    await userEvent.tab();
    await expect(keyInput).toHaveFocus();

    // Tab to description
    await userEvent.tab();
    await expect(descriptionInput).toHaveFocus();

    // Tab to cancel button
    await userEvent.tab();
    await expect(cancelButton).toHaveFocus();

    // Tab to submit button
    await userEvent.tab();
    await expect(submitButton).toHaveFocus();
  },
};

export const ManualKeyEdit: Story = {
  play: async ({ args }) => {
    const dialogCanvas = within(document.body);

    const nameInput = dialogCanvas.getByLabelText(PROJECT_NAME_LABEL);
    const keyInput = dialogCanvas.getByLabelText(PROJECT_KEY_LABEL);
    const submitButton = dialogCanvas.getByRole("button", {
      name: CREATE_BUTTON,
    });

    // Type name first
    await userEvent.type(nameInput, "Test Project");
    await expect(keyInput).toHaveValue("TP"); // Auto-generated

    // Manually edit the key
    await userEvent.clear(keyInput);
    await userEvent.type(keyInput, "CUSTOM");

    // Submit form
    await userEvent.click(submitButton);

    // Verify callback was called with manually entered key
    await expect(args.onSuccess).toHaveBeenCalledWith({
      key: "CUSTOM",
      name: "Test Project",
      description: undefined,
    });
  },
};

// Helper to create a delayed promise for simulating async key check
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Tests key availability check showing success state.
 * Uses a real async mock that returns true (key available).
 */
export const KeyAvailabilityCheckSuccess: Story = {
  args: {
    // Simple async function that returns true (key available)
    onCheckKeyAvailable: async () => {
      await delay(100);
      return true;
    },
  },
  play: async () => {
    const dialogCanvas = within(document.body);

    const nameInput = dialogCanvas.getByLabelText(PROJECT_NAME_LABEL);
    const keyInput = dialogCanvas.getByLabelText(PROJECT_KEY_LABEL);

    // Type name to trigger auto-generated key
    await userEvent.type(nameInput, "Test Project");
    await expect(keyInput).toHaveValue("TP");

    // Blur key field to trigger availability check
    await userEvent.tab();

    // Wait for check to complete (no error should appear)
    await waitFor(() => {
      expect(dialogCanvas.queryByText(KEY_TAKEN_ERROR)).toBeNull();
    });
  },
};

/**
 * Tests full flow: key availability check + submit when key is available.
 */
export const KeyAvailabilityCheckThenSubmit: Story = {
  args: {
    onCheckKeyAvailable: async () => {
      await delay(50);
      return true;
    },
  },
  play: async ({ args }) => {
    const dialogCanvas = within(document.body);

    const nameInput = dialogCanvas.getByLabelText(PROJECT_NAME_LABEL);
    const keyInput = dialogCanvas.getByLabelText(PROJECT_KEY_LABEL);
    const submitButton = dialogCanvas.getByRole("button", {
      name: CREATE_BUTTON,
    });

    // Type name to trigger auto-generated key
    await userEvent.type(nameInput, "Test Project");
    await expect(keyInput).toHaveValue("TP");

    // Blur to trigger check, then wait for it to complete
    await userEvent.tab();

    // Wait for key check to complete (submit button becomes enabled)
    await waitFor(() => {
      expect(submitButton).toBeEnabled();
    });

    // Submit should work since key is available
    await userEvent.click(submitButton);

    // Verify onSuccess was called with correct data
    await expect(args.onSuccess).toHaveBeenCalledWith({
      key: "TP",
      name: "Test Project",
      description: undefined,
    });
  },
};
