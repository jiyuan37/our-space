"use server";

import { revalidatePath } from "next/cache";

import { requireSession } from "@/lib/auth/session";
import type { UiErrorCode } from "@/lib/i18n/errors";
import { prisma } from "@/lib/db/prisma";
import { DomainError } from "@/server/errors/domain-error";
import { PresenceService } from "@/server/services/presence-service";

export type PresenceActionState = Readonly<{
  status?: "saved" | "cleared";
  errorCode?: UiErrorCode;
}>;

export async function updatePresenceAction(
  _: PresenceActionState,
  data: FormData,
): Promise<PresenceActionState> {
  try {
    const session = await requireSession();
    const service = new PresenceService(prisma);
    if (data.get("intent") === "clear") {
      await service.clearOwn(session.user.userId);
      revalidatePath("/home");
      return { status: "cleared" };
    }

    const shortText = data.get("shortText");
    const result = await service.updateOwn(session.user.userId, shortText);
    revalidatePath("/home");
    return { status: "cleared" in result ? "cleared" : "saved" };
  } catch (error) {
    if (error instanceof DomainError) {
      return { errorCode: error.code as UiErrorCode };
    }
    return { errorCode: "UNEXPECTED_ERROR" };
  }
}
