import path from "node:path";
import { prisma } from "@/lib/db/prisma";
import { rateLimiter } from "@/server/rate-limit/default-limiter";
import { OverpassProvider } from "./overpass";
import { FileGeographyCache, MapService } from "./service";
const state = globalThis as unknown as { mapService?: MapService };
export function mapService() {
  return (state.mapService ??= new MapService(
    prisma,
    new OverpassProvider(),
    new FileGeographyCache(
      process.env.MAP_CACHE_DIR ||
        path.join(process.cwd(), ".data", "map-cache"),
    ),
    rateLimiter,
  ));
}
