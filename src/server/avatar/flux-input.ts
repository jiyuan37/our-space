import sharp from "sharp";
import { AVATAR } from "@/lib/avatar/config";
import { AvatarPipelineError } from "./pipeline-error";
// FLUX 输入独立于通用自拍 1024px 规则：宽与高都严格小于 512px。
export async function prepareFluxReference(selfie: Buffer): Promise<Buffer> {
  try {
    const bytes = await sharp(selfie, {
      limitInputPixels: AVATAR.maxInputPixels,
      failOn: "warning",
    })
      .rotate()
      .resize(AVATAR.fluxInputSize, AVATAR.fluxInputSize, {
        fit: "inside",
        withoutEnlargement: true,
      })
      .flatten({ background: "#fff4df" })
      .jpeg({ quality: 85 })
      .toBuffer();
    const meta = await sharp(bytes).metadata();
    if (
      !meta.width ||
      !meta.height ||
      meta.width >= 512 ||
      meta.height >= 512 ||
      meta.exif
    )
      throw new Error();
    return bytes;
  } catch {
    throw new AvatarPipelineError("PROVIDER_INPUT_PREPROCESS_FAILED");
  }
}
