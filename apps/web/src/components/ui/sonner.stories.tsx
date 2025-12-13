import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ThemeProvider } from "next-themes";
import { toast } from "sonner";

import { Button } from "./button";
import { Toaster } from "./sonner";

const meta = {
  title: "UI/Sonner",
  component: Toaster,
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
        <Toaster richColors />
      </ThemeProvider>
    ),
  ],
} satisfies Meta<typeof Toaster>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Button onClick={() => toast("Event has been created")} variant="outline">
      Show Toast
    </Button>
  ),
};

export const Success: Story = {
  render: () => (
    <Button
      onClick={() => toast.success("Successfully saved!")}
      variant="outline"
    >
      Show Success
    </Button>
  ),
};

export const ErrorToast: Story = {
  render: () => (
    <Button
      onClick={() => toast.error("Something went wrong!")}
      variant="outline"
    >
      Show Error
    </Button>
  ),
};

export const Warning: Story = {
  render: () => (
    <Button
      onClick={() => toast.warning("Please check your input")}
      variant="outline"
    >
      Show Warning
    </Button>
  ),
};

export const Info: Story = {
  render: () => (
    <Button
      onClick={() => toast.info("New update available")}
      variant="outline"
    >
      Show Info
    </Button>
  ),
};

export const WithDescription: Story = {
  render: () => (
    <Button
      onClick={() =>
        toast("Event has been created", {
          description: "Sunday, December 03, 2023 at 9:00 AM",
        })
      }
      variant="outline"
    >
      With Description
    </Button>
  ),
};

export const WithAction: Story = {
  render: () => (
    <Button
      onClick={() =>
        toast("Event has been created", {
          action: {
            label: "Undo",
            onClick: () => console.log("Undo"),
          },
        })
      }
      variant="outline"
    >
      With Action
    </Button>
  ),
};

export const PromiseToast: Story = {
  render: () => (
    <Button
      onClick={() => {
        const promise = () =>
          new Promise((resolve) => setTimeout(resolve, 2000));

        toast.promise(promise, {
          loading: "Loading...",
          success: "Data loaded successfully!",
          error: "Error loading data",
        });
      }}
      variant="outline"
    >
      Show Promise
    </Button>
  ),
};

export const AllTypes: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Button onClick={() => toast("Default toast")} variant="outline">
        Default
      </Button>
      <Button onClick={() => toast.success("Success!")} variant="outline">
        Success
      </Button>
      <Button onClick={() => toast.error("Error!")} variant="outline">
        Error
      </Button>
      <Button onClick={() => toast.warning("Warning!")} variant="outline">
        Warning
      </Button>
      <Button onClick={() => toast.info("Info")} variant="outline">
        Info
      </Button>
    </div>
  ),
};
