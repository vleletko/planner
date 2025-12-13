---
paths: src/**/*.stories.{tsx,mdx}
---

# Storybook

We use Storybook 10 with Next.js 16 via `@storybook/nextjs-vite`.

## Commands

- `bun run test:storybook` - Run all tests
- `bun run test:storybook -- src/components/sign-in-form.stories.tsx` - Run single story
- `bun run storybook` - Development mode on port 6006

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
  title: "Category/MyComponent",
  component: MyComponent,
  tags: ["autodocs"], // Enable docs generation
} satisfies Meta<typeof MyComponent>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { /* props */ },
};
```

## Mocking with sb.mock()

Mock modules BEFORE component import:

```tsx
import { sb } from "storybook/test";
sb.mock("@/lib/auth-client", () => import("@/lib/__mocks__/auth-client"));

import { MyComponent } from "./my-component";
```

Mock files go in `src/lib/__mocks__/`. Use `mocked()` and `beforeEach` to configure per-story.

## Interaction Tests

Add `play` functions for user interaction coverage:

```tsx
import { expect, userEvent, within } from "storybook/test";

export const ClickTest: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole("button");
    await userEvent.click(button);
    await expect(button).toHaveTextContent("Clicked");
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
