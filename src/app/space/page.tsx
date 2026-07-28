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

export default async function SpacePage() {
  const session = await requireSession().catch(() => redirect("/login"));
  const current = await new SpaceService(prisma).current(session.user.userId);
  return (
    <AppShell>
      <section className="foundation-card">
        {current ? (
          <>
            <p className="eyebrow">{current.space.name}</p>
            <h1>You are home</h1>
            <p>Phase 2 已让两个人安全地来到这里。Home 会在下一阶段到来。</p>
            {current.role === "OWNER" && <InvitationForm />}
          </>
        ) : (
          <>
            <h1>Create our space</h1>
            <p>先为这个私密的家取一个名字。</p>
            <CreateSpaceForm />
          </>
        )}
        <LogoutButton />
      </section>
    </AppShell>
  );
}
