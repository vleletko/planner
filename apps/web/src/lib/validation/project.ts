/**
 * Project validation utilities
 * Constants are imported from @planner/api/lib/validation/project (single source of truth)
 */

import { PROJECT_CONSTRAINTS } from "@planner/api/lib/validation/project";

/**
 * Validate a project name
 * @returns Error message if invalid, null if valid
 */
export function validateProjectName(value: string): string | null {
  if (!value.trim()) {
    return "Project name is required";
  }
  if (value.length > PROJECT_CONSTRAINTS.MAX_NAME_LENGTH) {
    return `Name must be ${PROJECT_CONSTRAINTS.MAX_NAME_LENGTH} characters or less`;
  }
  return null;
}
