// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import sharp from "sharp";
import { AVATAR } from "@/lib/avatar/config";
import { CloudflareAvatarProvider } from "./provider";
import { avatarEnabled, avatarTestMode } from "./runtime";
vi.mock("@/lib/db/prisma", () => ({ prisma: {} }));
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});
function configure() {
  vi.stubEnv("AVATAR_EXTERNAL_PROCESSING_APPROVED", AVATAR.policyVersion);
  vi.stubEnv("CLOUDFLARE_WORKERS_PLAN", "free");
  vi.stubEnv("CLOUDFLARE_ACCOUNT_ID", "a".repeat(32));
  vi.stubEnv("CLOUDFLARE_API_TOKEN", "unit-test-not-a-secret");
  vi.stubEnv("AVATAR_PROVIDER", "cloudflare-sdxl-lightning");
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
  it("SDXL img2img 仅发送白名单图像输入与固定提示，无隐式重试", async () => {
    configure();
    const fetcher = vi.fn().mockResolvedValue(
      new Response(new Uint8Array([1, 2, 3]), {
        headers: { "content-type": "image/png" },
      }),
    );
    vi.stubGlobal("fetch", fetcher);
    await new CloudflareAvatarProvider().generate(
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
      new CloudflareAvatarProvider().generate(Buffer.from("x")),
    ).rejects.toMatchObject({
      code: "AVATAR_GENERATION_FAILED",
      message: "AVATAR_GENERATION_FAILED",
    });
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
  it("FLUX 仅发送小于512px本人照片，不外发其他参考图片", async () => {
    configure();
    const fetcher = vi.fn().mockResolvedValue(
      Response.json({
        success: true,
        result: { image: Buffer.from("result").toString("base64") },
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
      ["prompt", "width", "height", "input_image_0"].sort(),
    );
    expect(
      (
        await sharp(
          Buffer.from(await (form.get("input_image_0") as File).arrayBuffer()),
        ).metadata()
      ).width,
    ).toBe(480);
  });
});
