import { createHash } from "node:crypto";

import { RateLimitExceededError } from "@/server/errors/domain-error";

export type RateLimitInput = Readonly<{
  key: string;
  limit: number;
  windowMs: number;
}>;
export type RateLimitResult = Readonly<{
  allowed: boolean;
  retryAfterMs: number;
}>;
export interface RateLimiter {
  consume(input: RateLimitInput): Promise<RateLimitResult>;
}

type Bucket = { count: number; resetAt: number };

export class MemoryRateLimiter implements RateLimiter {
  private readonly buckets = new Map<string, Bucket>();
  constructor(private readonly now: () => number = Date.now) {}

  async consume(input: RateLimitInput): Promise<RateLimitResult> {
    const now = this.now();
    const bucket = this.buckets.get(input.key);
    if (!bucket || bucket.resetAt <= now) {
      this.buckets.set(input.key, { count: 1, resetAt: now + input.windowMs });
      return { allowed: true, retryAfterMs: 0 };
    }
    bucket.count += 1;
    return {
      allowed: bucket.count <= input.limit,
      retryAfterMs: Math.max(0, bucket.resetAt - now),
    };
  }
}

export function privateBucket(namespace: string, value: string): string {
  return `${namespace}:${createHash("sha256").update(value).digest("hex")}`;
}

export async function enforceRateLimit(
  limiter: RateLimiter,
  input: RateLimitInput,
): Promise<void> {
  if (!(await limiter.consume(input)).allowed)
    throw new RateLimitExceededError();
}

export async function enforceLoginRateLimits(
  limiter: RateLimiter,
  email: string,
  ip: string,
): Promise<void> {
  await Promise.all([
    enforceRateLimit(limiter, {
      key: privateBucket("login-email", email),
      limit: 10,
      windowMs: 15 * 60_000,
    }),
    enforceRateLimit(limiter, {
      key: privateBucket("login-ip", ip),
      limit: 50,
      windowMs: 15 * 60_000,
    }),
  ]);
}

export async function enforceRegistrationRateLimit(
  limiter: RateLimiter,
  ip: string,
): Promise<void> {
  await enforceRateLimit(limiter, {
    key: privateBucket("register-ip", ip),
    limit: 5,
    windowMs: 60 * 60_000,
  });
}

export async function enforceInvitationCreateRateLimit(
  limiter: RateLimiter,
  userId: string,
): Promise<void> {
  await enforceRateLimit(limiter, {
    key: privateBucket("invite-create-user", userId),
    limit: 10,
    windowMs: 60 * 60_000,
  });
}

export async function enforceInvitationPreviewRateLimit(
  limiter: RateLimiter,
  ip: string,
): Promise<void> {
  await enforceRateLimit(limiter, {
    key: privateBucket("invite-preview-ip", ip),
    limit: 30,
    windowMs: 15 * 60_000,
  });
}

export async function enforceInvitationAcceptRateLimit(
  limiter: RateLimiter,
  ip: string,
): Promise<void> {
  await enforceRateLimit(limiter, {
    key: privateBucket("invite-accept-ip", ip),
    limit: 30,
    windowMs: 15 * 60_000,
  });
}
