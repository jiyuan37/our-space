// @vitest-environment node
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import sharp from "sharp";
import { readFile } from "node:fs/promises";
import { AVATAR } from "@/lib/avatar/config";
import { approvedStyleReference } from "./style-reference";
import { CloudflareAvatarProvider, FLUX_AVATAR_PROMPT } from "./provider";
import { avatarEnabled, avatarTestMode } from "./runtime";
vi.mock("@/lib/db/prisma", () => ({ prisma: {} }));
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});
let validImage: Buffer;
beforeAll(async () => {
  validImage = await sharp({
    create: { width: 1024, height: 1024, channels: 3, background: "#baa" },
  })
    .png()
    .toBuffer();
});
function configure() {
  vi.stubEnv("AVATAR_EXTERNAL_REQUESTS_ENABLED", "true");
  vi.stubEnv("AVATAR_EXTERNAL_PROCESSING_APPROVED", AVATAR.policyVersion);
  vi.stubEnv("CLOUDFLARE_WORKERS_PLAN", "free");
  vi.stubEnv("CLOUDFLARE_ACCOUNT_ID", "a".repeat(32));
  vi.stubEnv("CLOUDFLARE_API_TOKEN", "unit-test-not-a-secret");
  vi.stubEnv("AVATAR_PROVIDER", "cloudflare-flux-klein");
}
describe("可替换 Cloudflare provider", () => {
  it("未配置/付费计划不派发，production 不能启用 fixture", async () => {
    const fetcher = vi.fn();
    vi.stubGlobal("fetch", fetcher);
    vi.stubEnv("AVATAR_EXTERNAL_PROCESSING_APPROVED", "");
    expect(avatarEnabled()).toBe(false);
    await expect(
      new CloudflareAvatarProvider().generate(Buffer.from("photo")),
    ).rejects.toMatchObject({ code: "AVATAR_UNAVAILABLE" });
    configure();
    vi.stubEnv("CLOUDFLARE_WORKERS_PLAN", "paid");
    expect(avatarEnabled()).toBe(false);
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("AVATAR_E2E_FIXTURE", "true");
    expect(avatarTestMode()).toBe(false);
    expect(fetcher).not.toHaveBeenCalled();
  });
  it("政策同意不等于允许真实请求；关闭请求开关绝不发送", async () => {
    configure();
    const fetcher = vi.fn();
    vi.stubGlobal("fetch", fetcher);
    vi.stubEnv("AVATAR_EXTERNAL_REQUESTS_ENABLED", "false");
    expect(avatarEnabled()).toBe(false);
    await expect(
      new CloudflareAvatarProvider().generate(Buffer.from("photo")),
    ).rejects.toMatchObject({ code: "AVATAR_UNAVAILABLE" });
    expect(fetcher).not.toHaveBeenCalled();
    vi.stubEnv("AVATAR_EXTERNAL_REQUESTS_ENABLED", "true");
    expect(avatarEnabled()).toBe(true);
    vi.stubEnv("AVATAR_PROVIDER", "cloudflare-sdxl-lightning");
    expect(avatarEnabled()).toBe(false);
  });
  it("SDXL img2img 仅发送白名单图像输入与固定提示，无隐式重试", async () => {
    configure();
    const fetcher = vi.fn().mockResolvedValue(
      new Response(new Uint8Array(validImage), {
        headers: { "content-type": "image/png" },
      }),
    );
    vi.stubGlobal("fetch", fetcher);
    await new CloudflareAvatarProvider("cloudflare-sdxl-lightning").generate(
      Buffer.from("normalized selfie"),
    );
    expect(fetcher).toHaveBeenCalledTimes(1);
    const [url, options] = fetcher.mock.calls[0];
    expect(url).toContain(AVATAR.sdxlModel);
    const body = JSON.parse(options.body);
    expect(Object.keys(body).sort()).toEqual(
      [
        "prompt",
        "negative_prompt",
        "image_b64",
        "width",
        "height",
        "num_steps",
        "strength",
        "guidance",
      ].sort(),
    );
    expect(body.image_b64).toBe(
      Buffer.from("normalized selfie").toString("base64"),
    );
    expect(options.redirect).toBe("error");
  });
  it("超限/失败只返回安全错误，不自动尝试其他模型", async () => {
    configure();
    const fetcher = vi
      .fn()
      .mockResolvedValue(
        new Response("provider-private-details", { status: 429 }),
      );
    vi.stubGlobal("fetch", fetcher);
    await expect(
      new CloudflareAvatarProvider("cloudflare-sdxl-lightning").generate(
        Buffer.from("x"),
      ),
    ).rejects.toMatchObject({
      code: "AVATAR_GENERATION_FAILED",
      message: "AVATAR_GENERATION_FAILED",
    });
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
  it("身份事实仅来自自拍，无眼镜必须无眼镜，参考副本无发夹/道具", async () => {
    for (const requirement of [
      "If image 1 has no glasses, the output MUST have no glasses",
      "Never add glasses, hats, earrings, a beard, hair accessories",
      "hair colour, hair length, hair parting or bangs, face shape",
      "accessories, face, hairstyle or identity from image 0",
      "Identity facts from image 1 always override",
    ])
      expect(FLUX_AVATAR_PROMPT).toContain(requirement);
    const svg = await readFile("src/server/avatar/style-reference.svg", "utf8");
    expect(svg).not.toContain("M37 18h4v2h-4Z");
    expect(svg).not.toContain("data-prop=");
    expect(svg).toContain("no props or accessories");
  });
  it("FLUX 图0仅原创风格、图1仅本人身份，两图严格小于512px且不自动重试", async () => {
    configure();
    const fetcher = vi.fn().mockResolvedValue(
      Response.json({
        success: true,
        result: { image: validImage.toString("base64") },
      }),
    );
    vi.stubGlobal("fetch", fetcher);
    const photo = await sharp({
      create: { width: 1024, height: 1024, channels: 3, background: "#baa" },
    })
      .jpeg()
      .toBuffer();
    await new CloudflareAvatarProvider("cloudflare-flux-klein").generate(photo);
    const form = fetcher.mock.calls[0][1].body as FormData;
    expect(Array.from(form.keys()).sort()).toEqual(
      ["prompt", "width", "height", "input_image_0", "input_image_1"].sort(),
    );
    expect(
      (
        await sharp(
          Buffer.from(await (form.get("input_image_1") as File).arrayBuffer()),
        ).metadata()
      ).width,
    ).toBe(480);
    const reference = Buffer.from(
      await (form.get("input_image_0") as File).arrayBuffer(),
    );
    expect(reference.equals(await approvedStyleReference())).toBe(true);
    expect(await sharp(reference).metadata()).toMatchObject({
      width: 480,
      height: 320,
      format: "png",
    });
    const identity = await sharp(
      Buffer.from(await (form.get("input_image_1") as File).arrayBuffer()),
    ).metadata();
    expect(identity.height).toBeLessThan(512);
    expect(identity.exif).toBeUndefined();
    expect(form.get("prompt")).toBe(FLUX_AVATAR_PROMPT);
    expect(FLUX_AVATAR_PROMPT).toContain(
      "Image 1 (input_image_1) supplies ONLY the user's identity",
    );
    expect(FLUX_AVATAR_PROMPT).toContain(
      "Image 0 (input_image_0) supplies ONLY visual style",
    );
    expect(form.has("guidance")).toBe(false);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
});
