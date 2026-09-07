// @vitest-environment node
import { randomUUID } from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import sharp from "sharp";
import { PrismaClient, type Prisma } from "@prisma/client";
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
import { parseCloudflareImageResponse } from "@/server/avatar/response";
import { AvatarPipelineError } from "@/server/avatar/pipeline-error";
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
  it("离线恢复source，不调用provider、不改final/期限，Partner不可读before", async () => {
    const ready = await generate();
    const original = await db.avatarGeneration.findUniqueOrThrow({
      where: { id: ready.id },
      include: { sourceMediaAsset: true },
    });
    await db.avatarGeneration.update({
      where: { id: ready.id },
      data: {
        status: "FAILED",
        candidateMediaAssetId: null,
        failureStage: "AVATAR_IMAGE_NORMALIZE_FAILED",
      },
    });
    await db.mediaAsset.delete({
      where: { id: original.candidateMediaAssetId! },
    });
    await expect(service.renormalizeOwn(partner, ready.id)).rejects.toThrow();
    const recovered = await service.renormalizeOwn(own, ready.id);
    expect(recovered.status).toBe("READY");
    expect(recovered.sourceUrl).toBeTruthy();
    const firstDisplay = await db.avatarGeneration.findUniqueOrThrow({
      where: { id: ready.id },
      include: { candidateMediaAsset: true },
    });
    await service.renormalizeOwn(own, ready.id);
    await expect(
      storage.get(firstDisplay.candidateMediaAsset!.storageKey),
    ).rejects.toThrow();
    const job = await db.avatarGeneration.findUniqueOrThrow({
      where: { id: ready.id },
    });
    expect(job.sourceMediaAssetId).toBe(original.sourceMediaAssetId);
    expect(job.expiresAt).toEqual(original.expiresAt);
    expect(job.dispatchedAt).toEqual(original.dispatchedAt);
    expect(job.confirmedMediaAssetId).toBeNull();
    expect(provider.generate).toHaveBeenCalledTimes(1);
    expect(
      (await db.resident.findUniqueOrThrow({ where: { id: ownResident } }))
        .avatarVersion,
    ).toBe(0);
    await expect(
      service.readCandidateImage(partner, ready.id, true),
    ).rejects.toThrow();
    expect(
      (await service.readCandidateImage(own, ready.id, true)).bytes,
    ).toEqual(await storage.get(original.sourceMediaAsset!.storageKey));
  });
  it("离线恢复显示写入失败保留source和旧final", async () => {
    const ready = await generate();
    const original = await db.avatarGeneration.findUniqueOrThrow({
      where: { id: ready.id },
    });
    await db.avatarGeneration.update({
      where: { id: ready.id },
      data: { status: "FAILED", candidateMediaAssetId: null },
    });
    await db.mediaAsset.delete({
      where: { id: original.candidateMediaAssetId! },
    });
    const put = vi
      .spyOn(storage, "put")
      .mockRejectedValueOnce(new Error("controlled storage failure"));
    await expect(service.renormalizeOwn(own, ready.id)).rejects.toThrow();
    put.mockRestore();
    const job = await db.avatarGeneration.findUniqueOrThrow({
      where: { id: ready.id },
    });
    expect(job.status).toBe("FAILED");
    expect(job.sourceMediaAssetId).toBe(original.sourceMediaAssetId);
    expect(job.confirmedMediaAssetId).toBeNull();
    expect(provider.generate).toHaveBeenCalledTimes(1);
  });
  it("身份拒绝仅本人可操作，持久保存并禁止确认/离线洗成READY", async () => {
    const first = await generate();
    await service.confirmOwn(own, first.id);
    const before = await db.resident.findUniqueOrThrow({
      where: { id: ownResident },
    });
    const job = await generate();
    await expect(service.rejectIdentityOwn(partner, job.id)).rejects.toThrow();
    await expect(service.rejectIdentityOwn(outsider, job.id)).rejects.toThrow();
    const rejected = await service.rejectIdentityOwn(own, job.id);
    expect(rejected.status).toBe("FAILED");
    expect(rejected.rejectionReason).toBe("IDENTITY_MISMATCH");
    expect((await service.latestOwn(own))?.rejectionReason).toBe(
      "IDENTITY_MISMATCH",
    );
    await service.rejectIdentityOwn(own, job.id);
    await expect(service.confirmOwn(own, job.id)).rejects.toThrow();
    await expect(service.renormalizeOwn(own, job.id)).rejects.toThrow();
    await expect(service.readCandidateImage(partner, job.id)).rejects.toThrow();
    expect((await service.readCandidateImage(own, job.id)).mimeType).toBe(
      "image/png",
    );
    const after = await db.resident.findUniqueOrThrow({
      where: { id: ownResident },
    });
    expect(after.avatarMediaAssetId).toBe(before.avatarMediaAssetId);
    expect(after.avatarVersion).toBe(before.avatarVersion);
    // 即使数据库状态错误回到READY，拒绝原因也独立阻止确认。
    await db.avatarGeneration.update({
      where: { id: job.id },
      data: { status: "READY" },
    });
    await expect(service.confirmOwn(own, job.id)).rejects.toThrow();
    await service.cancelOwn(own, job.id);
    await expect(service.readCandidateImage(own, job.id)).rejects.toThrow();
  });
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
    const stored = await db.avatarGeneration.findUniqueOrThrow({
      where: { id: job.id },
    });
    const assetId = stored.candidateMediaAssetId!;
    expect(stored.sourceMediaAssetId).toBeTruthy();
    expect((await service.latestOwn(own))?.candidateUrl).toBe(job.candidateUrl);
    await expect(service.readCandidate(partner, job.id)).rejects.toMatchObject({
      code: "AVATAR_NOT_AVAILABLE",
    });
    await expect(service.readAsset(own, assetId)).rejects.toMatchObject({
      code: "AVATAR_NOT_AVAILABLE",
    });
    expect(
      (await new HomeService(db).get(partner)).residents.find(
        (r) => r.isViewer === false,
      )?.avatarUrl,
    ).toBeNull();
    await expect(service.readAsset(partner, assetId)).rejects.toMatchObject({
      code: "AVATAR_NOT_AVAILABLE",
    });
    await expect(service.readCandidate(own, job.id)).resolves.toBeInstanceOf(
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
    ).toBe(`/api/avatar/assets/${assetId}`);
    await expect(service.readCandidate(own, job.id)).rejects.toMatchObject({
      code: "AVATAR_NOT_AVAILABLE",
    });
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
    await expect(service.readCandidate(own, job.id)).rejects.toThrow();
    expect((await service.getOwn(own, job.id)).status).toBe("EXPIRED");
    expect(await db.mediaAsset.count()).toBe(0);
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
      service.readAsset(
        outsider,
        (await db.avatarGeneration.findUniqueOrThrow({ where: { id: job.id } }))
          .confirmedMediaAssetId!,
      ),
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
  it("生成保存 1024px 源图和 256px 显示图，确认移动引用且取消删除两者", async () => {
    const job = await generate();
    const candidate = await db.avatarGeneration.findUniqueOrThrow({
      where: { id: job.id },
      include: { candidateMediaAsset: true, sourceMediaAsset: true },
    });
    expect(candidate.styleVersion).toBe(AVATAR.styleVersion);
    expect(
      (
        await sharp(
          await storage.get(candidate.sourceMediaAsset!.storageKey),
        ).metadata()
      ).width,
    ).toBe(1024);
    expect(
      (
        await sharp(
          await storage.get(candidate.candidateMediaAsset!.storageKey),
        ).metadata()
      ).width,
    ).toBe(256);
    await expect(
      service.readAsset(own, candidate.sourceMediaAssetId!),
    ).rejects.toThrow();
    await service.confirmOwn(own, job.id);
    const final = await db.avatarGeneration.findUniqueOrThrow({
      where: { id: job.id },
    });
    expect(final.candidateMediaAssetId).toBeNull();
    expect(final.confirmedMediaAssetId).toBe(candidate.candidateMediaAssetId);
    expect(final.sourceMediaAssetId).toBe(candidate.sourceMediaAssetId);
    const next = await generate();
    const assets = await db.mediaAsset.findMany({
      where: {
        OR: [
          { avatarGeneration: { is: { id: next.id } } },
          { avatarSourceGeneration: { is: { id: next.id } } },
        ],
      },
    });
    expect(assets).toHaveLength(2);
    await service.cancelOwn(own, next.id);
    for (const asset of assets)
      await expect(storage.get(asset.storageKey)).rejects.toThrow();
    expect(await db.mediaAsset.count()).toBe(2);
  });
  it("显示文件保存失败保留已提交源图和旧身份，取消后清理", async () => {
    const old = await generate();
    await service.confirmOwn(own, old.id);
    const originalPut = storage.put.bind(storage);
    let sourceKey = "";
    const spy = vi
      .spyOn(storage, "put")
      .mockImplementationOnce(async (bytes, mime) => {
        sourceKey = await originalPut(bytes, mime);
        return sourceKey;
      })
      .mockRejectedValueOnce(new Error("controlled disk failure"));
    let failed;
    try {
      failed = await generate();
    } finally {
      spy.mockRestore();
    }
    expect(failed.status).toBe("FAILED");
    expect(failed.previewKind).toBe("source");
    expect(await db.mediaAsset.count()).toBe(3);
    await expect(storage.get(sourceKey)).resolves.toBeInstanceOf(Buffer);
    expect(
      (
        await db.avatarGeneration.findUniqueOrThrow({
          where: { id: failed.id },
        })
      ).failureStage,
    ).toBe("AVATAR_DISPLAY_PERSIST_FAILED");
    expect(
      (await db.resident.findUniqueOrThrow({ where: { id: ownResident } }))
        .avatarVersion,
    ).toBe(1);
    await service.cancelOwn(own, failed.id);
    await expect(storage.get(sourceKey)).rejects.toThrow();
  });
  it("确认事务失败和源图丢失都保留旧资源，成功替换清理旧源图", async () => {
    const first = await generate();
    await service.confirmOwn(own, first.id);
    const oldAssets = await db.mediaAsset.findMany();
    const next = await generate();
    const spy = vi
      .spyOn(db, "$transaction")
      .mockRejectedValueOnce(new Error("controlled transaction failure"));
    try {
      await expect(service.confirmOwn(own, next.id)).rejects.toThrow(
        "controlled transaction failure",
      );
    } finally {
      spy.mockRestore();
    }
    for (const asset of oldAssets)
      await expect(storage.get(asset.storageKey)).resolves.toBeInstanceOf(
        Buffer,
      );
    const candidate = await db.avatarGeneration.findUniqueOrThrow({
      where: { id: next.id },
      include: { sourceMediaAsset: true },
    });
    const read = vi.spyOn(storage, "get").mockImplementation(async (key) => {
      if (key === candidate.sourceMediaAsset!.storageKey)
        throw new Error("controlled missing source");
      return LocalAvatarStorage.prototype.get.call(storage, key);
    });
    try {
      await expect(service.confirmOwn(own, next.id)).rejects.toThrow(
        "controlled missing source",
      );
    } finally {
      read.mockRestore();
    }
    expect(
      (await db.resident.findUniqueOrThrow({ where: { id: ownResident } }))
        .avatarVersion,
    ).toBe(1);
    await service.confirmOwn(own, next.id);
    for (const asset of oldAssets)
      await expect(storage.get(asset.storageKey)).rejects.toThrow();
    expect(await db.mediaAsset.count()).toBe(2);
  });
  it("删除旧文件失败不撤销已经提交的新身份，留下可扫描孤儿", async () => {
    const first = await generate();
    await service.confirmOwn(own, first.id);
    const next = await generate();
    const remove = vi
      .spyOn(storage, "remove")
      .mockRejectedValue(new Error("controlled unlink failure"));
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      await expect(service.confirmOwn(own, next.id)).resolves.toEqual({
        confirmed: true,
      });
      expect(log).toHaveBeenCalledWith("AVATAR_FILE_CLEANUP_FAILED");
    } finally {
      remove.mockRestore();
      log.mockRestore();
    }
    expect(
      (await db.resident.findUniqueOrThrow({ where: { id: ownResident } }))
        .avatarVersion,
    ).toBe(2);
    expect(await db.mediaAsset.count()).toBe(2);
  });
  it("事务执行完指针切换后回滚，旧身份与两份旧文件仍完整", async () => {
    const first = await generate();
    await service.confirmOwn(own, first.id);
    const before = await db.resident.findUniqueOrThrow({
      where: { id: ownResident },
    });
    const oldAssets = await db.mediaAsset.findMany();
    const next = await generate();
    const transaction = db.$transaction.bind(db);
    const spy = vi
      .spyOn(db, "$transaction")
      .mockImplementationOnce(async (work) =>
        transaction(async (tx) => {
          await (work as (tx: Prisma.TransactionClient) => Promise<unknown>)(
            tx,
          );
          throw new Error("controlled rollback after pointer change");
        }),
      );
    try {
      await expect(service.confirmOwn(own, next.id)).rejects.toThrow(
        "controlled rollback after pointer change",
      );
    } finally {
      spy.mockRestore();
    }
    const after = await db.resident.findUniqueOrThrow({
      where: { id: ownResident },
    });
    expect(after.avatarMediaAssetId).toBe(before.avatarMediaAssetId);
    expect(after.avatarVersion).toBe(before.avatarVersion);
    expect((await service.getOwn(own, next.id)).status).toBe("READY");
    for (const asset of oldAssets)
      await expect(storage.get(asset.storageKey)).resolves.toBeInstanceOf(
        Buffer,
      );
    await expect(
      service.readAsset(partner, after.avatarMediaAssetId!),
    ).resolves.toBeInstanceOf(Buffer);
  });
  it.each(["png", "jpeg"] as const)(
    "HTTP200 result.image %s → 私密 source → 256透明图 → 本人预览",
    async (format) => {
      const generated =
        format === "png"
          ? output
          : await sharp(output)
              .flatten({ background: "#ff00ff" })
              .jpeg({ quality: 100 })
              .toBuffer();
      provider.generate.mockImplementationOnce(
        async () =>
          parseCloudflareImageResponse(
            "application/json",
            Buffer.from(
              JSON.stringify({
                success: true,
                result: { image: generated.toString("base64") },
                errors: [],
              }),
            ),
          ).bytes,
      );
      const job = await generate();
      expect(job.status).toBe("READY");
      expect(job.previewKind).toBe("display");
      const stored = await db.avatarGeneration.findUniqueOrThrow({
        where: { id: job.id },
        include: { sourceMediaAsset: true },
      });
      expect(stored.sourceMediaAsset!.mimeType).toBe(`image/${format}`);
      const original = await storage.get(stored.sourceMediaAsset!.storageKey);
      expect(original.equals(generated)).toBe(true);
      expect((await sharp(original).metadata()).width).toBe(1024);
      const preview = await service.readCandidateImage(own, job.id);
      expect(preview.mimeType).toBe("image/png");
      expect(await sharp(preview.bytes).metadata()).toMatchObject({
        width: 256,
        height: 256,
        hasAlpha: true,
      });
      await expect(service.readCandidate(partner, job.id)).rejects.toThrow();
      await service.confirmOwn(own, job.id);
      expect(await db.mediaAsset.count()).toBe(2);
    },
  );
  it("规范化拒绝有效 JPEG 时源图仍可恢复预览，但本人/Partner 都不能确认为头像", async () => {
    const image = await sharp({
      create: { width: 1024, height: 1024, channels: 3, background: "#aaa" },
    })
      .jpeg()
      .toBuffer();
    provider.generate.mockResolvedValueOnce(image);
    const job = await generate();
    expect(job).toMatchObject({ status: "FAILED", previewKind: "source" });
    const row = await db.avatarGeneration.findUniqueOrThrow({
      where: { id: job.id },
      include: { sourceMediaAsset: true },
    });
    expect(row.failureStage).toBe("AVATAR_IMAGE_NORMALIZE_FAILED");
    expect(row.candidateMediaAssetId).toBeNull();
    expect(
      (await storage.get(row.sourceMediaAsset!.storageKey)).equals(image),
    ).toBe(true);
    const restored = await new AvatarService(db, storage).latestOwn(own);
    expect(restored?.candidateUrl).toBe(job.candidateUrl);
    expect((await service.readCandidateImage(own, job.id)).mimeType).toBe(
      "image/jpeg",
    );
    await expect(service.confirmOwn(own, job.id)).rejects.toThrow();
    await expect(service.readCandidate(partner, job.id)).rejects.toThrow();
    await expect(
      service.readAsset(partner, row.sourceMediaAssetId!),
    ).rejects.toThrow();
    expect(
      (await new HomeService(db).get(own)).residents.every(
        (r) => r.avatarUrl === null,
      ),
    ).toBe(true);
    await db.avatarGeneration.update({
      where: { id: job.id },
      data: { expiresAt: new Date(0) },
    });
    await expect(service.readCandidate(own, job.id)).rejects.toThrow();
    await expect(
      storage.get(row.sourceMediaAsset!.storageKey),
    ).rejects.toThrow();
  });
  it("各处理阶段独立记录，不将解析/解码失败误报为规范化失败", async () => {
    for (const stage of [
      "PROVIDER_RESPONSE_PARSE_FAILED",
      "PROVIDER_IMAGE_DECODE_FAILED",
    ] as const) {
      provider.generate.mockRejectedValueOnce(new AvatarPipelineError(stage));
      const id = randomUUID();
      await expect(generate(id)).rejects.toMatchObject({ stage });
      expect(
        (await db.avatarGeneration.findUniqueOrThrow({ where: { id } }))
          .failureStage,
      ).toBe(stage);
    }
    expect(await db.mediaAsset.count()).toBe(0);
  });
  it("保存源图后进程中断，超时只转失败保留预览，到24h才清除", async () => {
    const job = await generate();
    const row = await db.avatarGeneration.findUniqueOrThrow({
      where: { id: job.id },
      include: { candidateMediaAsset: true, sourceMediaAsset: true },
    });
    await db.avatarGeneration.update({
      where: { id: job.id },
      data: {
        status: "PENDING",
        candidateMediaAssetId: null,
        createdAt: new Date(Date.now() - AVATAR.pendingTtlMs - 1),
      },
    });
    await db.mediaAsset.delete({ where: { id: row.candidateMediaAssetId! } });
    await storage.remove(row.candidateMediaAsset!.storageKey);
    await service.cleanup();
    expect((await service.getOwn(own, job.id)).previewKind).toBe("source");
    expect(
      (await db.avatarGeneration.findUniqueOrThrow({ where: { id: job.id } }))
        .failureStage,
    ).toBe("AVATAR_PROCESSING_INTERRUPTED");
    await expect(
      storage.get(row.sourceMediaAsset!.storageKey),
    ).resolves.toBeInstanceOf(Buffer);
    await service.cancelOwn(own, job.id);
    await expect(
      storage.get(row.sourceMediaAsset!.storageKey),
    ).rejects.toThrow();
  });
});
