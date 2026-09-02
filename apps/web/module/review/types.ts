export type ConversationMessage = {
  id: string;
  role: "USER" | "ASSISTANT";
  message: string;
  createdAt?: string;
};

export type ReviewChatResponse = {
  reviewId: string;
  messages: ConversationMessage[];
};
