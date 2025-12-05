import { describe, expect, test } from "bun:test";
import {
  isNonEmptyString,
  isPositiveInteger,
  isValidEmail,
  sanitizeString,
} from "./validation";

describe("validation helpers", () => {
  describe("isValidEmail", () => {
    test("returns true for valid email addresses", () => {
      expect(isValidEmail("test@example.com")).toBe(true);
      expect(isValidEmail("user.name@domain.org")).toBe(true);
      expect(isValidEmail("user+tag@example.co.uk")).toBe(true);
    });

    test("returns false for invalid email addresses", () => {
      expect(isValidEmail("invalid")).toBe(false);
      expect(isValidEmail("@example.com")).toBe(false);
      expect(isValidEmail("user@")).toBe(false);
      expect(isValidEmail("user@.com")).toBe(false);
      expect(isValidEmail("")).toBe(false);
    });

    test("returns false for non-string values", () => {
      expect(isValidEmail(null as unknown as string)).toBe(false);
      expect(isValidEmail(undefined as unknown as string)).toBe(false);
    });
  });

  describe("isNonEmptyString", () => {
    test("returns true for non-empty strings", () => {
      expect(isNonEmptyString("hello")).toBe(true);
      expect(isNonEmptyString(" text ")).toBe(true);
    });

    test("returns false for empty or whitespace-only strings", () => {
      expect(isNonEmptyString("")).toBe(false);
      expect(isNonEmptyString("   ")).toBe(false);
      expect(isNonEmptyString("\t\n")).toBe(false);
    });

    test("returns false for non-string values", () => {
      expect(isNonEmptyString(null)).toBe(false);
      expect(isNonEmptyString(undefined)).toBe(false);
      expect(isNonEmptyString(123)).toBe(false);
      expect(isNonEmptyString({})).toBe(false);
    });
  });

  describe("isPositiveInteger", () => {
    test("returns true for positive integers", () => {
      expect(isPositiveInteger(1)).toBe(true);
      expect(isPositiveInteger(100)).toBe(true);
      expect(isPositiveInteger(Number.MAX_SAFE_INTEGER)).toBe(true);
    });

    test("returns false for zero and negative numbers", () => {
      expect(isPositiveInteger(0)).toBe(false);
      expect(isPositiveInteger(-1)).toBe(false);
      expect(isPositiveInteger(-100)).toBe(false);
    });

    test("returns false for non-integers", () => {
      expect(isPositiveInteger(1.5)).toBe(false);
      expect(isPositiveInteger(0.1)).toBe(false);
      expect(isPositiveInteger(Number.POSITIVE_INFINITY)).toBe(false);
      expect(isPositiveInteger(Number.NaN)).toBe(false);
    });

    test("returns false for non-number values", () => {
      expect(isPositiveInteger("1")).toBe(false);
      expect(isPositiveInteger(null)).toBe(false);
      expect(isPositiveInteger(undefined)).toBe(false);
    });
  });

  describe("sanitizeString", () => {
    test("trims whitespace from beginning and end", () => {
      expect(sanitizeString("  hello  ")).toBe("hello");
      expect(sanitizeString("\thello\n")).toBe("hello");
    });

    test("collapses multiple spaces to single space", () => {
      expect(sanitizeString("hello   world")).toBe("hello world");
      expect(sanitizeString("a  b  c")).toBe("a b c");
    });

    test("handles empty and whitespace-only strings", () => {
      expect(sanitizeString("")).toBe("");
      expect(sanitizeString("   ")).toBe("");
    });

    test("returns empty string for non-string values", () => {
      expect(sanitizeString(null as unknown as string)).toBe("");
      expect(sanitizeString(undefined as unknown as string)).toBe("");
      expect(sanitizeString(123 as unknown as string)).toBe("");
    });
  });
});
