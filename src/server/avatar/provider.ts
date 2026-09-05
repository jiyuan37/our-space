import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import sharp from "sharp";
import { AVATAR } from "@/lib/avatar/config";
import {
  AvatarGenerationFailedError,
  AvatarUnavailableError,
} from "@/server/errors/domain-error";

// Service 只依赖此接口，模型配置不进入 Resident 核心身份模型。
export interface AvatarGenerationProvider {
  readonly model: string;
  generate(selfie: Buffer): Promise<Buffer>;
}
export type CloudflareAvatarModel =
  | "cloudflare-sdxl-lightning"
  | "cloudflare-flux-klein";
export const AVATAR_PROMPT = `One original warm cute pixel-art portrait of the person in the input photo. Preserve their visible hairstyle, hair colour, skin tone and eyewear. Frontal oversized head, rounded stepped cheeks and chin, head 80-85 percent of the character, no neck, tiny shoulders. Clear gentle eyes and small smile, readable at 60 pixels. Hand-drawn 64x64 logical pixel scale, flat pixel clusters, one-pixel light contour, restrained warm beige and terracotta palette. Centre the complete head with 6 percent margin on all sides. Solid pure magenta #FF00FF background for removal, absolutely no magenta on character. No prop, no book, no drink, no badge, no text, no scenery. Not realistic, not full body, not a circle crop, no commercial game assets.`;
export class CloudflareAvatarProvider implements AvatarGenerationProvider {
  readonly model: string;
  constructor(
    readonly kind: CloudflareAvatarModel = "cloudflare-sdxl-lightning",
  ) {
    this.model =
      kind === "cloudflare-flux-klein" ? AVATAR.fluxModel : AVATAR.sdxlModel;
  }
  async generate(selfie: Buffer): Promise<Buffer> {
    const account = process.env.CLOUDFLARE_ACCOUNT_ID;
    const key = process.env.CLOUDFLARE_API_TOKEN;
    if (
      process.env.AVATAR_EXTERNAL_PROCESSING_APPROVED !==
        AVATAR.policyVersion ||
      process.env.CLOUDFLARE_WORKERS_PLAN !== "free" ||
      !key ||
      !account ||
      !/^[a-f0-9]{32}$/i.test(account)
    )
      throw new AvatarUnavailableError();
    let body: BodyInit;
    const headers: Record<string, string> = { Authorization: `Bearer ${key}` };
    if (this.kind === "cloudflare-sdxl-lightning") {
      headers["Content-Type"] = "application/json";
      body = JSON.stringify({
        prompt: AVATAR_PROMPT,
        negative_prompt:
          "photorealistic, full body, long neck, detailed clothing, scenery, text, watermark, blurry, multiple people",
        image_b64: selfie.toString("base64"),
        width: AVATAR.generationSize,
        height: AVATAR.generationSize,
        num_steps: AVATAR.sdxlSteps,
        strength: AVATAR.sdxlStrength,
        guidance: AVATAR.sdxlGuidance,
      });
    } else {
      const form = new FormData();
      form.set(
        "prompt",
        `Image 0 is the consenting user's photo. Image 1 is only our original pixel-art style reference, do not copy its identities. ${AVATAR_PROMPT}`,
      );
      form.set("width", String(AVATAR.generationSize));
      form.set("height", String(AVATAR.generationSize));
      const photo = await sharp(selfie)
        .resize(AVATAR.fluxInputSize, AVATAR.fluxInputSize, { fit: "inside" })
        .jpeg()
        .toBuffer();
      form.append(
        "input_image_0",
        new Blob([new Uint8Array(photo)], { type: "image/jpeg" }),
        "selfie.jpg",
      );
      const reference = await readFile(resolve("assets/avatar/style-v1.png"));
      form.append(
        "input_image_1",
        new Blob([new Uint8Array(reference)], { type: "image/png" }),
        "style.png",
      );
      body = form;
    }
    try {
      // 直连 Workers AI；不用 AI Gateway、R2、KV 或日志缓存。一次任务一次调用。
      const response = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${account}/ai/run/${this.model}`,
        {
          method: "POST",
          headers,
          body,
          signal: AbortSignal.timeout(AVATAR.providerTimeoutMs),
          redirect: "error",
        },
      );
      if (!response.ok) throw new Error();
      const reader = response.body?.getReader();
      if (!reader) throw new Error();
      const chunks: Uint8Array[] = [];
      let size = 0;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.length;
        if (size > 18 * 1024 * 1024) {
          await reader.cancel();
          throw new Error();
        }
        chunks.push(value);
      }
      const bytes = Buffer.concat(chunks);
      if (this.kind === "cloudflare-sdxl-lightning") return bytes;
      const result = JSON.parse(bytes.toString("utf8"));
      if (result.success === false || typeof result.result?.image !== "string")
        throw new Error();
      return Buffer.from(result.result.image, "base64");
    } catch {
      throw new AvatarGenerationFailedError();
    }
  }
}
