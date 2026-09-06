import { readFile } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";
import { AvatarPipelineError } from "./pipeline-error";
// 仅服务器自带的、由批准原创角色生成的素材；不接受 URL 或用户资源键。
export async function approvedStyleReference() {
  try {
    const svg = await readFile(
      join(process.cwd(), "src/server/avatar/style-reference.svg"),
    );
    const image = await sharp(svg).png().toBuffer();
    const meta = await sharp(image).metadata();
    if (meta.width !== 480 || meta.height !== 320 || meta.exif)
      throw new Error();
    return image;
  } catch {
    throw new AvatarPipelineError("PROVIDER_INPUT_PREPROCESS_FAILED");
  }
}
