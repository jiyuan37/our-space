// 模型、费用边界与资源版本集中定义；变更外部处理范围须重新批准。
export const AVATAR = {
  policyVersion: "avatar-cloudflare-v1",
  styleVersion: "pixel-big-head-b6fe15a-v1",
  sdxlModel: "@cf/bytedance/stable-diffusion-xl-lightning",
  fluxModel: "@cf/black-forest-labs/flux-2-klein-4b",
  sdxlSteps: 4,
  sdxlStrength: 0.65,
  sdxlGuidance: 7.5,
  candidates: 1,
  generationSize: 1024,
  selfieMaxSize: 1024,
  fluxInputSize: 480,
  maxUploadBytes: 5 * 1024 * 1024,
  maxBodyBytes: 6 * 1024 * 1024,
  maxInputPixels: 20_000_000,
  logicalSize: 64,
  outputSize: 256,
  candidateTtlMs: 24 * 60 * 60_000,
  pendingTtlMs: 4 * 60_000,
  providerTimeoutMs: 150_000,
  userDailyLimit: 3,
  globalDailyLimit: 20,
} as const;
export type AvatarJobView = {
  id: string;
  status: "PENDING" | "READY" | "CONFIRMED" | "CANCELLED" | "FAILED";
  candidateUrl: string | null;
  expiresAt: string;
};
