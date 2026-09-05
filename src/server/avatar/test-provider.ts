import sharp from "sharp";
import { AVATAR } from "@/lib/avatar/config";
import type { AvatarGenerationProvider } from "@/server/avatar/provider";
export class FixtureAvatarProvider implements AvatarGenerationProvider {
  readonly model = "controlled-fixture-not-ai";
  async generate(): Promise<Buffer> {
    await new Promise((resolve) => setTimeout(resolve, 350));
    return sharp("assets/avatar/test-candidate.svg")
      .resize(AVATAR.generationSize, AVATAR.generationSize, {
        kernel: "nearest",
      })
      .png()
      .toBuffer();
  }
}
