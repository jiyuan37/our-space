import { MemoryRateLimiter } from "@/server/rate-limit/rate-limiter";

const globalLimiter = globalThis as unknown as {
  ourSpaceRateLimiter?: MemoryRateLimiter;
};
export const rateLimiter =
  globalLimiter.ourSpaceRateLimiter ?? new MemoryRateLimiter();
if (process.env.NODE_ENV !== "production")
  globalLimiter.ourSpaceRateLimiter = rateLimiter;
