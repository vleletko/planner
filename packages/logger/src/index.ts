// Logger
export { createLogger, type Logger, logger } from "./logger";

// Span utilities
export {
  getTraceId,
  isInternalServerError,
  type RecordSpanErrorOptions,
  recordSpanError,
} from "./span";
