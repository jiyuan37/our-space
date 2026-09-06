// @vitest-environment node
import { describe, it, expect } from "vitest";
import sharp from "sharp";
import { removeUniformBackground } from "./background";
import { normalizeCandidate } from "./images";
function scene(color: number[]) {
  const size = 100,
    data = Buffer.alloc(size * size * 4);
  for (let p = 0; p < size * size; p++) data.set([...color, 255], p * 4);
  for (let y = 20; y < 85; y++)
    for (let x = 20; x < 80; x++)
      data.set([72, 48, 34, 255], (y * size + x) * 4);
  // 细发丝与被主体包围的同背景色饰物必须保留。
  for (let y = 12; y < 30; y++)
    data.set([50, 30, 20, 255], (y * size + 30) * 4);
  data.set([...color, 255], (50 * size + 50) * 4);
  return data;
}
describe("不依赖预设色相的本地背景分离", () => {
  it.each([
    [220, 40, 150],
    [245, 235, 220],
    [80, 155, 190],
    [90, 150, 90],
  ])("保留主体与细发丝，清除近似纯色 %j", (...color) => {
    const input = scene(color),
      copy = Buffer.from(input);
    const { data } = removeUniformBackground(input, 100, 100);
    expect(input.equals(copy)).toBe(true);
    expect(data[3]).toBe(0);
    for (const p of [15 * 100 + 30, 50 * 100 + 50, 40 * 100 + 40])
      expect(data.subarray(p * 4, p * 4 + 4)).toEqual(
        input.subarray(p * 4, p * 4 + 4),
      );
  });
  it.each(["png", "jpeg"] as const)(
    "opaque %s 全分辨率去背景再生成256px透明显示图",
    async (format) => {
      const raw = scene([195, 75, 155]);
      const input = await sharp(raw, {
        raw: { width: 100, height: 100, channels: 4 },
      })
        .resize(1024, 1024, { kernel: "nearest" })
        [format]()
        .toBuffer();
      const output = await normalizeCandidate(input);
      expect(await sharp(output).metadata()).toMatchObject({
        width: 256,
        height: 256,
        format: "png",
        hasAlpha: true,
      });
      const { data } = await sharp(output)
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });
      expect(data[3]).toBe(0);
      expect(data[(128 * 256 + 128) * 4 + 3]).toBe(255);
    },
  );
  it("边界混色局部去溢色，保留主体和发丝，不收缩轮廓", () => {
    const input = scene([200, 80, 160]);
    input.set([136, 64, 97, 255], (40 * 100 + 19) * 4);
    const { data } = removeUniformBackground(input, 100, 100);
    const edge = (40 * 100 + 19) * 4;
    expect(data[edge + 3]).toBeGreaterThan(100);
    expect(data[edge + 3]).toBeLessThan(160);
    expect(data[edge]).toBeLessThan(90);
    expect(data.subarray((40 * 100 + 40) * 4, (40 * 100 + 40) * 4 + 4)).toEqual(
      input.subarray((40 * 100 + 40) * 4, (40 * 100 + 40) * 4 + 4),
    );
  });
  it("压缩噪声/轻微色差允许，复杂边缘与空白图安全拒绝", () => {
    const data = scene([195, 75, 155]);
    for (let y = 0; y < 100; y++)
      for (let x = 0; x < 100; x++) {
        if (y < 10 || y > 90 || x < 10 || x > 90) {
          const i = (y * 100 + x) * 4;
          for (let c = 0; c < 3; c++) data[i + c] += ((x + y) % 5) - 2;
        }
      }
    expect(removeUniformBackground(data, 100, 100).borderClearRatio).toBe(1);
    const gradient = Buffer.from(data);
    for (let x = 0; x < 100; x++) gradient.set([x * 2, 0, 0, 255], x * 4);
    expect(() => removeUniformBackground(gradient, 100, 100)).toThrow(
      expect.objectContaining({ reason: "BACKGROUND_NOT_UNIFORM" }),
    );
    expect(() =>
      removeUniformBackground(Buffer.alloc(40000, 255), 100, 100),
    ).toThrow(expect.objectContaining({ reason: "FOREGROUND_NOT_SEPARABLE" }));
  });
});
