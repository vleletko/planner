/**
 * Common validation utilities for the API layer.
 * These helpers provide type-safe validation for common data formats.
 */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validates that a string is a properly formatted email address.
 * Uses a standard regex pattern that covers most common email formats.
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== "string") {
    return false;
  }
  return EMAIL_REGEX.test(email.trim());
}

/**
 * Validates that a string is a non-empty string after trimming whitespace.
 */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * Validates that a value is a positive integer.
 */
export function isPositiveInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value > 0;
}

/**
 * Sanitizes a string by trimming whitespace and collapsing multiple spaces.
 */
export function sanitizeString(value: string): string {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim().replace(/\s+/g, " ");
}
