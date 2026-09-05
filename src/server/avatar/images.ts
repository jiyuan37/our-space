import sharp from "sharp";
import { AVATAR } from "@/lib/avatar/config";
import {
  AvatarInvalidPhotoError,
  AvatarGenerationFailedError,
} from "@/server/errors/domain-error";

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
      .resize(AVATAR.logicalSize, AVATAR.logicalSize, { kernel: "nearest" })
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    const queue: number[] = [];
    const seen = new Set<number>();
    const edge = AVATAR.logicalSize;
    for (let i = 0; i < edge; i++)
      queue.push(i, (edge - 1) * edge + i, i * edge, i * edge + edge - 1);
    while (queue.length) {
      const p = queue.pop()!;
      if (seen.has(p)) continue;
      seen.add(p);
      const i = p * 4;
      if (
        !(
          data[i + 3] < 128 ||
          (data[i] > 170 &&
            data[i + 2] > 140 &&
            data[i + 1] < 135 &&
            data[i] - data[i + 1] > 75 &&
            data[i + 2] - data[i + 1] > 65)
        )
      )
        continue;
      data[i + 3] = 0;
      const x = p % edge,
        y = Math.floor(p / edge);
      if (x > 0) queue.push(p - 1);
      if (x < edge - 1) queue.push(p + 1);
      if (y > 0) queue.push(p - edge);
      if (y < edge - 1) queue.push(p + edge);
    }
    let visible = 0,
      borderClear = 0,
      border = 0;
    for (let y = 0; y < info.height; y++)
      for (let x = 0; x < info.width; x++) {
        const i = (y * info.width + x) * 4 + 3;
        data[i] = data[i] < 128 ? 0 : 255;
        if (data[i]) visible++;
        if (x < 2 || y < 2 || x >= info.width - 2 || y >= info.height - 2) {
          border++;
          if (!data[i]) borderClear++;
        }
      }
    if (visible < 400 || visible > 3700 || borderClear / border < 0.8)
      throw new Error();
    // 透明阶梯轮廓与 64px 逻辑栅格；不声称可自动分层或绑定骨骼。
    return await sharp(data, { raw: info })
      .resize(AVATAR.outputSize, AVATAR.outputSize, { kernel: "nearest" })
      .png({ palette: true, colours: 64, dither: 0 })
      .toBuffer();
  } catch {
    throw new AvatarGenerationFailedError();
  }
}
