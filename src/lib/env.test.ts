import { describe, expect, it } from "vitest";

import { EnvironmentValidationError, validateServerEnv } from "@/lib/env";

describe("validateServerEnv", () => {
  it("接受完整且有效的服务端环境变量", () => {
    expect(
      validateServerEnv({
        NODE_ENV: "test",
        APP_URL: "http://localhost:3000",
        DATABASE_URL: "postgresql://our_space:secret@localhost:5432/our_space",
        TEST_DATABASE_URL:
          "postgresql://our_space:secret@localhost:5432/our_space_test",
      }),
    ).toMatchObject({
      NODE_ENV: "test",
      APP_URL: "http://localhost:3000",
    });
  });

  it("缺少必需变量时返回中文且可定位的错误", () => {
    expect(() => validateServerEnv({ NODE_ENV: "test" })).toThrow(
      EnvironmentValidationError,
    );

    try {
      validateServerEnv({ NODE_ENV: "test" });
    } catch (error) {
      expect(error).toBeInstanceOf(EnvironmentValidationError);
      expect((error as Error).message).toContain("APP_URL");
      expect((error as Error).message).toContain("DATABASE_URL");
      expect((error as Error).message).toContain("环境变量验证失败");
    }
  });

  it("拒绝非 PostgreSQL DATABASE_URL", () => {
    expect(() =>
      validateServerEnv({
        NODE_ENV: "test",
        APP_URL: "http://localhost:3000",
        DATABASE_URL: "mysql://localhost/our_space",
      }),
    ).toThrow("DATABASE_URL 必须使用 postgresql:// 或 postgres://");
  });
});
