/*
  Warnings:

  - You are about to drop the `chat` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "chat" DROP CONSTRAINT "chat_reviewId_fkey";

-- DropTable
DROP TABLE "chat";

-- CreateTable
CREATE TABLE "conversation_message" (
    "id" TEXT NOT NULL,
    "reviewId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "role" "ConversationRole" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conversation_message_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "conversation_message_reviewId_createdAt_idx" ON "conversation_message"("reviewId", "createdAt");

-- AddForeignKey
ALTER TABLE "conversation_message" ADD CONSTRAINT "conversation_message_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "review"("id") ON DELETE CASCADE ON UPDATE CASCADE;
