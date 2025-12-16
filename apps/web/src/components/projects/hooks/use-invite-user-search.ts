import { useDebouncedValue } from "@tanstack/react-pacer";
import { useQuery, useQueryClient } from "@tanstack/react-query";

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

type ComputeSearchStateParams = {
  debouncedQuery: string;
  isLoading: boolean;
  isError: boolean;
  data: InviteUserResult[] | undefined;
};

/** Pure function to compute search state from query result */
export function computeSearchState({
  debouncedQuery,
  isLoading,
  isError,
  data,
}: ComputeSearchStateParams): InviteUserSearchState {
  if (!debouncedQuery) {
    return { status: "idle" };
  }
  if (isLoading) {
    return { status: "searching" };
  }
  if (isError) {
    return { status: "error" };
  }
  return { status: "success", results: data ?? [] };
}

export function useInviteUserSearch({
  query,
  onSearch,
  debounceMs = DEFAULT_DEBOUNCE_MS,
  disabled = false,
}: UseInviteUserSearchOptions): UseInviteUserSearchReturn {
  const queryClient = useQueryClient();
  const [debouncedQuery] = useDebouncedValue(query.trim(), {
    wait: debounceMs,
  });

  const { data, isLoading, isError } = useQuery({
    queryKey: ["invite-user-search", debouncedQuery],
    queryFn: () => onSearch?.(debouncedQuery) ?? [],
    enabled: !disabled && !!onSearch && debouncedQuery.length > 0,
    staleTime: 30_000, // Fresh for 30s
    gcTime: 5 * 60_000, // Keep 5min in cache
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const searchState = computeSearchState({
    debouncedQuery,
    isLoading,
    isError,
    data,
  });

  const reset = () => {
    queryClient.removeQueries({ queryKey: ["invite-user-search"] });
  };

  return { searchState, reset };
}
