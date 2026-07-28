ALTER TABLE "Invitation" RENAME COLUMN "token" TO "tokenHash";

ALTER INDEX "Invitation_token_key" RENAME TO "Invitation_tokenHash_key";

ALTER TABLE "Invitation"
ADD CONSTRAINT "Invitation_acceptance_lifecycle_check" CHECK (
  ("status" = 'ACCEPTED' AND "acceptedAt" IS NOT NULL)
  OR ("status" <> 'ACCEPTED' AND "acceptedAt" IS NULL)
);

CREATE UNIQUE INDEX "Invitation_one_pending_per_space_key"
ON "Invitation" ("spaceId")
WHERE "status" = 'PENDING';
