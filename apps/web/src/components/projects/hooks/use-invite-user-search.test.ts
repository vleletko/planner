import { describe, expect, it } from "vitest";
import { computeSearchState } from "./use-invite-user-search";

describe("computeSearchState", () => {
  it("returns idle when query is empty", () => {
    const result = computeSearchState({
      debouncedQuery: "",
      isLoading: false,
      isError: false,
      data: undefined,
    });
    expect(result).toEqual({ status: "idle" });
  });

  it("returns searching when loading", () => {
    const result = computeSearchState({
      debouncedQuery: "test",
      isLoading: true,
      isError: false,
      data: undefined,
    });
    expect(result).toEqual({ status: "searching" });
  });

  it("returns error when query failed", () => {
    const result = computeSearchState({
      debouncedQuery: "test",
      isLoading: false,
      isError: true,
      data: undefined,
    });
    expect(result).toEqual({ status: "error" });
  });

  it("returns success with results", () => {
    const mockResults = [{ name: "John", email: "john@test.com" }];
    const result = computeSearchState({
      debouncedQuery: "test",
      isLoading: false,
      isError: false,
      data: mockResults,
    });
    expect(result).toEqual({ status: "success", results: mockResults });
  });

  it("returns success with empty array when data is undefined", () => {
    const result = computeSearchState({
      debouncedQuery: "test",
      isLoading: false,
      isError: false,
      data: undefined,
    });
    expect(result).toEqual({ status: "success", results: [] });
  });
});
