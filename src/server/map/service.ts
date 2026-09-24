import { cellsForBounds, mergeCellGeography } from "@/lib/map/cells";
import { OverpassBackoffError, OverpassHttpError } from "./request-gate";
import { mkdir, readFile, writeFile, rename } from "node:fs/promises";
import path from "node:path";
import type { Geography, GeographyProvider } from "@/lib/map/model";
import { findMapArea } from "@/lib/map/areas";
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
  read(id: string): Promise<Geography | null>;
  write(id: string, data: Geography): Promise<void>;
}
export class FileGeographyCache implements GeographyCache {
  constructor(private readonly root: string) {}
  async read(id: string) {
    if (!/^cell-v4--?\d+--?\d+-z16$/.test(id))
      throw new MapReadError("MAP_INVALID_AREA");
    try {
      return JSON.parse(
        await readFile(path.join(this.root, `${id}.json`), "utf8"),
      ) as Geography;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
      throw error;
    }
  }
  async write(id: string, data: Geography) {
    if (!/^cell-v4--?\d+--?\d+-z16$/.test(id))
      throw new MapReadError("MAP_INVALID_AREA");
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
    const cells = cellsForBounds(area.bounds);
    const cached = await Promise.all(cells.map((c) => this.cache.read(c.key)));
    if (cached.every((c) => c !== null))
      return mergeCellGeography(area.bounds, cached);
    const key = cells.map((c) => c.key).join("|");
    const pending = this.inflight.get(key);
    if (pending) return pending;
    const job = (async () => {
      try {
        // 同一HTTP内顺序输出有限的未缓存cell；不为每个layer并行请求公共实例。
        const missing = cells.filter((_, i) => !cached[i]);
        const fresh = this.provider.readCells
          ? await this.provider.readCells(missing.map((c) => c.bounds))
          : await (async () => {
              const result: Geography[] = [];
              for (const c of missing)
                result.push(await this.provider.read(c.bounds));
              return result;
            })();
        if (fresh.length !== missing.length)
          throw new Error("MAP_PROVIDER_INCOMPLETE");
        for (let i = 0; i < missing.length; i++)
          await this.cache.write(missing[i].key, fresh[i]);
        const data = cells.map(
          (c, i) =>
            cached[i] ?? fresh[missing.findIndex((m) => m.key === c.key)],
        );
        return mergeCellGeography(area.bounds, data);
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
    this.inflight.set(key, job);
    try {
      return await job;
    } finally {
      this.inflight.delete(key);
    }
  }
}
