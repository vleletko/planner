import { Archive, CheckCircle2, Filter, Layers, Search, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export type ProjectStatusFilter = "active" | "archived" | "all";

export type ProjectsListFilterProps = {
  nameFilter: string;
  onNameFilterChange: (value: string) => void;
  statusFilter: ProjectStatusFilter;
  onStatusFilterChange: (value: ProjectStatusFilter) => void;
  isAdmin: boolean;
  className?: string;
};

const DEBOUNCE_MS = 300;

export function ProjectsListFilter({
  nameFilter,
  onNameFilterChange,
  statusFilter,
  onStatusFilterChange,
  isAdmin,
  className,
}: ProjectsListFilterProps) {
  // Local state for debounced search input
  const [localSearch, setLocalSearch] = useState(nameFilter);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync local state when external value changes
  useEffect(() => {
    setLocalSearch(nameFilter);
  }, [nameFilter]);

  // Cleanup debounce timeout on unmount
  useEffect(
    () => () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    },
    []
  );

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setLocalSearch(value);

      // Clear existing timeout
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      // Set new debounced callback
      debounceRef.current = setTimeout(() => {
        onNameFilterChange(value);
      }, DEBOUNCE_MS);
    },
    [onNameFilterChange]
  );

  const handleClearSearch = useCallback(() => {
    setLocalSearch("");
    onNameFilterChange("");

    // Clear any pending debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
  }, [onNameFilterChange]);

  const hasActiveFilters = nameFilter.length > 0 || statusFilter !== "active";

  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4",
        className
      )}
    >
      {/* Search Input */}
      <div className="relative flex-1 sm:max-w-xs">
        <Search
          aria-hidden="true"
          className="-translate-y-1/2 pointer-events-none absolute top-1/2 left-3 size-4 text-muted-foreground"
        />
        <Input
          aria-label="Search projects by name"
          className="pr-8 pl-9"
          onChange={handleSearchChange}
          placeholder="Search projects..."
          type="search"
          value={localSearch}
        />
        {localSearch.length > 0 ? (
          <Button
            aria-label="Clear search"
            className="-translate-y-1/2 absolute top-1/2 right-1 size-7 text-muted-foreground hover:text-foreground"
            onClick={handleClearSearch}
            size="icon"
            type="button"
            variant="ghost"
          >
            <X className="size-4" />
          </Button>
        ) : null}
      </div>

      {/* Status Filter - Only show dropdown for admins */}
      {isAdmin ? (
        <Select
          onValueChange={(value) =>
            onStatusFilterChange(value as ProjectStatusFilter)
          }
          value={statusFilter}
        >
          <SelectTrigger
            aria-label="Filter by status"
            className="w-full sm:w-[140px]"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">
              <CheckCircle2 className="size-4" />
              <span>Active</span>
            </SelectItem>
            <SelectItem value="archived">
              <Archive className="size-4" />
              <span>Archived</span>
            </SelectItem>
            <SelectItem value="all">
              <Layers className="size-4" />
              <span>All</span>
            </SelectItem>
          </SelectContent>
        </Select>
      ) : null}

      {/* Active filters indicator */}
      {hasActiveFilters ? (
        <div className="flex items-center gap-2 text-muted-foreground text-xs">
          <Filter className="size-3" />
          <span>Filtered</span>
        </div>
      ) : null}
    </div>
  );
}

/**
 * Empty state shown when no projects match the current filter
 */
export type FilteredEmptyStateProps = {
  nameFilter: string;
  statusFilter: ProjectStatusFilter;
  onClearFilters?: () => void;
};

export function FilteredEmptyState({
  nameFilter,
  statusFilter,
  onClearFilters,
}: FilteredEmptyStateProps) {
  const hasNameFilter = nameFilter.length > 0;
  const hasStatusFilter = statusFilter !== "active";

  let message = "No projects found";
  if (hasNameFilter && hasStatusFilter) {
    message = `No ${statusFilter === "all" ? "" : statusFilter} projects matching "${nameFilter}"`;
  } else if (hasNameFilter) {
    message = `No projects matching "${nameFilter}"`;
  } else if (hasStatusFilter) {
    message = `No ${statusFilter} projects`;
  }

  return (
    <div className="flex min-h-[300px] flex-col items-center justify-center rounded-xl border border-muted-foreground/25 border-dashed bg-muted/30 px-4 py-8">
      <div className="relative mb-4">
        <Search className="size-12 text-muted-foreground/50" strokeWidth={1} />
      </div>
      <p className="mb-4 max-w-xs text-center text-muted-foreground text-sm">
        {message}
      </p>
      {onClearFilters ? (
        <Button onClick={onClearFilters} size="sm" variant="outline">
          Clear filters
        </Button>
      ) : null}
    </div>
  );
}
