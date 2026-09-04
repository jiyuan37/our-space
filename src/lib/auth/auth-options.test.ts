import { describe, expect, it, vi } from "vitest";

import {
  authorizeCredentials,
  sessionUserFromToken,
} from "@/lib/auth/auth-options";
import { LOGIN_RATE_LIMIT_ERROR_CODE } from "@/lib/auth/auth-error-codes";
import { InvalidCredentialsError } from "@/server/errors/domain-error";
import type { RateLimiter } from "@/server/rate-limit/rate-limiter";

const request = { headers: { "x-forwarded-for": "203.0.113.10" } };

function allowingLimiter(): RateLimiter {
  return {
    consume: vi.fn().mockResolvedValue({ allowed: true, retryAfterMs: 0 }),
  };
}

describe("Credentials authorize", () => {
  it.each(["wrong password", "nonexistent email"])(
    "%s 使用相同 invalid credentials 结果",
    async () => {
      const verifier = {
        verifyCredentials: vi
          .fn()
          .mockRejectedValue(new InvalidCredentialsError()),
      };
      await expect(
        authorizeCredentials(
          { email: " User@Example.com ", password: "invalid password" },
          request,
          { limiter: allowingLimiter(), verifier },
        ),
      ).resolves.toBeNull();
    },
  );

  it("将 login rate limit 映射为稳定错误码且不查询账户是否存在", async () => {
    const limiter: RateLimiter = {
      consume: vi.fn().mockResolvedValue({ allowed: false, retryAfterMs: 1 }),
    };
    const verifier = { verifyCredentials: vi.fn() };
    await expect(
      authorizeCredentials(
        { email: "user@example.com", password: "irrelevant" },
        request,
        { limiter, verifier },
      ),
    ).rejects.toThrow(LOGIN_RATE_LIMIT_ERROR_CODE);
    expect(verifier.verifyCredentials).not.toHaveBeenCalled();
  });

  it("成功时只返回最小身份字段", async () => {
    const verifier = {
      verifyCredentials: vi.fn().mockResolvedValue({
        id: "user_1",
        email: "user@example.com",
        name: "Yuan",
        passwordHash: "must-not-leak",
      }),
    };
    await expect(
      authorizeCredentials(
        { email: "user@example.com", password: "valid password" },
        request,
        { limiter: allowingLimiter(), verifier },
      ),
    ).resolves.toEqual({
      id: "user_1",
      email: "user@example.com",
      name: "Yuan",
    });
  });
});

describe("JWT session view model", () => {
  it("不包含 passwordHash、token 或 Space 内容", () => {
    const token = {
      userId: "user_1",
      email: "user@example.com",
      name: "Yuan",
      passwordHash: "must-not-leak",
      invitationToken: "must-not-leak",
      space: { id: "space_1" },
    };
    expect(sessionUserFromToken(token)).toEqual({
      userId: "user_1",
      email: "user@example.com",
      name: "Yuan",
    });
  });
});
