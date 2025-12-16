import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { DangerZone } from "./danger-zone";

const meta = {
  title: "Projects/Settings/DangerZone",
  component: DangerZone,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
  decorators: [
    (StoryFn) => (
      <div className="mx-auto max-w-3xl">
        <StoryFn />
      </div>
    ),
  ],
  args: {
    projectName: "Marketing Campaign Q1",
    onDeleteProject: fn(),
    canDelete: true,
  },
} satisfies Meta<typeof DangerZone>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const CannotDelete: Story = {
  args: {
    canDelete: false,
  },
};

export const LongProjectName: Story = {
  args: {
    projectName: "Enterprise Resource Planning System Implementation Project",
  },
};

export const Mobile: Story = {
  globals: {
    viewport: { value: "mobile1" },
  },
};
