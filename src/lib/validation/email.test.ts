import { describe, expect, it } from "vitest";
import { normalizeEmail } from "@/lib/validation/email";

describe("normalizeEmail", () => {
  it.each(["User@Example.com", " user@example.com ", "USER@example.com"])(
    "统一规范化 %s",
    (value) => {
      expect(normalizeEmail(value)).toBe("user@example.com");
    },
  );
});
