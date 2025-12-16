import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { Toaster } from "@/components/ui/sonner";
import { ProjectCreationDialog } from "./project-creation-dialog";

const meta = {
  title: "Projects/ProjectCreationDialog",
  component: ProjectCreationDialog,
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
    onOpenChange: fn(),
    onSuccess: fn(),
  },
} satisfies Meta<typeof ProjectCreationDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithContent: Story = {
  render: (args) => {
    // Pre-fill form via controlled state simulation
    // Since the component manages its own state, we show this as documentation
    return <ProjectCreationDialog {...args} />;
  },
};

export const Submitting: Story = {
  args: {
    isSubmitting: true,
  },
};

export const DuplicateNameError: Story = {
  args: {
    serverError: 'A project named "Marketing Campaign" already exists',
  },
};

export const ServerError: Story = {
  args: {
    serverError: "Failed to create project. Please try again.",
  },
};

export const Mobile: Story = {
  globals: {
    viewport: { value: "mobile1" },
  },
};

export const Tablet: Story = {
  globals: {
    viewport: { value: "tablet" },
  },
};

export const Desktop: Story = {
  globals: {
    viewport: { value: "desktop" },
  },
};
