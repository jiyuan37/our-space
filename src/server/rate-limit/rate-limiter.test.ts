import { describe, expect, it, vi } from "vitest";
import {
  enforceRateLimit,
  enforceInvitationAcceptRateLimit,
  enforceInvitationCreateRateLimit,
  enforceInvitationPreviewRateLimit,
  enforceLoginRateLimits,
  enforceRegistrationRateLimit,
  MemoryRateLimiter,
  privateBucket,
} from "@/server/rate-limit/rate-limiter";
import { RateLimitExceededError } from "@/server/errors/domain-error";

describe("MemoryRateLimiter", () => {
  it("独立限制 email 与 IP bucket，并在窗口后重置", async () => {
    let now = 0;
    const limiter = new MemoryRateLimiter(() => now);
    const email = privateBucket("login-email", "user@example.com");
    const ip = privateBucket("login-ip", "local");
    await enforceRateLimit(limiter, { key: email, limit: 1, windowMs: 100 });
    await enforceRateLimit(limiter, { key: ip, limit: 1, windowMs: 100 });
    await expect(
      enforceRateLimit(limiter, { key: email, limit: 1, windowMs: 100 }),
    ).rejects.toBeInstanceOf(RateLimitExceededError);
    now = 101;
    await expect(
      enforceRateLimit(limiter, { key: email, limit: 1, windowMs: 100 }),
    ).resolves.toBeUndefined();
  });

  it("按 DEC-039 为每个业务入口使用独立维度", async () => {
    const consume = vi
      .fn()
      .mockResolvedValue({ allowed: true, retryAfterMs: 0 });
    const limiter = { consume };

    await enforceLoginRateLimits(limiter, "user@example.com", "ip-login");
    await enforceRegistrationRateLimit(limiter, "ip-register");
    await enforceInvitationCreateRateLimit(limiter, "user_1");
    await enforceInvitationPreviewRateLimit(limiter, "ip-preview");
    await enforceInvitationAcceptRateLimit(limiter, "ip-accept");

    expect(consume.mock.calls.map(([input]) => input)).toEqual([
      {
        key: privateBucket("login-email", "user@example.com"),
        limit: 10,
        windowMs: 15 * 60_000,
      },
      {
        key: privateBucket("login-ip", "ip-login"),
        limit: 50,
        windowMs: 15 * 60_000,
      },
      {
        key: privateBucket("register-ip", "ip-register"),
        limit: 5,
        windowMs: 60 * 60_000,
      },
      {
        key: privateBucket("invite-create-user", "user_1"),
        limit: 10,
        windowMs: 60 * 60_000,
      },
      {
        key: privateBucket("invite-preview-ip", "ip-preview"),
        limit: 30,
        windowMs: 15 * 60_000,
      },
      {
        key: privateBucket("invite-accept-ip", "ip-accept"),
        limit: 30,
        windowMs: 15 * 60_000,
      },
    ]);
  });
});
