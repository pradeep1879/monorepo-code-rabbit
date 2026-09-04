import { ai } from "@/lib/gemini";
import { prisma } from "@repo/db";
import type { Content, FunctionCall, Part } from "@google/genai";
import {
  chatToolDeclarations,
  executeChatTool,
  type ChatToolEvent,
} from "@/module/chat/chat-tools";

export { approveCreateBranch } from "@/module/chat/chat-tools";

const getSafeAgentError = (error: unknown) => {
  const raw = error instanceof Error ? error.message : String(error);
  if (
    raw.includes("429") ||
    raw.includes("RESOURCE_EXHAUSTED") ||
    raw.toLowerCase().includes("quota exceeded") ||
    raw.toLowerCase().includes("rate limit")
  )
    return "The AI service is temporarily rate-limited. Please wait a few seconds and try again.";
  if (raw.includes("403") || raw.toLowerCase().includes("permission denied"))
    return "The AI service denied this request. Please check the configured API key and project permissions.";
  if (
    raw.includes("401") ||
    raw.toLowerCase().includes("api key not valid") ||
    raw.toLowerCase().includes("unauthenticated")
  )
    return "The Gemini API key is invalid or unavailable. Please check GOOGLE_GENERATIVE_AI_API_KEY.";
  if (
    raw.includes("404") ||
    raw.toLowerCase().includes("model not found") ||
    raw.toLowerCase().includes("not_found")
  )
    return "The selected Gemini model is unavailable for this API project. Try gemini-2.5-flash or verify the model name.";
  if (
    raw.includes("400") ||
    raw.toLowerCase().includes("invalid argument") ||
    raw.toLowerCase().includes("invalid request")
  )
    return "Gemini rejected the chat request. Check that the selected model supports streaming and function calling.";
  return raw.length > 240 ? "The AI request failed. Please try again." : raw;
};

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

export const getChatMessagesForUser = async (
  reviewId: string,
  userId: string,
) => {
  const review = await getReviewForUser(reviewId, userId);
  if (!review) throw new Error("Review not found");
  const [messages, pendingApprovals] = await Promise.all([
    prisma.conversationMessage.findMany({
      where: { reviewId },
      orderBy: { createdAt: "asc" },
      select: { id: true, role: true, message: true, createdAt: true },
    }),
    prisma.agentApproval.findMany({
      where: {
        reviewId,
        userId,
        status: "pending",
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "asc" },
      select: { id: true, toolName: true },
    }),
  ]);

  return [
    ...messages.map((message) => ({
      ...message,
      createdAt: message.createdAt.toISOString(),
    })),
    ...pendingApprovals.map((approval) => ({
      id: `approval-${approval.id}`,
      role: "ASSISTANT" as const,
      message: "",
      kind: "activity" as const,
      activity: {
        name: approval.toolName,
        label: "Approval required",
        status: "waiting_for_approval" as const,
        action: {
          approvalId: approval.id,
          label:
            approval.toolName === "apply_patch"
              ? "Apply changes"
              : approval.toolName === "commit_changes"
                ? "Commit changes"
                : approval.toolName === "create_pull_request"
                  ? "Create pull request"
                  : "Approve create branch",
          toolName: approval.toolName,
        },
      },
    })),
  ];
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
  const approvedBranch = await prisma.agentApproval.findFirst({
    where: { reviewId, userId, toolName: "create_branch", status: "consumed" },
    orderBy: { consumedAt: "desc" },
    select: { payload: true },
  });
  const branchPayload = approvedBranch?.payload as
    | { branchName?: string }
    | undefined;
  const requestedBranch = trimmedMessage.match(
    /\bbranch(?:\s+named)?\s+["'`]?((?:ai\/)[A-Za-z0-9._/-]{1,79})/i,
  )?.[1];

  await prisma.conversationMessage.create({
    data: { reviewId, message: trimmedMessage, role: "USER" },
  });

  const history: Content[] = (await getConversation(reviewId))
    .slice(0, -1)
    .map((item) => ({
      role: item.role === "USER" ? ("user" as const) : ("model" as const),
      parts: [{ text: item.message }],
    }));

  const systemInstruction = `You are an AI code review assistant helping a developer understand pull request #${review.prNumber}.
        PR title: ${review.prTitle}
        PR URL: ${review.prUrl}
        PR review:
        ${review.review}

  Use the review and conversation history as your primary context. Do not invent information. Answer clearly and concisely.
  You may use read-only tools when the review or conversation does not contain enough detail. Never claim to have changed code, created a branch, committed, pushed, or updated a pull request. Repository mutations require the matching tool and explicit user approval. apply_patch creates a GitHub commit because GitHub's file API is commit-based. Use commit_changes for a separate explicitly prepared file commit, and create_pull_request only after the approved branch is ready.`;

  const encoder = new TextEncoder();
  const patchInstruction =
    "When the user explicitly asks for an apply_patch workflow, call get_file and get_pull_request_diff to inspect the real file and PR diff, then immediately call apply_patch with the exact path returned by get_file, the branchName returned by get_file (or the approved working branch), the exact expectedFileSha returned by get_file, and a complete minimal unified diff. The file and SHA must come from the same approved branch. Do not call propose_patch for this workflow because it only provides context and is not an approval request. Never claim that changes were applied before the user approves.";
  const branchInstruction =
    requestedBranch && requestedBranch !== branchPayload?.branchName
      ? `The user explicitly requested branch ${requestedBranch}, but it has not been approved in this conversation. Request create_branch for exactly this branch before preparing apply_patch.`
      : branchPayload?.branchName
        ? "An approved working branch already exists: " +
          branchPayload.branchName +
          ". Do not request another branch; use this branch for apply_patch."
        : "No working branch has been approved yet. Request create_branch only when the user explicitly asks for a new branch.";
  const mutationInstruction =
    "For commit requests, first use get_file on the approved branch, then call commit_changes with the exact current SHA, complete updated file content, and a concise commit message. For pull request requests, use create_pull_request with the approved head branch and the original PR base branch. Both tools pause for explicit approval; never report success before approval.";
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let assistantText = "";
      let completedResponse = false;

      const sendEvent = (event: ChatToolEvent) => {
        controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
      };

      try {
        const contents: Content[] = [
          ...history,
          { role: "user", parts: [{ text: trimmedMessage }] },
        ];

        agentLoop: for (let round = 0; round < 8; round += 1) {
          const response = await ai.models.generateContentStream({
            model: "gemini-3-flash-preview",
            contents,
            config: {
              systemInstruction:
                systemInstruction +
                  patchInstruction +
                  branchInstruction +
                  mutationInstruction,
              tools: [{ functionDeclarations: chatToolDeclarations }],
            },
          });

          const modelParts: Part[] = [];
          const functionCalls: FunctionCall[] = [];
          for await (const chunk of response) {
            const parts = chunk.candidates?.[0]?.content?.parts ?? [];
            modelParts.push(...parts);
            for (const part of parts) {
              if (part.functionCall?.name)
                functionCalls.push(part.functionCall);
              if (part.text && !part.thought) {
                assistantText += part.text;
                controller.enqueue(
                  encoder.encode(
                    JSON.stringify({ type: "text", text: part.text }) + "\n",
                  ),
                );
              }
            }
          }

          if (!functionCalls.length) {
            completedResponse = true;
            break;
          }

          contents.push({ role: "model", parts: modelParts });
          const functionResponses = [];
          for (const call of functionCalls) {
            const name = call.name || "unknown_tool";
            const label = name.replaceAll("_", " ");
            const activityId = `tool-${call.id || `${round}-${name}`}`;
            sendEvent({
              type: "tool",
              id: activityId,
              name,
              label: `Using ${label}…`,
              status: "running",
            });
            try {
              const output = await executeChatTool(name, call.args ?? {}, {
                reviewId,
                userId,
                requestedBranch,
              });
              functionResponses.push({
                functionResponse: { id: call.id, name, response: { output } },
              });
              sendEvent({
                type: "tool",
                id: activityId,
                name,
                label: `Used ${label}`,
                status: "completed",
              });
              const approvalOutput = output as {
                approvalRequired?: boolean;
                approvalId?: string;
              };
              if (
                approvalOutput.approvalRequired &&
                approvalOutput.approvalId
              ) {
                sendEvent({
                  type: "tool",
                  id: activityId,
                  name,
                  label: `Approval required for ${label}`,
                  status: "waiting_for_approval",
                  action: {
                    approvalId: approvalOutput.approvalId,
                    label: `Approve ${label}`,
                    toolName: name,
                  },
                });
                const approvalMessage =
                  name === "apply_patch"
                    ? "The proposed changes are waiting for your explicit approval."
                    : name === "commit_changes"
                      ? "The commit is waiting for your explicit approval."
                      : name === "create_pull_request"
                        ? "The pull request creation is waiting for your explicit approval."
                        : "The branch creation is waiting for your explicit approval.";
                assistantText += approvalMessage;
                completedResponse = true;
                controller.enqueue(
                  encoder.encode(
                    JSON.stringify({ type: "text", text: approvalMessage }) +
                      "\n",
                  ),
                );
                break agentLoop;
              }
            } catch (error) {
              const message =
                error instanceof Error ? error.message : "Tool failed";
              functionResponses.push({
                functionResponse: {
                  id: call.id,
                  name,
                  response: { error: message },
                },
              });
              sendEvent({
                type: "tool",
                id: activityId,
                name,
                label: `Unable to use ${label}: ${message.slice(0, 120)}`,
                status: "failed",
              });
            }
          }
          contents.push({ role: "user", parts: functionResponses });
        }

        if (!completedResponse) {
          assistantText =
            "I could not complete that tool-assisted request. Please retry with the exact repository-relative file path.";
          controller.enqueue(
            encoder.encode(
              JSON.stringify({ type: "text", text: assistantText }) + "\n",
            ),
          );
        }

        await prisma.conversationMessage.create({
          data: { reviewId, message: assistantText, role: "ASSISTANT" },
        });
        controller.close();
      } catch (error) {
        const message = getSafeAgentError(error);
        controller.enqueue(
          encoder.encode(JSON.stringify({ type: "error", message }) + "\n"),
        );
        controller.close();
      }
    },
  });

  return stream;
};
