import { describe, expect, it } from "vitest";

import {
  DomainError,
  NotSpaceResidentError,
  SpaceFullError,
} from "@/server/errors/domain-error";

describe("DomainError", () => {
  it("提供稳定错误 code、HTTP status 和语言无关内部说明", () => {
    const error = new SpaceFullError();

    expect(error).toBeInstanceOf(DomainError);
    expect(error.code).toBe("SPACE_FULL");
    expect(error.statusCode).toBe(409);
    expect(error.message).toBe(
      "Space has reached its active Resident capacity.",
    );
  });

  it("授权错误不会暴露内部细节", () => {
    const error = new NotSpaceResidentError();

    expect(error.code).toBe("NOT_SPACE_RESIDENT");
    expect(error.statusCode).toBe(403);
    expect(error.message).toBe("Active Space residency is required.");
  });
});
