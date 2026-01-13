import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { mockProject, mockProjects } from "./mock-data";
import { ProjectCard, ProjectCardSkeleton } from "./project-card";

const meta = {
  title: "Projects/ProjectCard",
  component: ProjectCard,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  args: {
    onClick: fn(),
  },
  decorators: [
    (StoryFn) => (
      <div className="w-[360px]">
        <StoryFn />
      </div>
    ),
  ],
} satisfies Meta<typeof ProjectCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    projectKey: mockProject.key,
    ...mockProject,
  },
};

export const WithoutDescription: Story = {
  args: {
    projectKey: mockProject.key,
    ...mockProject,
    description: undefined,
  },
};

export const LongTitle: Story = {
  args: {
    projectKey: mockProject.key,
    ...mockProject,
    name: "Enterprise Resource Planning System Implementation Project",
  },
};

export const LongDescription: Story = {
  args: {
    projectKey: mockProject.key,
    ...mockProject,
    description:
      "This is a comprehensive project management system designed to help teams track their work items through various workflow stages with validation rules and custom configurations for each transition point.",
  },
};

export const AdminRole: Story = {
  args: {
    projectKey: mockProjects[1].key,
    ...mockProjects[1],
  },
};

export const MemberRole: Story = {
  args: {
    projectKey: mockProjects[2].key,
    ...mockProjects[2],
  },
};

export const SingleMember: Story = {
  args: {
    projectKey: mockProject.key,
    ...mockProject,
    memberCount: 1,
  },
};

export const ManyMembers: Story = {
  args: {
    projectKey: mockProject.key,
    ...mockProject,
    memberCount: 42,
  },
};

export const NonClickable: Story = {
  args: {
    projectKey: mockProject.key,
    ...mockProject,
    onClick: undefined,
  },
};

export const Loading: Story = {
  args: {
    projectKey: mockProject.key,
    ...mockProject,
  },
  render: () => <ProjectCardSkeleton />,
};

export const Mobile: Story = {
  args: {
    projectKey: mockProject.key,
    ...mockProject,
  },
  globals: {
    viewport: { value: "mobile1" },
  },
  decorators: [
    (StoryFn) => (
      <div className="w-[320px]">
        <StoryFn />
      </div>
    ),
  ],
};

export const Tablet: Story = {
  args: {
    projectKey: mockProject.key,
    ...mockProject,
  },
  globals: {
    viewport: { value: "tablet" },
  },
  decorators: [
    (StoryFn) => (
      <div className="w-[400px]">
        <StoryFn />
      </div>
    ),
  ],
};

export const Desktop: Story = {
  args: {
    projectKey: mockProject.key,
    ...mockProject,
  },
  globals: {
    viewport: { value: "desktop" },
  },
  decorators: [
    (StoryFn) => (
      <div className="w-[440px]">
        <StoryFn />
      </div>
    ),
  ],
};
