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
      let approvalPending = false;
      let buffer = "";
      const applyEvent = (line: string) => {
        if (!line.trim()) return;
        const event = JSON.parse(line) as
          | { type: "text"; text: string }
          | { type: "error"; message: string }
          | {
              type: "tool";
              id?: string;
              name: string;
              label: string;
              status:
                | "running"
                | "completed"
                | "failed"
                | "waiting_for_approval";
              action?: { approvalId: string; label: string; toolName?: string };
            };
        if (event.type === "error") {
          throw new Error(event.message);
        }
        if (event.type === "text") {
          assistantText += event.text;
          queryClient.setQueryData<ConversationMessage[]>(
            reviewChatQueryKey(reviewId),
            (current = []) =>
              current.map((item) =>
                item.id === "streaming-assistant"
                  ? { ...item, message: assistantText }
                  : item,
              ),
          );
          return;
        }
        const id = event.id ?? `tool-${event.name}`;
        if (event.status === "waiting_for_approval") approvalPending = true;
        queryClient.setQueryData<ConversationMessage[]>(
          reviewChatQueryKey(reviewId),
          (current = []) => {
            const activity: ConversationMessage = {
              id,
              role: "ASSISTANT",
              message: "",
              kind: "activity",
              activity: {
                name: event.name,
                label: event.label,
                status: event.status,
                action: event.action,
              },
            };
            const existing = current.findIndex((item) => item.id === id);
            if (existing < 0) return [...current, activity];
            return current.map((item, index) =>
              index === existing ? activity : item,
            );
          },
        );
      };
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) applyEvent(line);
      }
      buffer += decoder.decode();
      applyEvent(buffer);
      return { assistantText, approvalPending };
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
    onSuccess: async ({ approvalPending }) => {
      if (approvalPending) return;
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

export const useApproveChatAction = (reviewId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      approvalId,
      toolName,
    }: {
      approvalId: string;
      toolName?: string;
    }) => {
      const response = await fetch("/api/chat", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approvalId, toolName }),
      });
      const body = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;
      if (!response.ok)
        throw new Error(body?.error ?? "Unable to approve action");
      return { approvalId, result: body };
    },
    onSuccess: async ({ approvalId }) => {
      queryClient.setQueryData<ConversationMessage[]>(
        reviewChatQueryKey(reviewId),
        (current = []) =>
          current.map((item) =>
            item.activity?.action?.approvalId === approvalId
              ? {
                  ...item,
                  activity: {
                    ...item.activity,
                    label: "Branch created",
                    status: "completed" as const,
                    action: undefined,
                  },
                }
              : item,
          ),
      );
      await queryClient.invalidateQueries({
        queryKey: reviewChatQueryKey(reviewId),
      });
    },
  });
};
