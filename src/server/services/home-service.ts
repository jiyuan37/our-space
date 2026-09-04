import { NotSpaceResidentError } from "@/server/errors/domain-error";
import type { DatabaseClient } from "@/server/services/service-context";

export type HomeViewModel = Readonly<{
  space: Readonly<{ id: string; name: string }>;
  residents: ReadonlyArray<
    Readonly<{
      id: string;
      displayName: string;
      avatarUrl: string | null;
      isViewer: boolean;
      presence: Readonly<{
        shortText: string;
        updatedAt: string;
      }> | null;
    }>
  >;
}>;

export class HomeService {
  constructor(private readonly db: DatabaseClient) {}

  async get(userId: string): Promise<HomeViewModel> {
    const viewer = await this.db.resident.findFirst({
      where: {
        userId,
        status: "ACTIVE",
        space: { status: "ACTIVE" },
      },
      select: {
        id: true,
        space: {
          select: {
            id: true,
            name: true,
            residents: {
              where: { status: "ACTIVE" },
              orderBy: [{ joinedAt: "asc" }, { id: "asc" }],
              take: 2,
              select: {
                id: true,
                displayName: true,
                avatarUrl: true,
                presence: {
                  select: { shortText: true, updatedAt: true },
                },
              },
            },
          },
        },
      },
    });
    if (!viewer) throw new NotSpaceResidentError();

    return {
      space: { id: viewer.space.id, name: viewer.space.name },
      residents: viewer.space.residents.map((resident) => ({
        id: resident.id,
        displayName: resident.displayName,
        avatarUrl: resident.avatarUrl,
        isViewer: resident.id === viewer.id,
        presence: resident.presence?.shortText?.trim()
          ? {
              shortText: resident.presence.shortText.trim(),
              updatedAt: resident.presence.updatedAt.toISOString(),
            }
          : null,
      })),
    };
  }
}
