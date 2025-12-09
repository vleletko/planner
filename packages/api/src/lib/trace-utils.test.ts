import { beforeEach, describe, expect, mock, test } from "bun:test";
import { SpanStatusCode, trace } from "@opentelemetry/api";
import { getTraceId, recordSpanError } from "./trace-utils";

describe("trace-utils", () => {
  const mockSpan = {
    spanContext: mock(() => ({ traceId: "abc123def456" })),
    // biome-ignore lint/suspicious/noEmptyBlockStatements: mock function returns undefined
    recordException: mock(() => {}),
    // biome-ignore lint/suspicious/noEmptyBlockStatements: mock function returns undefined
    setStatus: mock(() => {}),
    // biome-ignore lint/suspicious/noEmptyBlockStatements: mock function returns undefined
    setAttributes: mock(() => {}),
  };

  beforeEach(() => {
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

  describe("getTraceId", () => {
    test("returns trace ID when active span exists", () => {
      const originalGetActiveSpan = trace.getActiveSpan;
      (trace as any).getActiveSpan = () => mockSpan;

      const result = getTraceId();
      expect(result).toBe("abc123def456");
      expect(mockSpan.spanContext).toHaveBeenCalled();

      (trace as any).getActiveSpan = originalGetActiveSpan;
    });

    test("returns undefined when no active span", () => {
      const originalGetActiveSpan = trace.getActiveSpan;
      // biome-ignore lint/suspicious/noEmptyBlockStatements: return undefined for no span
      (trace as any).getActiveSpan = () => {};

      const result = getTraceId();
      expect(result).toBeUndefined();

      (trace as any).getActiveSpan = originalGetActiveSpan;
    });
  });

  describe("recordSpanError", () => {
    test("records exception on active span", () => {
      const originalGetActiveSpan = trace.getActiveSpan;
      (trace as any).getActiveSpan = () => mockSpan;

      const error = new Error("Test error");
      recordSpanError(error, { "rpc.path": "test/procedure" }, false);

      expect(mockSpan.recordException).toHaveBeenCalledWith(error);

      (trace as any).getActiveSpan = originalGetActiveSpan;
    });

    test("sets ERROR status for server errors", () => {
      const originalGetActiveSpan = trace.getActiveSpan;
      (trace as any).getActiveSpan = () => mockSpan;

      const error = new Error("Server error");
      recordSpanError(error, { "rpc.path": "test/procedure" }, false);

      expect(mockSpan.setStatus).toHaveBeenCalledWith({
        code: SpanStatusCode.ERROR,
        message: "Server error",
      });

      (trace as any).getActiveSpan = originalGetActiveSpan;
    });

    test("sets OK status for client errors (expected behavior)", () => {
      const originalGetActiveSpan = trace.getActiveSpan;
      (trace as any).getActiveSpan = () => mockSpan;

      const error = new Error("Client error");
      recordSpanError(error, { "rpc.path": "test/procedure" }, true);

      expect(mockSpan.setStatus).toHaveBeenCalledWith({
        code: SpanStatusCode.OK,
      });

      (trace as any).getActiveSpan = originalGetActiveSpan;
    });

    test("sets error attributes including error type", () => {
      const originalGetActiveSpan = trace.getActiveSpan;
      (trace as any).getActiveSpan = () => mockSpan;

      const error = new TypeError("Type error");
      recordSpanError(error, { "rpc.path": "test/procedure" }, false);

      expect(mockSpan.setAttributes).toHaveBeenCalledWith({
        "error.type": "TypeError",
        "rpc.path": "test/procedure",
      });

      (trace as any).getActiveSpan = originalGetActiveSpan;
    });

    test("does nothing when no active span", () => {
      const originalGetActiveSpan = trace.getActiveSpan;
      // biome-ignore lint/suspicious/noEmptyBlockStatements: return undefined for no span
      (trace as any).getActiveSpan = () => {};

      const error = new Error("Test error");
      recordSpanError(error, { "rpc.path": "test/procedure" }, false);

      expect(mockSpan.recordException).not.toHaveBeenCalled();
      expect(mockSpan.setStatus).not.toHaveBeenCalled();
      expect(mockSpan.setAttributes).not.toHaveBeenCalled();

      (trace as any).getActiveSpan = originalGetActiveSpan;
    });
  });
});
