import type { Page, Response } from "@playwright/test";

/**
 * Wait for an API response matching the given pattern
 * Useful for ensuring async operations complete before assertions
 */
export function waitForApiResponse(
  page: Page,
  urlPattern: RegExp,
  options: {
    method?: string;
    status?: number;
  } = {}
): Promise<Response> {
  const { method = "GET", status = 200 } = options;

  return page.waitForResponse(
    (response) =>
      urlPattern.test(response.url()) &&
      response.request().method() === method &&
      response.status() === status
  );
}

/**
 * Wait for any pending network requests to complete
 * Alternative to waitForLoadState('networkidle') with more control
 *
 * Uses Playwright's default timeout from config if not specified
 */
export async function waitForNetworkSettled(
  page: Page,
  options: { timeout?: number } = {}
): Promise<void> {
  await page.waitForLoadState("networkidle", options);
}
