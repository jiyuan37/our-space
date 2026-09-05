import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { HomeService } from "@/server/services/home-service";
import { NotSpaceResidentError } from "@/server/errors/domain-error";
import {
  avatarEnabled,
  avatarService,
  avatarTestMode,
} from "@/server/avatar/runtime";
import { AppShell } from "@/components/layout/app-shell";
import { HomeHeader } from "@/components/home/home-header";
import { AvatarWizard } from "@/components/avatar/avatar-wizard";
export default async function AvatarPage() {
  const session = await requireSession().catch(() =>
    redirect("/login?callbackUrl=/avatar"),
  );
  const home = await new HomeService(prisma)
    .get(session.user.userId)
    .catch((error) => {
      if (error instanceof NotSpaceResidentError) redirect("/space");
      throw error;
    });
  const resident = home.residents.find((r) => r.isViewer)!;
  const job = await avatarService().latestOwn(session.user.userId);
  return (
    <AppShell header={<HomeHeader viewerName={resident.displayName} />}>
      <AvatarWizard
        currentUrl={resident.avatarUrl}
        initialJob={job}
        enabled={avatarEnabled()}
        testMode={avatarTestMode()}
      />
    </AppShell>
  );
}
