# Package Testing Setup Guide

This guide explains how to add unit testing to any package in the monorepo.

## Prerequisites

- Bun 1.3.1+ (already configured in monorepo)
- Package exists in `packages/` or `apps/`

## Setup Steps

### 1. Create `bunfig.toml`

Create `packages/<your-package>/bunfig.toml`:

```toml
[test]
root = "./src"
coverage = true
coverageReporter = ["text", "lcov"]
coverageDir = "./coverage"
coverageSkipTestFiles = true

[test.reporter]
junit = "./test-results/junit.xml"
```

### 2. Add Test Scripts

Add to `packages/<your-package>/package.json`:

```json
{
  "scripts": {
    "test": "bun test",
    "test:watch": "bun test --watch",
    "test:coverage": "bun test --coverage"
  }
}
```

### 3. Update `.gitignore`

Add to `packages/<your-package>/.gitignore`:

```gitignore
# code coverage
coverage
*.lcov

# test results
test-results
```

### 4. Write Tests

Create test files next to source files using the pattern `{filename}.test.ts`:

```
packages/<your-package>/src/
├── utils/
│   ├── helpers.ts
│   └── helpers.test.ts    # <- test file
```

Example test:

```typescript
import { describe, expect, test } from "bun:test";
import { myFunction } from "./helpers";

describe("myFunction", () => {
  test("returns expected value", () => {
    expect(myFunction("input")).toBe("expected");
  });
});
```

## Running Tests

```bash
# Run tests for specific package
bun test --cwd packages/<your-package>

# Run all tests in monorepo
bun run test

# Watch mode for specific package
bun test --watch --cwd packages/<your-package>

# With coverage
bun run test:coverage
```

## CI Integration

No additional CI configuration needed. The existing CI workflow uses glob patterns that automatically discover:

- Test results: `**/test-results/junit.xml`

Your package's test results will appear as a PR check automatically. Coverage is visible in CI logs.

## Best Practices

1. **Co-locate tests** - Keep `*.test.ts` files next to the code they test
2. **Test behavior, not implementation** - Focus on inputs/outputs, not internal details
3. **Use descriptive names** - `test("returns null when user not found")` not `test("test1")`
4. **Keep tests fast** - Unit tests should run in milliseconds
5. **One assertion focus** - Each test should verify one specific behavior

## Reference

- [Bun Test Runner](https://bun.sh/docs/cli/test)
- [Bun Test Coverage](https://bun.sh/docs/test/coverage)
- Example implementation: `packages/api/`
