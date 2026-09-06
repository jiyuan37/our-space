// @vitest-environment node
import { beforeAll, describe, expect, it } from "vitest";
import sharp from "sharp";
import { decodeProviderImage, parseCloudflareImageResponse } from "./response";
let png: Buffer, jpeg: Buffer;
beforeAll(async () => {
  png = await sharp({
    create: { width: 1024, height: 1024, channels: 3, background: "#efd7ab" },
  })
    .png()
    .toBuffer();
  jpeg = await sharp(png).jpeg().toBuffer();
});
const json = (image: Buffer, envelope = true) =>
  Buffer.from(
    JSON.stringify(
      envelope
        ? {
            success: true,
            errors: [],
            messages: [],
            result: { image: image.toString("base64") },
          }
        : { image: image.toString("base64") },
    ),
  );
describe("Cloudflare response 纯解析与真实图像解码", () => {
  it.each(["png", "jpeg"] as const)(
    "result.image 接受有效 %s，magic 决定 MIME",
    async (format) => {
      const image = format === "png" ? png : jpeg;
      const parsed = parseCloudflareImageResponse(
        "application/json; charset=utf-8",
        json(image),
      );
      expect(parsed.bytes.equals(image)).toBe(true);
      expect(parsed.mimeType).toBe(`image/${format}`);
      expect(await decodeProviderImage(parsed.bytes)).toMatchObject({
        width: 1024,
        height: 1024,
        mimeType: `image/${format}`,
      });
    },
  );
  it("支持模型直接 image 输出，不强制 result envelope", () => {
    expect(
      parseCloudflareImageResponse(
        "application/json",
        json(png, false),
      ).bytes.equals(png),
    ).toBe(true);
  });
  it.each([
    {},
    { result: {} },
    { result: null },
    { result: { image: 42 } },
    { success: false, result: { image: "AA==" } },
    { errors: [{ code: 1 }], image: "AA==" },
  ])("拒绝缺少 image 或错误 envelope %#", (value) => {
    expect(() =>
      parseCloudflareImageResponse(
        "application/json",
        Buffer.from(JSON.stringify(value)),
      ),
    ).toThrow(
      expect.objectContaining({ stage: "PROVIDER_RESPONSE_PARSE_FAILED" }),
    );
  });
  it.each([
    "",
    "not!base64",
    "a",
    "YWJj=",
    "YR==",
    "data:image/png;base64,AA==",
    "AA-_",
    "AA==\n",
  ])("严格拒绝无效 Base64 %#", (value) => {
    expect(() =>
      parseCloudflareImageResponse(
        "application/json",
        Buffer.from(JSON.stringify({ result: { image: value } })),
      ),
    ).toThrow(
      expect.objectContaining({ stage: "PROVIDER_RESPONSE_PARSE_FAILED" }),
    );
  });
  it("合法 Base64 解出非图片必须归为 decode 失败", () => {
    expect(() =>
      parseCloudflareImageResponse(
        "application/json",
        json(Buffer.from("not-image")),
      ),
    ).toThrow(
      expect.objectContaining({ stage: "PROVIDER_IMAGE_DECODE_FAILED" }),
    );
  });
  it("raw JPEG 不被错误 HTTP PNG 标签覆盖，raw PNG 同样可用", async () => {
    const parsed = parseCloudflareImageResponse("image/png", jpeg);
    expect(parsed.mimeType).toBe("image/jpeg");
    expect((await decodeProviderImage(parsed.bytes)).mimeType).toBe(
      "image/jpeg",
    );
    expect(
      parseCloudflareImageResponse("application/octet-stream", png).mimeType,
    ).toBe("image/png");
  });
  it("corrupt PNG/JPEG 不能靠正确 magic 混过解码", async () => {
    for (const image of [png, jpeg]) {
      await expect(
        decodeProviderImage(image.subarray(0, 24)),
      ).rejects.toMatchObject({
        stage: "PROVIDER_IMAGE_DECODE_FAILED",
        message: "AVATAR_GENERATION_FAILED",
      });
    }
  });
  it("拒绝 unsupported format、错误 JSON 与未知 Content-Type", async () => {
    const webp = await sharp(png).webp().toBuffer();
    await expect(decodeProviderImage(webp)).rejects.toMatchObject({
      stage: "PROVIDER_IMAGE_DECODE_FAILED",
    });
    expect(() =>
      parseCloudflareImageResponse("application/json", Buffer.from("{broken")),
    ).toThrow(
      expect.objectContaining({ stage: "PROVIDER_RESPONSE_PARSE_FAILED" }),
    );
    expect(() =>
      parseCloudflareImageResponse(
        "text/html",
        Buffer.from("secret-provider-error"),
      ),
    ).toThrow(expect.objectContaining({ message: "AVATAR_GENERATION_FAILED" }));
  });
});
