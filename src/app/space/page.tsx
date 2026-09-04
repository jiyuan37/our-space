import Link from "next/link";
import { redirect } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import {
  CreateSpaceForm,
  InvitationForm,
  LogoutButton,
} from "@/components/space/space-actions";
import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { SpaceService } from "@/server/services/space-service";
import { getServerI18n } from "@/lib/i18n/server";

export default async function SpacePage() {
  const session = await requireSession().catch(() => redirect("/login"));
  const current = await new SpaceService(prisma).current(session.user.userId);
  const { t } = await getServerI18n();
  return (
    <AppShell>
      <section className="foundation-card">
        {current ? (
          <>
            <p className="eyebrow">{t("space.managementEyebrow")}</p>
            <h1>{t("space.managementTitle")}</h1>
            <p>{t("space.managementCopy")}</p>
            <p>
              <Link href="/home">{t("space.homeLink")}</Link>
            </p>
            {current.role === "OWNER" && <InvitationForm />}
          </>
        ) : (
          <>
            <h1>{t("space.createTitle")}</h1>
            <p>{t("space.createCopy")}</p>
            <CreateSpaceForm />
          </>
        )}
        <LogoutButton />
      </section>
    </AppShell>
  );
}
