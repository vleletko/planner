import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { Toaster } from "@/components/ui/sonner";
import type { InviteUserSearchState } from "./invite-member-dialog";
import { InviteMemberDialog } from "./invite-member-dialog";
import { mockFoundUser, mockSearchResults } from "./mock-data";

// Controlled states for Storybook
const idleState: InviteUserSearchState = { status: "idle" };
const searchingState: InviteUserSearchState = { status: "searching" };
const userFoundState: InviteUserSearchState = {
  status: "success",
  results: [mockFoundUser],
};
const userNotFoundState: InviteUserSearchState = {
  status: "success",
  results: [],
};
const alreadyMemberState: InviteUserSearchState = {
  status: "success",
  results: [{ ...mockFoundUser, isMember: true }],
};
const errorState: InviteUserSearchState = { status: "error" };

// Multiple results states
const multipleResultsState: InviteUserSearchState = {
  status: "success",
  results: mockSearchResults.slice(0, 3), // 3 results
};
const manyResultsState: InviteUserSearchState = {
  status: "success",
  results: mockSearchResults, // 5 results (shows 3 + "and 2 more")
};

const meta = {
  title: "Projects/InviteMemberDialog",
  component: InviteMemberDialog,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  decorators: [
    (StoryFn) => (
      <>
        <StoryFn />
        <Toaster />
      </>
    ),
  ],
  args: {
    isOpen: true,
    onOpenChange: fn(),
    onInvite: fn(),
  },
} satisfies Meta<typeof InviteMemberDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default state - shows full UI with multiple search results.
 * Displays user list with "and X more" message, role selector (disabled until user selected).
 */
export const Default: Story = {
  args: {
    controlledSearchState: manyResultsState,
  },
};

/**
 * Searching state - spinner in input area while searching for user.
 */
export const SearchingState: Story = {
  args: {
    controlledSearchState: searchingState,
  },
};

/**
 * User found state - shows user preview card with avatar,
 * name, email, and ready indicator. Role selector appears.
 */
export const UserFound: Story = {
  args: {
    controlledSearchState: userFoundState,
  },
};

/**
 * User not found state - warning message displayed when
 * no account exists for the searched email.
 */
export const UserNotFound: Story = {
  args: {
    controlledSearchState: userNotFoundState,
  },
};

/**
 * Already member state - shows user card with warning styling
 * when the searched user is already part of the project.
 */
export const AlreadyMember: Story = {
  args: {
    controlledSearchState: alreadyMemberState,
  },
};

/**
 * Error state - shows error message when search fails.
 */
export const ErrorState: Story = {
  args: {
    controlledSearchState: errorState,
  },
};

/**
 * Submitting state - button shows loading spinner while
 * invitation is being sent.
 */
export const Submitting: Story = {
  args: {
    controlledSearchState: userFoundState,
    isSubmitting: true,
  },
};

/**
 * User found with avatar - shows user with profile image.
 */
export const UserFoundWithAvatar: Story = {
  args: {
    controlledSearchState: {
      status: "success",
      results: [
        {
          name: "Alex Johnson",
          email: "alex.johnson@company.com",
          avatar: "https://i.pravatar.cc/150?u=alex",
        },
      ],
    },
  },
};

/**
 * Mobile viewport - responsive layout on small screens.
 */
export const Mobile: Story = {
  args: {
    controlledSearchState: manyResultsState,
  },
  globals: {
    viewport: { value: "mobile1" },
  },
};

/**
 * Tablet viewport - responsive layout on medium screens.
 */
export const Tablet: Story = {
  args: {
    controlledSearchState: manyResultsState,
  },
  globals: {
    viewport: { value: "tablet" },
  },
};

/**
 * Multiple results - shows a list of selectable user cards.
 * User must select one before seeing the role selector.
 */
export const MultipleResults: Story = {
  args: {
    controlledSearchState: multipleResultsState,
  },
};

/**
 * Many results - shows first 3 results with "and X more" message.
 */
export const ManyResults: Story = {
  args: {
    controlledSearchState: manyResultsState,
  },
};
