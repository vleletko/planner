"use client";

import { useEffect } from "react";

/**
 * Sets data-hydrated="true" on body after React hydration completes.
 * Clears on unmount so full page reloads start fresh.
 * Used by E2E tests to wait for the app to be interactive.
 */
export function HydrationMarker() {
  useEffect(() => {
    document.body.dataset.hydrated = "true";
    return () => {
      delete document.body.dataset.hydrated;
    };
  }, []);
  return null;
}
