/**
 * Get initials from a name string.
 * Returns up to 2 uppercase characters from the first letters of each word.
 * Handles empty strings and whitespace-only input gracefully.
 */
export function getInitials(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) {
    return "";
  }
  return trimmed
    .split(" ")
    .filter((part) => part.length > 0)
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Format a date for display using the browser's locale.
 * Shows month (short), day, and year.
 */
export function formatDate(date: Date): string {
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
