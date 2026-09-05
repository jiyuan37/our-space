import { z } from "zod";
import type { AvatarGeneration, Prisma, PrismaClient } from "@prisma/client";
import { AVATAR, type AvatarJobView } from "@/lib/avatar/config";
import {
  AvatarBusyError,
  AvatarConsentRequiredError,
  AvatarNotAvailableError,
  RateLimitExceededError,
} from "@/server/errors/domain-error";
import { ResidentService } from "@/server/services/resident-service";
import {
  normalizeSelfie,
  normalizeCandidate,
  normalizeGeneratedSource,
} from "@/server/avatar/images";
import type { AvatarGenerationProvider } from "@/server/avatar/provider";
import type { AvatarStorage } from "@/server/avatar/storage";

export class AvatarService {
  constructor(
    private readonly db: PrismaClient,
    private readonly storage: AvatarStorage,
    private readonly provider?: AvatarGenerationProvider,
  ) {}
  private locked<T>(work: (tx: Prisma.TransactionClient) => Promise<T>) {
    return this.db.$transaction(async (tx) => {
      // 只锁短数据库操作，绝不在事务中等待 AI。跨进程防重复派发和超额计费。
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(510501)::text`;
      return work(tx);
    });
  }
  private view(job: AvatarGeneration): AvatarJobView {
    const expired = job.expiresAt.getTime() <= Date.now();
    const stalePending =
      job.status === "PENDING" &&
      job.createdAt.getTime() + AVATAR.pendingTtlMs <= Date.now();
    const status =
      (expired || stalePending) &&
      (job.status === "READY" || job.status === "PENDING")
        ? expired
          ? "EXPIRED"
          : "FAILED"
        : job.status;
    return {
      id: job.id,
      status,
      candidateUrl:
        status === "READY" && job.candidateMediaAssetId
          ? `/api/avatar/candidates/${job.id}`
          : null,
      expiresAt: job.expiresAt.toISOString(),
    };
  }
  async getOwn(userId: string, id: string) {
    const resident = await new ResidentService(this.db).requireActive(userId);
    await this.cleanup(new Date(), resident.id);
    const job = await this.db.avatarGeneration.findFirst({
      where: { id: z.string().uuid().parse(id), residentId: resident.id },
    });
    if (!job) throw new AvatarNotAvailableError();
    return this.view(job);
  }
  async latestOwn(userId: string) {
    const resident = await new ResidentService(this.db).requireActive(userId);
    await this.cleanup(new Date(), resident.id);
    const job = await this.db.avatarGeneration.findFirst({
      where: {
        residentId: resident.id,
        status: { in: ["PENDING", "READY"] },
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });
    return job ? this.view(job) : null;
  }
  async generateOwn(
    userId: string,
    id: string,
    consent: unknown,
    bytes: Buffer,
    mime: string,
  ) {
    z.string().uuid().parse(id);
    if (consent !== AVATAR.policyVersion)
      throw new AvatarConsentRequiredError();
    await new ResidentService(this.db).requireActive(userId);
    if (!this.provider) throw new AvatarNotAvailableError();
    const selfie = await normalizeSelfie(bytes, mime);
    try {
      const reserved = await this.locked(async (tx) => {
        const resident = await new ResidentService(tx).requireActive(userId);
        const existing = await tx.avatarGeneration.findUnique({
          where: { id },
        });
        if (existing) {
          if (existing.residentId !== resident.id)
            throw new AvatarNotAvailableError();
          return { job: existing, dispatch: false };
        }
        const since = new Date(Date.now() - 24 * 60 * 60_000);
        const pendingSince = new Date(Date.now() - AVATAR.pendingTtlMs);
        if (
          await tx.avatarGeneration.count({
            where: {
              residentId: resident.id,
              OR: [
                { status: "PENDING", createdAt: { gt: pendingSince } },
                { status: "READY", expiresAt: { gt: new Date() } },
              ],
            },
          })
        )
          throw new AvatarBusyError();
        const [own, global] = await Promise.all([
          tx.avatarGeneration.count({
            where: { residentId: resident.id, dispatchedAt: { gt: since } },
          }),
          tx.avatarGeneration.count({ where: { dispatchedAt: { gt: since } } }),
        ]);
        if (own >= AVATAR.userDailyLimit || global >= AVATAR.globalDailyLimit)
          throw new RateLimitExceededError();
        const identity = await tx.resident.findUniqueOrThrow({
          where: { id: resident.id },
          select: { avatarVersion: true },
        });
        const job = await tx.avatarGeneration.create({
          data: {
            id,
            residentId: resident.id,
            baseAvatarVersion: identity.avatarVersion,
            model: this.provider!.model,
            policyVersion: AVATAR.policyVersion,
            styleVersion: AVATAR.styleVersion,
            dispatchedAt: new Date(),
            expiresAt: new Date(Date.now() + AVATAR.candidateTtlMs),
          },
        });
        return { job, dispatch: true };
      });
      if (!reserved.dispatch) return this.view(reserved.job);
      const keys: string[] = [];
      let retained = false;
      try {
        // 取消可以早于上传到达，预先写入的取消记录让同一 id 永不派发。
        const before = await this.getOwn(userId, id);
        if (before.status !== "PENDING") return before;
        const generated = await this.provider.generate(selfie);
        const candidate = await normalizeCandidate(generated);
        const source = await normalizeGeneratedSource(generated);
        keys.push(await this.storage.put(candidate));
        keys.push(await this.storage.put(source));
        const result = await this.locked(async (tx) => {
          const resident = await new ResidentService(tx).requireActive(userId);
          const job = await tx.avatarGeneration.findUniqueOrThrow({
            where: { id },
          });
          if (job.status !== "PENDING" || this.view(job).status !== "PENDING")
            return this.view(job);
          const asset = await tx.mediaAsset.create({
            data: {
              spaceId: resident.spaceId,
              uploadedByUserId: userId,
              storageKey: keys[0],
              mimeType: "image/png",
              sizeBytes: candidate.length,
            },
          });
          const sourceAsset = await tx.mediaAsset.create({
            data: {
              spaceId: resident.spaceId,
              uploadedByUserId: userId,
              storageKey: keys[1],
              mimeType: "image/png",
              sizeBytes: source.length,
            },
          });
          const ready = await tx.avatarGeneration.update({
            where: { id },
            data: {
              status: "READY",
              candidateMediaAssetId: asset.id,
              sourceMediaAssetId: sourceAsset.id,
            },
          });
          return this.view(ready);
        });
        retained = result.status === "READY";
        return result;
      } catch (error) {
        await this.db.avatarGeneration.updateMany({
          where: { id, status: "PENDING" },
          data: { status: "FAILED" },
        });
        throw error;
      } finally {
        if (!retained) await this.removeFiles(keys);
      }
    } finally {
      selfie.fill(0);
    }
  }
  // 数据库切换完成后删除失败交给孤儿扫描重试，不能把已成功的确认报告成失败。
  private async removeFiles(keys: string[]) {
    for (const key of keys) {
      try {
        await this.storage.remove(key);
      } catch {
        console.error("AVATAR_FILE_CLEANUP_FAILED");
      }
    }
  }
  async confirmOwn(userId: string, id: string) {
    z.string().uuid().parse(id);
    const oldKeys = await this.locked(async (tx) => {
      const resident = await new ResidentService(tx).requireActive(userId);
      const identity = await tx.resident.findUniqueOrThrow({
        where: { id: resident.id },
        include: { avatarMediaAsset: true },
      });
      const job = await tx.avatarGeneration.findFirst({
        where: { id, residentId: resident.id },
        include: { candidateMediaAsset: true, sourceMediaAsset: true },
      });
      if (job?.status === "CONFIRMED") return [];
      if (
        !job ||
        this.view(job).status !== "READY" ||
        !job.candidateMediaAsset ||
        job.baseAvatarVersion !== identity.avatarVersion
      )
        throw new AvatarNotAvailableError();
      // 新资源全部可读后再切换。旧版迁移来的候选可能没有高分辨率源图。
      await this.storage.get(job.candidateMediaAsset.storageKey);
      if (job.sourceMediaAsset)
        await this.storage.get(job.sourceMediaAsset.storageKey);
      const previous = identity.avatarMediaAssetId
        ? await tx.avatarGeneration.findUnique({
            where: { confirmedMediaAssetId: identity.avatarMediaAssetId },
            include: { sourceMediaAsset: true },
          })
        : null;
      await tx.resident.update({
        where: { id: resident.id },
        data: {
          avatarMediaAssetId: job.candidateMediaAssetId,
          avatarVersion: { increment: 1 },
        },
      });
      await tx.avatarGeneration.update({
        where: { id },
        data: {
          status: "CONFIRMED",
          confirmedMediaAssetId: job.candidateMediaAssetId,
          candidateMediaAssetId: null,
        },
      });
      const obsolete = [
        identity.avatarMediaAsset,
        previous?.sourceMediaAsset,
      ].filter((x) => x != null);
      for (const asset of obsolete)
        await tx.mediaAsset.delete({ where: { id: asset.id } });
      return obsolete.map((asset) => asset.storageKey);
    });
    await this.removeFiles(oldKeys);
    return { confirmed: true };
  }
  async cancelOwn(userId: string, id: string) {
    z.string().uuid().parse(id);
    const oldKeys = await this.locked(async (tx) => {
      const resident = await new ResidentService(tx).requireActive(userId);
      const job = await tx.avatarGeneration.findUnique({
        where: { id },
        include: { candidateMediaAsset: true, sourceMediaAsset: true },
      });
      if (job && job.residentId !== resident.id)
        throw new AvatarNotAvailableError();
      if (job?.status === "CONFIRMED") return [];
      if (!job) {
        await tx.avatarGeneration.create({
          data: {
            id,
            residentId: resident.id,
            status: "CANCELLED",
            baseAvatarVersion: 0,
            model: "not-dispatched",
            policyVersion: AVATAR.policyVersion,
            expiresAt: new Date(),
          },
        });
        return [];
      }
      await tx.avatarGeneration.update({
        where: { id },
        data: {
          status: "CANCELLED",
          candidateMediaAssetId: null,
          sourceMediaAssetId: null,
        },
      });
      const obsolete = [job.candidateMediaAsset, job.sourceMediaAsset].filter(
        (x) => x != null,
      );
      for (const asset of obsolete)
        await tx.mediaAsset.delete({ where: { id: asset.id } });
      return obsolete.map((asset) => asset.storageKey);
    });
    await this.removeFiles(oldKeys);
    return { cancelled: true };
  }
  async readCandidate(userId: string, id: string) {
    const resident = await new ResidentService(this.db).requireActive(userId);
    await this.cleanup(new Date(), resident.id);
    const job = await this.db.avatarGeneration.findFirst({
      where: {
        id,
        residentId: resident.id,
        status: "READY",
        expiresAt: { gt: new Date() },
      },
      include: { candidateMediaAsset: true },
    });
    if (!job?.candidateMediaAsset) throw new AvatarNotAvailableError();
    return this.storage.get(job.candidateMediaAsset.storageKey);
  }
  async readAsset(userId: string, id: string) {
    const resident = await new ResidentService(this.db).requireActive(userId);
    const asset = await this.db.mediaAsset.findFirst({
      where: {
        id,
        spaceId: resident.spaceId,
        avatarOwner: { is: { status: "ACTIVE", spaceId: resident.spaceId } },
      },
    });
    if (!asset) throw new AvatarNotAvailableError();
    return this.storage.get(asset.storageKey);
  }
  async cleanup(now = new Date(), residentId?: string) {
    const keys = await this.locked(async (tx) => {
      const jobs = await tx.avatarGeneration.findMany({
        where: {
          residentId,
          OR: [
            { status: { in: ["READY", "PENDING"] }, expiresAt: { lte: now } },
            {
              status: "PENDING",
              createdAt: { lte: new Date(now.getTime() - AVATAR.pendingTtlMs) },
            },
            {
              status: { in: ["READY", "PENDING"] },
              resident: {
                OR: [{ status: "LEFT" }, { space: { status: "ARCHIVED" } }],
              },
            },
          ],
        },
        include: { candidateMediaAsset: true, sourceMediaAsset: true },
        take: 100,
      });
      const removed: string[] = [];
      for (const job of jobs) {
        await tx.avatarGeneration.update({
          where: { id: job.id },
          data: {
            status: job.expiresAt <= now ? "EXPIRED" : "FAILED",
            candidateMediaAssetId: null,
            sourceMediaAssetId: null,
          },
        });
        for (const asset of [job.candidateMediaAsset, job.sourceMediaAsset]) {
          if (!asset) continue;
          await tx.mediaAsset.delete({ where: { id: asset.id } });
          removed.push(asset.storageKey);
        }
      }
      await tx.avatarGeneration.deleteMany({
        where: {
          residentId,
          createdAt: { lt: new Date(now.getTime() - 7 * 24 * 60 * 60_000) },
          OR: [
            { status: { in: ["FAILED", "CANCELLED", "EXPIRED"] } },
            {
              status: "CONFIRMED",
              confirmedMediaAssetId: null,
              sourceMediaAssetId: null,
            },
          ],
        },
      });
      return removed;
    });
    await this.removeFiles(keys);
  }
}
