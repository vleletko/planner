import { useDebouncedValue } from "@tanstack/react-pacer";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";

export type InviteUserResult = {
  /** User id (required for invite mutation). */
  id?: string;
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
  onSearch?: (
    query: string,
    signal?: AbortSignal
  ) => Promise<InviteUserResult[]>;
  /** Debounce delay in milliseconds (default: 500) */
  debounceMs?: number;
  /** If true, disables the hook (for controlled/Storybook mode) */
  disabled?: boolean;
  /** Optional query key prefix for cache scoping */
  queryKeyPrefix?: unknown[];
};

export type UseInviteUserSearchReturn = {
  searchState: InviteUserSearchState;
  reset: () => void;
};

const DEFAULT_DEBOUNCE_MS = 500;

type ComputeSearchStateParams = {
  query: string;
  debouncedQuery: string;
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  data: InviteUserResult[] | undefined;
};

/** Pure function to compute search state from query result */
export function computeSearchState({
  query,
  debouncedQuery,
  isLoading,
  isError,
  error,
  data,
}: ComputeSearchStateParams): InviteUserSearchState {
  const trimmedQuery = query.trim();
  const trimmedDebouncedQuery = debouncedQuery.trim();

  if (trimmedQuery.length < 2) {
    return { status: "idle" };
  }

  // User is actively typing and we haven't fired the debounced query yet.
  if (trimmedDebouncedQuery !== trimmedQuery) {
    return { status: "searching" };
  }

  if (isLoading) {
    return { status: "searching" };
  }

  if (isError) {
    // When a new search starts, previous in-flight requests should be canceled.
    // Cancellations should not surface as "Search failed".
    if (error instanceof DOMException && error.name === "AbortError") {
      return { status: "searching" };
    }

    return { status: "error" };
  }

  return { status: "success", results: data ?? [] };
}

function combineAbortSignals(
  signals: Array<AbortSignal | undefined>
): AbortSignal | undefined {
  const activeSignals = signals.filter(Boolean) as AbortSignal[];
  if (activeSignals.length === 0) {
    return;
  }

  if (activeSignals.length === 1) {
    return activeSignals[0];
  }

  const controller = new AbortController();

  for (const signal of activeSignals) {
    if (signal.aborted) {
      controller.abort();
      break;
    }

    signal.addEventListener(
      "abort",
      () => {
        controller.abort();
      },
      { once: true }
    );
  }

  return controller.signal;
}

export function useInviteUserSearch({
  query,
  onSearch,
  debounceMs = DEFAULT_DEBOUNCE_MS,
  disabled = false,
  queryKeyPrefix,
}: UseInviteUserSearchOptions): UseInviteUserSearchReturn {
  const queryClient = useQueryClient();
  const abortControllerRef = useRef<AbortController | null>(null);
  const baseQueryKey = queryKeyPrefix ?? ["invite-user-search"];

  // If the user keeps typing, cancel any in-flight search immediately.
  useEffect(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    return () => {
      abortControllerRef.current?.abort();
    };
  }, [query]);

  const [debouncedQuery] = useDebouncedValue(query.trim(), {
    wait: debounceMs,
  });

  const { data, isLoading, isError, error } = useQuery({
    queryKey: [...baseQueryKey, debouncedQuery],
    queryFn: ({ signal }) => {
      const combinedSignal = combineAbortSignals([
        signal,
        abortControllerRef.current?.signal,
      ]);

      return onSearch?.(debouncedQuery, combinedSignal) ?? [];
    },
    enabled: !disabled && !!onSearch && debouncedQuery.length >= 2,
    staleTime: 30_000, // Fresh for 30s
    gcTime: 5 * 60_000, // Keep 5min in cache
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const searchState = computeSearchState({
    query,
    debouncedQuery,
    isLoading,
    isError,
    error,
    data,
  });

  const reset = () => {
    queryClient.removeQueries({ queryKey: baseQueryKey });
  };

  return { searchState, reset };
}
