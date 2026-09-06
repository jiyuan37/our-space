// @vitest-environment node
import { describe, expect, it } from "vitest";
import sharp from "sharp";
import { prepareFluxReference } from "./flux-input";
describe("FLUX reference 严格小于 512x512", () => {
  it.each([
    [1024, 1024],
    [2048, 512],
    [512, 2048],
    [512, 512],
    [128, 256],
  ])("%i × %i 输入均约束双边且不放大小图", async (width, height) => {
    const input = await sharp({
      create: { width, height, channels: 3, background: "#bea" },
    })
      .jpeg()
      .withMetadata({ orientation: 6 })
      .toBuffer();
    const result = await prepareFluxReference(input);
    const meta = await sharp(result).metadata();
    expect(meta.width).toBeLessThan(512);
    expect(meta.height).toBeLessThan(512);
    expect(Math.max(meta.width!, meta.height!)).toBeLessThanOrEqual(
      Math.min(480, Math.max(width, height)),
    );
    expect(meta.exif).toBeUndefined();
    expect(meta.orientation).toBeUndefined();
  });
  it("预处理损坏数据返回独立阶段码", async () => {
    await expect(
      prepareFluxReference(Buffer.from("invalid")),
    ).rejects.toMatchObject({ stage: "PROVIDER_INPUT_PREPROCESS_FAILED" });
  });
});
