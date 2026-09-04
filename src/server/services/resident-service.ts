import type { ResidentRole } from "@prisma/client";

import {
  NotSpaceResidentError,
  OwnerPermissionRequiredError,
  SpaceFullError,
} from "@/server/errors/domain-error";
import type { DatabaseClient } from "@/server/services/service-context";

export class ResidentService {
  constructor(private readonly db: DatabaseClient) {}

  async requireActive(userId: string, spaceId?: string) {
    const resident = await this.db.resident.findFirst({
      where: {
        userId,
        status: "ACTIVE",
        space: { status: "ACTIVE" },
        ...(spaceId ? { spaceId } : {}),
      },
      select: {
        id: true,
        spaceId: true,
        userId: true,
        displayName: true,
        role: true,
      },
    });
    if (!resident) throw new NotSpaceResidentError();
    return resident;
  }

  async requireRole(userId: string, spaceId: string, role: ResidentRole) {
    const resident = await this.requireActive(userId, spaceId);
    if (resident.role !== role) throw new OwnerPermissionRequiredError();
    return resident;
  }

  async assertCapacity(spaceId: string): Promise<void> {
    if (
      (await this.db.resident.count({
        where: { spaceId, status: "ACTIVE" },
      })) >= 2
    ) {
      throw new SpaceFullError();
    }
  }
}
