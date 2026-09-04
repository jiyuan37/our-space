import { Prisma, type PrismaClient } from "@prisma/client";

import {
  generateInvitationToken,
  hashInvitationToken,
} from "@/lib/auth/invitation-token";
import { normalizeEmail } from "@/lib/validation/email";
import {
  ActiveResidentConflictError,
  InvitationAlreadyUsedError,
  InvitationEmailMismatchError,
  InvitationExpiredError,
  InvitationNotFoundError,
  InvitationRevokedError,
  SpaceInactiveError,
  TransactionConflictError,
} from "@/server/errors/domain-error";
import { ResidentService } from "@/server/services/resident-service";

const DAYS_7 = 7 * 24 * 60 * 60 * 1000;

function isRetryable(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2034"
  );
}

export class InvitationService {
  constructor(private readonly db: PrismaClient) {}

  async create(input: { userId: string; email?: string }) {
    const owner = await new ResidentService(this.db).requireActive(
      input.userId,
    );
    if (owner.role !== "OWNER") {
      await new ResidentService(this.db).requireRole(
        input.userId,
        owner.spaceId,
        "OWNER",
      );
    }
    const token = generateInvitationToken();
    const tokenHash = hashInvitationToken(token);
    const invitation = await this.db.$transaction(async (tx) => {
      await tx.invitation.updateMany({
        where: { spaceId: owner.spaceId, status: "PENDING" },
        data: { status: "REVOKED" },
      });
      return tx.invitation.create({
        data: {
          spaceId: owner.spaceId,
          tokenHash,
          email: input.email ? normalizeEmail(input.email) : null,
          expiresAt: new Date(Date.now() + DAYS_7),
        },
        select: { id: true, expiresAt: true },
      });
    });
    return { ...invitation, token };
  }

  private async find(token: string) {
    const invitation = await this.db.invitation.findUnique({
      where: { tokenHash: hashInvitationToken(token) },
      include: {
        space: {
          select: {
            id: true,
            name: true,
            status: true,
            residents: {
              where: { role: "OWNER", status: "ACTIVE" },
              select: { displayName: true },
              take: 1,
            },
          },
        },
      },
    });
    if (!invitation) throw new InvitationNotFoundError();
    return invitation;
  }

  async preview(token: string) {
    const invitation = await this.find(token);
    if (invitation.status === "PENDING" && invitation.expiresAt <= new Date()) {
      await this.db.invitation.update({
        where: { id: invitation.id },
        data: { status: "EXPIRED" },
      });
      return {
        spaceName: invitation.space.name,
        inviterDisplayName: invitation.space.residents[0]?.displayName ?? null,
        acceptable: false,
      };
    }
    return {
      spaceName: invitation.space.name,
      inviterDisplayName: invitation.space.residents[0]?.displayName ?? null,
      acceptable:
        invitation.status === "PENDING" && invitation.space.status === "ACTIVE",
    };
  }

  async revoke(userId: string, invitationId: string): Promise<void> {
    const invitation = await this.db.invitation.findUnique({
      where: { id: invitationId },
      select: { spaceId: true },
    });
    if (!invitation) throw new InvitationNotFoundError();
    await new ResidentService(this.db).requireRole(
      userId,
      invitation.spaceId,
      "OWNER",
    );
    await this.db.invitation.updateMany({
      where: { id: invitationId, status: "PENDING" },
      data: { status: "REVOKED" },
    });
  }

  async accept(input: {
    userId: string;
    token: string;
    email: string;
    displayName: string;
  }) {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        return await this.db.$transaction(
          async (tx) => {
            const invitation = await tx.invitation.findUnique({
              where: { tokenHash: hashInvitationToken(input.token) },
              include: { space: { select: { id: true, status: true } } },
            });
            if (!invitation) throw new InvitationNotFoundError();
            if (invitation.status === "REVOKED")
              throw new InvitationRevokedError();
            if (invitation.status === "ACCEPTED")
              throw new InvitationAlreadyUsedError();
            if (
              invitation.status === "EXPIRED" ||
              invitation.expiresAt <= new Date()
            ) {
              if (invitation.status === "PENDING")
                await tx.invitation.update({
                  where: { id: invitation.id },
                  data: { status: "EXPIRED" },
                });
              throw new InvitationExpiredError();
            }
            if (invitation.space.status !== "ACTIVE")
              throw new SpaceInactiveError();
            if (
              invitation.email &&
              invitation.email !== normalizeEmail(input.email)
            )
              throw new InvitationEmailMismatchError();
            if (
              await tx.resident.findFirst({
                where: { userId: input.userId, status: "ACTIVE" },
              })
            )
              throw new ActiveResidentConflictError();
            await new ResidentService(tx).assertCapacity(invitation.spaceId);
            const resident = await tx.resident.create({
              data: {
                spaceId: invitation.spaceId,
                userId: input.userId,
                displayName: input.displayName.trim(),
                role: "RESIDENT",
              },
              select: {
                id: true,
                spaceId: true,
                displayName: true,
                role: true,
              },
            });
            await tx.invitation.update({
              where: { id: invitation.id },
              data: { status: "ACCEPTED", acceptedAt: new Date() },
            });
            return resident;
          },
          { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
        );
      } catch (error) {
        if (isRetryable(error) && attempt < 2) continue;
        if (isRetryable(error)) throw new TransactionConflictError();
        throw error;
      }
    }
    throw new TransactionConflictError();
  }
}
