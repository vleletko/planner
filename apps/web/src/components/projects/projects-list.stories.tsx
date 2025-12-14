import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { mockProjects } from "./mock-data";
import {
  ProjectsEmptyState,
  ProjectsList,
  ProjectsListSkeleton,
} from "./projects-list";

const meta = {
  title: "Projects/ProjectsList",
  component: ProjectsList,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
  args: {
    onProjectClick: fn(),
    onCreateProject: fn(),
  },
} satisfies Meta<typeof ProjectsList>;

export default meta;
type Story = StoryObj<typeof meta>;

// Generate more projects for realistic grid
const manyProjects = [
  ...mockProjects,
  {
    id: "project-101",
    name: "Marketing Campaign Tracker",
    description:
      "Track all ongoing marketing initiatives and their performance metrics",
    memberCount: 8,
    createdAt: new Date("2025-02-01"),
    role: "admin" as const,
  },
  {
    id: "project-102",
    name: "Q1 Product Launch",
    description: "Coordinate the launch of new product features for Q1",
    memberCount: 12,
    createdAt: new Date("2025-01-28"),
    role: "member" as const,
  },
  {
    id: "project-103",
    name: "Infrastructure Migration",
    description: "AWS to GCP migration project",
    memberCount: 4,
    createdAt: new Date("2025-01-10"),
    role: "owner" as const,
  },
];

export const Default: Story = {
  args: {
    projects: mockProjects,
  },
};

export const ManyProjects: Story = {
  args: {
    projects: manyProjects,
  },
};

export const SingleProject: Story = {
  args: {
    projects: [mockProjects[0]],
  },
};

export const EmptyState: Story = {
  args: {
    projects: [],
  },
};

export const EmptyStateStandalone: Story = {
  render: (args) => (
    <ProjectsEmptyState onCreateProject={args.onCreateProject} />
  ),
};

export const Loading: Story = {
  args: {
    projects: [],
    isLoading: true,
  },
};

export const LoadingStandalone: Story = {
  render: () => <ProjectsListSkeleton />,
};

export const Mobile: Story = {
  args: {
    projects: manyProjects,
  },
  globals: {
    viewport: { value: "mobile1" },
  },
};

export const Tablet: Story = {
  args: {
    projects: manyProjects,
  },
  globals: {
    viewport: { value: "tablet" },
  },
};

export const Desktop: Story = {
  args: {
    projects: manyProjects,
  },
  globals: {
    viewport: { value: "desktop" },
  },
};
