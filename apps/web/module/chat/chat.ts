"use server";

import { auth } from "@repo/auth/server";
import { headers } from "next/headers";
import { getChatMessagesForUser } from "@/module/chat/chat-server";

const getSession = async () => auth.api.getSession({ headers: await headers() });

export const getChatMessages = async (reviewId: string) => {
  const session = await getSession();
  if (!session?.user) throw new Error("Unauthorized");

  return getChatMessagesForUser(reviewId, session.user.id);
};
