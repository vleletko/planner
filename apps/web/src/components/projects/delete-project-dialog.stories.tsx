import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn, userEvent, within } from "storybook/test";
import { Toaster } from "@/components/ui/sonner";
import { DeleteProjectDialog } from "./delete-project-dialog";
import { mockImpactData } from "./mock-data";

const meta = {
  title: "Projects/DeleteProjectDialog",
  component: DeleteProjectDialog,
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
 * Default state - dialog open with empty input field.
 * The "Delete Project" button is disabled.
 */
export const Default: Story = {};

/**
 * Name mismatch state - user has typed wrong text.
 * Shows error message and delete button remains disabled.
 */
export const NameMismatch: Story = {
  play: async () => {
    const canvas = within(document.body);
    const input = canvas.getByRole("textbox");
    await userEvent.type(input, "Wrong Name");
  },
};

/**
 * Long project name - tests layout with lengthy project names.
 */
export const LongProjectName: Story = {
  args: {
    projectName: "Enterprise Application Development Environment v2",
    projectKey: "ENTAPP",
  },
};

/**
 * Loading impact state - shows loading spinners while fetching impact data.
 */
export const LoadingImpact: Story = {
  args: {
    impact: undefined,
    isLoadingImpact: true,
  },
};

/**
 * Large impact - shows high numbers for impact metrics.
 * Tests layout with 3+ digit numbers.
 */
export const LargeImpact: Story = {
  args: {
    impact: {
      cardCount: 156,
      memberCount: 23,
      resourceCount: 47,
    },
  },
};

/**
 * Minimal impact - shows zero or low impact numbers.
 */
export const MinimalImpact: Story = {
  args: {
    impact: {
      cardCount: 0,
      memberCount: 1,
      resourceCount: 0,
    },
  },
};

/**
 * Deleting state - shows loading spinner while deletion is in progress.
 * All form elements are disabled.
 */
export const Deleting: Story = {
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
