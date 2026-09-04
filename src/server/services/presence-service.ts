import { normalizePresenceText } from "@/lib/validation/presence";
import { ResidentService } from "@/server/services/resident-service";
import type { DatabaseClient } from "@/server/services/service-context";

export class PresenceService {
  constructor(private readonly db: DatabaseClient) {}

  async updateOwn(userId: string, value: unknown) {
    const resident = await new ResidentService(this.db).requireActive(userId);
    const shortText = normalizePresenceText(value);
    if (shortText === null) {
      await this.db.presence.deleteMany({ where: { residentId: resident.id } });
      return { cleared: true } as const;
    }

    return this.db.presence.upsert({
      where: { residentId: resident.id },
      create: { residentId: resident.id, shortText },
      update: { shortText },
      select: { id: true, residentId: true, shortText: true, updatedAt: true },
    });
  }

  async clearOwn(userId: string): Promise<{ cleared: true }> {
    const resident = await new ResidentService(this.db).requireActive(userId);
    await this.db.presence.deleteMany({ where: { residentId: resident.id } });
    return { cleared: true };
  }
}
