import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ThemeProvider } from "next-themes";

import PublicHeader from "./public-header";

const meta = {
  title: "Layout/Header/Unauthenticated",
  component: PublicHeader,
  parameters: {
    layout: "fullscreen",
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
} satisfies Meta<typeof PublicHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithContent: Story = {
  decorators: [
    (StoryFn) => (
      <>
        <StoryFn />
        <main className="px-6 pt-20">
          <div className="mx-auto max-w-[1280px]">
            <h1 className="font-bold text-2xl">Welcome to Planner</h1>
            <p className="mt-4 text-muted-foreground">
              Sign in to access your dashboard and manage your projects.
            </p>
          </div>
        </main>
      </>
    ),
  ],
};
