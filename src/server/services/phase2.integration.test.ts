import { PrismaClient } from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { AuthService } from "@/server/services/auth-service";
import { InvitationService } from "@/server/services/invitation-service";
import { SpaceService } from "@/server/services/space-service";

const databaseUrl = process.env.TEST_DATABASE_URL;
const suite = databaseUrl ? describe : describe.skip;
const db = new PrismaClient({ datasources: { db: { url: databaseUrl } } });

suite.sequential("Phase 2 PostgreSQL integration", () => {
  beforeAll(async () => {
    await db.invitation.deleteMany();
    await db.resident.deleteMany();
    await db.space.deleteMany();
    await db.user.deleteMany();
  });
  afterAll(() => db.$disconnect());

  it("注册、原子创建 Space/OWNER，并安全接受第二名 Resident", async () => {
    const auth = new AuthService(db);
    const owner = await auth.register({
      email: " Owner@Example.com ",
      password: "owner-local-fake-password-安全",
      name: "Yuan",
    });
    const guest = await auth.register({
      email: "guest@example.com",
      password: "guest-local-fake-password-安全",
      name: "Lin",
    });
    await expect(
      auth.verifyCredentials({
        email: "OWNER@example.com",
        password: "owner-local-fake-password-安全",
      }),
    ).resolves.toEqual(owner);

    const created = await new SpaceService(db).create({
      userId: owner.id,
      name: "Our Quiet Place",
      displayName: owner.name,
    });
    expect(created.resident.role).toBe("OWNER");

    const invitation = await new InvitationService(db).create({
      userId: owner.id,
      email: guest.email,
    });
    const stored = await db.invitation.findUniqueOrThrow({
      where: { id: invitation.id },
    });
    expect(stored.tokenHash).not.toBe(invitation.token);

    await new InvitationService(db).accept({
      userId: guest.id,
      token: invitation.token,
      email: guest.email,
      displayName: guest.name,
    });
    expect(
      await db.resident.count({
        where: { spaceId: created.space.id, status: "ACTIVE" },
      }),
    ).toBe(2);
    expect(
      await db.invitation.findUniqueOrThrow({
        where: { id: invitation.id },
        select: { status: true, acceptedAt: true },
      }),
    ).toMatchObject({ status: "ACCEPTED", acceptedAt: expect.any(Date) });
  });

  it("并发接受不能创建第三名 ACTIVE Resident", async () => {
    const auth = new AuthService(db);
    const owner = await auth.register({
      email: "concurrent-owner@example.com",
      password: "owner-concurrency-fake-安全密码",
      name: "Owner",
    });
    const first = await auth.register({
      email: "first@example.com",
      password: "first-concurrency-fake-安全密码",
      name: "First",
    });
    const second = await auth.register({
      email: "second@example.com",
      password: "second-concurrency-fake-安全密码",
      name: "Second",
    });
    const created = await new SpaceService(db).create({
      userId: owner.id,
      name: "Concurrent Home",
      displayName: owner.name,
    });
    const invitation = await new InvitationService(db).create({
      userId: owner.id,
    });
    const results = await Promise.allSettled(
      [first, second].map((user) =>
        new InvitationService(db).accept({
          userId: user.id,
          token: invitation.token,
          email: user.email,
          displayName: user.name,
        }),
      ),
    );
    expect(
      results.filter((result) => result.status === "fulfilled"),
    ).toHaveLength(1);
    expect(
      await db.resident.count({
        where: { spaceId: created.space.id, status: "ACTIVE" },
      }),
    ).toBe(2);
  });
});
