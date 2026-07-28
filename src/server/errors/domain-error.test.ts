import { describe, expect, it } from "vitest";

import {
  DomainError,
  NotSpaceResidentError,
  SpaceFullError,
} from "@/server/errors/domain-error";

describe("DomainError", () => {
  it("提供稳定错误 code、HTTP status 和平静的中文说明", () => {
    const error = new SpaceFullError();

    expect(error).toBeInstanceOf(DomainError);
    expect(error.code).toBe("SPACE_FULL");
    expect(error.statusCode).toBe(409);
    expect(error.message).toBe("这个 Space 已经住满了。");
  });

  it("授权错误不会暴露内部细节", () => {
    const error = new NotSpaceResidentError();

    expect(error.code).toBe("NOT_SPACE_RESIDENT");
    expect(error.statusCode).toBe(403);
    expect(error.message).toBe("你无法访问这个 Space。");
  });
});
