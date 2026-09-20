import { mkdtemp, rm, readFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  FileOverpassGate,
  OverpassHttpError,
  retryAfterMilliseconds,
} from "./request-gate";
const roots: string[] = [];
async function root() {
  const dir = await mkdtemp(path.join(os.tmpdir(), "our-space-map-gate-"));
  roots.push(dir);
  return dir;
}
afterEach(async () => {
  await Promise.all(
    roots.splice(0).map((dir) => rm(dir, { recursive: true, force: true })),
  );
});
describe("Overpass 持久请求闸门（无外部调用）", () => {
  it("跨实例不能并行，缓存外读取的全局30秒间隔跨重启保留", async () => {
    const dir = await root();
    let now = Date.parse("2026-09-07T00:00:00Z");
    const first = new FileOverpassGate(dir, () => now),
      second = new FileOverpassGate(dir, () => now);
    let release!: () => void;
    let entered!: () => void;
    const started = new Promise<void>((r) => {
      entered = r;
    });
    const pending = first.run(async () => {
      entered();
      await new Promise<void>((r) => {
        release = r;
      });
      return { value: "ok", bytes: 10 };
    });
    await started;
    const duplicate = vi.fn();
    await expect(second.run(duplicate)).rejects.toMatchObject({
      message: "MAP_PROVIDER_BACKOFF",
    });
    expect(duplicate).not.toHaveBeenCalled();
    release();
    expect(await pending).toBe("ok");
    await expect(second.run(duplicate)).rejects.toMatchObject({
      retryAt: now + 30000,
    });
    now += 30001;
    expect(await second.run(async () => ({ value: "later", bytes: 1 }))).toBe(
      "later",
    );
  });
  it.each([429, 406, 504])(
    "HTTP %s 采用更长 Retry-After，不自动再请求",
    async (status) => {
      const dir = await root();
      let now = 100000;
      const gate = new FileOverpassGate(dir, () => now);
      const work = vi
        .fn()
        .mockRejectedValue(new OverpassHttpError(status, 90000));
      await expect(gate.run(work)).rejects.toMatchObject({ status });
      now += 30001;
      await expect(
        new FileOverpassGate(dir, () => now).run(work),
      ).rejects.toMatchObject({ retryAt: 190000 });
      expect(work).toHaveBeenCalledTimes(1);
    },
  );
  it("成功使用实际字节，失败保守预留，磁盘日预算拒绝继续外发", async () => {
    const dir = await root();
    let now = Date.parse("2026-09-07T00:00:00Z");
    const gate = new FileOverpassGate(dir, () => now);
    await gate.run(async (limit) => ({ value: true, bytes: limit }));
    now += 30001;
    await gate.run(async (limit) => ({ value: true, bytes: limit }));
    now += 30001;
    const work = vi.fn();
    await expect(gate.run(work)).rejects.toMatchObject({
      message: "MAP_PROVIDER_BACKOFF",
    });
    expect(work).not.toHaveBeenCalled();
    expect(
      JSON.parse(await readFile(path.join(dir, "overpass-budget.json"), "utf8"))
        .bytes,
    ).toBe(10 * 1024 * 1024);
  });
  it("Retry-After秒数/日期与缺失值至少30秒", () => {
    expect(retryAfterMilliseconds("3", 0)).toBe(30000);
    expect(retryAfterMilliseconds("90", 0)).toBe(90000);
    expect(retryAfterMilliseconds("Thu, 01 Jan 1970 00:02:00 GMT", 0)).toBe(
      120000,
    );
    expect(retryAfterMilliseconds("invalid", 0)).toBe(30000);
  });
  it("新批准的两次验收额度保留旧计数、共享锁和单次5MiB上限，第三次被拒绝", async () => {
    const dir = await root();
    let now = Date.parse("2026-09-07T00:00:00Z");
    const normal = new FileOverpassGate(dir, () => now);
    for (let i = 0; i < 2; i++) {
      await normal.run(async (limit) => ({ value: true, bytes: limit }));
      now += 30001;
    }
    const grant = { id: "test-only-two", maxRequests: 2 } as const;
    for (let i = 0; i < 2; i++) {
      await new FileOverpassGate(dir, () => now, grant).run(async (limit) => {
        expect(limit).toBe(5 * 1024 * 1024);
        return { value: true, bytes: 10, httpStatus: 200 };
      });
      now += 30001;
    }
    const work = vi.fn();
    await expect(
      new FileOverpassGate(dir, () => now, grant).run(work),
    ).rejects.toThrow("MAP_ACCEPTANCE_BUDGET_EXHAUSTED");
    await expect(normal.run(work)).rejects.toThrow("MAP_PROVIDER_BACKOFF");
    expect(work).not.toHaveBeenCalled();
    const state = JSON.parse(
      await readFile(path.join(dir, "overpass-budget.json"), "utf8"),
    );
    expect(state.requests).toBe(4);
    expect(state.bytes).toBe(10 * 1024 * 1024 + 20);
    expect(state.lastHttpStatus).toBe(200);
  });
});
