import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { Toaster } from "@/components/ui/sonner";
import { mockTransferableMembers } from "./mock-data";
import { TransferOwnershipDialog } from "./transfer-ownership-dialog";

const meta = {
  title: "Projects/TransferOwnershipDialog",
  component: TransferOwnershipDialog,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
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
 * Default state - dialog open with no member selected and checkbox unchecked.
 * The "Transfer Ownership" button is disabled.
 */
export const Default: Story = {};

/**
 * Long project name - tests text truncation and layout with long names.
 */
export const LongProjectName: Story = {
  args: {
    projectName:
      "This Is A Very Long Project Name That Should Wrap Or Truncate Properly",
  },
};

/**
 * Submitting state - shows loading spinner while transfer is in progress.
 * All form elements are disabled.
 */
export const Submitting: Story = {
  args: {
    isSubmitting: true,
  },
};

/**
 * Mobile viewport - responsive layout on small screens.
 */
export const Mobile: Story = {
  globals: {
    viewport: { value: "mobile1" },
  },
};

/**
 * Tablet viewport - responsive layout on medium screens.
 */
export const Tablet: Story = {
  globals: {
    viewport: { value: "tablet" },
  },
};
