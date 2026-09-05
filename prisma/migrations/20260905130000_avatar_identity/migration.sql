ALTER TABLE "Resident" ADD COLUMN "avatarMediaAssetId" TEXT, ADD COLUMN "avatarVersion" INTEGER NOT NULL DEFAULT 0;
CREATE UNIQUE INDEX "Resident_avatarMediaAssetId_key" ON "Resident"("avatarMediaAssetId");
ALTER TABLE "Resident" ADD CONSTRAINT "Resident_avatarMediaAssetId_fkey" FOREIGN KEY ("avatarMediaAssetId") REFERENCES "MediaAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE TYPE "AvatarGenerationStatus" AS ENUM ('PENDING', 'READY', 'CONFIRMED', 'CANCELLED', 'FAILED');
CREATE TABLE "AvatarGeneration" (
 "id" UUID NOT NULL, "residentId" TEXT NOT NULL,
 "status" "AvatarGenerationStatus" NOT NULL DEFAULT 'PENDING',
 "candidateMediaAssetId" TEXT, "baseAvatarVersion" INTEGER NOT NULL,
 "model" TEXT NOT NULL, "policyVersion" TEXT NOT NULL,
 "dispatchedAt" TIMESTAMP(3), "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "expiresAt" TIMESTAMP(3) NOT NULL,
 CONSTRAINT "AvatarGeneration_pkey" PRIMARY KEY ("id"),
 CONSTRAINT "AvatarGeneration_residentId_fkey" FOREIGN KEY ("residentId") REFERENCES "Resident"("id") ON DELETE CASCADE ON UPDATE CASCADE,
 CONSTRAINT "AvatarGeneration_candidateMediaAssetId_fkey" FOREIGN KEY ("candidateMediaAssetId") REFERENCES "MediaAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "AvatarGeneration_candidateMediaAssetId_key" ON "AvatarGeneration"("candidateMediaAssetId");
CREATE INDEX "AvatarGeneration_residentId_createdAt_idx" ON "AvatarGeneration"("residentId", "createdAt");
CREATE INDEX "AvatarGeneration_status_expiresAt_idx" ON "AvatarGeneration"("status", "expiresAt");
CREATE INDEX "AvatarGeneration_dispatchedAt_idx" ON "AvatarGeneration"("dispatchedAt");
