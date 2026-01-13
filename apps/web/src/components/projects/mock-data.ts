// Mock project data for stories
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export const mockProject = {
  id: "project-123",
  key: "MKT",
  name: "My Project",
  description: "A sample project for testing",
  memberCount: 3,
  createdAt: new Date(Date.now() - SEVEN_DAYS_MS),
  role: "owner" as const,
};

export const mockProjects = [
  mockProject,
  {
    ...mockProject,
    id: "project-456",
    key: "PROD",
    name: "Second Project",
    role: "admin" as const,
  },
  {
    ...mockProject,
    id: "project-789",
    key: "DEMO",
    name: "Third Project",
    role: "member" as const,
  },
];

// Mock member data for stories
const TWO_DAYS_MS = 2 * 24 * 60 * 60 * 1000;

export const mockMember = {
  user: { name: "John Doe", email: "john@example.com", avatar: null },
  role: "member" as const,
  addedAt: new Date(Date.now() - TWO_DAYS_MS),
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

// Mock user data for invite dialog stories
export const mockFoundUser = {
  name: "Sarah Developer",
  email: "sarah@example.com",
  avatar: null,
};

// Multiple users for search results
export const mockSearchResults = [
  mockFoundUser,
  {
    name: "Sam Wilson",
    email: "sam.wilson@example.com",
    avatar: null,
  },
  {
    name: "Sandra Lee",
    email: "sandra.lee@example.com",
    avatar: "https://i.pravatar.cc/150?u=sandra",
  },
  {
    name: "Steve Rogers",
    email: "steve.rogers@example.com",
    avatar: null,
  },
  {
    name: "Samantha Brown",
    email: "samantha.brown@example.com",
    avatar: null,
  },
];

// Transferable members for ownership transfer dialog (excludes current owner)
export type TransferableMember = {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
};

export const mockTransferableMembers: TransferableMember[] = [
  {
    id: "member-1",
    name: "Bob Admin",
    email: "bob@example.com",
    avatar: null,
  },
  {
    id: "member-2",
    name: "Charlie Developer",
    email: "charlie@example.com",
    avatar: "https://i.pravatar.cc/150?u=charlie",
  },
  {
    id: "member-3",
    name: "Diana Designer",
    email: "diana@example.com",
    avatar: null,
  },
];
