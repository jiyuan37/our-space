-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "SpaceStatus" AS ENUM ('ACTIVE', 'ARCHIVED');
CREATE TYPE "ResidentRole" AS ENUM ('OWNER', 'RESIDENT');
CREATE TYPE "ResidentStatus" AS ENUM ('ACTIVE', 'LEFT');
CREATE TYPE "LifePointVisibility" AS ENUM ('PRIVATE', 'SHARED_WITH_RESIDENT', 'SHARED_WITH_HOME');
CREATE TYPE "LifePointStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'REMOVED');
CREATE TYPE "MediaType" AS ENUM ('IMAGE', 'AUDIO');
CREATE TYPE "ResponseType" AS ENUM ('TEXT', 'IMAGE', 'RECEIVED', 'HOLD_FOR_LATER');
CREATE TYPE "InvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'EXPIRED', 'REVOKED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT,
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Space" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "SpaceStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdByUserId" TEXT NOT NULL,
    "archivedAt" TIMESTAMP(3),
    "archivedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Space_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Space_lifecycle_check" CHECK (
        ("status" = 'ACTIVE' AND "archivedAt" IS NULL AND "archivedByUserId" IS NULL)
        OR ("status" = 'ARCHIVED' AND "archivedAt" IS NOT NULL)
    )
);

CREATE TABLE "Resident" (
    "id" TEXT NOT NULL,
    "spaceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "role" "ResidentRole" NOT NULL,
    "status" "ResidentStatus" NOT NULL DEFAULT 'ACTIVE',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leftAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Resident_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Resident_lifecycle_check" CHECK (
        ("status" = 'ACTIVE' AND "leftAt" IS NULL)
        OR ("status" = 'LEFT' AND "leftAt" IS NOT NULL)
    )
);

CREATE TABLE "Presence" (
    "id" TEXT NOT NULL,
    "residentId" TEXT NOT NULL,
    "shortText" TEXT,
    "mood" TEXT,
    "context" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Presence_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "LifePoint" (
    "id" TEXT NOT NULL,
    "spaceId" TEXT NOT NULL,
    "residentId" TEXT NOT NULL,
    "text" TEXT,
    "mediaAssetId" TEXT,
    "mediaType" "MediaType",
    "visibility" "LifePointVisibility" NOT NULL DEFAULT 'SHARED_WITH_HOME',
    "status" "LifePointStatus" NOT NULL DEFAULT 'DRAFT',
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "LifePoint_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "LifePoint_content_check" CHECK (
        "text" IS NOT NULL OR "mediaAssetId" IS NOT NULL
    ),
    CONSTRAINT "LifePoint_media_type_check" CHECK (
        ("mediaAssetId" IS NULL AND "mediaType" IS NULL)
        OR ("mediaAssetId" IS NOT NULL AND "mediaType" IS NOT NULL)
    )
);

CREATE TABLE "Response" (
    "id" TEXT NOT NULL,
    "lifePointId" TEXT NOT NULL,
    "residentId" TEXT NOT NULL,
    "text" TEXT,
    "mediaAssetId" TEXT,
    "responseType" "ResponseType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Response_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Response_payload_check" CHECK (
        ("responseType" = 'TEXT' AND "text" IS NOT NULL AND "mediaAssetId" IS NULL)
        OR ("responseType" = 'IMAGE' AND "mediaAssetId" IS NOT NULL)
        OR ("responseType" IN ('RECEIVED', 'HOLD_FOR_LATER') AND "text" IS NULL AND "mediaAssetId" IS NULL)
    )
);

CREATE TABLE "SharedMoment" (
    "id" TEXT NOT NULL,
    "spaceId" TEXT NOT NULL,
    "lifePointId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastVisitedAt" TIMESTAMP(3),
    "visitCount" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "SharedMoment_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "SharedMoment_visit_count_check" CHECK ("visitCount" >= 0)
);

CREATE TABLE "Invitation" (
    "id" TEXT NOT NULL,
    "spaceId" TEXT NOT NULL,
    "email" TEXT,
    "token" TEXT NOT NULL,
    "status" "InvitationStatus" NOT NULL DEFAULT 'PENDING',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acceptedAt" TIMESTAMP(3),
    CONSTRAINT "Invitation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MediaAsset" (
    "id" TEXT NOT NULL,
    "spaceId" TEXT NOT NULL,
    "uploadedByUserId" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MediaAsset_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "MediaAsset_size_check" CHECK ("sizeBytes" > 0)
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE INDEX "Space_status_idx" ON "Space"("status");
CREATE INDEX "Space_createdByUserId_idx" ON "Space"("createdByUserId");
CREATE INDEX "Resident_spaceId_status_idx" ON "Resident"("spaceId", "status");
CREATE INDEX "Resident_userId_status_idx" ON "Resident"("userId", "status");
CREATE UNIQUE INDEX "Resident_spaceId_userId_key" ON "Resident"("spaceId", "userId");

-- 一个 User 在 MVP 中最多只能有一条活跃 Resident 记录。
CREATE UNIQUE INDEX "Resident_one_active_space_per_user_key"
ON "Resident"("userId")
WHERE "status" = 'ACTIVE';

CREATE UNIQUE INDEX "Presence_residentId_key" ON "Presence"("residentId");
CREATE UNIQUE INDEX "LifePoint_mediaAssetId_key" ON "LifePoint"("mediaAssetId");
CREATE INDEX "LifePoint_spaceId_status_occurredAt_idx" ON "LifePoint"("spaceId", "status", "occurredAt");
CREATE INDEX "LifePoint_residentId_status_idx" ON "LifePoint"("residentId", "status");
CREATE INDEX "LifePoint_spaceId_visibility_status_idx" ON "LifePoint"("spaceId", "visibility", "status");
CREATE UNIQUE INDEX "Response_mediaAssetId_key" ON "Response"("mediaAssetId");
CREATE INDEX "Response_lifePointId_createdAt_idx" ON "Response"("lifePointId", "createdAt");
CREATE INDEX "Response_residentId_idx" ON "Response"("residentId");
CREATE UNIQUE INDEX "SharedMoment_lifePointId_key" ON "SharedMoment"("lifePointId");
CREATE INDEX "SharedMoment_spaceId_createdAt_idx" ON "SharedMoment"("spaceId", "createdAt");
CREATE INDEX "SharedMoment_spaceId_lastVisitedAt_idx" ON "SharedMoment"("spaceId", "lastVisitedAt");
CREATE UNIQUE INDEX "Invitation_token_key" ON "Invitation"("token");
CREATE INDEX "Invitation_spaceId_status_idx" ON "Invitation"("spaceId", "status");
CREATE INDEX "Invitation_expiresAt_status_idx" ON "Invitation"("expiresAt", "status");
CREATE UNIQUE INDEX "MediaAsset_storageKey_key" ON "MediaAsset"("storageKey");
CREATE INDEX "MediaAsset_spaceId_createdAt_idx" ON "MediaAsset"("spaceId", "createdAt");
CREATE INDEX "MediaAsset_uploadedByUserId_idx" ON "MediaAsset"("uploadedByUserId");

-- AddForeignKey
ALTER TABLE "Space" ADD CONSTRAINT "Space_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Space" ADD CONSTRAINT "Space_archivedByUserId_fkey" FOREIGN KEY ("archivedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Resident" ADD CONSTRAINT "Resident_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "Space"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Resident" ADD CONSTRAINT "Resident_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Presence" ADD CONSTRAINT "Presence_residentId_fkey" FOREIGN KEY ("residentId") REFERENCES "Resident"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "LifePoint" ADD CONSTRAINT "LifePoint_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "Space"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "LifePoint" ADD CONSTRAINT "LifePoint_residentId_fkey" FOREIGN KEY ("residentId") REFERENCES "Resident"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "LifePoint" ADD CONSTRAINT "LifePoint_mediaAssetId_fkey" FOREIGN KEY ("mediaAssetId") REFERENCES "MediaAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Response" ADD CONSTRAINT "Response_lifePointId_fkey" FOREIGN KEY ("lifePointId") REFERENCES "LifePoint"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Response" ADD CONSTRAINT "Response_residentId_fkey" FOREIGN KEY ("residentId") REFERENCES "Resident"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Response" ADD CONSTRAINT "Response_mediaAssetId_fkey" FOREIGN KEY ("mediaAssetId") REFERENCES "MediaAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SharedMoment" ADD CONSTRAINT "SharedMoment_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "Space"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SharedMoment" ADD CONSTRAINT "SharedMoment_lifePointId_fkey" FOREIGN KEY ("lifePointId") REFERENCES "LifePoint"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "Space"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MediaAsset" ADD CONSTRAINT "MediaAsset_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "Space"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MediaAsset" ADD CONSTRAINT "MediaAsset_uploadedByUserId_fkey" FOREIGN KEY ("uploadedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
