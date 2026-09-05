ALTER TYPE "AvatarGenerationStatus" ADD VALUE 'EXPIRED';
ALTER TABLE "AvatarGeneration"
 ADD COLUMN "confirmedMediaAssetId" TEXT,
 ADD COLUMN "sourceMediaAssetId" TEXT,
 ADD COLUMN "styleVersion" TEXT NOT NULL DEFAULT 'pixel-big-head-b6fe15a-v1';
CREATE UNIQUE INDEX "AvatarGeneration_confirmedMediaAssetId_key" ON "AvatarGeneration"("confirmedMediaAssetId");
CREATE UNIQUE INDEX "AvatarGeneration_sourceMediaAssetId_key" ON "AvatarGeneration"("sourceMediaAssetId");
ALTER TABLE "AvatarGeneration" ADD CONSTRAINT "AvatarGeneration_confirmedMediaAssetId_fkey" FOREIGN KEY ("confirmedMediaAssetId") REFERENCES "MediaAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AvatarGeneration" ADD CONSTRAINT "AvatarGeneration_sourceMediaAssetId_fkey" FOREIGN KEY ("sourceMediaAssetId") REFERENCES "MediaAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;
-- 兼容已经确认的旧头像，不改变 Resident 指针或丢弃现有文件。
UPDATE "AvatarGeneration" SET "confirmedMediaAssetId" = "candidateMediaAssetId", "candidateMediaAssetId" = NULL WHERE "status" = 'CONFIRMED';
