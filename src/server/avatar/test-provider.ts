import sharp from "sharp";
import { parseCloudflareImageResponse, decodeProviderImage } from "./response";
import { AVATAR } from "@/lib/avatar/config";
import type { AvatarGenerationProvider } from "@/server/avatar/provider";
export class FixtureAvatarProvider implements AvatarGenerationProvider {
  readonly model = "controlled-fixture-not-ai";
  async generate(): Promise<Buffer> {
    await new Promise((resolve) => setTimeout(resolve, 350));
    const image = await sharp("assets/avatar/test-candidate.svg")
      .resize(AVATAR.generationSize, AVATAR.generationSize, {
        kernel: "nearest",
      })
      .png()
      .toBuffer();
    // 与官方 REST schema 一致的 HTTP 200 fixture；无 fetch，不冒充真实服务响应。
    const response = Response.json({
      success: true,
      errors: [],
      result: { image: image.toString("base64") },
    });
    const parsed = parseCloudflareImageResponse(
      response.headers.get("content-type"),
      Buffer.from(await response.arrayBuffer()),
    );
    await decodeProviderImage(parsed.bytes);
    return parsed.bytes;
  }
}
