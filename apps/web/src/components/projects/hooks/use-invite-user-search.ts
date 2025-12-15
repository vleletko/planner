import { useEffect, useRef, useState } from "react";

export type InviteUserResult = {
  name: string;
  email: string;
  avatar?: string | null;
  /** Server indicates if user is already a member of the target project */
  isMember?: boolean;
};

export type InviteUserSearchState =
  | { status: "idle" }
  | { status: "searching" }
  | { status: "success"; results: InviteUserResult[] }
  | { status: "error" };

export type UseInviteUserSearchOptions = {
  /** The query to search for */
  query: string;
  /** Async callback to search for users. Returns array of matching users. */
  onSearch?: (query: string) => Promise<InviteUserResult[]>;
  /** Debounce delay in milliseconds (default: 500) */
  debounceMs?: number;
  /** If true, disables the hook (for controlled/Storybook mode) */
  disabled?: boolean;
};

export type UseInviteUserSearchReturn = {
  searchState: InviteUserSearchState;
  reset: () => void;
};

const DEFAULT_DEBOUNCE_MS = 500;
const IDLE_STATE: InviteUserSearchState = { status: "idle" };
const SEARCHING_STATE: InviteUserSearchState = { status: "searching" };
const ERROR_STATE: InviteUserSearchState = { status: "error" };

export function useInviteUserSearch({
  query,
  onSearch,
  debounceMs = DEFAULT_DEBOUNCE_MS,
  disabled = false,
}: UseInviteUserSearchOptions): UseInviteUserSearchReturn {
  const [searchState, setSearchState] =
    useState<InviteUserSearchState>(IDLE_STATE);

  // Track the latest search request to handle race conditions
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (disabled || !onSearch) {
      return;
    }

    const trimmedQuery = query.trim();

    // Reset to idle if query is empty
    if (!trimmedQuery) {
      setSearchState(IDLE_STATE);
      return;
    }

    requestIdRef.current += 1;
    const currentRequestId = requestIdRef.current;

    const timeoutId = setTimeout(async () => {
      setSearchState(SEARCHING_STATE);

      try {
        const results = await onSearch(trimmedQuery);

        // Only update if this is still the latest request
        if (currentRequestId === requestIdRef.current) {
          setSearchState({ status: "success", results });
        }
      } catch {
        if (currentRequestId === requestIdRef.current) {
          setSearchState(ERROR_STATE);
        }
      }
    }, debounceMs);

    return () => clearTimeout(timeoutId);
  }, [query, onSearch, debounceMs, disabled]);

  const reset = () => {
    setSearchState(IDLE_STATE);
  };

  return { searchState, reset };
}
