/**
 * Project validation constants and patterns
 * Shared between API and frontend
 */
export const PROJECT_CONSTRAINTS = {
  MAX_NAME_LENGTH: 100,
  MAX_KEY_LENGTH: 7,
  MAX_DESCRIPTION_LENGTH: 500,
} as const;

/**
 * Project key format regex
 * Must start with a letter, followed by uppercase letters/numbers
 */
export const PROJECT_KEY_REGEX = /^[A-Z][A-Z0-9]*$/;
