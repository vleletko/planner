import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";
import { SpanStatusCode, trace } from "@opentelemetry/api";
import { ORPCError } from "@orpc/server";
import { getTraceId, isInternalServerError, recordSpanError } from "./span";

// Noop function for mock implementations
const noop = () => {
  // Mock function intentionally does nothing
};

describe("isInternalServerError", () => {
  test("returns true for non-ORPCError (unhandled exceptions)", () => {
    expect(isInternalServerError(new Error("generic error"))).toBe(true);
    expect(isInternalServerError(new TypeError("type error"))).toBe(true);
  });

  test("returns true for ORPCError with INTERNAL_SERVER_ERROR code", () => {
    expect(isInternalServerError(new ORPCError("INTERNAL_SERVER_ERROR"))).toBe(
      true
    );
  });

  test("returns false for ORPCError with client error codes", () => {
    expect(isInternalServerError(new ORPCError("NOT_FOUND"))).toBe(false);
    expect(isInternalServerError(new ORPCError("UNAUTHORIZED"))).toBe(false);
    expect(isInternalServerError(new ORPCError("BAD_REQUEST"))).toBe(false);
    expect(isInternalServerError(new ORPCError("FORBIDDEN"))).toBe(false);
  });

  test("returns false for ORPCError with transient server error codes", () => {
    // These are 5xx but NOT internal errors - they're transient/infrastructure
    expect(isInternalServerError(new ORPCError("SERVICE_UNAVAILABLE"))).toBe(
      false
    );
    expect(isInternalServerError(new ORPCError("BAD_GATEWAY"))).toBe(false);
    expect(isInternalServerError(new ORPCError("GATEWAY_TIMEOUT"))).toBe(false);
    expect(isInternalServerError(new ORPCError("NOT_IMPLEMENTED"))).toBe(false);
  });

  test("returns true for non-Error values (treated as internal)", () => {
    expect(isInternalServerError("string")).toBe(true);
    expect(isInternalServerError(null)).toBe(true);
    expect(isInternalServerError(undefined)).toBe(true);
    expect(isInternalServerError(42)).toBe(true);
  });
});

describe("span utilities", () => {
  const mockSpan = {
    spanContext: mock(() => ({ traceId: "abc123def456" })),
    recordException: mock(noop),
    setStatus: mock(noop),
    setAttributes: mock(noop),
  };

  let originalGetActiveSpan: typeof trace.getActiveSpan;

  beforeEach(() => {
    originalGetActiveSpan = trace.getActiveSpan;
    mock.module("@opentelemetry/api", () => ({
      trace: {
        getActiveSpan: mock(() => mockSpan),
      },
      SpanStatusCode,
    }));
    // Reset mocks
    mockSpan.spanContext.mockClear();
    mockSpan.recordException.mockClear();
    mockSpan.setStatus.mockClear();
    mockSpan.setAttributes.mockClear();
  });

  afterEach(() => {
    (
      trace as unknown as { getActiveSpan: typeof trace.getActiveSpan }
    ).getActiveSpan = originalGetActiveSpan;
  });

  describe("getTraceId", () => {
    test("returns trace ID when active span exists", () => {
      (
        trace as unknown as { getActiveSpan: () => typeof mockSpan }
      ).getActiveSpan = () => mockSpan;

      const result = getTraceId();
      expect(result).toBe("abc123def456");
      expect(mockSpan.spanContext).toHaveBeenCalled();
    });

    test("returns undefined when no active span", () => {
      (trace as unknown as { getActiveSpan: () => undefined }).getActiveSpan =
        noop;

      const result = getTraceId();
      expect(result).toBeUndefined();
    });
  });

  describe("recordSpanError", () => {
    test("records exception on active span", () => {
      (
        trace as unknown as { getActiveSpan: () => typeof mockSpan }
      ).getActiveSpan = () => mockSpan;

      const error = new Error("Test error");
      recordSpanError(error);

      expect(mockSpan.recordException).toHaveBeenCalledWith(error);
    });

    test("sets ERROR status for internal errors (default)", () => {
      (
        trace as unknown as { getActiveSpan: () => typeof mockSpan }
      ).getActiveSpan = () => mockSpan;

      const error = new Error("Server error");
      recordSpanError(error);

      expect(mockSpan.setStatus).toHaveBeenCalledWith({
        code: SpanStatusCode.ERROR,
        message: "Server error",
      });
    });

    test("sets ERROR status when isInternalError is true", () => {
      (
        trace as unknown as { getActiveSpan: () => typeof mockSpan }
      ).getActiveSpan = () => mockSpan;

      const error = new Error("Server error");
      recordSpanError(error, { isInternalError: true });

      expect(mockSpan.setStatus).toHaveBeenCalledWith({
        code: SpanStatusCode.ERROR,
        message: "Server error",
      });
    });

    test("sets OK status when isInternalError is false (expected error)", () => {
      (
        trace as unknown as { getActiveSpan: () => typeof mockSpan }
      ).getActiveSpan = () => mockSpan;

      const error = new Error("Client error");
      recordSpanError(error, { isInternalError: false });

      expect(mockSpan.setStatus).toHaveBeenCalledWith({
        code: SpanStatusCode.OK,
      });
    });

    test("sets error attributes including error type", () => {
      (
        trace as unknown as { getActiveSpan: () => typeof mockSpan }
      ).getActiveSpan = () => mockSpan;

      const error = new TypeError("Type error");
      recordSpanError(error, { attributes: { "rpc.path": "test/procedure" } });

      expect(mockSpan.setAttributes).toHaveBeenCalledWith({
        "error.type": "TypeError",
        "rpc.path": "test/procedure",
      });
    });

    test("does nothing when no active span", () => {
      (trace as unknown as { getActiveSpan: () => undefined }).getActiveSpan =
        noop;

      const error = new Error("Test error");
      recordSpanError(error);

      expect(mockSpan.recordException).not.toHaveBeenCalled();
      expect(mockSpan.setStatus).not.toHaveBeenCalled();
      expect(mockSpan.setAttributes).not.toHaveBeenCalled();
    });
  });
});
