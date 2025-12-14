// Mock project data for stories
export const mockProject = {
  id: "project-123",
  name: "My Project",
  description: "A sample project for testing",
  memberCount: 3,
  createdAt: new Date("2025-01-15"),
  role: "owner" as const,
};

export const mockProjects = [
  mockProject,
  {
    ...mockProject,
    id: "project-456",
    name: "Second Project",
    role: "admin" as const,
  },
  {
    ...mockProject,
    id: "project-789",
    name: "Third Project",
    role: "member" as const,
  },
];

// Mock member data for stories
export const mockMember = {
  user: { name: "John Doe", email: "john@example.com", avatar: null },
  role: "member" as const,
  addedAt: new Date("2025-01-20"),
};

export const mockMembers = [
  {
    ...mockMember,
    user: { name: "Alice Owner", email: "alice@example.com", avatar: null },
    role: "owner" as const,
  },
  {
    ...mockMember,
    user: { name: "Bob Admin", email: "bob@example.com", avatar: null },
    role: "admin" as const,
  },
  mockMember,
];

// Impact data for deletion dialog
export const mockImpactData = {
  cardCount: 24,
  memberCount: 5,
  resourceCount: 12,
};

// Project role type
export type ProjectRole = "owner" | "admin" | "member";
