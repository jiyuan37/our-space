import { describe, expect, it } from "vitest";
import {
  hashPassword,
  validatePassword,
  verifyPassword,
} from "@/lib/auth/password";
import { PasswordPolicyError } from "@/server/errors/domain-error";

describe("password", () => {
  it("执行 15–128 字符边界", () => {
    expect(() => validatePassword("a".repeat(14))).toThrow(PasswordPolicyError);
    expect(() => validatePassword("密".repeat(15))).not.toThrow();
    expect(() => validatePassword("a".repeat(129))).toThrow(
      PasswordPolicyError,
    );
  });
  it("使用 Argon2id 安全验证", async () => {
    const password = "本地测试假密码-足够长-123";
    const hash = await hashPassword(password);
    expect(hash).not.toContain(password);
    await expect(verifyPassword(hash, password)).resolves.toBe(true);
    await expect(verifyPassword(hash, "错误但足够长的假密码")).resolves.toBe(
      false,
    );
  });
});
