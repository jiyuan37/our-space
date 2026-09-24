import { createHash } from "node:crypto";
import { mkdir, writeFile, rename } from "node:fs/promises";
import path from "node:path";
import {
  FileOverpassGate,
  OverpassHttpError,
  retryAfterMilliseconds,
  type RequestGate,
} from "./request-gate";
import { z } from "zod";
import type {
  Bounds,
  Geography,
  GeographyProvider,
  MapFeature,
  Point,
} from "@/lib/map/model";
import {
  FileProviderHealth,
  ProviderCircuitOpenError,
  type ProviderEndpoint,
  type ProviderHealth,
  type ProviderOutcome,
  validateProviderEndpoints,
} from "./provider-health";

export { boundsSchema, overpassQuery } from "./layers";
import { MAP_LAYERS, overpassCellsQuery } from "./layers";
import {
  same,
  stitch,
  splitGeometry,
  clipLines,
  clipRing,
} from "./cropped-geometry";
const coordinate = z
  .object({
    lon: z.number().min(-180).max(180),
    lat: z.number().min(-90).max(90),
  })
  .nullable();
const geometry = z.array(coordinate).max(20000);
const element = z.object({
  type: z.enum(["way", "relation"]),
  id: z.number().int().positive(),
  tags: z.record(z.string()).optional(),
  geometry: geometry.optional(),
  members: z
    .array(
      z.object({
        type: z.string(),
        ref: z.number(),
        role: z.string(),
        geometry: geometry.optional(),
      }),
    )
    .max(1500)
    .optional(),
});
const responseSchema = z.object({
  elements: z.array(element).max(12000),
  remark: z.string().optional(),
});
export function parseOverpass(
  value: unknown,
  bounds: Bounds,
  now = new Date(),
  enforceCellBudgets = true,
): Geography {
  const parsed = responseSchema.parse(value);
  if (parsed.remark) throw new Error("MAP_PROVIDER_INCOMPLETE");
  const features: MapFeature[] = [];
  let rawPoints = 0;
  let geometryEntries = 0;
  const seen = new Set<string>();
  const counts = new Map<string, { elements: number; points: number }>();
  for (const item of parsed.elements) {
    const tags = item.tags ?? {};
    const kind = tags.highway
      ? "road"
      : tags.building
        ? "building"
        : tags.natural === "water" ||
            tags.natural === "coastline" ||
            ["riverbank", "river", "stream", "canal"].includes(tags.waterway)
          ? "water"
          : ["park", "garden", "recreation_ground"].includes(tags.leisure) ||
              ["grass", "forest", "meadow"].includes(tags.landuse)
            ? "park"
            : null;
    if (!kind) continue;
    const identity = `${item.type}/${item.id}`;
    if (seen.has(identity)) continue;
    seen.add(identity);
    const arrays = [
      item.geometry ?? [],
      ...(item.members ?? []).map((m) => m.geometry ?? []),
    ];
    geometryEntries += arrays.reduce((n, a) => n + a.length, 0);
    if (geometryEntries > 150000)
      throw new Error("MAP_PROVIDER_TOO_LARGE", {
        cause: { stage: "GEOMETRY_ENTRY_LIMIT" },
      });
    const pointCount = arrays.reduce(
      (n, a) => n + a.filter((c) => c !== null).length,
      0,
    );
    rawPoints += pointCount;
    if (rawPoints > 50000)
      throw new Error("MAP_PROVIDER_TOO_LARGE", {
        cause: { stage: "GEOMETRY_POINT_LIMIT" },
      });
    const budget = MAP_LAYERS.find(
      (l) => l.kind === kind && l.elementType === item.type,
    );
    if (!budget) throw new Error("MAP_PROVIDER_INCOMPLETE");
    if (item.type === "relation" && !item.members)
      throw new Error("MAP_PROVIDER_INCOMPLETE");
    const budgetKey = `${kind}:${item.type}`;
    const usage = counts.get(budgetKey) ?? { elements: 0, points: 0 };
    usage.elements++;
    usage.points += pointCount;
    counts.set(budgetKey, usage);
    if (
      enforceCellBudgets &&
      (usage.elements > budget.maxElements || usage.points > budget.maxPoints)
    )
      throw new Error("MAP_PROVIDER_TOO_LARGE", {
        cause: {
          stage:
            usage.elements > budget.maxElements
              ? "LAYER_ELEMENT_LIMIT"
              : "LAYER_POINT_LIMIT",
        },
      });
    const chains: Point[][] =
      item.type === "way"
        ? splitGeometry(item.geometry ?? [])
        : ["outer", "inner"].flatMap((role) =>
            stitch(
              (item.members ?? [])
                .filter(
                  (m) =>
                    m.type === "way" &&
                    (m.role === role || (role === "outer" && m.role === "")),
                )
                .flatMap((m) => splitGeometry(m.geometry ?? [])),
            ),
          );
    const polygon =
      kind !== "road" &&
      tags.natural !== "coastline" &&
      !["river", "stream", "canal"].includes(tags.waterway);
    const complete =
      polygon &&
      !item.geometry?.includes(null) &&
      chains.length > 0 &&
      chains.every((r) => r.length >= 4 && same(r[0], r[r.length - 1])) &&
      !(item.members ?? []).some(
        (m) =>
          m.type === "relation" ||
          (m.type === "way" &&
            ["outer", "inner", ""].includes(m.role) &&
            (!m.geometry?.some((c) => c !== null) ||
              m.geometry.includes(null))),
      );
    const rings = complete
      ? chains.map((r) => clipRing(r, bounds)).filter((r) => r.length >= 4)
      : kind === "road"
        ? clipLines(chains, bounds)
        : [];
    const outlines = kind !== "road" ? clipLines(chains, bounds) : [];
    if (rings.length || outlines.length)
      features.push({
        id: `${item.type}/${item.id}`,
        kind,
        rings,
        ...(outlines.length ? { outlines } : {}),
        ...(kind === "road" ? { roadClass: tags.highway } : {}),
        ...(tags.name ? { name: tags.name.slice(0, 80) } : {}),
      });
  }
  return {
    bounds,
    features,
    attribution: "OpenStreetMap contributors",
    fetchedAt: now.toISOString(),
  };
}
export function parseCellResponse(
  value: unknown,
  cells: readonly Bounds[],
): Geography[] {
  const envelope = z
    .object({
      elements: z.array(z.unknown()).max(12000 + MAP_LAYERS.length),
      remark: z.string().optional(),
    })
    .parse(value);
  if (envelope.remark) throw new Error("MAP_PROVIDER_INCOMPLETE");
  const groups: unknown[][] = [];
  let current: unknown[] = [];
  for (const raw of envelope.elements) {
    if (
      raw &&
      typeof raw === "object" &&
      "type" in raw &&
      raw.type === "count"
    ) {
      const count = z
        .object({ tags: z.object({ total: z.string().regex(/^\d+$/) }) })
        .parse(raw);
      if (groups.length >= MAP_LAYERS.length)
        throw new Error("MAP_PROVIDER_INCOMPLETE");
      const budget = MAP_LAYERS[groups.length];
      const total = Number(count.tags.total);
      const batchLimit = Math.min(
        budget.maxBatchElements,
        budget.maxElements * cells.length,
      );
      if (total > batchLimit) throw new Error("MAP_PROVIDER_TOO_LARGE");
      if (total !== current.length) throw new Error("MAP_PROVIDER_INCOMPLETE");
      groups.push(current);
      current = [];
    } else current.push(raw);
  }
  if (current.length || groups.length !== MAP_LAYERS.length)
    throw new Error("MAP_PROVIDER_INCOMPLETE");
  const elements = groups.flat();
  return cells.map((bounds) =>
    parseOverpass({ elements }, bounds, undefined, false),
  );
}
export class OverpassProvider implements GeographyProvider {
  constructor(
    private readonly transport: typeof fetch = fetch,
    private readonly approved = () =>
      process.env.MAP_EXTERNAL_PROCESSING_APPROVED ===
      "osm-overpass-area-only-v1",
    private readonly options: {
      endpoint?: string;
      endpoints?: readonly ProviderEndpoint[];
      gate?: RequestGate;
      health?: ProviderHealth;
      retainSource?: boolean;
      timeoutMs?: number;
    } = {},
  ) {}
  async read(bounds: Bounds): Promise<Geography> {
    return (await this.readCells([bounds]))[0];
  }
  async readCells(cells: readonly Bounds[]): Promise<Geography[]> {
    if (!this.approved()) throw new Error("MAP_PROVIDER_NOT_APPROVED");
    const query = overpassCellsQuery(cells);
    const primary =
      this.options.endpoint ||
      process.env.MAP_OVERPASS_ENDPOINT ||
      "https://overpass-api.de/api/interpreter";
    const configured =
      this.options.endpoints ??
      [
        primary,
        ...(process.env.MAP_OVERPASS_FALLBACK_ENDPOINTS ?? "")
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean),
      ].map((url, index) => ({
        name: index === 0 ? "primary" : `fallback-${index}`,
        url,
      }));
    if (configured.length > 3) throw new Error("MAP_PROVIDER_NOT_APPROVED");
    const endpoints = validateProviderEndpoints(configured);
    const root =
      process.env.MAP_CACHE_DIR ||
      path.join(process.cwd(), ".data", "map-cache");
    const health = this.options.health ?? new FileProviderHealth(root);
    const endpoint = await health.select(endpoints);
    const gate =
      this.options.gate ??
      new FileOverpassGate(
        process.env.MAP_CACHE_DIR ||
          path.join(process.cwd(), ".data", "map-cache"),
      );
    return gate.run(async (byteLimit) => {
      // 端点仅由服务端配置，客户端不能指定；不转发 Cookie、Referer 或任何业务字段。
      const startedAt = Date.now();
      let outcome: ProviderOutcome = "transport_error";
      try {
        const response = await this.transport(endpoint.url, {
          method: "POST",
          body: new URLSearchParams({ data: query }),
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "User-Agent":
              "OurSpace/0.1 MAP-01A (+https://github.com/jiyuan37/our-space)",
            Accept: "application/json",
          },
          signal: AbortSignal.timeout(this.options.timeoutMs ?? 25000),
          redirect: "error",
          cache: "no-store",
        });
        if (!response.ok || !response.body) {
          outcome = "http_error";
          await response.body?.cancel();
          throw new OverpassHttpError(
            response.status,
            retryAfterMilliseconds(response.headers.get("retry-after")),
          );
        }
        const reader = response.body.getReader();
        const chunks: Uint8Array[] = [];
        let size = 0;
        try {
          while (true) {
            const part = await reader.read();
            if (part.done) break;
            size += part.value.length;
            if (size > byteLimit)
              throw new Error("MAP_PROVIDER_TOO_LARGE", {
                cause: { stage: "RESPONSE_BYTE_LIMIT" },
              });
            chunks.push(part.value);
          }
        } finally {
          await reader.cancel();
        }
        const raw = Buffer.concat(chunks);
        if (this.options.retainSource !== false) {
          await mkdir(root, { recursive: true, mode: 0o700 });
          const name = path.join(
            root,
            `source-${createHash("sha256").update(query).digest("hex").slice(0, 20)}.json`,
          );
          const temporary = `${name}.tmp`;
          await writeFile(temporary, raw, { mode: 0o600 });
          await rename(temporary, name);
        }
        let value: Geography[];
        try {
          value = parseCellResponse(JSON.parse(raw.toString("utf8")), cells);
        } catch (error) {
          if (
            error instanceof Error &&
            error.message === "MAP_PROVIDER_TOO_LARGE"
          ) {
            outcome = "response_rejected";
            throw error;
          }
          outcome = "incomplete";
          if (
            error instanceof Error &&
            error.message === "MAP_PROVIDER_INCOMPLETE"
          )
            throw error;
          throw new Error("MAP_PROVIDER_INCOMPLETE", { cause: error });
        }
        outcome = "success";
        return {
          value,
          bytes: size,
          httpStatus: response.status,
        };
      } catch (error) {
        if (
          error instanceof Error &&
          ["TimeoutError", "AbortError"].includes(error.name)
        )
          outcome = "timeout";
        throw error;
      } finally {
        await health.record(endpoint, {
          outcome,
          latencyMs: Date.now() - startedAt,
        });
      }
    });
  }
}

export { ProviderCircuitOpenError };
