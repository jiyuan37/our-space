import { approvedStyleReference } from "./style-reference";
import { prepareFluxReference } from "./flux-input";
import { parseCloudflareImageResponse, decodeProviderImage } from "./response";
import { AvatarPipelineError } from "./pipeline-error";
import { AVATAR } from "@/lib/avatar/config";
import { AvatarUnavailableError } from "@/server/errors/domain-error";

// Service 只依赖此接口，模型配置不进入 Resident 核心身份模型。
export interface AvatarGenerationProvider {
  readonly model: string;
  generate(selfie: Buffer): Promise<Buffer>;
}
export type CloudflareAvatarModel =
  | "cloudflare-sdxl-lightning"
  | "cloudflare-flux-klein";
export const AVATAR_PROMPT = `One original warm cute pixel-art portrait of the person in the input photo. Preserve their visible hairstyle, hair colour, skin tone and eyewear. Frontal oversized head, rounded stepped cheeks and chin, head 80-85 percent of the character, no neck, tiny shoulders. Clear gentle eyes and small smile, readable at 60 pixels. Hand-drawn 64x64 logical pixel scale, flat pixel clusters, one-pixel light contour, restrained warm beige and terracotta palette. Centre the complete head with 6 percent margin on all sides. Solid pure magenta #FF00FF background for removal, absolutely no magenta on character. No prop, no book, no drink, no badge, no text, no scenery. Not realistic, not full body, not a circle crop, no commercial game assets.`;
// 模板版本见 AVATAR.promptVersion；图序由白名单 payload 测试固定。
export const FLUX_AVATAR_PROMPT = `Create one original Our Space warm cute pixel big-head character. Image 1 (input_image_1) supplies ONLY the user's identity facts: preserve visible hair colour, hair length, hair parting or bangs, face shape, skin tone and other stable visible features. Never add glasses, hats, earrings, a beard, hair accessories or any identity-defining accessory absent from image 1. If image 1 has no glasses, the output MUST have no glasses. Do not invent features that cannot be seen. Image 0 (input_image_0) supplies ONLY visual style: pixel scale, stepped rounded silhouette, head proportions, warm palette, lightweight outlines and readable facial expression. Do NOT copy either reference character's accessories, face, hairstyle or identity from image 0. Identity facts from image 1 always override anything suggested by image 0; these are not stylistic variations. Render the identity of image 1 in the style of image 0. Override the selfie portrait composition: an oversized rounded head occupying 80-85 percent of the character, round cheeks and chin, no long neck, extremely little shoulder area, clear eyes and a small smile. Flat coherent pixel clusters, original hand-drawn pixel cartoon, not realistic or smooth vector. Single head/head-and-tiny-shoulders centered with margin, no full body. Base identity with no book, drink, prop, badge, text or scenery. A uniform flat background contrasting with the hair and skin, no gradient, texture or cast shadow; the application removes this background. Never copy commercial game assets.`;
export class CloudflareAvatarProvider implements AvatarGenerationProvider {
  readonly model: string;
  constructor(readonly kind: CloudflareAvatarModel = "cloudflare-flux-klein") {
    this.model =
      kind === "cloudflare-flux-klein" ? AVATAR.fluxModel : AVATAR.sdxlModel;
  }
  async generate(selfie: Buffer): Promise<Buffer> {
    const account = process.env.CLOUDFLARE_ACCOUNT_ID;
    const key = process.env.CLOUDFLARE_API_TOKEN;
    if (
      process.env.AVATAR_EXTERNAL_REQUESTS_ENABLED !== "true" ||
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
      form.set("prompt", FLUX_AVATAR_PROMPT);
      form.set("width", String(AVATAR.generationSize));
      form.set("height", String(AVATAR.generationSize));
      const style = await approvedStyleReference();
      form.append(
        "input_image_0",
        new Blob([new Uint8Array(style)], { type: "image/png" }),
        "our-space-style.png",
      );
      const photo = await prepareFluxReference(selfie);
      form.append(
        "input_image_1",
        new Blob([new Uint8Array(photo)], { type: "image/jpeg" }),
        "selfie.jpg",
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
      if (!response.ok)
        throw new AvatarPipelineError("PROVIDER_REQUEST_FAILED");
      const reader = response.body?.getReader();
      if (!reader)
        throw new AvatarPipelineError("PROVIDER_RESPONSE_PARSE_FAILED");
      const chunks: Uint8Array[] = [];
      let size = 0;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.length;
        if (size > AVATAR.maxProviderResponseBytes) {
          await reader.cancel();
          throw new AvatarPipelineError("PROVIDER_RESPONSE_PARSE_FAILED");
        }
        chunks.push(value);
      }
      const parsed = parseCloudflareImageResponse(
        response.headers.get("content-type"),
        Buffer.concat(chunks),
      );
      await decodeProviderImage(parsed.bytes);
      return parsed.bytes;
    } catch (error) {
      if (error instanceof AvatarPipelineError) throw error;
      throw new AvatarPipelineError("PROVIDER_REQUEST_FAILED");
    }
  }
}
