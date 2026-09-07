import { OverpassBackoffError, OverpassHttpError } from "./request-gate";
import { mkdir, readFile, writeFile, rename } from "node:fs/promises";
import path from "node:path";
import type { Geography, GeographyProvider } from "@/lib/map/model";
import { findMapArea, type MapAreaId } from "@/lib/map/areas";
import type { DatabaseClient } from "@/server/services/service-context";
import { NotSpaceResidentError } from "@/server/errors/domain-error";
import {
  enforceRateLimit,
  privateBucket,
  type RateLimiter,
} from "@/server/rate-limit/rate-limiter";

export class MapReadError extends Error {
  constructor(
    readonly code:
      | "MAP_INVALID_AREA"
      | "MAP_UNAVAILABLE"
      | "MAP_NOT_CONFIGURED"
      | "MAP_BACKOFF",
    readonly retryAt?: number,
  ) {
    super(code);
  }
}
export interface GeographyCache {
  read(id: MapAreaId): Promise<Geography | null>;
  write(id: MapAreaId, data: Geography): Promise<void>;
}
export class FileGeographyCache implements GeographyCache {
  constructor(private readonly root: string) {}
  async read(id: MapAreaId) {
    try {
      return JSON.parse(
        await readFile(path.join(this.root, `${id}.json`), "utf8"),
      ) as Geography;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
      throw error;
    }
  }
  async write(id: MapAreaId, data: Geography) {
    await mkdir(this.root, { recursive: true, mode: 0o700 });
    const temporary = path.join(this.root, `${id}.${crypto.randomUUID()}.tmp`);
    await writeFile(temporary, JSON.stringify(data), { mode: 0o600 });
    await rename(temporary, path.join(this.root, `${id}.json`));
  }
}
export class MapService {
  private readonly inflight = new Map<string, Promise<Geography>>();
  constructor(
    private readonly db: DatabaseClient,
    private readonly provider: GeographyProvider,
    private readonly cache: GeographyCache,
    private readonly limiter: RateLimiter,
  ) {}
  async read(userId: string, areaId: unknown): Promise<Geography> {
    const membership = await this.db.resident.findFirst({
      where: { userId, status: "ACTIVE", space: { status: "ACTIVE" } },
      select: { id: true },
    });
    if (!membership) throw new NotSpaceResidentError();
    const area = findMapArea(areaId);
    if (!area) throw new MapReadError("MAP_INVALID_AREA");
    await enforceRateLimit(this.limiter, {
      key: privateBucket("map-read", userId),
      limit: 30,
      windowMs: 60_000,
    });
    // 公共地理缓存不含用户、Space 或最近浏览记录。无后台刷新/跟踪。
    const cached = await this.cache.read(area.id);
    if (cached) return cached;
    const pending = this.inflight.get(area.id);
    if (pending) return pending;
    const job = (async () => {
      await enforceRateLimit(this.limiter, {
        key: "map-provider-global",
        limit: 10,
        windowMs: 86400000,
      });
      try {
        const geography = await this.provider.read(area.bounds);
        await this.cache.write(area.id, geography);
        return geography;
      } catch (error) {
        if (error instanceof OverpassBackoffError)
          throw new MapReadError("MAP_BACKOFF", error.retryAt);
        if (error instanceof OverpassHttpError)
          throw new MapReadError(
            "MAP_BACKOFF",
            Date.now() + error.retryAfterMs,
          );
        if (
          error instanceof Error &&
          error.message === "MAP_PROVIDER_NOT_APPROVED"
        )
          throw new MapReadError("MAP_NOT_CONFIGURED");
        throw new MapReadError("MAP_UNAVAILABLE");
      }
    })();
    this.inflight.set(area.id, job);
    try {
      return await job;
    } finally {
      this.inflight.delete(area.id);
    }
  }
}
