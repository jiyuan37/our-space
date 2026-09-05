// @vitest-environment node
import { describe, expect, it } from "vitest";
import sharp from "sharp";
import {
  normalizeSelfie,
  normalizeCandidate,
  normalizeGeneratedSource,
} from "./images";
import { FixtureAvatarProvider } from "./test-provider";
import { LocalAvatarStorage } from "./storage";
describe("头像图片边界", () => {
  it("解码校验、纠正方向、清除 EXIF 并限制发送尺寸", async () => {
    const source = await sharp({
      create: { width: 1600, height: 1200, channels: 3, background: "#baa" },
    })
      .jpeg()
      .withMetadata({ orientation: 6 })
      .toBuffer();
    const result = await normalizeSelfie(source, "image/jpeg");
    const meta = await sharp(result).metadata();
    expect(meta.width).toBeLessThanOrEqual(1024);
    expect(meta.height).toBeLessThanOrEqual(1024);
    expect(meta.exif).toBeUndefined();
    expect(meta.orientation).toBeUndefined();
  });
  it.each(["image/svg+xml", "image/gif", "image/jpeg"])(
    "拒绝伪造 MIME/内容 %s",
    async (mime) => {
      await expect(
        normalizeSelfie(
          Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"/>'),
          mime,
        ),
      ).rejects.toMatchObject({ code: "AVATAR_INVALID_PHOTO" });
    },
  );
  it("拒绝 MIME 与实际解码不匹配、超限与过小照片", async () => {
    const png = await sharp({
      create: { width: 128, height: 128, channels: 3, background: "red" },
    })
      .png()
      .toBuffer();
    await expect(normalizeSelfie(png, "image/jpeg")).rejects.toThrow();
    await expect(
      normalizeSelfie(Buffer.alloc(6 * 1024 * 1024), "image/png"),
    ).rejects.toThrow();
    await expect(
      normalizeSelfie(
        await sharp(png).resize(32, 32).png().toBuffer(),
        "image/png",
      ),
    ).rejects.toThrow();
  });
  it("候选具有固定像素栅格、透明背景且拒绝无效输出", async () => {
    const bytes = await new FixtureAvatarProvider().generate();
    const image = await normalizeCandidate(bytes);
    const meta = await sharp(image).metadata();
    expect(meta.width).toBe(256);
    expect(meta.height).toBe(256);
    expect(meta.hasAlpha).toBe(true);
    await expect(
      normalizeCandidate(Buffer.from("not an image")),
    ).rejects.toMatchObject({ code: "AVATAR_GENERATION_FAILED" });
    await expect(
      normalizeCandidate(
        await sharp({
          create: {
            width: 1024,
            height: 1024,
            channels: 3,
            background: "#aaa",
          },
        })
          .png()
          .toBuffer(),
      ),
    ).rejects.toThrow();
  });
  it("只清除边缘连通的底色，不抹掉脸部肤色", async () => {
    const source = await new FixtureAvatarProvider().generate();
    const keyed = await sharp(source)
      .flatten({ background: "#ff00ff" })
      .png()
      .toBuffer();
    expect(
      (await sharp(await normalizeCandidate(keyed)).metadata()).hasAlpha,
    ).toBe(true);
  });
  it("保留高分辨率生成源图但去除其元数据，拒绝无效源图", async () => {
    const image = await new FixtureAvatarProvider().generate();
    const withMetadata = await sharp(image).withMetadata().png().toBuffer();
    const result = await normalizeGeneratedSource(withMetadata);
    const meta = await sharp(result).metadata();
    expect(meta.width).toBe(1024);
    expect(meta.height).toBe(1024);
    expect(meta.format).toBe("png");
    expect(meta.exif).toBeUndefined();
    await expect(
      normalizeGeneratedSource(Buffer.from("invalid")),
    ).rejects.toMatchObject({ code: "AVATAR_GENERATION_FAILED" });
    await expect(
      normalizeGeneratedSource(await sharp(image).resize(256).png().toBuffer()),
    ).rejects.toThrow();
  });
  it("私密存储拒绝 public 和路径穿越", async () => {
    expect(() => new LocalAvatarStorage("public/uploads")).toThrow();
    expect(() =>
      new LocalAvatarStorage("/tmp/our-space-avatar-storage-unit").get(
        "../../.env",
      ),
    ).toThrow();
  });
});
