import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import Loader from "./loader";

const meta = {
  title: "Components/Loader",
  component: Loader,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof Loader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const InContainer: Story = {
  decorators: [
    (StoryFn) => (
      <div className="h-64 w-64 rounded-lg border">
        <StoryFn />
      </div>
    ),
  ],
};
