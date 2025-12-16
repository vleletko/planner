# Development Commands

All commands should be run from the repository root using `bun run`.

## Linting & Formatting

| Command             | Description                             |
| ------------------- | --------------------------------------- |
| `bun run check`     | Run Biome linter to check for issues    |
| `bun run check:fix` | Auto-fix linting issues and format code |

## Type Checking

| Command               | Description                                      |
| --------------------- | ------------------------------------------------ |
| `bun run check-types` | Run TypeScript type checking across all packages |

## Building

| Command         | Description        |
| --------------- | ------------------ |
| `bun run build` | Build all packages |

## Testing

| Command                  | Description                       |
| ------------------------ | --------------------------------- |
| `bun run test`           | Run unit tests (Vitest)           |
| `bun run test:storybook` | Run Storybook interaction tests   |
| `bun run test:e2e`       | Run end-to-end tests (Playwright) |
| `bun run test:e2e:ui`    | Run e2e tests with UI mode        |

## Storybook

Storybook runs on port 6006. Start it with:

```bash
bun run --filter=web storybook
```

## Complete Check

Run the complete check whenever verification is needed (after implementing features, fixing bugs, or before committing):

**Important**: Always run the full check sequence when the agent needs to verify that changes work correctly.

```bash
bun run check && bun run check-types && bun run test && bun run test:storybook && bun run build
```

Or run them individually in sequence:

1. `bun run check` - Lint and format check
2. `bun run check-types` - TypeScript validation
3. `bun run test` - Unit tests
4. `bun run test:storybook` - Storybook interaction tests
5. `bun run build` - Production build
