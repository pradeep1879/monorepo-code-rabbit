import { ai } from "@/lib/gemini";
import { prisma } from "@repo/db";

const getReviewForUser = async (reviewId: string, userId: string) =>
  prisma.review.findFirst({
    where: { id: reviewId, repository: { userId } },
    select: {
      id: true,
      prNumber: true,
      prTitle: true,
      prUrl: true,
      review: true,
    },
  });

const getConversation = async (reviewId: string) =>
  prisma.conversationMessage.findMany({
    where: { reviewId },
    orderBy: { createdAt: "asc" },
    select: { message: true, role: true },
  });

export const getChatMessagesForUser = async (reviewId: string, userId: string) => {
  const review = await getReviewForUser(reviewId, userId);
  if (!review) throw new Error("Review not found");

  const messages = await prisma.conversationMessage.findMany({
    where: { reviewId },
    orderBy: { createdAt: "asc" },
    select: { id: true, role: true, message: true, createdAt: true },
  });

  return messages.map((message) => ({
    ...message,
    createdAt: message.createdAt.toISOString(),
  }));
};

export const createChatStream = async ({
  message,
  reviewId,
  userId,
}: {
  message: string;
  reviewId: string;
  userId: string;
}) => {
  const trimmedMessage = message.trim();
  if (!trimmedMessage || trimmedMessage.length > 4000) {
    throw new Error("Message must be between 1 and 4000 characters");
  }

  const review = await getReviewForUser(reviewId, userId);
  if (!review) throw new Error("Review not found");

  await prisma.conversationMessage.create({
    data: { reviewId, message: trimmedMessage, role: "USER" },
  });

  const history = (await getConversation(reviewId))
    .slice(0, -1)
    .map((item) => ({
      role: item.role === "USER" ? ("user" as const) : ("model" as const),
      parts: [{ text: item.message }],
    }));

  const chat = ai.chats.create({
    model: "gemini-3-flash-preview",
    config: {
      systemInstruction: `You are an AI code review assistant helping a developer understand pull request #${review.prNumber}.
        PR title: ${review.prTitle}
        PR URL: ${review.prUrl}
        PR review:
        ${review.review}

  Use the review and conversation history as your primary context. Do not invent information. Answer clearly and concisely.`,
    },
    history,
  });

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let assistantText = "";

      try {
        const response = await chat.sendMessageStream({
          message: trimmedMessage,
        });
        for await (const chunk of response) {
          const text = chunk.text ?? "";
          if (!text) continue;
          assistantText += text;
          controller.enqueue(encoder.encode(text));
        }

        if (!assistantText) throw new Error("Failed to generate AI response");

        await prisma.conversationMessage.create({
          data: { reviewId, message: assistantText, role: "ASSISTANT" },
        });
        controller.close();
      } catch (error) {
        controller.error(error);
      }
    },
  });

  return stream;
};
