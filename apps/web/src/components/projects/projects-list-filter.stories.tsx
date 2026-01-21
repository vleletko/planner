import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn, userEvent, within } from "storybook/test";
import { FilteredEmptyState, ProjectsListFilter } from "./projects-list-filter";

// Module-level regex patterns (REQUIRED by Biome)
const CLEAR_SEARCH_BUTTON = /clear search/i;
const FILTER_BY_STATUS = /filter by status/i;
const ARCHIVED_OPTION = /archived/i;

const meta = {
  title: "Projects/ProjectsListFilter",
  component: ProjectsListFilter,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
  args: {
    nameFilter: "",
    onNameFilterChange: fn(),
    statusFilter: "active",
    onStatusFilterChange: fn(),
    isAdmin: false,
  },
} satisfies Meta<typeof ProjectsListFilter>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default state - non-admin user with empty search.
 * Status filter dropdown is hidden for non-admins.
 */
export const Default: Story = {};

/**
 * Admin user - shows status filter dropdown with all options.
 */
export const AdminUser: Story = {
  args: {
    isAdmin: true,
  },
};

/**
 * Admin with archived filter selected.
 */
export const AdminArchivedFilter: Story = {
  args: {
    isAdmin: true,
    statusFilter: "archived",
  },
};

/**
 * Admin with "All" filter selected.
 */
export const AdminAllFilter: Story = {
  args: {
    isAdmin: true,
    statusFilter: "all",
  },
};

/**
 * With active name search.
 */
export const WithNameSearch: Story = {
  args: {
    nameFilter: "Marketing",
    isAdmin: true,
  },
};

/**
 * Combined filters - name search + archived status.
 */
export const CombinedFilters: Story = {
  args: {
    nameFilter: "Project",
    statusFilter: "archived",
    isAdmin: true,
  },
};

/**
 * Mobile viewport - filters stack vertically.
 */
export const Mobile: Story = {
  args: {
    isAdmin: true,
  },
  globals: {
    viewport: { value: "mobile1" },
  },
};

/**
 * Tablet viewport.
 */
export const Tablet: Story = {
  args: {
    isAdmin: true,
  },
  globals: {
    viewport: { value: "tablet" },
  },
};

// FilteredEmptyState stories

const emptyStateMeta = {
  title: "Projects/FilteredEmptyState",
  component: FilteredEmptyState,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
  args: {
    nameFilter: "",
    statusFilter: "active",
    onClearFilters: fn(),
  },
} satisfies Meta<typeof FilteredEmptyState>;

type EmptyStateStory = StoryObj<typeof emptyStateMeta>;

/**
 * Empty state when search has no matches.
 */
export const EmptySearchResults: EmptyStateStory = {
  render: (args) => (
    <FilteredEmptyState
      nameFilter="Nonexistent Project"
      onClearFilters={args.onClearFilters}
      statusFilter="active"
    />
  ),
};

/**
 * Empty state when no archived projects exist.
 */
export const EmptyArchivedProjects: EmptyStateStory = {
  render: (args) => (
    <FilteredEmptyState
      nameFilter=""
      onClearFilters={args.onClearFilters}
      statusFilter="archived"
    />
  ),
};

/**
 * Empty state with combined filters.
 */
export const EmptyCombinedFilters: EmptyStateStory = {
  render: (args) => (
    <FilteredEmptyState
      nameFilter="Test"
      onClearFilters={args.onClearFilters}
      statusFilter="archived"
    />
  ),
};

/**
 * Empty state without clear button (no callback provided).
 */
export const EmptyNoClearButton: EmptyStateStory = {
  render: () => (
    <FilteredEmptyState nameFilter="Search term" statusFilter="active" />
  ),
};

// Interaction tests

/**
 * Test typing in the search input.
 */
export const TypeInSearch: Story = {
  args: {
    isAdmin: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const searchInput = canvas.getByRole("searchbox");

    await userEvent.type(searchInput, "Marketing");
  },
};

/**
 * Test clearing the search input.
 */
export const ClearSearch: Story = {
  args: {
    nameFilter: "Existing search",
    isAdmin: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const clearButton = canvas.getByRole("button", {
      name: CLEAR_SEARCH_BUTTON,
    });

    await userEvent.click(clearButton);
  },
};

/**
 * Test selecting a different status filter.
 */
export const SelectStatusFilter: Story = {
  args: {
    isAdmin: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const statusTrigger = canvas.getByRole("combobox", {
      name: FILTER_BY_STATUS,
    });

    await userEvent.click(statusTrigger);

    // Wait for dropdown and select "Archived"
    const archivedOption = await within(document.body).findByRole("option", {
      name: ARCHIVED_OPTION,
    });
    await userEvent.click(archivedOption);
  },
};
