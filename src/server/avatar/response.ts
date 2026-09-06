import sharp from "sharp";
import { AVATAR } from "@/lib/avatar/config";
import { AvatarPipelineError } from "./pipeline-error";
export type AvatarImageMime = "image/png" | "image/jpeg";
export function imageMime(bytes: Buffer): AvatarImageMime {
  if (
    bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
  )
    return "image/png";
  if (bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255)
    return "image/jpeg";
  throw new AvatarPipelineError("PROVIDER_IMAGE_DECODE_FAILED");
}
function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function base64Image(value: string): Buffer {
  // Buffer.from(base64) 会忽略非法字符，不能用它替代严格格式验证。
  if (
    !value.length ||
    value.length > Math.ceil(AVATAR.maxProviderImageBytes / 3) * 4 ||
    value.length % 4 !== 0 ||
    !/^[A-Za-z0-9+/]+={0,2}$/.test(value)
  )
    throw new AvatarPipelineError("PROVIDER_RESPONSE_PARSE_FAILED");
  const bytes = Buffer.from(value, "base64");
  if (
    bytes.toString("base64") !== value ||
    bytes.length > AVATAR.maxProviderImageBytes
  )
    throw new AvatarPipelineError("PROVIDER_RESPONSE_PARSE_FAILED");
  return bytes;
}
// 纯解析：无网络、文件、日志或环境变量。FLUX 模型 shape 与 REST envelope 分开。
export function parseCloudflareImageResponse(
  contentType: string | null,
  body: Buffer,
) {
  if (!body.length || body.length > AVATAR.maxProviderResponseBytes)
    throw new AvatarPipelineError("PROVIDER_RESPONSE_PARSE_FAILED");
  const type = (contentType ?? "").split(";")[0].trim().toLowerCase();
  let bytes: Buffer;
  if (type === "application/json" || type.endsWith("+json")) {
    let json: unknown;
    try {
      json = JSON.parse(body.toString("utf8"));
    } catch {
      throw new AvatarPipelineError("PROVIDER_RESPONSE_PARSE_FAILED");
    }
    if (
      !record(json) ||
      json.success === false ||
      (Array.isArray(json.errors) && json.errors.length > 0)
    )
      throw new AvatarPipelineError("PROVIDER_RESPONSE_PARSE_FAILED");
    const output = Object.hasOwn(json, "result") ? json.result : json;
    if (!record(output) || typeof output.image !== "string")
      throw new AvatarPipelineError("PROVIDER_RESPONSE_PARSE_FAILED");
    bytes = base64Image(output.image);
  } else if (
    type === "image/png" ||
    type === "image/jpeg" ||
    type === "application/octet-stream"
  ) {
    bytes = body;
  } else {
    throw new AvatarPipelineError("PROVIDER_RESPONSE_PARSE_FAILED");
  }
  if (bytes.length > AVATAR.maxProviderImageBytes)
    throw new AvatarPipelineError("PROVIDER_IMAGE_DECODE_FAILED");
  // 实际 magic 优先于 HTTP MIME；不能把 JPEG 标成 PNG。
  return { bytes, mimeType: imageMime(bytes) };
}
// 无 I/O 的真实解码验证，magic 正确但被截断的 JPEG/PNG 也必须拒绝。
export async function decodeProviderImage(bytes: Buffer) {
  try {
    if (!bytes.length || bytes.length > AVATAR.maxProviderImageBytes)
      throw new Error();
    const mimeType = imageMime(bytes);
    const decoder = sharp(bytes, {
      limitInputPixels: AVATAR.maxProviderPixels,
      failOn: "warning",
    });
    const metadata = await decoder.metadata();
    if (
      (metadata.pages ?? 1) !== 1 ||
      !metadata.width ||
      !metadata.height ||
      metadata.format !== (mimeType === "image/jpeg" ? "jpeg" : "png")
    )
      throw new Error();
    await decoder.raw().toBuffer();
    return { bytes, mimeType, width: metadata.width, height: metadata.height };
  } catch {
    throw new AvatarPipelineError("PROVIDER_IMAGE_DECODE_FAILED");
  }
}
