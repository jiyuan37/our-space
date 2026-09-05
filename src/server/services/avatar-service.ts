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
import { normalizeSelfie, normalizeCandidate } from "@/server/avatar/images";
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
        ? "FAILED"
        : job.status;
    return {
      id: job.id,
      status,
      candidateUrl:
        status === "READY" && job.candidateMediaAssetId
          ? `/api/avatar/assets/${job.candidateMediaAssetId}`
          : null,
      expiresAt: job.expiresAt.toISOString(),
    };
  }
  async getOwn(userId: string, id: string) {
    const resident = await new ResidentService(this.db).requireActive(userId);
    const job = await this.db.avatarGeneration.findFirst({
      where: { id: z.string().uuid().parse(id), residentId: resident.id },
    });
    if (!job) throw new AvatarNotAvailableError();
    return this.view(job);
  }
  async latestOwn(userId: string) {
    const resident = await new ResidentService(this.db).requireActive(userId);
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
            dispatchedAt: new Date(),
            expiresAt: new Date(Date.now() + AVATAR.candidateTtlMs),
          },
        });
        return { job, dispatch: true };
      });
      if (!reserved.dispatch) return this.view(reserved.job);
      let key: string | null = null;
      let retained = false;
      try {
        // 取消可以早于上传到达，预先写入的取消记录让同一 id 永不派发。
        const before = await this.getOwn(userId, id);
        if (before.status !== "PENDING") return before;
        const generated = await this.provider.generate(selfie);
        const candidate = await normalizeCandidate(generated);
        key = await this.storage.put(candidate);
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
              storageKey: key!,
              mimeType: "image/png",
              sizeBytes: candidate.length,
            },
          });
          const ready = await tx.avatarGeneration.update({
            where: { id },
            data: { status: "READY", candidateMediaAssetId: asset.id },
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
        if (key && !retained) await this.storage.remove(key);
      }
    } finally {
      selfie.fill(0);
    }
  }
  async confirmOwn(userId: string, id: string) {
    z.string().uuid().parse(id);
    const oldKey = await this.locked(async (tx) => {
      const resident = await new ResidentService(tx).requireActive(userId);
      const identity = await tx.resident.findUniqueOrThrow({
        where: { id: resident.id },
        include: { avatarMediaAsset: true },
      });
      const job = await tx.avatarGeneration.findFirst({
        where: { id, residentId: resident.id },
        include: { candidateMediaAsset: true },
      });
      if (job?.status === "CONFIRMED") return null; // 幂等确认不重新覆盖任何版本。
      if (
        !job ||
        this.view(job).status !== "READY" ||
        !job.candidateMediaAsset ||
        job.baseAvatarVersion !== identity.avatarVersion
      )
        throw new AvatarNotAvailableError();
      // 丢失文件时拒绝确认，旧身份继续有效。
      await this.storage.get(job.candidateMediaAsset.storageKey);
      await tx.resident.update({
        where: { id: resident.id },
        data: {
          avatarMediaAssetId: job.candidateMediaAssetId,
          avatarVersion: { increment: 1 },
        },
      });
      await tx.avatarGeneration.update({
        where: { id },
        data: { status: "CONFIRMED" },
      });
      if (identity.avatarMediaAsset)
        await tx.mediaAsset.delete({
          where: { id: identity.avatarMediaAsset.id },
        });
      return identity.avatarMediaAsset?.storageKey ?? null;
    });
    if (oldKey) await this.storage.remove(oldKey);
    return { confirmed: true };
  }
  async cancelOwn(userId: string, id: string) {
    z.string().uuid().parse(id);
    const oldKey = await this.locked(async (tx) => {
      const resident = await new ResidentService(tx).requireActive(userId);
      const job = await tx.avatarGeneration.findUnique({
        where: { id },
        include: { candidateMediaAsset: true },
      });
      if (job && job.residentId !== resident.id)
        throw new AvatarNotAvailableError();
      if (job?.status === "CONFIRMED") return null;
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
        return null;
      }
      await tx.avatarGeneration.update({
        where: { id },
        data: { status: "CANCELLED", candidateMediaAssetId: null },
      });
      if (job.candidateMediaAsset)
        await tx.mediaAsset.delete({
          where: { id: job.candidateMediaAsset.id },
        });
      return job.candidateMediaAsset?.storageKey ?? null;
    });
    if (oldKey) await this.storage.remove(oldKey);
    return { cancelled: true };
  }
  async readAsset(userId: string, id: string) {
    const resident = await new ResidentService(this.db).requireActive(userId);
    const asset = await this.db.mediaAsset.findFirst({
      where: {
        id,
        spaceId: resident.spaceId,
        OR: [
          {
            avatarOwner: {
              is: { status: "ACTIVE", spaceId: resident.spaceId },
            },
          },
          {
            avatarGeneration: {
              is: {
                residentId: resident.id,
                status: "READY",
                expiresAt: { gt: new Date() },
              },
            },
          },
        ],
      },
    });
    if (!asset) throw new AvatarNotAvailableError();
    return this.storage.get(asset.storageKey);
  }
  async cleanup(now = new Date()) {
    const keys = await this.locked(async (tx) => {
      const jobs = await tx.avatarGeneration.findMany({
        where: {
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
        include: { candidateMediaAsset: true },
        take: 100,
      });
      const removed: string[] = [];
      for (const job of jobs) {
        await tx.avatarGeneration.update({
          where: { id: job.id },
          data: { status: "FAILED", candidateMediaAssetId: null },
        });
        if (job.candidateMediaAsset) {
          await tx.mediaAsset.delete({
            where: { id: job.candidateMediaAsset.id },
          });
          removed.push(job.candidateMediaAsset.storageKey);
        }
      }
      await tx.avatarGeneration.deleteMany({
        where: {
          createdAt: { lt: new Date(now.getTime() - 7 * 24 * 60 * 60_000) },
          OR: [
            { status: { in: ["FAILED", "CANCELLED"] } },
            { status: "CONFIRMED", candidateMediaAssetId: null },
          ],
        },
      });
      return removed;
    });
    for (const key of keys) await this.storage.remove(key);
  }
}
