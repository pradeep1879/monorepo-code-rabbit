CREATE TABLE "chat_workflow" (
    "id" TEXT NOT NULL,
    "reviewId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'running',
    "lastTool" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "chat_workflow_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "chat_workflow_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "review"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "chat_workflow_reviewId_userId_status_idx"
ON "chat_workflow"("reviewId", "userId", "status");
