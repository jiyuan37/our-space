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
import { getServerI18n } from "@/lib/i18n/server";
import { errorMessageKey } from "@/lib/i18n/errors";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const session = await getServerSession(authOptions);
  const { t } = await getServerI18n();
  try {
    const ip = getClientIp(await headers());
    await enforceInvitationPreviewRateLimit(rateLimiter, ip);
    const preview = await new InvitationService(prisma).preview(token);
    return (
      <AppShell>
        <section className="foundation-card">
          <p className="eyebrow">{preview.spaceName}</p>
          <h1>{t("invitation.title")}</h1>
          <p>
            {t("invitation.copy", {
              name:
                preview.inviterDisplayName ?? t("invitation.fallbackInviter"),
            })}
          </p>
          {preview.acceptable ? (
            session ? (
              <AcceptInvitationForm token={token} />
            ) : (
              <p>
                <Link
                  href={`/login?callbackUrl=/invite/${encodeURIComponent(token)}`}
                >
                  {t("invitation.login")}
                </Link>{" "}
                ·{" "}
                <Link
                  href={`/register?callbackUrl=/invite/${encodeURIComponent(token)}`}
                >
                  {t("invitation.register")}
                </Link>
              </p>
            )
          ) : (
            <p role="status">{t("invitation.unavailable")}</p>
          )}
        </section>
      </AppShell>
    );
  } catch (error) {
    return (
      <AppShell>
        <section className="foundation-card">
          <h1>{t("invitation.openError")}</h1>
          <p role="alert">
            {t(
              errorMessageKey(
                error instanceof DomainError ? error.code : "UNEXPECTED_ERROR",
              ),
            )}
          </p>
        </section>
      </AppShell>
    );
  }
}
