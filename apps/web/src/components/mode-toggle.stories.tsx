import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ThemeProvider } from "next-themes";

import { ModeToggle } from "./mode-toggle";

const meta = {
  title: "Components/ModeToggle",
  component: ModeToggle,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  decorators: [
    (StoryFn) => (
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        disableTransitionOnChange
        enableSystem
      >
        <StoryFn />
      </ThemeProvider>
    ),
  ],
} satisfies Meta<typeof ModeToggle>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const InHeader: Story = {
  decorators: [
    (StoryFn) => (
      <div className="flex items-center gap-4 rounded-lg border bg-background p-4">
        <span className="text-sm">Theme:</span>
        <StoryFn />
      </div>
    ),
  ],
};
