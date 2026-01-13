import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { mockMembers } from "../mock-data";
import { MembersTab } from "./members-tab";

const mockMembersWithId = mockMembers.map((m, i) => ({
  id: `member-${i}`,
  name: m.user.name,
  email: m.user.email,
  avatar: m.user.avatar,
  role: m.role,
  addedAt: m.addedAt,
}));

const manyMembers = [
  ...mockMembersWithId,
  {
    id: "member-3",
    name: "Diana Developer",
    email: "diana@example.com",
    avatar: null,
    role: "member" as const,
    addedAt: new Date("2025-01-25"),
  },
  {
    id: "member-4",
    name: "Edward Engineer",
    email: "edward@example.com",
    avatar: null,
    role: "admin" as const,
    addedAt: new Date("2025-01-22"),
  },
  {
    id: "member-5",
    name: "Fiona Frontend",
    email: "fiona@example.com",
    avatar: null,
    role: "member" as const,
    addedAt: new Date("2025-01-28"),
  },
];

const meta = {
  title: "Projects/Settings/MembersTab",
  component: MembersTab,
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
    members: mockMembersWithId,
    currentUserRole: "owner",
    onInviteMember: fn(),
    onRemoveMember: fn(),
    onTransferOwnership: fn(),
    onChangeRole: fn(),
  },
} satisfies Meta<typeof MembersTab>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const ManyMembers: Story = {
  args: {
    members: manyMembers,
  },
};

export const AsAdmin: Story = {
  args: {
    currentUserRole: "admin",
  },
};

export const AsMember: Story = {
  args: {
    currentUserRole: "member",
  },
};

export const ReadOnly: Story = {
  args: {
    isReadOnly: true,
    currentUserRole: "member",
  },
};

export const ReadOnlyManyMembers: Story = {
  args: {
    isReadOnly: true,
    currentUserRole: "member",
    members: manyMembers,
  },
};

export const EmptyState: Story = {
  args: {
    members: [],
  },
};

export const SingleOwner: Story = {
  args: {
    members: [mockMembersWithId[0]],
  },
};

export const Mobile: Story = {
  args: {
    members: manyMembers,
  },
  globals: {
    viewport: { value: "mobile1" },
  },
};

export const Tablet: Story = {
  args: {
    members: manyMembers,
  },
  globals: {
    viewport: { value: "tablet" },
  },
};

export const Desktop: Story = {
  args: {
    members: manyMembers,
  },
  globals: {
    viewport: { value: "desktop" },
  },
};
