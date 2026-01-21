ALTER TABLE "projects" DROP CONSTRAINT "unique_project_name_per_user";--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
-- Create partial unique index for name (only for active/non-deleted projects)
-- This allows name reuse after soft-delete while maintaining uniqueness for active projects
CREATE UNIQUE INDEX "unique_project_name_per_user" ON "projects" ("owner_id", "name") WHERE "deleted_at" IS NULL;