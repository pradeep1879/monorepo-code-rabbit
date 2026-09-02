ALTER TABLE "repository"
ADD COLUMN "indexingStatus" TEXT NOT NULL DEFAULT 'idle',
ADD COLUMN "indexingError" TEXT;

ALTER TABLE "review"
ALTER COLUMN "status" SET DEFAULT 'pending';
