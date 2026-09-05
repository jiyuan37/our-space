import { prisma } from "@/lib/db/prisma";
import { AVATAR } from "@/lib/avatar/config";
import { AvatarUnavailableError } from "@/server/errors/domain-error";
import { AvatarService } from "@/server/services/avatar-service";
import { LocalAvatarStorage } from "@/server/avatar/storage";
import { CloudflareAvatarProvider } from "@/server/avatar/provider";
import { FixtureAvatarProvider } from "@/server/avatar/test-provider";
export function avatarTestMode() {
  // 自动测试显式隔离；生产永远不能选固定图片 provider。
  return (
    process.env.NODE_ENV === "development" &&
    process.env.AVATAR_E2E_FIXTURE === "true" &&
    Boolean(process.env.TEST_DATABASE_URL) &&
    process.env.DATABASE_URL === process.env.TEST_DATABASE_URL &&
    /_test(?:\?|$)/.test(new URL(process.env.TEST_DATABASE_URL!).pathname)
  );
}
export function avatarEnabled() {
  if (avatarTestMode()) return true;
  return (
    process.env.AVATAR_EXTERNAL_REQUESTS_ENABLED === "true" &&
    process.env.AVATAR_EXTERNAL_PROCESSING_APPROVED === AVATAR.policyVersion &&
    process.env.CLOUDFLARE_WORKERS_PLAN === "free" &&
    Boolean(process.env.CLOUDFLARE_API_TOKEN) &&
    /^[a-f0-9]{32}$/i.test(process.env.CLOUDFLARE_ACCOUNT_ID ?? "") &&
    ["cloudflare-flux-klein"].includes(process.env.AVATAR_PROVIDER ?? "")
  );
}
export function avatarService(generating = false) {
  if (generating && !avatarEnabled()) throw new AvatarUnavailableError();
  const provider = avatarTestMode()
    ? new FixtureAvatarProvider()
    : new CloudflareAvatarProvider("cloudflare-flux-klein");
  return new AvatarService(
    prisma,
    new LocalAvatarStorage(),
    generating ? provider : undefined,
  );
}
