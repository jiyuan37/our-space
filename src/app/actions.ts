"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { z } from "zod";

import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { DomainError } from "@/server/errors/domain-error";
import { AuthService } from "@/server/services/auth-service";
import { InvitationService } from "@/server/services/invitation-service";
import { SpaceService } from "@/server/services/space-service";
import { getClientIp } from "@/lib/http/client-ip";
import { rateLimiter } from "@/server/rate-limit/default-limiter";
import {
  enforceRateLimit,
  privateBucket,
} from "@/server/rate-limit/rate-limiter";

export type ActionState = {
  error?: string;
  invitationUrl?: string;
  invitationId?: string;
};
const userSchema = z.object({
  name: z.string().trim().min(1).max(80),
  email: z.string(),
  password: z.string(),
});

function calm(error: unknown): ActionState {
  if (error instanceof DomainError) return { error: error.message };
  if (error instanceof z.ZodError)
    return { error: error.issues[0]?.message ?? "请检查填写的内容。" };
  return { error: "暂时无法完成，请稍后再试。" };
}

export async function registerAction(
  _: ActionState,
  data: FormData,
): Promise<ActionState> {
  try {
    const ip = getClientIp(await headers());
    await enforceRateLimit(rateLimiter, {
      key: privateBucket("register-ip", ip),
      limit: 5,
      windowMs: 60 * 60_000,
    });
    const input = userSchema.parse(Object.fromEntries(data));
    await new AuthService(prisma).register(input);
  } catch (error) {
    return calm(error);
  }
  redirect("/login?registered=1");
}

export async function createSpaceAction(
  _: ActionState,
  data: FormData,
): Promise<ActionState> {
  try {
    const session = await requireSession();
    await enforceRateLimit(rateLimiter, {
      key: privateBucket("invite-user", session.user.userId),
      limit: 10,
      windowMs: 60 * 60_000,
    });
    const input = z
      .object({ name: z.string().trim().min(1).max(80) })
      .parse(Object.fromEntries(data));
    await new SpaceService(prisma).create({
      userId: session.user.userId,
      name: input.name,
      displayName: session.user.name,
    });
    revalidatePath("/space");
    return {};
  } catch (error) {
    return calm(error);
  }
}

export async function createInvitationAction(
  _: ActionState,
  data: FormData,
): Promise<ActionState> {
  try {
    const session = await requireSession();
    const ip = getClientIp(await headers());
    await enforceRateLimit(rateLimiter, {
      key: privateBucket("invite-accept-ip", ip),
      limit: 30,
      windowMs: 15 * 60_000,
    });
    const email = z
      .string()
      .trim()
      .optional()
      .parse(data.get("email")?.toString());
    const result = await new InvitationService(prisma).create({
      userId: session.user.userId,
      email: email || undefined,
    });
    return {
      invitationUrl: `${process.env.APP_URL}/invite/${result.token}`,
      invitationId: result.id,
    };
  } catch (error) {
    return calm(error);
  }
}

export async function revokeInvitationAction(data: FormData): Promise<void> {
  const session = await requireSession();
  const invitationId = z.string().min(1).parse(data.get("invitationId"));
  await new InvitationService(prisma).revoke(session.user.userId, invitationId);
  revalidatePath("/space");
}

export async function acceptInvitationAction(
  _: ActionState,
  data: FormData,
): Promise<ActionState> {
  try {
    const session = await requireSession();
    const token = z.string().min(1).parse(data.get("token"));
    await new InvitationService(prisma).accept({
      userId: session.user.userId,
      token,
      email: session.user.email,
      displayName: session.user.name,
    });
  } catch (error) {
    return calm(error);
  }
  redirect("/space?joined=1");
}
