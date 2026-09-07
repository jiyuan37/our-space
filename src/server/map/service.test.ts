import { OverpassBackoffError } from "./request-gate";
import { describe, expect, it, vi } from "vitest";
import { MapService, type GeographyCache } from "./service";
import type { DatabaseClient } from "@/server/services/service-context";
import type { Geography } from "@/lib/map/model";
import { MemoryRateLimiter } from "@/server/rate-limit/rate-limiter";
const data: Geography = {
  bounds: [10, 50, 10.02, 50.02],
  features: [],
  attribution: "OpenStreetMap contributors",
  fetchedAt: "2026-09-06T00:00:00Z",
};
function setup(active = true) {
  const findFirst = vi
    .fn()
    .mockResolvedValue(active ? { id: "real-resident" } : null);
  const db = { resident: { findFirst } } as unknown as DatabaseClient;
  const provider = { read: vi.fn().mockResolvedValue(data) };
  const cache: GeographyCache = {
    read: vi.fn().mockResolvedValue(null),
    write: vi.fn().mockResolvedValue(undefined),
  };
  return {
    findFirst,
    provider,
    cache,
    service: new MapService(db, provider, cache, new MemoryRateLimiter()),
  };
}
describe("MapService", () => {
  it("先验证 ACTIVE Space 和 Resident，越权不读缓存或外发", async () => {
    const { service, provider, cache, findFirst } = setup(false);
    await expect(service.read("outsider", "paris-seine")).rejects.toMatchObject(
      { code: "NOT_SPACE_RESIDENT" },
    );
    expect(findFirst).toHaveBeenCalledWith({
      where: {
        userId: "outsider",
        status: "ACTIVE",
        space: { status: "ACTIVE" },
      },
      select: { id: true },
    });
    expect(provider.read).not.toHaveBeenCalled();
    expect(cache.read).not.toHaveBeenCalled();
  });
  it("不接受任意 endpoint、文件路径或原始查询", async () => {
    const { service, provider } = setup();
    await expect(service.read("own", "../../secret")).rejects.toMatchObject({
      code: "MAP_INVALID_AREA",
    });
    expect(provider.read).not.toHaveBeenCalled();
  });
  it("本地缓存命中时没有外部调用", async () => {
    const { service, provider, cache } = setup();
    vi.mocked(cache.read).mockResolvedValue(data);
    expect(await service.read("own", "paris-seine")).toEqual(data);
    expect(provider.read).not.toHaveBeenCalled();
  });
  it("并发请求合并，公共地理不含用户内容", async () => {
    const { service, provider, cache } = setup();
    const results = await Promise.all([
      service.read("own", "paris-seine"),
      service.read("partner", "paris-seine"),
    ]);
    expect(results).toEqual([data, data]);
    expect(provider.read).toHaveBeenCalledTimes(1);
    expect(cache.write).toHaveBeenCalledTimes(1);
    expect(provider.read).toHaveBeenCalledWith([2.334, 48.852, 2.35, 48.862]);
  });
  it("失败不写坏缓存，也不自动重试", async () => {
    const { service, provider, cache } = setup();
    provider.read.mockRejectedValue(new Error("upstream"));
    await expect(service.read("own", "paris-seine")).rejects.toMatchObject({
      code: "MAP_UNAVAILABLE",
    });
    expect(cache.write).not.toHaveBeenCalled();
    expect(provider.read).toHaveBeenCalledTimes(1);
  });
  it("政策关闭与网络失败分开，不误报为可以重试的网络故障", async () => {
    const { service, provider } = setup();
    provider.read.mockRejectedValue(new Error("MAP_PROVIDER_NOT_APPROVED"));
    await expect(service.read("own", "paris-seine")).rejects.toMatchObject({
      code: "MAP_NOT_CONFIGURED",
    });
  });
  it("共享退避转换为安全业务错误，仍可使用已有缓存", async () => {
    const { service, provider, cache } = setup();
    provider.read.mockRejectedValue(new OverpassBackoffError(999999999));
    await expect(service.read("own", "paris-seine")).rejects.toMatchObject({
      code: "MAP_BACKOFF",
      retryAt: 999999999,
    });
    vi.mocked(cache.read).mockResolvedValue(data);
    expect(await service.read("own", "paris-seine")).toEqual(data);
    expect(provider.read).toHaveBeenCalledTimes(1);
  });
});
