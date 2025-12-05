# Story 1.6a: Unit Testing Infrastructure

Status: Ready for Review

## Story

As a developer,
I want unit testing configured with Bun's test runner for business logic,
so that I can write and run fast, reliable tests for utilities and API logic.

## Acceptance Criteria

1. **Bun Test Runner Configuration**
   - Bun's built-in test runner is configured for `packages/api`
   - Test scripts available: `bun test`, `bun test --watch`, `bun test --coverage`
   - Tests can import from workspace packages

2. **Example Tests**
   - At least one utility function test exists and passes
   - Tests demonstrate best practices (arrangement, assertion patterns)

3. **Coverage Reporting**
   - Coverage data generated in lcov format
   - Coverage summary visible in CI logs
   - Coverage data uploaded to GitHub (visible in PR via Codecov or similar)

4. **CI Integration**
   - Unit tests run in the `verify` job (before build)
   - Failing tests block the pipeline
   - Test results visible in GitHub Actions

## Tasks / Subtasks

- [x] Task 1: Configure Bun Test Runner (AC: #1)
  - [x] 1.1: Create `packages/api/bunfig.toml` with test configuration
  - [x] 1.2: Add test scripts to `packages/api/package.json`: `test`, `test:watch`, `test:coverage`

- [x] Task 2: Add Root-Level Test Scripts (AC: #1)
  - [x] 2.1: Add `test`, `test:watch`, `test:coverage` scripts to root `package.json`
  - [x] 2.2: Update `turbo.json` with test pipeline configuration

- [x] Task 3: Create Example Tests (AC: #2)
  - [x] 3.1: Create utility/helper test in `packages/api` (e.g., validation logic)
  - [x] 3.2: Verify tests pass with `bun test`

- [x] Task 4: Configure Coverage Reporting (AC: #3)
  - [x] 4.1: Configure lcov output in bunfig.toml
  - [x] 4.2: Test coverage generation locally

- [x] Task 5: CI Integration (AC: #3, #4)
  - [x] 5.1: Add unit test step to `verify` job in `.github/workflows/ci.yml`
  - [x] 5.2: Add coverage display to GitHub Job Summary (native, no external services)
  - [x] 5.3: Verify tests run and coverage appears in GitHub Actions

## Dev Notes

### Why Bun Test Runner?

**Decision: Use Bun's built-in test runner instead of Jest or Vitest**

| Factor | Bun Test | Jest | Vitest |
|--------|----------|------|--------|
| **Speed** | Fastest (native) | Slow (Node + transforms) | Fast (Vite) |
| **Config** | Minimal (bunfig.toml) | Heavy (jest.config + babel + ts-jest) | Moderate |
| **TypeScript** | Native | Requires ts-jest | Native |
| **Dependencies** | 0 (built-in) | ~50+ packages | ~20+ packages |
| **API** | Jest-compatible | Standard | Jest-compatible |
| **Coverage** | Built-in | Requires istanbul | Built-in |

**Key reasons for Bun:**

1. **Already using Bun 1.3.1** - Consistency across package management, scripts, and testing
2. **Zero additional test runner dependencies** - Built into the runtime
3. **10-20x faster than Jest** - Native implementation, no Node.js overhead
4. **Jest-compatible API** - `describe`, `test`, `expect` work identically
5. **TypeScript native** - No ts-jest, no babel, no transpilation config
6. **Built-in coverage** - `bun test --coverage` generates lcov directly
7. **AI-friendly output** - `CLAUDECODE=1 bun test` for quiet mode with Claude Code

### Testing Strategy

**What we test with unit tests:**
- Utility functions (formatters, validators, helpers)
- Business logic in `packages/api` (validation orchestrators, field type logic)
- Pure functions with clear inputs/outputs

**What we DON'T test with unit tests:**
- UI components (covered by E2E tests in Story 1-6b)
- shadcn/ui primitives (already tested by the library)
- Visual appearance (Storybook can be added later if needed)

**Rationale:** E2E tests provide better coverage of real user flows. Component unit tests often become brittle and test implementation details rather than behavior.

### Configuration Files

**`packages/api/bunfig.toml`:**
```toml
[test]
root = "./src"

[test.coverage]
enabled = true
reporter = ["text", "lcov"]
coverageDir = "./coverage"
```

**`packages/api/package.json` scripts:**
```json
{
  "scripts": {
    "test": "bun test",
    "test:watch": "bun test --watch",
    "test:coverage": "bun test --coverage"
  }
}
```

**Root `package.json` scripts:**
```json
{
  "scripts": {
    "test": "turbo test",
    "test:watch": "bun test --watch --cwd packages/api",
    "test:coverage": "turbo test:coverage"
  }
}
```

**`turbo.json` additions:**
```json
{
  "tasks": {
    "test": {
      "outputs": ["coverage/**"],
      "cache": false
    },
    "test:coverage": {
      "outputs": ["coverage/**"],
      "cache": false
    }
  }
}
```

### Example Test

```typescript
// packages/api/src/lib/example.test.ts
import { describe, test, expect } from "bun:test";

// Example: testing a validation helper
describe("validation helpers", () => {
  test("validates email format", () => {
    const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    expect(isValidEmail("test@example.com")).toBe(true);
    expect(isValidEmail("invalid")).toBe(false);
    expect(isValidEmail("")).toBe(false);
  });
});
```

### CI Integration

Add to `.github/workflows/ci.yml` in the `verify` job (after lint, before build):

```yaml
- name: Run unit tests
  run: |
    mkdir -p packages/api/test-results
    bun run test:coverage

- name: Report test results
  if: always()
  uses: mikepenz/action-junit-report@v5
  with:
    report_paths: packages/api/test-results/junit.xml
    include_passed: true
    check_name: Unit Tests

- name: Report coverage
  if: github.event_name == 'pull_request'
  uses: zgosalvez/github-actions-report-lcov@v4
  with:
    coverage-files: packages/api/coverage/lcov.info
    github-token: ${{ secrets.GITHUB_TOKEN }}
    update-comment: true
```

**Features:**
- [JUnit Report Action](https://github.com/mikepenz/action-junit-report) - Shows test results as PR check with annotations
- [Report LCOV](https://github.com/marketplace/actions/report-lcov) - Posts coverage comments on PRs
- No external accounts required - uses built-in `GITHUB_TOKEN`

### Project Structure

```
packages/api/
├── bunfig.toml                    # NEW: Bun test configuration
├── coverage/                      # NEW: Generated coverage reports
│   └── lcov.info
└── src/
    └── lib/
        └── example.test.ts        # NEW: Example test file
```

### Test File Convention

Per architecture document: Test files are co-located with source using pattern `{filename}.test.ts`

```
packages/api/src/
├── fields/
│   ├── validator.ts
│   └── validator.test.ts          # Tests next to implementation
├── lib/
│   ├── logger.ts
│   └── logger.test.ts
```

### References

- [Source: docs/epics/epic-1-foundation-project-infrastructure.md#Story 1.6]
- [Source: docs/architecture.md#Code Organization - Test Files]
- [Bun Test Runner](https://bun.com/docs/test)
- [Bun Test Coverage](https://bun.sh/docs/cli/test#coverage)

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Completion Notes List

- Configured Bun test runner with bunfig.toml using flat coverage options (not nested)
- Created validation utilities (isValidEmail, isNonEmptyString, isPositiveInteger, sanitizeString) with 100% test coverage
- All 14 tests pass with 100% function and line coverage
- Added test scripts to root package.json and turbo.json for monorepo test orchestration
- Integrated unit tests into CI verify job with JUnit test reporting and LCOV coverage comments
- Uses mikepenz/action-junit-report for test results and zgosalvez/github-actions-report-lcov for coverage
- No external accounts required - uses built-in GITHUB_TOKEN

### File List

- packages/api/bunfig.toml (NEW)
- packages/api/package.json (MODIFIED)
- packages/api/.gitignore (MODIFIED)
- packages/api/src/lib/validation.ts (NEW)
- packages/api/src/lib/validation.test.ts (NEW)
- package.json (MODIFIED)
- turbo.json (MODIFIED)
- .github/workflows/ci.yml (MODIFIED)
- docs/guides/package-testing-setup.md (NEW)

### Change Log

- 2025-12-05: Story created - Unit testing for business logic only (no component tests)
- 2025-12-05: Story implementation completed - All tasks finished, tests passing with 100% coverage
