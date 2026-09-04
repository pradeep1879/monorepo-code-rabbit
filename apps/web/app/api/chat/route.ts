import {
  createChatStream,
  getChatMessagesForUser,
} from "@/module/chat/chat-server";
import {
  approveApplyPatch,
  approveCommitChanges,
  approveCreateBranch,
  approveCreatePullRequest,
} from "@/module/chat/chat-tools";
import { auth } from "@repo/auth/server";
import { prisma } from "@repo/db";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = (await request.json()) as {
      message?: unknown;
      reviewId?: unknown;
    };
    if (typeof body.message !== "string" || typeof body.reviewId !== "string") {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const stream = await createChatStream({
      message: body.message,
      reviewId: body.reviewId,
      userId: session.user.id,
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "application/x-ndjson; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    const status =
      message === "Review not found"
        ? 404
        : message.startsWith("Message must")
          ? 400
          : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const reviewId = new URL(request.url).searchParams.get("reviewId");
    if (!reviewId)
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });

    return NextResponse.json(
      await getChatMessagesForUser(reviewId, session.user.id),
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { error: message },
      { status: message === "Review not found" ? 404 : 500 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = (await request.json()) as {
      approvalId?: unknown;
      toolName?: unknown;
    };
    if (typeof body.approvalId !== "string")
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    const approval = await prisma.agentApproval.findFirst({
      where: { id: body.approvalId, userId: session.user.id },
      select: { toolName: true },
    });
    if (!approval)
      return NextResponse.json({ error: "APPROVAL_EXPIRED" }, { status: 409 });
    const toolName = approval.toolName;
    const result =
      toolName === "apply_patch"
        ? await approveApplyPatch(body.approvalId, session.user.id)
        : toolName === "commit_changes"
          ? await approveCommitChanges(body.approvalId, session.user.id)
          : toolName === "create_pull_request"
            ? await approveCreatePullRequest(body.approvalId, session.user.id)
            : toolName === "create_branch"
              ? await approveCreateBranch(body.approvalId, session.user.id)
              : (() => {
                  throw new Error("UNKNOWN_APPROVAL_TOOL");
                })();
    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    const status =
      message === "APPROVAL_EXPIRED"
        ? 409
        : message === "Unauthorized"
          ? 401
          : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
