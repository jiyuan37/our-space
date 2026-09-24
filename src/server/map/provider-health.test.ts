import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  FileProviderHealth,
  ProviderCircuitOpenError,
  validateProviderEndpoints,
} from "./provider-health";

const endpoints = [
  { name: "primary", url: "https://one.example/api/interpreter" },
  { name: "fallback", url: "https://two.example/api/interpreter" },
];
const dirs: string[] = [];
afterEach(async () => {
  await Promise.all(dirs.splice(0).map((dir) => rm(dir, { recursive: true })));
});

describe("地图 provider health", () => {
  it("失败后指数退避并让下一次独立读取选择 fallback", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "map-health-"));
    dirs.push(root);
    let now = 1_000_000;
    const health = new FileProviderHealth(root, () => now);
    const primary = await health.select(endpoints);
    expect(primary.name).toBe("primary");
    await health.record(primary, { outcome: "timeout", latencyMs: 25_001 });
    expect((await health.select(endpoints)).name).toBe("fallback");
    await health.record(endpoints[1], {
      outcome: "incomplete",
      latencyMs: 14_000,
    });
    await expect(health.select(endpoints)).rejects.toEqual(
      new ProviderCircuitOpenError(now + 30_000),
    );
    now += 30_000;
    expect((await health.select(endpoints)).name).toBe("primary");
    await health.record(endpoints[0], {
      outcome: "transport_error",
      latencyMs: 2,
    });
    const state = JSON.parse(
      await readFile(path.join(root, "provider-health.json"), "utf8"),
    );
    expect(state.endpoints.primary).toMatchObject({
      consecutiveFailures: 2,
      circuitOpenUntil: now + 60_000,
      lastOutcome: "transport_error",
    });
  });

  it("成功关闭 circuit，并且持久记录不包含 URL 或查询数据", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "map-health-"));
    dirs.push(root);
    const health = new FileProviderHealth(root, () => 42);
    await health.record(endpoints[0], { outcome: "success", latencyMs: 123.4 });
    const raw = await readFile(path.join(root, "provider-health.json"), "utf8");
    expect(JSON.parse(raw).endpoints.primary).toMatchObject({
      consecutiveFailures: 0,
      circuitOpenUntil: 42,
      lastLatencyMs: 123,
      lastOutcome: "success",
    });
    expect(raw).not.toContain("https:");
    expect(raw).not.toContain("query");
  });

  it("拒绝有凭据、query string 或不安全协议的 endpoint", () => {
    for (const url of [
      "http://one.example/api",
      "https://user:secret@one.example/api",
      "https://one.example/api?data=private",
    ])
      expect(() =>
        validateProviderEndpoints([{ name: "primary", url }]),
      ).toThrow("MAP_PROVIDER_NOT_APPROVED");
  });
});
