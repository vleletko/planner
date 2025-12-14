import { fn } from "storybook/test";

// Mock auth client for Storybook
export const authClient = {
  useSession: fn(() => ({
    isPending: false,
    isRefetching: false,
    data: null,
    error: null,
    refetch: fn(),
  })),
  signIn: {
    email: fn(() => Promise.resolve({ data: null, error: null })),
  },
  signUp: {
    email: fn(() => Promise.resolve({ data: null, error: null })),
  },
  signOut: fn(() => Promise.resolve({ success: true })),
};
