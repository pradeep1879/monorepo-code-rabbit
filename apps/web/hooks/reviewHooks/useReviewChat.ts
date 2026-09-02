import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ConversationMessage } from "@/module/review/types";

export const reviewChatQueryKey = (reviewId: string) => [
  "review",
  reviewId,
  "chat",
];

export const useReviewChat = (reviewId: string, enabled: boolean) =>
  useQuery({
    queryKey: reviewChatQueryKey(reviewId),
    queryFn: async () => {
      const response = await fetch(
        `/api/chat?reviewId=${encodeURIComponent(reviewId)}`,
      );
      if (!response.ok) throw new Error("Unable to load this conversation");
      return response.json() as Promise<ConversationMessage[]>;
    },
    enabled: enabled && Boolean(reviewId),
  });

export const useSendReviewChatMessage = (reviewId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ message }: { message: string }) => {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, reviewId }),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(body?.error ?? "Unable to send message");
      }
      if (!response.body)
        throw new Error("Streaming is not supported by this browser");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantText = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        assistantText += decoder.decode(value, { stream: true });
        queryClient.setQueryData<ConversationMessage[]>(
          reviewChatQueryKey(reviewId),
          (current = []) =>
            current.map((item) =>
              item.id === "streaming-assistant"
                ? { ...item, message: assistantText }
                : item,
            ),
        );
      }
      const finalText = decoder.decode();
      if (finalText) {
        assistantText += finalText;
        queryClient.setQueryData<ConversationMessage[]>(
          reviewChatQueryKey(reviewId),
          (current = []) =>
            current.map((item) =>
              item.id === "streaming-assistant"
                ? { ...item, message: assistantText }
                : item,
            ),
        );
      }
      return assistantText;
    },
    onMutate: async ({ message }) => {
      await queryClient.cancelQueries({
        queryKey: reviewChatQueryKey(reviewId),
      });
      const previous = queryClient.getQueryData<ConversationMessage[]>(
        reviewChatQueryKey(reviewId),
      );
      const userMessage: ConversationMessage = {
        id: `user-${Date.now()}`,
        role: "USER",
        message,
      };
      const assistantMessage: ConversationMessage = {
        id: "streaming-assistant",
        role: "ASSISTANT",
        message: "",
      };
      queryClient.setQueryData<ConversationMessage[]>(
        reviewChatQueryKey(reviewId),
        (current = []) => [...current, userMessage],
      );
      queryClient.setQueryData<ConversationMessage[]>(
        reviewChatQueryKey(reviewId),
        (current = []) => [...current, assistantMessage],
      );
      return { previous };
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: reviewChatQueryKey(reviewId),
      });
    },
    onError: (_error, _variables, context) => {
      queryClient.setQueryData(
        reviewChatQueryKey(reviewId),
        context?.previous ?? [],
      );
    },
  });
};
