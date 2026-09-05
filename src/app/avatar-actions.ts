"use server";
import { revalidatePath } from "next/cache";
import { ZodError } from "zod";
import { requireSession } from "@/lib/auth/session";
import type { UiErrorCode } from "@/lib/i18n/errors";
import { DomainError } from "@/server/errors/domain-error";
import { avatarService } from "@/server/avatar/runtime";
import { rateLimiter } from "@/server/rate-limit/default-limiter";
import {
  enforceRateLimit,
  privateBucket,
} from "@/server/rate-limit/rate-limiter";
export async function avatarAction(
  intent: "confirm" | "cancel",
  id: string,
): Promise<{ ok?: true; errorCode?: UiErrorCode }> {
  try {
    const session = await requireSession();
    await enforceRateLimit(rateLimiter, {
      key: privateBucket("avatar-edit", session.user.userId),
      limit: 30,
      windowMs: 60_000,
    });
    if (intent === "confirm")
      await avatarService().confirmOwn(session.user.userId, id);
    else if (intent === "cancel")
      await avatarService().cancelOwn(session.user.userId, id);
    else return { errorCode: "INVALID_INPUT" };
    revalidatePath("/home");
    revalidatePath("/avatar");
    return { ok: true };
  } catch (error) {
    return {
      errorCode:
        error instanceof DomainError
          ? error.code
          : error instanceof ZodError
            ? "INVALID_INPUT"
            : "UNEXPECTED_ERROR",
    };
  }
}
