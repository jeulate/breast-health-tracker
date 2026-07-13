import { describe, it, expect } from "vitest";
import { ok, fail } from "@/lib/utils/api-response";

describe("ApiResponse helpers", () => {
  describe("ok()", () => {
    it("returns success: true with data", () => {
      const response = ok({ id: "1", name: "Test" });
      expect(response.success).toBe(true);
      expect(response.data).toEqual({ id: "1", name: "Test" });
      expect(response.error).toBeUndefined();
    });

    it("works with primitive data", () => {
      const response = ok(42);
      expect(response.success).toBe(true);
      expect(response.data).toBe(42);
    });

    it("works with array data", () => {
      const response = ok([1, 2, 3]);
      expect(response.success).toBe(true);
      expect(response.data).toHaveLength(3);
    });
  });

  describe("fail()", () => {
    it("returns success: false with error", () => {
      const response = fail("NOT_FOUND", "Resource not found");
      expect(response.success).toBe(false);
      expect(response.error?.code).toBe("NOT_FOUND");
      expect(response.error?.message).toBe("Resource not found");
      expect(response.data).toBeUndefined();
    });

    it("includes details when provided", () => {
      const details = { field: "email", reason: "invalid" };
      const response = fail("VALIDATION_ERROR", "Bad input", details);
      expect(response.error?.details).toEqual(details);
    });

    it("omits details when not provided", () => {
      const response = fail("INTERNAL_ERROR", "Something went wrong");
      expect(response.error?.details).toBeUndefined();
    });
  });
});
