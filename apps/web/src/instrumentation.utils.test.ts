import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";
import {
  addTraceIdHeader,
  getDeploymentEnvironment,
  getOtlpHeaders,
  getSamplerConfig,
  getTraceExporterUrl,
} from "./instrumentation.utils";

// Noop function for mock implementations
const noop = () => {
  // Mock function intentionally does nothing
};

describe("instrumentation.utils", () => {
  // Store original env values
  const originalEnv = { ...process.env };

  beforeEach(() => {
    // Reset env before each test
    process.env = { ...originalEnv };
    // Clear relevant env vars
    process.env.NODE_ENV = undefined;
    process.env.PREVIEW_ID = undefined;
    process.env.STAGING = undefined;
    process.env.USER = undefined;
    process.env.OTEL_EXPORTER_OTLP_HEADERS = undefined;
    process.env.OTEL_EXPORTER_OTLP_ENDPOINT = undefined;
  });

  afterEach(() => {
    // Restore original env
    process.env = { ...originalEnv };
  });

  describe("getDeploymentEnvironment", () => {
    test("returns 'production' when NODE_ENV=production and no PREVIEW_ID", () => {
      process.env.NODE_ENV = "production";
      expect(getDeploymentEnvironment()).toBe("production");
    });

    test("returns 'preview-{id}' when PREVIEW_ID is set", () => {
      process.env.PREVIEW_ID = "123";
      expect(getDeploymentEnvironment()).toBe("preview-123");
    });

    test("returns 'preview-{id}' when PREVIEW_ID is set even with NODE_ENV=production", () => {
      process.env.NODE_ENV = "production";
      process.env.PREVIEW_ID = "456";
      expect(getDeploymentEnvironment()).toBe("preview-456");
    });

    test("returns 'staging' when STAGING=true", () => {
      process.env.STAGING = "true";
      expect(getDeploymentEnvironment()).toBe("staging");
    });

    test("returns '{USER}-development' for development environment", () => {
      process.env.USER = "testuser";
      expect(getDeploymentEnvironment()).toBe("testuser-development");
    });

    test("returns 'unknown-development' when USER is not set", () => {
      expect(getDeploymentEnvironment()).toBe("unknown-development");
    });

    test("PREVIEW_ID takes priority over STAGING", () => {
      process.env.PREVIEW_ID = "789";
      process.env.STAGING = "true";
      expect(getDeploymentEnvironment()).toBe("preview-789");
    });
  });

  describe("getSamplerConfig", () => {
    test("returns 10% ratio for production", () => {
      const config = getSamplerConfig("production");
      expect(config.type).toBe("ratio");
      expect(config.ratio).toBe(0.1);
    });

    test("returns 50% ratio for staging", () => {
      const config = getSamplerConfig("staging");
      expect(config.type).toBe("ratio");
      expect(config.ratio).toBe(0.5);
    });

    test("returns always-on for development", () => {
      const config = getSamplerConfig("testuser-development");
      expect(config.type).toBe("always");
      expect(config.ratio).toBeUndefined();
    });

    test("returns always-on for preview environments", () => {
      const config = getSamplerConfig("preview-123");
      expect(config.type).toBe("always");
      expect(config.ratio).toBeUndefined();
    });
  });

  describe("getOtlpHeaders", () => {
    test("returns undefined when OTEL_EXPORTER_OTLP_HEADERS is not set", () => {
      expect(getOtlpHeaders()).toBeUndefined();
    });

    test("returns undefined when OTEL_EXPORTER_OTLP_HEADERS is empty", () => {
      process.env.OTEL_EXPORTER_OTLP_HEADERS = "";
      expect(getOtlpHeaders()).toBeUndefined();
    });

    test("parses single key-value pair", () => {
      process.env.OTEL_EXPORTER_OTLP_HEADERS = "Authorization=Bearer token123";
      expect(getOtlpHeaders()).toEqual({
        Authorization: "Bearer token123",
      });
    });

    test("parses multiple key-value pairs", () => {
      process.env.OTEL_EXPORTER_OTLP_HEADERS =
        "key1=value1,key2=value2,key3=value3";
      expect(getOtlpHeaders()).toEqual({
        key1: "value1",
        key2: "value2",
        key3: "value3",
      });
    });

    test("handles values containing equals sign (base64)", () => {
      process.env.OTEL_EXPORTER_OTLP_HEADERS =
        "signoz-access-token=abc123def456==";
      expect(getOtlpHeaders()).toEqual({
        "signoz-access-token": "abc123def456==",
      });
    });

    test("trims whitespace from keys and values", () => {
      process.env.OTEL_EXPORTER_OTLP_HEADERS =
        " key1 = value1 , key2 = value2 ";
      expect(getOtlpHeaders()).toEqual({
        key1: "value1",
        key2: "value2",
      });
    });

    test("ignores malformed pairs without equals", () => {
      process.env.OTEL_EXPORTER_OTLP_HEADERS = "valid=pair,invalid,also=valid";
      expect(getOtlpHeaders()).toEqual({
        valid: "pair",
        also: "valid",
      });
    });
  });

  describe("getTraceExporterUrl", () => {
    test("returns undefined when endpoint is undefined", () => {
      expect(getTraceExporterUrl(undefined)).toBeUndefined();
    });

    test("returns undefined when endpoint is empty string", () => {
      expect(getTraceExporterUrl("")).toBeUndefined();
    });

    test("appends /v1/traces to endpoint", () => {
      expect(getTraceExporterUrl("http://localhost:4318")).toBe(
        "http://localhost:4318/v1/traces"
      );
    });

    test("handles endpoint with trailing slash", () => {
      expect(getTraceExporterUrl("http://localhost:4318/")).toBe(
        "http://localhost:4318/v1/traces"
      );
    });

    test("handles full URL with path", () => {
      expect(getTraceExporterUrl("https://otel.example.com:443")).toBe(
        "https://otel.example.com:443/v1/traces"
      );
    });
  });

  describe("addTraceIdHeader", () => {
    test("sets x-trace-id header from span context", () => {
      const mockSetHeader = mock(noop);
      const mockResponse = { setHeader: mockSetHeader };
      const mockSpan = {
        spanContext: () => ({ traceId: "abc123def456" }),
      };
      const mockLogger = { error: mock(noop) };

      addTraceIdHeader(mockSpan, mockResponse, mockLogger);

      expect(mockSetHeader).toHaveBeenCalledWith("x-trace-id", "abc123def456");
      expect(mockLogger.error).not.toHaveBeenCalled();
    });

    test("handles response without setHeader method gracefully", () => {
      const mockResponse = {}; // No setHeader - like IncomingMessage
      const mockSpan = {
        spanContext: () => ({ traceId: "abc123def456" }),
      };
      const mockLogger = { error: mock(noop) };

      // Should not throw
      addTraceIdHeader(mockSpan, mockResponse, mockLogger);
      expect(mockLogger.error).not.toHaveBeenCalled();
    });

    test("handles null response gracefully", () => {
      const mockSpan = {
        spanContext: () => ({ traceId: "abc123def456" }),
      };
      const mockLogger = { error: mock(noop) };

      // Should not throw
      addTraceIdHeader(mockSpan, null, mockLogger);
      expect(mockLogger.error).not.toHaveBeenCalled();
    });

    test("logs error if spanContext throws", () => {
      const mockSetHeader = mock(noop);
      const mockResponse = { setHeader: mockSetHeader };
      const mockSpan = {
        spanContext: () => {
          throw new Error("span error");
        },
      };
      const mockLogger = { error: mock(noop) };

      addTraceIdHeader(mockSpan, mockResponse, mockLogger);

      expect(mockLogger.error).toHaveBeenCalled();
      expect(mockSetHeader).not.toHaveBeenCalled();
    });
  });
});
