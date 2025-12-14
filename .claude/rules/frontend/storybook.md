---
paths: src/**/*.stories.{tsx,mdx}
---

# Storybook

We use Storybook 10 with Next.js 16 via `@storybook/nextjs-vite`.

## Commands

Run from `apps/web/`:
- `bun run test:storybook` - Run all story tests
- `bun run storybook` - Development mode on port 6006

Run specific file from monorepo root:
- `bun run --filter web test:storybook -- src/components/auth/sign-in-form.stories.tsx`

## Component Organization

Feature-based folder structure with matching story titles:

```
components/
├── ui/           → title: "UI/Button"
├── auth/
│   ├── sign-in-form.tsx
│   ├── sign-in-form.stories.tsx              → title: "Auth/SignInForm"
│   └── sign-in-form.interactions.stories.tsx → title: "Auth/SignInForm/Interactions"
├── layout/
│   ├── header.tsx
│   ├── header.stories.tsx                    → title: "Layout/Header/Authenticated"
│   └── header.interactions.stories.tsx       → title: "Layout/Header/Authenticated/Interactions"
└── shared/       → title: "Shared/Loader"
```

**Naming convention:**
- Visual stories: `component-name.stories.tsx`
- Interaction stories: `component-name.interactions.stories.tsx`

Both files stay at the **same level** as the component (no `interactions/` subfolder).

**Visual stories** CAN have `play` functions for **state verification** (assertions without user interaction). **Interaction stories** use `play` for **user interactions** (clicks, typing).

## Critical Import Rules

**Use `storybook/test` (not `@storybook/test`):**

```tsx
// ✅ CORRECT
import { expect, fn, userEvent, within, sb } from "storybook/test";

// ❌ WRONG - causes errors in Storybook 10
import { ... } from "@storybook/test";
```

**Types from framework package:**

```tsx
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
```

## Story Structure

```tsx
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { MyComponent } from "./my-component";

const meta = {
  title: "Feature/MyComponent", // Match folder: auth/ → "Auth/..."
  component: MyComponent,
  tags: ["autodocs"],
} satisfies Meta<typeof MyComponent>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { /* props */ },
};
```

**Why `satisfies` + `typeof meta`:**
- `satisfies Meta<...>` gives stricter type checking (errors for missing required args, not just invalid ones)
- `StoryObj<typeof meta>` connects meta and story types, so TypeScript knows args defined at meta level satisfy story requirements
- Enables proper inference of `play` function availability when sharing across stories

## Mocking with sb.mock()

Register mocks globally in `.storybook/preview.ts`:

```ts
sb.mock(import("../src/lib/auth-client.ts"));
```

Storybook auto-discovers mock files from adjacent `__mocks__/` folder:

```
src/lib/
├── auth-client.ts
└── __mocks__/
    └── auth-client.ts  ← Auto-discovered
```

Use `mocked()` and `beforeEach` in stories to configure per-story behavior.

## Play Functions

### State Verification (visual stories)

Visual stories can use `play` to verify rendered state without user interaction:

```tsx
// layout/header.stories.tsx
export const OnDashboard: Story = {
  parameters: { nextjs: { navigation: { pathname: "/dashboard" } } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const dashboardLink = canvas.getByRole("link", { name: /dashboard/i });
    await expect(dashboardLink).toHaveAttribute("data-active", "true");
  },
};
```

### User Interactions (*.interactions.stories.tsx)

Interaction stories with user actions (clicks, typing) use the `.interactions.stories.tsx` suffix:

```
auth/
├── sign-in-form.tsx
├── sign-in-form.stories.tsx              # Visual: Default, Loading, Error
└── sign-in-form.interactions.stories.tsx # Interactions: SuccessfulSubmit
```

```tsx
// sign-in-form.interactions.stories.tsx
const meta = {
  title: "Auth/SignInForm/Interactions",
  component: SignInForm,
} satisfies Meta<typeof SignInForm>;

export const SuccessfulSubmit: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByLabelText("Email"), "test@example.com");
    await userEvent.click(canvas.getByRole("button", { name: "Submit" }));
    await expect(mockFn).toHaveBeenCalled();
  },
};
```

**Portal elements** (dropdowns, modals): Use `within(document.body)` since Radix renders outside `canvasElement`.

### Reusable Play Functions

Extract shared verification logic into factory functions:

```tsx
const BOARD_LINK = /^board$/i;
const PROJECTS_LINK = /^projects$/i;
const NAV_LINKS = [BOARD_LINK, PROJECTS_LINK] as const;

/** Verifies only the expected link has data-active="true" */
const verifyActiveLink =
  (activeLink: RegExp) =>
  async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    const canvas = within(canvasElement);
    for (const link of NAV_LINKS) {
      const element = canvas.getByRole("link", { name: link });
      await expect(element).toHaveAttribute(
        "data-active",
        link === activeLink ? "true" : "false"
      );
    }
  };

export const Default: Story = {
  play: verifyActiveLink(BOARD_LINK),
};

export const OnProjectsPage: Story = {
  parameters: { nextjs: { navigation: { pathname: "/projects" } } },
  play: verifyActiveLink(PROJECTS_LINK),
};
```

**Extract regex patterns to top level** (Biome performance rule):

```tsx
// ✅ CORRECT - regex at module level
const SUBMIT_BUTTON = /submit/i;

export const ClickTest: Story = {
  play: async ({ canvasElement }) => {
    const button = canvas.getByRole("button", { name: SUBMIT_BUTTON });
  },
};

// ❌ WRONG - regex inside play function triggers Biome warning
play: async ({ canvasElement }) => {
  const button = canvas.getByRole("button", { name: /submit/i });
};
```

## Naming

Avoid shadowing globals:

```tsx
// ❌ shadows Number/Error globals
export const Number: Story = {};
export const Error: Story = {};

// ✅
export const NumberInput: Story = {};
export const ErrorToast: Story = {};
```
