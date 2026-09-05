// @vitest-environment node
import { randomUUID } from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import sharp from "sharp";
import { PrismaClient } from "@prisma/client";
import {
  beforeAll,
  afterAll,
  beforeEach,
  describe,
  it,
  expect,
  vi,
} from "vitest";
import { AvatarService } from "./avatar-service";
import { HomeService } from "./home-service";
import { LocalAvatarStorage } from "@/server/avatar/storage";
import { FixtureAvatarProvider } from "@/server/avatar/test-provider";
import { AVATAR } from "@/lib/avatar/config";
const suite = process.env.TEST_DATABASE_URL ? describe : describe.skip;
suite.sequential("头像真实 PostgreSQL 授权与持久性", () => {
  let db: PrismaClient,
    storage: LocalAvatarStorage,
    source: Buffer,
    output: Buffer,
    folder: string;
  let own: string, partner: string, outsider: string, ownResident: string;
  const provider = { model: "controlled-fixture-not-ai", generate: vi.fn() };
  let service: AvatarService;
  beforeAll(async () => {
    db = new PrismaClient({
      datasources: { db: { url: process.env.TEST_DATABASE_URL! } },
    });
    folder = await mkdtemp(join(tmpdir(), "avatar-integration-"));
    storage = new LocalAvatarStorage(folder);
    service = new AvatarService(db, storage, provider);
    source = await sharp({
      create: { width: 256, height: 256, channels: 3, background: "#cba" },
    })
      .jpeg()
      .toBuffer();
    output = await new FixtureAvatarProvider().generate();
  });
  beforeEach(async () => {
    // 与既有 integration 共享测试库时串行执行；清理全部由测试创建的记录。
    await db.avatarGeneration.deleteMany();
    await db.mediaAsset.deleteMany();
    await db.presence.deleteMany();
    await db.invitation.deleteMany();
    await db.resident.deleteMany();
    await db.space.deleteMany();
    await db.user.deleteMany();
    const users = await Promise.all(
      [0, 1, 2].map((i) =>
        db.user.create({
          data: { name: `Test ${i}`, email: `avatar-${i}@example.com` },
        }),
      ),
    );
    [own, partner, outsider] = users.map((u) => u.id);
    const space = await db.space.create({
      data: { name: "测试 Space", createdByUserId: own },
    });
    ownResident = (
      await db.resident.create({
        data: {
          spaceId: space.id,
          userId: own,
          displayName: "阿禾",
          role: "OWNER",
        },
      })
    ).id;
    await db.resident.create({
      data: {
        spaceId: space.id,
        userId: partner,
        displayName: "小满",
        role: "RESIDENT",
      },
    });
    provider.generate.mockReset().mockResolvedValue(output);
  });
  afterAll(async () => {
    await db?.$disconnect();
    await rm(folder, { recursive: true, force: true });
  });
  const generate = (id = randomUUID()) =>
    service.generateOwn(own, id, AVATAR.policyVersion, source, "image/jpeg");
  it("没有 ACTIVE Resident 或未同意不能生成", async () => {
    await expect(
      service.generateOwn(
        outsider,
        randomUUID(),
        AVATAR.policyVersion,
        source,
        "image/jpeg",
      ),
    ).rejects.toMatchObject({ code: "NOT_SPACE_RESIDENT" });
    await expect(
      service.generateOwn(own, randomUUID(), "no", source, "image/jpeg"),
    ).rejects.toMatchObject({ code: "AVATAR_CONSENT_REQUIRED" });
    expect(provider.generate).not.toHaveBeenCalled();
  });
  it("未确认候选只属于本人，确认后仅同 Space ACTIVE Resident 读取，重建 Service 仍持久", async () => {
    const job = await generate();
    const assetId = job.candidateUrl!.split("/").pop()!;
    expect(
      (await new HomeService(db).get(partner)).residents.find(
        (r) => r.isViewer === false,
      )?.avatarUrl,
    ).toBeNull();
    await expect(service.readAsset(partner, assetId)).rejects.toMatchObject({
      code: "AVATAR_NOT_AVAILABLE",
    });
    await expect(service.readAsset(own, assetId)).resolves.toBeInstanceOf(
      Buffer,
    );
    await expect(service.confirmOwn(partner, job.id)).rejects.toMatchObject({
      code: "AVATAR_NOT_AVAILABLE",
    });
    await service.confirmOwn(own, job.id);
    expect(
      (await new HomeService(db).get(partner)).residents.find(
        (r) => !r.isViewer,
      )?.avatarUrl,
    ).toBe(job.candidateUrl);
    await expect(
      new AvatarService(db, storage).readAsset(partner, assetId),
    ).resolves.toBeInstanceOf(Buffer);
    await expect(service.readAsset(outsider, assetId)).rejects.toMatchObject({
      code: "NOT_SPACE_RESIDENT",
    });
    await db.resident.updateMany({
      where: { userId: partner },
      data: { status: "LEFT", leftAt: new Date() },
    });
    await expect(service.readAsset(partner, assetId)).rejects.toMatchObject({
      code: "NOT_SPACE_RESIDENT",
    });
  });
  it("并发重复任务只派发一次，重复确认不增加版本", async () => {
    const id = randomUUID();
    const jobs = await Promise.all([generate(id), generate(id)]);
    expect(provider.generate).toHaveBeenCalledTimes(1);
    expect(jobs.some((j) => j.status === "READY")).toBe(true);
    await Promise.all([
      service.confirmOwn(own, id),
      service.confirmOwn(own, id),
    ]);
    expect(
      (await db.resident.findUniqueOrThrow({ where: { id: ownResident } }))
        .avatarVersion,
    ).toBe(1);
  });
  it("取消可早于上传，迟到结果不能变成正式身份", async () => {
    const id = randomUUID();
    await service.cancelOwn(own, id);
    expect((await generate(id)).status).toBe("CANCELLED");
    expect(provider.generate).not.toHaveBeenCalled();
    let release!: (b: Buffer) => void;
    provider.generate.mockImplementation(
      () =>
        new Promise((r) => {
          release = r;
        }),
    );
    const second = randomUUID();
    const running = generate(second);
    await vi.waitFor(() => expect(provider.generate).toHaveBeenCalledTimes(1));
    await service.cancelOwn(own, second);
    release(output);
    expect((await running).status).toBe("CANCELLED");
    expect(await db.mediaAsset.count()).toBe(0);
  });
  it("失败与取消保留旧头像；确认替换删除旧资源", async () => {
    const first = await generate();
    await service.confirmOwn(own, first.id);
    const old = (await db.mediaAsset.findFirstOrThrow()).storageKey;
    provider.generate.mockRejectedValueOnce(new Error("controlled failure"));
    await expect(generate()).rejects.toThrow();
    expect(
      (await db.resident.findUniqueOrThrow({ where: { id: ownResident } }))
        .avatarVersion,
    ).toBe(1);
    const replacement = await generate();
    await service.confirmOwn(own, replacement.id);
    expect(
      (await db.resident.findUniqueOrThrow({ where: { id: ownResident } }))
        .avatarVersion,
    ).toBe(2);
    await expect(storage.get(old)).rejects.toThrow();
  });
  it("取消候选立即撤销读取并删除文件", async () => {
    const first = await generate();
    const asset = await db.mediaAsset.findFirstOrThrow();
    await service.cancelOwn(own, first.id);
    await expect(storage.get(asset.storageKey)).rejects.toThrow();
    await expect(service.readAsset(own, asset.id)).rejects.toThrow();
  });
  it("候选过期后即使清理未运行也拒绝读取与确认，清理删除文件", async () => {
    const job = await generate();
    const asset = await db.mediaAsset.findFirstOrThrow();
    await db.avatarGeneration.update({
      where: { id: job.id },
      data: { expiresAt: new Date(0) },
    });
    await expect(service.confirmOwn(own, job.id)).rejects.toThrow();
    await expect(service.readAsset(own, asset.id)).rejects.toThrow();
    await service.cleanup();
    await expect(storage.get(asset.storageKey)).rejects.toThrow();
  });
  it("个人生成次数由数据库限制，取消/失败不能返还次数绕过", async () => {
    for (let i = 0; i < 3; i++) {
      const job = await generate();
      await service.cancelOwn(own, job.id);
    }
    await expect(generate()).rejects.toMatchObject({
      code: "RATE_LIMIT_EXCEEDED",
    });
    expect(provider.generate).toHaveBeenCalledTimes(3);
  });
  it("缺失候选文件不能确认并破坏旧身份", async () => {
    const first = await generate();
    await service.confirmOwn(own, first.id);
    const second = await generate();
    const row = await db.avatarGeneration.findUniqueOrThrow({
      where: { id: second.id },
      include: { candidateMediaAsset: true },
    });
    await storage.remove(row.candidateMediaAsset!.storageKey);
    await expect(service.confirmOwn(own, second.id)).rejects.toThrow();
    expect(
      (await db.resident.findUniqueOrThrow({ where: { id: ownResident } }))
        .avatarVersion,
    ).toBe(1);
  });
  it("其他有效 Space 不能读取最终图或操作候选，全站限额在派发前生效", async () => {
    const job = await generate();
    await service.confirmOwn(own, job.id);
    const foreign = await db.space.create({
      data: { name: "其他私密 Space", createdByUserId: outsider },
    });
    await db.resident.create({
      data: {
        spaceId: foreign.id,
        userId: outsider,
        displayName: "他人",
        role: "OWNER",
      },
    });
    await expect(
      service.readAsset(outsider, job.candidateUrl!.split("/").pop()!),
    ).rejects.toMatchObject({ code: "AVATAR_NOT_AVAILABLE" });
    await expect(service.getOwn(partner, job.id)).rejects.toMatchObject({
      code: "AVATAR_NOT_AVAILABLE",
    });
    await expect(service.cancelOwn(partner, job.id)).rejects.toMatchObject({
      code: "AVATAR_NOT_AVAILABLE",
    });
    await db.avatarGeneration.createMany({
      data: Array.from({ length: AVATAR.globalDailyLimit - 1 }, () => ({
        id: randomUUID(),
        residentId: ownResident,
        status: "FAILED" as const,
        model: "controlled-fixture-not-ai",
        baseAvatarVersion: 0,
        policyVersion: AVATAR.policyVersion,
        dispatchedAt: new Date(),
        expiresAt: new Date(),
      })),
    });
    await expect(
      service.generateOwn(
        outsider,
        randomUUID(),
        AVATAR.policyVersion,
        source,
        "image/jpeg",
      ),
    ).rejects.toMatchObject({ code: "RATE_LIMIT_EXCEEDED" });
    expect(provider.generate).toHaveBeenCalledTimes(1);
  });
  it("清理保留当前身份的生成关联，超时或成员离开后的候选不可确认", async () => {
    const first = await generate();
    await service.confirmOwn(own, first.id);
    await db.avatarGeneration.update({
      where: { id: first.id },
      data: { createdAt: new Date(0) },
    });
    await service.cleanup();
    expect(
      await db.avatarGeneration.findUnique({ where: { id: first.id } }),
    ).not.toBeNull();
    const next = await generate();
    await db.resident.update({
      where: { id: ownResident },
      data: { status: "LEFT", leftAt: new Date() },
    });
    await expect(service.confirmOwn(own, next.id)).rejects.toMatchObject({
      code: "NOT_SPACE_RESIDENT",
    });
    await service.cleanup();
    expect(
      (await db.avatarGeneration.findUniqueOrThrow({ where: { id: next.id } }))
        .status,
    ).toBe("FAILED");
    expect(
      (await db.resident.findUniqueOrThrow({ where: { id: ownResident } }))
        .avatarVersion,
    ).toBe(1);
  });
});
