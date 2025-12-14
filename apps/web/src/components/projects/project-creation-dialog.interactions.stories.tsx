import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import { Toaster } from "@/components/ui/sonner";
import { ProjectCreationDialog } from "./project-creation-dialog";

// Module-level regex patterns for Biome compliance
const PROJECT_NAME_LABEL = /project name/i;
const DESCRIPTION_LABEL = /description/i;
const CREATE_BUTTON = /create project/i;
const CANCEL_BUTTON = /cancel/i;
const NAME_REQUIRED_ERROR = /project name is required/i;

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
    const descriptionInput = dialogCanvas.getByLabelText(DESCRIPTION_LABEL);
    const submitButton = dialogCanvas.getByRole("button", {
      name: CREATE_BUTTON,
    });

    // Type project details
    await userEvent.type(nameInput, "Q1 Marketing Campaign");
    await userEvent.type(
      descriptionInput,
      "Track all marketing initiatives for Q1"
    );

    // Submit form
    await userEvent.click(submitButton);

    // Verify callback was called with correct data
    await expect(args.onSuccess).toHaveBeenCalledWith({
      name: "Q1 Marketing Campaign",
      description: "Track all marketing initiatives for Q1",
    });
  },
};

export const SubmitWithNameOnly: Story = {
  play: async ({ args }) => {
    const dialogCanvas = within(document.body);

    const nameInput = dialogCanvas.getByLabelText(PROJECT_NAME_LABEL);
    const submitButton = dialogCanvas.getByRole("button", {
      name: CREATE_BUTTON,
    });

    await userEvent.type(nameInput, "Simple Project");
    await userEvent.click(submitButton);

    await expect(args.onSuccess).toHaveBeenCalledWith({
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
