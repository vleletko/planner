# Component Inventory

## Overview

This application uses **shadcn/ui** - a collection of re-usable components built on Radix UI with TailwindCSS. Components live in `apps/web/src/components/`.

**Key Technologies:**
- shadcn/ui (Radix UI v1.4.2)
- TailwindCSS v4.1.10
- Lucide React icons

**Structure:**
- `components/ui/` - shadcn/ui base components (9 components)
- `components/` - Application-specific components (7 components)

---

## Key Patterns

### Composition Pattern
Components compose together for flexibility:
```tsx
<Card>
  <CardHeader><CardTitle>Title</CardTitle></CardHeader>
  <CardContent>Content</CardContent>
</Card>
```

### Variants
Components use `class-variance-authority` for variants:
```tsx
<Button variant="destructive" size="lg">Delete</Button>
```

### Styling
- `cn()` utility for conditional classes: `cn('base', isActive && 'active')`
- All components use TailwindCSS utilities
- Theme support via CSS variables and `next-themes`

### Design Tokens (MANDATORY)

**⚠️ Always use design tokens defined in `apps/web/src/index.css`**

- Use semantic tokens: `bg-background`, `text-foreground`, `bg-primary`, etc.
- Tokens automatically handle light/dark theme switching
- **Never hardcode colors** like `bg-gray-900` or `#000000`

**Example:**
```tsx
<div className="bg-background text-foreground border-border">
  <Button className="bg-primary text-primary-foreground">Submit</Button>
</div>
```

---

## Adding Components

### Adding shadcn/ui Components

```bash
npx shadcn@latest add <component-name>
```

This automatically:
- Installs dependencies
- Adds component to `src/components/ui/`
- Configures imports

**Examples:**
```bash
npx shadcn@latest add dialog
npx shadcn@latest add table
npx shadcn@latest add tabs
```

### Creating Custom Components

1. Create file in `apps/web/src/components/`
2. Import shadcn/ui primitives as needed
3. Follow existing patterns (see `sign-in-form.tsx` or `header.tsx`)

**Example:**
```tsx
// apps/web/src/components/my-feature.tsx
import { Button } from './ui/button'
import { Card, CardContent } from './ui/card'

export function MyFeature() {
  return (
    <Card>
      <CardContent>
        <Button>Action</Button>
      </CardContent>
    </Card>
  )
}
```

---

## Configuration

**File:** `apps/web/components.json`

```json
{
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils"
  }
}
```

This enables imports like:
```tsx
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
```
