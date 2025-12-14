---
paths: src/**/*.stories.{tsx,mdx}
---

# Storybook

We use Storybook 10 with Next.js 16 via `@storybook/nextjs-vite`.

## Commands

- `bun run test:storybook` - Run all tests
- `bun run test:storybook -- src/components/auth/sign-in-form.stories.tsx` - Run single story
- `bun run storybook` - Development mode on port 6006

## Component Organization

Feature-based folder structure with matching story titles:

```
components/
├── ui/           → title: "UI/Button"
├── auth/         → title: "Auth/SignInForm"
│   └── interactions/  → title: "Auth/SignInForm/Interactions"
├── layout/       → title: "Layout/Header"
│   └── interactions/  → title: "Layout/.../Interactions"
└── shared/       → title: "Shared/Loader"
```

**Visual stories** stay in component file, **interaction stories** go in `interactions/` subfolder.

Visual stories CAN have `play` functions for **state verification** (assertions without user interaction). Interaction stories use `play` for **user interactions** (clicks, typing).

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

### User Interactions (interactions/ subfolder)

Interaction stories with user actions (clicks, typing) go in `interactions/` subfolder:

```
auth/
├── sign-in-form.stories.tsx              # Visual: Default, Loading, Error
└── interactions/sign-in-form.stories.tsx # Interactions: SuccessfulSubmit
```

```tsx
// interactions/sign-in-form.stories.tsx
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
