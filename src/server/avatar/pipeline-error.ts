import { AvatarGenerationFailedError } from "@/server/errors/domain-error";
export type AvatarFailureStage =
  | "PROVIDER_REQUEST_FAILED"
  | "PROVIDER_RESPONSE_PARSE_FAILED"
  | "PROVIDER_IMAGE_DECODE_FAILED"
  | "PROVIDER_INPUT_PREPROCESS_FAILED"
  | "AVATAR_SOURCE_PERSIST_FAILED"
  | "AVATAR_IMAGE_NORMALIZE_FAILED"
  | "AVATAR_DISPLAY_PERSIST_FAILED"
  | "AVATAR_PROCESSING_INTERRUPTED";
// 用户仍收到稳定领域错误；内部阶段不包含第三方响应、图像、路径或凭据。
export class AvatarPipelineError extends AvatarGenerationFailedError {
  constructor(readonly stage: AvatarFailureStage) {
    super();
  }
}
