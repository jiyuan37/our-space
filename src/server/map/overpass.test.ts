import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import type { RequestGate } from "./request-gate";
const gate: RequestGate = {
  run: async (work) => (await work(5 * 1024 * 1024)).value,
};
import { describe, expect, it, vi } from "vitest";
import {
  boundsSchema,
  OverpassProvider,
  overpassQuery,
  parseOverpass,
} from "./overpass";
const bounds = [10, 50, 10.02, 50.02] as const;
const square = [
  { lon: 10, lat: 50 },
  { lon: 10.01, lat: 50 },
  { lon: 10.01, lat: 50.01 },
  { lon: 10, lat: 50 },
];
const fixture = {
  elements: [
    { id: 1, type: "way", tags: { building: "yes" }, geometry: square },
    {
      id: 2,
      type: "way",
      tags: { highway: "footway" },
      geometry: square.slice(0, 2),
    },
  ],
};
describe("Overpass 适配层（仅离线 fixture）", () => {
  it("接受真实 schema 并只保留制图所需字段", () => {
    const data = parseOverpass(fixture, bounds);
    expect(data.features).toHaveLength(2);
    expect(data.features[0].kind).toBe("building");
    expect(data.features[1].roadClass).toBe("footway");
    expect(data).not.toHaveProperty("residents");
  });
  it("连接分段关系，保留内环", () => {
    const data = parseOverpass(
      {
        elements: [
          {
            id: 3,
            type: "relation",
            tags: { natural: "water" },
            members: [
              {
                ref: 1,
                type: "way",
                role: "outer",
                geometry: square.slice(0, 3),
              },
              {
                ref: 2,
                type: "way",
                role: "outer",
                geometry: [square[3], square[2]],
              },
              { ref: 3, type: "way", role: "inner", geometry: square },
            ],
          },
        ],
      },
      bounds,
    );
    expect(data.features[0].rings).toHaveLength(2);
  });
  it("不伪造未闭合面边界", () => {
    const data = parseOverpass(
      {
        elements: [
          ...fixture.elements,
          {
            id: 4,
            type: "way",
            tags: { leisure: "park" },
            geometry: square.slice(0, 3),
          },
        ],
      },
      bounds,
    );
    expect(data.features).toHaveLength(2);
  });
  it("拒绝无数据、无效 geometry 和服务端部分失败", () => {
    expect(() => parseOverpass({ elements: [] }, bounds)).toThrow(
      "MAP_NO_GEOGRAPHY",
    );
    expect(() =>
      parseOverpass(
        {
          elements: [
            { ...fixture.elements[0], geometry: [{ lon: "private", lat: 50 }] },
          ],
        },
        bounds,
      ),
    ).toThrow();
    expect(() =>
      parseOverpass({ ...fixture, remark: "timeout" }, bounds),
    ).toThrow("MAP_PROVIDER_INCOMPLETE");
  });
  it("校验范围并固定查询字段，不接受查询注入", () => {
    expect(boundsSchema.safeParse([0, 0, 10, 10]).success).toBe(false);
    expect(boundsSchema.safeParse([10, 50, 9, 49]).success).toBe(false);
    expect(overpassQuery(bounds)).toContain("(50,10,50.02,10.02)");
    expect(() => overpassQuery([NaN, 0, 1, 1])).toThrow();
  });
  it("未批准时绝不发请求", async () => {
    const transport = vi.fn();
    await expect(
      new OverpassProvider(transport, () => false, {
        gate,
        retainSource: false,
      }).read(bounds),
    ).rejects.toThrow("MAP_PROVIDER_NOT_APPROVED");
    expect(transport).not.toHaveBeenCalled();
  });
  it("只有范围发送给固定服务，失败不重试", async () => {
    const transport = vi
      .fn()
      .mockResolvedValue(new Response("", { status: 429 }));
    await expect(
      new OverpassProvider(transport, () => true, {
        gate,
        retainSource: false,
      }).read(bounds),
    ).rejects.toThrow("MAP_PROVIDER_UNAVAILABLE");
    expect(transport).toHaveBeenCalledTimes(1);
    expect(transport.mock.calls[0][1].headers["User-Agent"]).toContain(
      "OurSpace/",
    );
    expect(String(transport.mock.calls[0][1].body)).not.toMatch(
      /Resident|Presence|userId|avatar/,
    );
  });
  it("离线 HTTP200 fixture 经适配返回地图", async () => {
    const transport = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify(fixture)));
    const data = await new OverpassProvider(transport, () => true, {
      gate,
      retainSource: false,
    }).read(bounds);
    expect(data.features).toHaveLength(2);
    expect(transport).toHaveBeenCalledTimes(1);
    expect(transport.mock.calls[0][1].headers["User-Agent"]).toContain(
      "OurSpace/",
    );
  });
  it("可替换 HTTPS 后端，凭据和动态查询端点被拒绝", async () => {
    const transport = vi.fn().mockResolvedValue(Response.json(fixture));
    await new OverpassProvider(transport, () => true, {
      gate,
      retainSource: false,
      endpoint: "https://maps.example.org/api/interpreter",
    }).read(bounds);
    expect(transport.mock.calls[0][0]).toBe(
      "https://maps.example.org/api/interpreter",
    );
    for (const endpoint of [
      "http://maps.example.org/",
      "https://user:pass@maps.example.org/",
      "https://maps.example.org/?q=private",
    ]) {
      await expect(
        new OverpassProvider(transport, () => true, { gate, endpoint }).read(
          bounds,
        ),
      ).rejects.toThrow("MAP_PROVIDER_NOT_APPROVED");
    }
    expect(transport).toHaveBeenCalledTimes(1);
  });
  it("响应超过字节预算时中止，不解析或再次调用", async () => {
    const transport = vi.fn().mockResolvedValue(Response.json(fixture));
    const tinyGate: RequestGate = {
      run: async (work) => (await work(8)).value,
    };
    await expect(
      new OverpassProvider(transport, () => true, {
        gate: tinyGate,
        retainSource: false,
      }).read(bounds),
    ).rejects.toThrow("MAP_PROVIDER_TOO_LARGE");
    expect(transport).toHaveBeenCalledTimes(1);
  });
  it("完整原始地理响应先保存，解析失败可离线诊断", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "our-space-map-source-"));
    const previous = process.env.MAP_CACHE_DIR;
    process.env.MAP_CACHE_DIR = dir;
    const raw = JSON.stringify({ elements: [], remark: "runtime timeout" });
    try {
      const transport = vi.fn().mockResolvedValue(new Response(raw));
      await expect(
        new OverpassProvider(transport, () => true, { gate }).read(bounds),
      ).rejects.toThrow("MAP_PROVIDER_INCOMPLETE");
      const names = await readdir(dir);
      expect(names).toHaveLength(1);
      expect(names[0]).toMatch(/^source-[a-f0-9]{20}\.json$/);
      expect(await readFile(path.join(dir, names[0]), "utf8")).toBe(raw);
      expect(transport).toHaveBeenCalledTimes(1);
    } finally {
      if (previous === undefined) delete process.env.MAP_CACHE_DIR;
      else process.env.MAP_CACHE_DIR = previous;
      await rm(dir, { recursive: true, force: true });
    }
  });
});
