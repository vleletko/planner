import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { Toaster } from "@/components/ui/sonner";
import { OverviewTab } from "./overview-tab";

const meta = {
  title: "Projects/Settings/OverviewTab",
  component: OverviewTab,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
  decorators: [
    (StoryFn) => (
      <div className="mx-auto max-w-3xl">
        <StoryFn />
        <Toaster />
      </div>
    ),
  ],
  args: {
    projectKey: "MKT",
    initialName: "Marketing Campaign Q1",
    initialDescription:
      "Track all marketing initiatives and their performance metrics for Q1 2025.",
    onSave: fn(),
  },
} satisfies Meta<typeof OverviewTab>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithoutDescription: Story = {
  args: {
    initialDescription: "",
  },
};

export const Saving: Story = {
  args: {
    isSaving: true,
  },
};

export const SaveSuccess: Story = {
  args: {
    saveSuccess: true,
  },
};

export const LongDescription: Story = {
  args: {
    initialDescription:
      "This is a comprehensive marketing campaign tracking system designed to help our team monitor all ongoing marketing initiatives across multiple channels. We track performance metrics, budget allocation, and ROI for each campaign. The system integrates with our analytics platform to provide real-time insights and automated reporting.",
  },
};

export const Mobile: Story = {
  globals: {
    viewport: { value: "mobile1" },
  },
};

export const ReadOnly: Story = {
  args: {
    isReadOnly: true,
  },
};

export const ReadOnlyWithLongDescription: Story = {
  args: {
    isReadOnly: true,
    initialDescription:
      "This is a comprehensive marketing campaign tracking system designed to help our team monitor all ongoing marketing initiatives across multiple channels. We track performance metrics, budget allocation, and ROI for each campaign.",
  },
};
