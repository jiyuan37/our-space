import { PrismaClient } from "@prisma/client";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { AuthService } from "@/server/services/auth-service";
import { InvitationService } from "@/server/services/invitation-service";
import { HomeService } from "@/server/services/home-service";
import { PresenceService } from "@/server/services/presence-service";
import { SpaceService } from "@/server/services/space-service";
import {
  ActiveResidentConflictError,
  ActiveSpaceAlreadyExistsError,
  EmailAlreadyRegisteredError,
  InvalidCredentialsError,
  InvitationAlreadyUsedError,
  InvitationEmailMismatchError,
  InvitationExpiredError,
  InvitationRevokedError,
  NotSpaceResidentError,
  OwnerPermissionRequiredError,
  SpaceFullError,
  SpaceInactiveError,
} from "@/server/errors/domain-error";

const databaseUrl = process.env.TEST_DATABASE_URL;
const suite = databaseUrl ? describe : describe.skip;
let db: PrismaClient;

const password = "phase-two-integration-fake-password-安全";

async function register(email: string, name = "Resident") {
  return new AuthService(db).register({ email, password, name });
}

async function createOwner(prefix: string) {
  const owner = await register(`${prefix}-owner@example.com`, "Owner");
  const created = await new SpaceService(db).create({
    userId: owner.id,
    name: `${prefix} Home`,
    displayName: owner.name,
  });
  return { owner, created };
}

async function createPair(prefix: string) {
  const ownerHome = await createOwner(prefix);
  const guest = await register(`${prefix}-guest@example.com`, "Guest");
  const invitation = await new InvitationService(db).create({
    userId: ownerHome.owner.id,
    email: guest.email,
  });
  const guestResident = await new InvitationService(db).accept({
    userId: guest.id,
    token: invitation.token,
    email: guest.email,
    displayName: guest.name,
  });
  return { ...ownerHome, guest, guestResident };
}

async function resetDatabase() {
  await db.presence.deleteMany();
  await db.invitation.deleteMany();
  await db.resident.deleteMany();
  await db.space.deleteMany();
  await db.user.deleteMany();
}

suite.sequential("Phase 2/3 PostgreSQL integration", () => {
  beforeAll(() => {
    db = new PrismaClient({ datasources: { db: { url: databaseUrl! } } });
  });
  beforeEach(resetDatabase);
  afterAll(async () => {
    await db?.$disconnect();
  });

  it("注册、规范化、重复邮箱和凭据错误行为正确", async () => {
    const auth = new AuthService(db);
    const user = await auth.register({
      email: " User@Example.com ",
      password,
      name: "Yuan",
    });
    expect(user.email).toBe("user@example.com");
    await expect(
      auth.register({ email: "USER@example.com", password, name: "Other" }),
    ).rejects.toBeInstanceOf(EmailAlreadyRegisteredError);
    await expect(
      auth.verifyCredentials({ email: " USER@example.com ", password }),
    ).resolves.toEqual(user);
    await expect(
      auth.verifyCredentials({
        email: user.email,
        password: "wrong-password-value-long-enough",
      }),
    ).rejects.toBeInstanceOf(InvalidCredentialsError);
    await expect(
      auth.verifyCredentials({ email: "missing@example.com", password }),
    ).rejects.toBeInstanceOf(InvalidCredentialsError);
  });

  it("原子创建 Space/OWNER，并拒绝已有 ACTIVE Resident", async () => {
    const { owner, created } = await createOwner("atomic");
    expect(created.space.status).toBe("ACTIVE");
    expect(created.resident.role).toBe("OWNER");
    expect(
      await db.resident.count({
        where: { userId: owner.id, status: "ACTIVE" },
      }),
    ).toBe(1);
    await expect(
      new SpaceService(db).create({
        userId: owner.id,
        name: "Second Home",
        displayName: owner.name,
      }),
    ).rejects.toBeInstanceOf(ActiveSpaceAlreadyExistsError);
  });

  it("并发创建 Space 最终只保留一个并映射领域错误", async () => {
    const user = await register("space-race@example.com", "Race Owner");
    const results = await Promise.allSettled([
      new SpaceService(db).create({
        userId: user.id,
        name: "Home A",
        displayName: user.name,
      }),
      new SpaceService(db).create({
        userId: user.id,
        name: "Home B",
        displayName: user.name,
      }),
    ]);
    expect(
      results.filter((result) => result.status === "fulfilled"),
    ).toHaveLength(1);
    const rejection = results.find((result) => result.status === "rejected");
    expect(rejection).toMatchObject({
      status: "rejected",
      reason: expect.any(ActiveSpaceAlreadyExistsError),
    });
    expect(
      await db.resident.count({ where: { userId: user.id, status: "ACTIVE" } }),
    ).toBe(1);
    expect(await db.space.count({ where: { createdByUserId: user.id } })).toBe(
      1,
    );
  });

  it("OWNER 可以创建和撤销 Invitation，非 OWNER 均被拒绝", async () => {
    const { owner } = await createOwner("authorization");
    const guest = await register("authorization-guest@example.com", "Guest");
    const invitations = new InvitationService(db);
    const first = await invitations.create({
      userId: owner.id,
      email: guest.email,
    });
    await invitations.accept({
      userId: guest.id,
      token: first.token,
      email: guest.email,
      displayName: guest.name,
    });
    await expect(
      invitations.create({ userId: guest.id }),
    ).rejects.toBeInstanceOf(OwnerPermissionRequiredError);
    const second = await invitations.create({ userId: owner.id });
    await expect(
      invitations.revoke(guest.id, second.id),
    ).rejects.toBeInstanceOf(OwnerPermissionRequiredError);
    await invitations.revoke(owner.id, second.id);
    expect(
      await db.invitation.findUniqueOrThrow({
        where: { id: second.id },
        select: { status: true },
      }),
    ).toEqual({ status: "REVOKED" });
  });

  it("preview 只返回最小安全 view model", async () => {
    const { owner } = await createOwner("preview");
    const invitation = await new InvitationService(db).create({
      userId: owner.id,
      email: "preview-guest@example.com",
    });
    await expect(
      new InvitationService(db).preview(invitation.token),
    ).resolves.toEqual({
      spaceName: "preview Home",
      inviterDisplayName: "Owner",
      acceptable: true,
    });
    expect(
      Object.keys(
        await new InvitationService(db).preview(invitation.token),
      ).sort(),
    ).toEqual(["acceptable", "inviterDisplayName", "spaceName"]);
  });

  it("接受 Invitation 会创建第二名 Resident 并设置 acceptedAt", async () => {
    const { owner, created } = await createOwner("accept");
    const guest = await register("accept-guest@example.com", "Guest");
    const invitations = new InvitationService(db);
    const invitation = await invitations.create({
      userId: owner.id,
      email: " ACCEPT-GUEST@example.com ",
    });
    const resident = await invitations.accept({
      userId: guest.id,
      token: invitation.token,
      email: guest.email,
      displayName: guest.name,
    });
    expect(resident.role).toBe("RESIDENT");
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
    await expect(
      invitations.accept({
        userId: guest.id,
        token: invitation.token,
        email: guest.email,
        displayName: guest.name,
      }),
    ).rejects.toBeInstanceOf(InvitationAlreadyUsedError);
  });

  it("拒绝 expired、revoked 与 email mismatch Invitation", async () => {
    const { owner } = await createOwner("lifecycle");
    const guest = await register("lifecycle-guest@example.com", "Guest");
    const invitations = new InvitationService(db);

    const expired = await invitations.create({ userId: owner.id });
    await db.invitation.update({
      where: { id: expired.id },
      data: { expiresAt: new Date(Date.now() - 1_000) },
    });
    await expect(
      invitations.accept({
        userId: guest.id,
        token: expired.token,
        email: guest.email,
        displayName: guest.name,
      }),
    ).rejects.toBeInstanceOf(InvitationExpiredError);

    const revoked = await invitations.create({ userId: owner.id });
    await invitations.revoke(owner.id, revoked.id);
    await expect(
      invitations.accept({
        userId: guest.id,
        token: revoked.token,
        email: guest.email,
        displayName: guest.name,
      }),
    ).rejects.toBeInstanceOf(InvitationRevokedError);

    const restricted = await invitations.create({
      userId: owner.id,
      email: "someone-else@example.com",
    });
    await expect(
      invitations.accept({
        userId: guest.id,
        token: restricted.token,
        email: guest.email,
        displayName: guest.name,
      }),
    ).rejects.toBeInstanceOf(InvitationEmailMismatchError);
  });

  it("拒绝 inactive 或已满 Space", async () => {
    const inactive = await createOwner("inactive");
    const inactiveGuest = await register("inactive-guest@example.com", "Guest");
    const inactiveInvitation = await new InvitationService(db).create({
      userId: inactive.owner.id,
    });
    await db.space.update({
      where: { id: inactive.created.space.id },
      data: {
        status: "ARCHIVED",
        archivedAt: new Date(),
        archivedByUserId: inactive.owner.id,
      },
    });
    await expect(
      new InvitationService(db).accept({
        userId: inactiveGuest.id,
        token: inactiveInvitation.token,
        email: inactiveGuest.email,
        displayName: inactiveGuest.name,
      }),
    ).rejects.toBeInstanceOf(SpaceInactiveError);

    await resetDatabase();
    const full = await createOwner("full");
    const firstGuest = await register("full-first@example.com", "First");
    const secondGuest = await register("full-second@example.com", "Second");
    const invitations = new InvitationService(db);
    const firstInvitation = await invitations.create({ userId: full.owner.id });
    await invitations.accept({
      userId: firstGuest.id,
      token: firstInvitation.token,
      email: firstGuest.email,
      displayName: firstGuest.name,
    });
    const secondInvitation = await invitations.create({
      userId: full.owner.id,
    });
    await expect(
      invitations.accept({
        userId: secondGuest.id,
        token: secondInvitation.token,
        email: secondGuest.email,
        displayName: secondGuest.name,
      }),
    ).rejects.toBeInstanceOf(SpaceFullError);
  });

  it("拒绝已有其他 ACTIVE Space 或已是当前 Resident 的 User", async () => {
    const target = await createOwner("target");
    const other = await createOwner("other");
    const invitation = await new InvitationService(db).create({
      userId: target.owner.id,
    });
    await expect(
      new InvitationService(db).accept({
        userId: other.owner.id,
        token: invitation.token,
        email: other.owner.email,
        displayName: other.owner.name,
      }),
    ).rejects.toBeInstanceOf(ActiveResidentConflictError);

    await resetDatabase();
    const current = await createOwner("current");
    const guest = await register("current-guest@example.com", "Guest");
    const invitations = new InvitationService(db);
    const first = await invitations.create({ userId: current.owner.id });
    await invitations.accept({
      userId: guest.id,
      token: first.token,
      email: guest.email,
      displayName: guest.name,
    });
    const second = await invitations.create({ userId: current.owner.id });
    await expect(
      invitations.accept({
        userId: guest.id,
        token: second.token,
        email: guest.email,
        displayName: guest.name,
      }),
    ).rejects.toBeInstanceOf(ActiveResidentConflictError);
  });

  it("并发接受不能创建第三名 ACTIVE Resident", async () => {
    const { owner, created } = await createOwner("concurrent");
    const first = await register("concurrent-first@example.com", "First");
    const second = await register("concurrent-second@example.com", "Second");
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
      results.filter((result) => result.status === "rejected"),
    ).toHaveLength(1);
    expect(
      await db.resident.count({
        where: { spaceId: created.space.id, status: "ACTIVE" },
      }),
    ).toBeLessThanOrEqual(2);
  });

  it("Home query 只返回当前 ACTIVE Space 的有限安全模型", async () => {
    const pair = await createPair("home-query");
    await new PresenceService(db).updateOwn(
      pair.guest.id,
      "  今天走了很长的路  ",
    );

    const home = await new HomeService(db).get(pair.owner.id);
    expect(home).toEqual({
      space: { id: pair.created.space.id, name: "home-query Home" },
      residents: [
        expect.objectContaining({
          id: pair.created.resident.id,
          displayName: "Owner",
          avatarUrl: null,
          isViewer: true,
          presence: null,
        }),
        expect.objectContaining({
          id: pair.guestResident.id,
          displayName: "Guest",
          avatarUrl: null,
          isViewer: false,
          presence: expect.objectContaining({
            shortText: "今天走了很长的路",
            updatedAt: expect.any(String),
          }),
        }),
      ],
    });
    expect(Object.keys(home.space).sort()).toEqual(["id", "name"]);
    expect(home.residents).toHaveLength(2);
    expect(home.residents.every((resident) => !("userId" in resident))).toBe(
      true,
    );
  });

  it("Presence upsert 永远由 session user 解析自己的 Resident", async () => {
    const pair = await createPair("presence-own");
    const presence = new PresenceService(db);
    await presence.updateOwn(pair.owner.id, "第一句");
    await presence.updateOwn(pair.owner.id, "第二句");
    await presence.updateOwn(pair.guest.id, "另一位的此刻");

    expect(await db.presence.count()).toBe(2);
    await expect(
      db.presence.findUniqueOrThrow({
        where: { residentId: pair.created.resident.id },
        select: { shortText: true },
      }),
    ).resolves.toEqual({ shortText: "第二句" });
    await expect(
      db.presence.findUniqueOrThrow({
        where: { residentId: pair.guestResident.id },
        select: { shortText: true },
      }),
    ).resolves.toEqual({ shortText: "另一位的此刻" });
  });

  it("Presence 可主动清除，纯空白也按清除处理", async () => {
    const pair = await createPair("presence-clear");
    const presence = new PresenceService(db);
    await presence.updateOwn(pair.owner.id, "稍后回来");
    await presence.clearOwn(pair.owner.id);
    expect(await db.presence.count()).toBe(0);

    await presence.updateOwn(pair.owner.id, "重新出现");
    await presence.updateOwn(pair.owner.id, "  \n ");
    expect(await db.presence.count()).toBe(0);
  });

  it("过期语义不会自动删除数据库 Presence", async () => {
    const pair = await createPair("presence-retained");
    await new PresenceService(db).updateOwn(pair.owner.id, "旧的一天");
    const oldTime = new Date("2025-01-01T12:00:00.000Z");
    await db.presence.update({
      where: { residentId: pair.created.resident.id },
      data: { updatedAt: oldTime },
    });

    const home = await new HomeService(db).get(pair.owner.id);
    expect(home.residents[0]?.presence?.updatedAt).toBe(oldTime.toISOString());
    expect(await db.presence.count()).toBe(1);
  });

  it("非 Resident 与 ARCHIVED Space 均不能读取 Home 或更新 Presence", async () => {
    const pair = await createPair("presence-authz");
    const outsider = await register("presence-outsider@example.com", "Outside");
    await expect(new HomeService(db).get(outsider.id)).rejects.toBeInstanceOf(
      NotSpaceResidentError,
    );
    await expect(
      new PresenceService(db).updateOwn(outsider.id, "不应写入"),
    ).rejects.toBeInstanceOf(NotSpaceResidentError);

    await db.space.update({
      where: { id: pair.created.space.id },
      data: {
        status: "ARCHIVED",
        archivedAt: new Date(),
        archivedByUserId: pair.owner.id,
      },
    });
    await expect(new HomeService(db).get(pair.owner.id)).rejects.toBeInstanceOf(
      NotSpaceResidentError,
    );
    await expect(
      new PresenceService(db).updateOwn(pair.owner.id, "不应写入"),
    ).rejects.toBeInstanceOf(NotSpaceResidentError);
  });
});
