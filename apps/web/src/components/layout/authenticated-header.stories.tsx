import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ThemeProvider } from "next-themes";
import AuthenticatedHeader from "./authenticated-header";

const mockUser = {
  id: "user-123",
  email: "john.doe@example.com",
  name: "John Doe",
  image: null,
};

const meta = {
  title: "Layout/AuthenticatedHeader",
  component: AuthenticatedHeader,
  parameters: {
    layout: "fullscreen",
    nextjs: {
      appDirectory: true,
      navigation: {
        pathname: "/dashboard",
      },
    },
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
  args: {
    user: mockUser,
  },
} satisfies Meta<typeof AuthenticatedHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const OnProjectsPage: Story = {
  parameters: {
    nextjs: {
      appDirectory: true,
      navigation: {
        pathname: "/projects",
      },
    },
  },
};

export const OnReportsPage: Story = {
  parameters: {
    nextjs: {
      appDirectory: true,
      navigation: {
        pathname: "/reports",
      },
    },
  },
};

export const WithContent: Story = {
  decorators: [
    (StoryFn) => (
      <>
        <StoryFn />
        <main className="px-6 pt-20">
          <div className="mx-auto max-w-[1280px]">
            <h1 className="font-bold text-2xl">Dashboard</h1>
            <p className="mt-4 text-muted-foreground">
              Welcome back! Here's an overview of your projects.
            </p>
          </div>
        </main>
      </>
    ),
  ],
};

export const LongUserName: Story = {
  args: {
    user: {
      id: "user-456",
      email: "alexander.maximilian.thompson@example.com",
      name: "Alexander Maximilian Thompson",
      image: null,
    },
  },
};
