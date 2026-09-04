import { Prisma, type PrismaClient } from "@prisma/client";

import { ActiveSpaceAlreadyExistsError } from "@/server/errors/domain-error";

export class SpaceService {
  constructor(private readonly db: PrismaClient) {}

  async current(userId: string) {
    return this.db.resident.findFirst({
      where: { userId, status: "ACTIVE", space: { status: "ACTIVE" } },
      select: {
        id: true,
        role: true,
        displayName: true,
        space: { select: { id: true, name: true } },
      },
    });
  }

  async create(input: { userId: string; name: string; displayName: string }) {
    return this.db.$transaction(async (tx) => {
      if (
        await tx.resident.findFirst({
          where: { userId: input.userId, status: "ACTIVE" },
        })
      ) {
        throw new ActiveSpaceAlreadyExistsError();
      }
      const space = await tx.space.create({
        data: { name: input.name.trim(), createdByUserId: input.userId },
        select: { id: true, name: true, status: true },
      });
      try {
        const resident = await tx.resident.create({
          data: {
            spaceId: space.id,
            userId: input.userId,
            displayName: input.displayName.trim(),
            role: "OWNER",
          },
          select: { id: true, displayName: true, role: true },
        });
        return { space, resident };
      } catch (error) {
        if (isActiveResidentUniqueConflict(error)) {
          throw new ActiveSpaceAlreadyExistsError();
        }
        throw error;
      }
    });
  }
}

function isActiveResidentUniqueConflict(error: unknown): boolean {
  if (
    !(error instanceof Prisma.PrismaClientKnownRequestError) ||
    error.code !== "P2002"
  ) {
    return false;
  }

  const target = error.meta?.target;
  const fields = Array.isArray(target)
    ? target.map(String)
    : typeof target === "string"
      ? [target]
      : [];
  return fields.some(
    (field) =>
      field === "userId" ||
      field.includes("Resident_one_active_space_per_user_key"),
  );
}
