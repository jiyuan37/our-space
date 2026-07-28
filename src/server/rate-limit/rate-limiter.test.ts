import { describe, expect, it } from "vitest";
import {
  enforceRateLimit,
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
});
