CREATE TABLE "review_finding" (
    "id" TEXT NOT NULL,
    "reviewId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'medium',
    "category" TEXT,
    "filePath" TEXT,
    "lineStart" INTEGER,
    "lineEnd" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'open',
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "review_finding_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "review_finding_reviewId_status_idx"
ON "review_finding"("reviewId", "status");

CREATE INDEX "review_finding_severity_idx"
ON "review_finding"("severity");

ALTER TABLE "review_finding"
ADD CONSTRAINT "review_finding_reviewId_fkey"
FOREIGN KEY ("reviewId") REFERENCES "review"("id") ON DELETE CASCADE ON UPDATE CASCADE;
