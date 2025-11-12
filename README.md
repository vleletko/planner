# planner

This project was created with [Better-T-Stack](https://github.com/AmanVarshney01/create-better-t-stack), a modern TypeScript stack that combines Next.js, Self, ORPC, and more.

## Features

- **TypeScript** - For type safety and improved developer experience
- **Next.js** - Full-stack React framework
- **TailwindCSS** - Utility-first CSS for rapid UI development
- **shadcn/ui** - Reusable UI components
- **oRPC** - End-to-end type-safe APIs with OpenAPI integration
- **Drizzle** - TypeScript-first ORM
- **PostgreSQL** - Database engine
- **Authentication** - Better-Auth
- **Turborepo** - Optimized monorepo build system

## Prerequisites

This project requires:
- **Bun 1.3.1** (exact version managed via `packageManager` field)
- **PostgreSQL 16** (for database)

## Getting Started

First, install the dependencies:

```bash
bun install
```
## Database Setup

This project uses PostgreSQL with Drizzle ORM.

1. Copy the environment file and configure your settings:
```bash
cp apps/web/.env.example apps/web/.env
```

2. Update `apps/web/.env` with your PostgreSQL connection details and auth configuration.

3. Start the PostgreSQL database (using Docker):
```bash
bun run db:start
```

4. Apply the schema to your database:
```bash
bun run db:push
```


Then, run the development server:

```bash
bun run dev
```

Open [http://localhost:3001](http://localhost:3001) in your browser to see your fullstack application.







## Project Structure

```
planner/
├── apps/
│   └── web/         # Fullstack application (Next.js)
├── packages/
│   ├── api/         # API layer / business logic
│   ├── auth/        # Authentication configuration & logic
│   └── db/          # Database schema & queries
```

## Available Scripts

### Development
- `bun run dev`: Start all applications in development mode
- `bun run dev:web`: Start only the web application
- `bun run dev:native`: Start only the native application

### Building
- `bun run build`: Build all applications for production

### Code Quality
- `bun run check`: Run Biome linter and formatter (with auto-fix)
- `bun run check-types`: Check TypeScript types across all packages

### Database
- `bun run db:push`: Push schema changes to database
- `bun run db:studio`: Open Drizzle Studio (database UI)
- `bun run db:generate`: Generate database migrations
- `bun run db:migrate`: Run database migrations
- `bun run db:start`: Start PostgreSQL database (Docker)
- `bun run db:watch`: Start PostgreSQL with logs
- `bun run db:stop`: Stop PostgreSQL database
- `bun run db:down`: Stop and remove PostgreSQL container
