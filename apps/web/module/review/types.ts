export type ConversationMessage = {
  id: string;
  role: "USER" | "ASSISTANT";
  message: string;
  createdAt?: string;
  kind?: "message" | "activity";
  activity?: {
    name: string;
    label: string;
    status: "running" | "completed" | "failed" | "waiting_for_approval";
    action?: { approvalId: string; label: string; toolName?: string };
  };
};

export type ReviewChatResponse = {
  reviewId: string;
  messages: ConversationMessage[];
};
