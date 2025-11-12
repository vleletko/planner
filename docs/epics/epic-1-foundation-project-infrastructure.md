# Epic 1: Foundation & Project Infrastructure

**Goal:** Establish the core technical foundation including project setup, database infrastructure, authentication system, basic UI shell, and deployment pipeline. This epic creates the foundation that enables all subsequent development work.

**UX Design Reference:** This epic implements the foundational visual and interaction patterns defined in the UX Design Specification, particularly:
- Design System (Section 1.1): shadcn/ui (New York style) + Tailwind CSS
- Color System (Section 3.1): Balanced Teal theme with semantic colors
- Typography System (Section 3.1): Inter font family with defined type scale
- Theme System: Light/dark mode support with smooth transitions

**Important:** All design values must use design tokens from the design system. See docs/ux-design-specification.md for token definitions.

## Story 1.1: Project Setup and Infrastructure Initialization

As a developer,
I want a properly configured monorepo with Next.js, TypeScript, and core dependencies,
So that the team has a solid foundation to build features on.

**Acceptance Criteria:**

**Given** a new codebase
**When** I clone the repository and run setup commands
**Then** the development environment starts successfully with all dependencies installed

**And** the monorepo structure includes:
- `/apps/web` - Next.js 16 application with React 19
- `/packages/api` - ORPC API package
- `/packages/db` - Drizzle ORM package
- `/packages/auth` - Better-Auth package
- TypeScript configured across all packages

**And** the build system compiles without errors
**And** hot module replacement works in development mode

**Prerequisites:** None (first story)

**Technical Notes:**
- Use pnpm workspaces for monorepo management
- Configure TypeScript with strict mode enabled
- Set up tsconfig paths for package imports
- Install Ultracite for Biome-based linting and formatting
- Configure base Next.js 16 with App Router
- Verify all existing code integrates properly

---

## Story 1.2: Database Setup and Schema Foundation

As a developer,
I want PostgreSQL database connected with Drizzle ORM and migration system,
So that we can store and query application data.

**Acceptance Criteria:**

**Given** the project infrastructure from Story 1.1
**When** I start the development environment
**Then** the application connects to PostgreSQL database successfully

**And** Drizzle ORM is configured with:
- Database connection pooling
- Type-safe query builder
- Migration scripts in `/packages/db/src/migrations` folder
- Schema files organized by domain

**And** initial schema includes:
- Users table (extending Better-Auth schema)
- Created/updated timestamp tracking
- Proper indexes on frequently queried fields

**And** I can run migrations with `pnpm db:migrate`
**And** I can seed development data with `pnpm db:seed`

**Prerequisites:** Story 1.1

**Technical Notes:**
- Use Drizzle Kit for migrations
- Configure connection string via environment variables
- Set up database pooling for connection management
- Create drizzle.config.ts in packages/db
- Verify existing schema in `/packages/db/src/schema/auth.ts` is properly integrated

---

## Story 1.3: Authentication System Integration

As a user,
I want to sign up, log in, and have my session managed securely,
So that I can access the application with my account.

**Acceptance Criteria:**

**Given** the database is set up from Story 1.2
**When** I navigate to the login page
**Then** I see a form to enter email and password

**And** when I submit valid credentials, I am logged in and redirected to the dashboard
**And** when I submit invalid credentials, I see a clear error message

**And** the signup flow allows me to:
- Create account with email and password
- Receive validation errors for weak passwords or duplicate emails
- Auto-login after successful signup

**And** session management provides:
- Persistent sessions across browser refreshes
- Secure session cookies with httpOnly flag
- Session expiration after inactivity
- Logout functionality that clears session

**And** the authentication forms follow UX design patterns:
- Use shadcn/ui form components with inline validation
- Display error messages below fields with var(--color-error) color (Error semantic color)
- Show success states with var(--color-success) checkmarks
- Provide real-time validation feedback as user types
- Use primary buttons with var(--color-primary) background
- Follow var(--font-sans) font family and type scale from design system
- Implement proper focus indicators meeting WCAG 2.1 AA standards

**Prerequisites:** Story 1.2

**Technical Notes:**
- Use Better-Auth from `/packages/auth` package
- Integrate with existing auth schema in `/packages/db/src/schema/auth.ts`
- Use existing sign-in/sign-up forms from `/apps/web/src/components/`
- Configure CSRF protection
- Set up password hashing with bcrypt
- Create auth context provider in `/apps/web/src/components/providers.tsx`

**UX Design Section:**
See UX Design Spec: Section 3.1 - Color System, Section 2.1 - Core User Experience

**Design Token References:**
- Error states: var(--color-error) with var(--color-error-light) background
- Success states: var(--color-success) with var(--color-success-light) background
- Primary buttons: var(--color-primary) background, white text
- Typography: var(--text-base) for body text, var(--font-sans) font family
- Form field focus: var(--color-focus-ring) border
- Form field error: var(--color-error) border
- Inline validation pattern inspired by Jira (Section 2.1)

---

## Story 1.4: Basic UI Shell and Theme System

As a user,
I want a consistent, accessible UI with theme support,
So that I have a pleasant experience using the application.

**Acceptance Criteria:**

**Given** authentication is working from Story 1.3
**When** I log in to the application
**Then** I see a header with navigation and user menu

**And** the UI includes:
- Application header with logo and navigation
- User menu with profile and logout options
- Theme toggle for light/dark mode
- Responsive layout that works on mobile and desktop

**And** theme system provides:
- Light and dark mode themes
- Theme preference persisted in localStorage
- Smooth theme transitions
- Theme colors applied to all UI components

**And** accessibility features include:
- Keyboard navigation support
- ARIA labels on interactive elements
- Focus indicators meeting WCAG 2.1 AA
- Semantic HTML structure

**And** the UI shell follows the design specification:
- Header uses clean, functional toolbar pattern (Section 4.1)
- Application header includes: Planner branding, global search, "+ New Card" primary action, user avatar
- Primary actions use var(--color-primary) color
- Secondary actions use var(--color-secondary) color
- Layout uses max-width 1280px container with fixed header
- Typography follows var(--font-sans) font family throughout
- Spacing uses var(--spacing-*) token system
- Border radius: var(--radius-sm) for buttons, var(--radius-md) for cards
- Shadows follow elevation system: var(--shadow-sm/md/lg/xl) as defined in design spec

**Prerequisites:** Story 1.3

**Technical Notes:**
- Use existing UI components from `/apps/web/src/components/ui/`
- Integrate existing theme-provider from `/apps/web/src/components/theme-provider.tsx`
- Use existing mode-toggle component
- Use existing header and user-menu components
- Ensure consistent styling with shadcn/ui design system
- Configure Next.js layout in `/apps/web/src/app/layout.tsx`

**UX Design Section:**
See UX Design Spec: Section 4.1 - Design Direction, Section 3.1 - Visual Foundation, Section 6.2 - Design Tokens

**Design Token References:**
- Primary color: var(--color-primary) with var(--color-primary-hover) for hover states
- Secondary color: var(--color-secondary) with var(--color-secondary-hover) for hover states
- Typography: var(--font-sans) font family, var(--text-base) for body, heading scale uses var(--text-xl/2xl/3xl/4xl)
- Spacing system: var(--spacing-xs/sm/md/lg/xl/2xl/3xl) based on var(--spacing-xs) base unit
- Border radius: var(--radius-sm) for buttons/inputs, var(--radius-md) for cards/modals
- Shadows: var(--shadow-sm/md/lg/xl) for elevation hierarchy
- Layout: max-width 1280px container, gutter var(--spacing-lg)
- Lucide icons integrated for UI elements
- Theme transitions: var(--transition-fade) for smooth, non-jarring transitions

---

## Story 1.5: Deployment Pipeline and Environment Configuration

As a developer,
I want automated build and deployment pipeline,
So that we can deploy to production reliably and consistently.

**Acceptance Criteria:**

**Given** the application is fully functional from Stories 1.1-1.4
**When** code is pushed to the main branch
**Then** CI/CD pipeline automatically runs

**And** the pipeline includes:
- Linting with Ultracite/Biome (fails on errors)
- Type checking with TypeScript (fails on errors)
- Unit test execution (if tests exist)
- Production build compilation
- Deployment to staging environment

**And** environment configuration supports:
- Development, staging, and production environments
- Environment-specific variables (database URLs, API keys)
- Secrets management for sensitive credentials
- Environment variable validation at startup

**And** production build is optimized with:
- Code minification and bundling
- Tree shaking for unused code
- Image optimization
- Static asset caching headers

**Prerequisites:** Story 1.4

**Technical Notes:**
- Configure GitHub Actions or similar CI/CD
- Use Vercel/Railway/similar for hosting
- Set up environment variables in deployment platform
- Create `.env.example` file with required variables
- Document deployment process in README
- Configure build output directory for Next.js
- Set up health check endpoint for monitoring
- Use existing turbo.json for build orchestration

---

## Story 1.6: Testing Infrastructure and E2E Setup

As a developer,
I want a comprehensive testing infrastructure with unit, integration, and E2E tests,
So that I can ensure code quality and catch regressions early.

**Acceptance Criteria:**

**Given** the basic application infrastructure from Stories 1.1-1.5
**When** I want to write and run tests
**Then** I have a complete testing framework available

**And** unit/integration testing is configured:
- Bun's built-in test runner is available
- React Testing Library is installed for component tests
- DOM testing environment is configured
- Test scripts run successfully: `bun test`, `bun test --watch`, `bun test --coverage`
- Example unit test exists and passes

**And** E2E testing is configured in separate app:
- E2E tests live in dedicated `apps/e2e/` application
- Playwright is installed and configured
- Browser automation works (Chromium, Firefox, WebKit)
- Test scripts run successfully: `bun test:e2e`, `bun test:e2e:ui`, `bun test:e2e:debug`
- Example E2E test (login flow) exists and passes
- Screenshots and videos capture on test failure

**And** test utilities are available:
- Authentication helpers (login/logout)
- Database seeding helpers (create test data, cleanup)
- Test database is separate from development database
- Helpers import from workspace packages as needed

**And** CI/CD runs tests automatically:
- Tests run on push and pull requests
- Unit tests execute first
- E2E tests execute after unit tests
- Failing tests block deployment
- Test reports and artifacts available on failure

**And** documentation exists:
- README explains how to run tests
- README explains how to write new tests
- Example tests demonstrate best practices

**Prerequisites:** Story 1.5

**Technical Notes:**
- Use Bun's built-in test runner for unit/integration tests
- Use Playwright for E2E tests
- Create `apps/e2e/` as separate application
- Configure separate test database
- E2E tests align with story naming convention

---
