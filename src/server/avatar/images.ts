import sharp from "sharp";
import { removeUniformBackground } from "./background";
import { AvatarPipelineError } from "./pipeline-error";
import { AVATAR } from "@/lib/avatar/config";
import { AvatarInvalidPhotoError } from "@/server/errors/domain-error";

export async function normalizeSelfie(
  bytes: Buffer,
  mime: string,
): Promise<Buffer> {
  try {
    if (!bytes.length || bytes.length > AVATAR.maxUploadBytes)
      throw new Error();
    const allowed: Record<string, string> = {
      "image/jpeg": "jpeg",
      "image/png": "png",
      "image/webp": "webp",
    };
    const decoder = sharp(bytes, {
      limitInputPixels: AVATAR.maxInputPixels,
      failOn: "warning",
    });
    const meta = await decoder.metadata();
    if (
      !allowed[mime] ||
      allowed[mime] !== meta.format ||
      (meta.pages ?? 1) !== 1 ||
      !meta.width ||
      !meta.height ||
      Math.min(meta.width, meta.height) < 128
    )
      throw new Error();
    // 自动纠正方向；默认不保留 EXIF/GPS/ICC 等 metadata。原照片不落盘。
    return await decoder
      .rotate()
      .resize(AVATAR.selfieMaxSize, AVATAR.selfieMaxSize, {
        fit: "inside",
        withoutEnlargement: true,
      })
      .flatten({ background: "#fff4df" })
      .jpeg({ quality: 85 })
      .toBuffer();
  } catch {
    throw new AvatarInvalidPhotoError();
  }
}
export async function normalizeCandidate(bytes: Buffer): Promise<Buffer> {
  try {
    if (!bytes.length || bytes.length > 12 * 1024 * 1024) throw new Error();
    const decoder = sharp(bytes, {
      limitInputPixels: 2_000_000,
      failOn: "warning",
    });
    const meta = await decoder.metadata();
    if (
      !["png", "jpeg"].includes(meta.format ?? "") ||
      meta.width !== AVATAR.generationSize ||
      meta.height !== AVATAR.generationSize ||
      (meta.pages ?? 1) !== 1
    )
      throw new Error();
    const { data, info } = await decoder
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    const matte = removeUniformBackground(data, info.width, info.height);
    // 去背景后再缩至显示尺寸，保留细发丝/眼镜/表情；不靠64px重采样伪造画风。
    return await sharp(matte.data, { raw: info })
      .resize(AVATAR.outputSize, AVATAR.outputSize, { kernel: "lanczos3" })
      .png()
      .toBuffer();
  } catch (error) {
    if (error instanceof AvatarPipelineError) throw error;
    throw new AvatarPipelineError("AVATAR_IMAGE_NORMALIZE_FAILED");
  }
}

// 保存模型生成的高分辨率源图（不是上传自拍），去除元数据并统一为无损 PNG。
export async function normalizeGeneratedSource(bytes: Buffer): Promise<Buffer> {
  try {
    if (!bytes.length || bytes.length > 12 * 1024 * 1024) throw new Error();
    const decoder = sharp(bytes, {
      limitInputPixels: 2_000_000,
      failOn: "warning",
    });
    const meta = await decoder.metadata();
    if (
      !["png", "jpeg"].includes(meta.format ?? "") ||
      meta.width !== AVATAR.generationSize ||
      meta.height !== AVATAR.generationSize ||
      (meta.pages ?? 1) !== 1
    )
      throw new Error();
    return await decoder.png().toBuffer();
  } catch (error) {
    if (error instanceof AvatarPipelineError) throw error;
    throw new AvatarPipelineError("AVATAR_IMAGE_NORMALIZE_FAILED");
  }
}
