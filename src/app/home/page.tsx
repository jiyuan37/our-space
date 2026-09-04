import { redirect } from "next/navigation";

import { HomeHeader } from "@/components/home/home-header";
import { HomeView } from "@/components/home/home-view";
import { AppShell } from "@/components/layout/app-shell";
import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { NotSpaceResidentError } from "@/server/errors/domain-error";
import {
  HomeService,
  type HomeViewModel,
} from "@/server/services/home-service";

export default async function HomePage({
  searchParams,
}: Readonly<{
  searchParams: Promise<{ created?: string; joined?: string }>;
}>) {
  const session = await requireSession().catch(() => redirect("/login"));
  let home: HomeViewModel;
  try {
    home = await new HomeService(prisma).get(session.user.userId);
  } catch (error) {
    if (error instanceof NotSpaceResidentError) redirect("/space");
    throw error;
  }
  const params = await searchParams;
  const viewerName =
    home.residents.find((resident) => resident.isViewer)?.displayName ??
    session.user.name;

  return (
    <AppShell home header={<HomeHeader viewerName={viewerName} />}>
      <HomeView
        home={home}
        showWelcome={params.created === "1" || params.joined === "1"}
      />
    </AppShell>
  );
}
