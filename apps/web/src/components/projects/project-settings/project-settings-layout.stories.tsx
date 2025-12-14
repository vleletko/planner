import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { mockMembers } from "../mock-data";
import { DangerZone } from "./danger-zone";
import { MembersTab } from "./members-tab";
import { OverviewTab } from "./overview-tab";
import { ProjectSettingsLayout } from "./project-settings-layout";

const mockMembersWithId = mockMembers.map((m, i) => ({
  id: `member-${i}`,
  name: m.user.name,
  email: m.user.email,
  avatar: m.user.avatar,
  role: m.role,
  addedAt: m.addedAt,
}));

const meta = {
  title: "Projects/Settings/Layout",
  component: ProjectSettingsLayout,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
  args: {
    projectName: "Marketing Campaign Q1",
    onTabChange: fn(),
    overviewContent: (
      <div className="space-y-6">
        <OverviewTab
          initialDescription="Track all marketing initiatives and their performance metrics for Q1 2025."
          initialName="Marketing Campaign Q1"
          onSave={fn()}
        />
        <DangerZone
          onDeleteProject={fn()}
          projectName="Marketing Campaign Q1"
        />
      </div>
    ),
    membersContent: (
      <MembersTab
        currentUserRole="owner"
        members={mockMembersWithId}
        onChangeRole={fn()}
        onInviteMember={fn()}
        onRemoveMember={fn()}
        onTransferOwnership={fn()}
      />
    ),
  },
} satisfies Meta<typeof ProjectSettingsLayout>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const MembersTabActive: Story = {
  args: {
    activeTab: "members",
  },
};

export const Mobile: Story = {
  globals: {
    viewport: { value: "mobile1" },
  },
};

export const Tablet: Story = {
  globals: {
    viewport: { value: "tablet" },
  },
};
