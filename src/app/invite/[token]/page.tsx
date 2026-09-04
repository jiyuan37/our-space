import Link from "next/link";
import { getServerSession } from "next-auth";
import { headers } from "next/headers";

import { AppShell } from "@/components/layout/app-shell";
import { AcceptInvitationForm } from "@/components/invitation/accept-form";
import { authOptions } from "@/lib/auth/auth-options";
import { prisma } from "@/lib/db/prisma";
import { DomainError } from "@/server/errors/domain-error";
import { InvitationService } from "@/server/services/invitation-service";
import { getClientIp } from "@/lib/http/client-ip";
import { rateLimiter } from "@/server/rate-limit/default-limiter";
import { enforceInvitationPreviewRateLimit } from "@/server/rate-limit/rate-limiter";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const session = await getServerSession(authOptions);
  try {
    const ip = getClientIp(await headers());
    await enforceInvitationPreviewRateLimit(rateLimiter, ip);
    const preview = await new InvitationService(prisma).preview(token);
    return (
      <AppShell>
        <section className="foundation-card">
          <p className="eyebrow">{preview.spaceName}</p>
          <h1>Welcome Home</h1>
          <p>{preview.inviterDisplayName} 邀请你来到这个 Space。</p>
          {preview.acceptable ? (
            session ? (
              <AcceptInvitationForm token={token} />
            ) : (
              <p>
                <Link
                  href={`/login?callbackUrl=/invite/${encodeURIComponent(token)}`}
                >
                  登录后接受
                </Link>{" "}
                ·{" "}
                <Link
                  href={`/register?callbackUrl=/invite/${encodeURIComponent(token)}`}
                >
                  注册
                </Link>
              </p>
            )
          ) : (
            <p role="status">这份邀请现在无法接受。</p>
          )}
        </section>
      </AppShell>
    );
  } catch (error) {
    return (
      <AppShell>
        <section className="foundation-card">
          <h1>邀请暂时无法打开</h1>
          <p role="alert">
            {error instanceof DomainError ? error.message : "请稍后再试。"}
          </p>
        </section>
      </AppShell>
    );
  }
}
