import { prisma } from "@repo/db";
import {
  getGithubAccesstoken,
  createGithubBranch,
  githubBranchExists,
  getGithubFile,
  updateGithubFile,
  getPullRequest,
  getPullRequestDiff,
  getRepoFileContents,
  searchGithubCode,
} from "@/module/github/lib/github";

export type ChatToolEvent = {
  type: "tool";
  id?: string;
  name: string;
  label: string;
  status: "running" | "completed" | "failed" | "waiting_for_approval";
  action?: { approvalId: string; label: string; toolName?: string };
};

type ToolContext = { reviewId: string; userId: string };
type ToolArgs = Record<string, unknown>;

const declarations = [
  {
    name: "get_pull_request",
    description:
      "Read metadata for the pull request associated with this review.",
    parametersJsonSchema: {
      type: "object",
      properties: {},
      additionalProperties: false,
    },
  },
  {
    name: "get_pull_request_diff",
    description:
      "Read the unified diff for the pull request associated with this review.",
    parametersJsonSchema: {
      type: "object",
      properties: {},
      additionalProperties: false,
    },
  },
  {
    name: "get_file",
    description:
      "Read one file from the pull request repository. Use a repository-relative path.",
    parametersJsonSchema: {
      type: "object",
      properties: { path: { type: "string" } },
      required: ["path"],
      additionalProperties: false,
    },
  },
  {
    name: "search_code",
    description:
      "Search indexed GitHub code for a symbol or text. This is read-only.",
    parametersJsonSchema: {
      type: "object",
      properties: { query: { type: "string" }, repository: { type: "string" } },
      required: ["query"],
      additionalProperties: false,
    },
  },
  {
    name: "get_review",
    description: "Read the complete AI review currently being discussed.",
    parametersJsonSchema: {
      type: "object",
      properties: {},
      additionalProperties: false,
    },
  },
  {
    name: "get_finding",
    description: "Read a specific finding if finding records are available.",
    parametersJsonSchema: {
      type: "object",
      properties: { findingId: { type: "string" } },
      required: ["findingId"],
      additionalProperties: false,
    },
  },
  {
    name: "propose_patch",
    description:
      "Inspect a repository file and the current pull request diff, then prepare context for a minimal unified diff. This never changes the repository.",
    parametersJsonSchema: {
      type: "object",
      properties: {
        filePath: { type: "string" },
        instruction: { type: "string" },
      },
      required: ["filePath", "instruction"],
      additionalProperties: false,
    },
  },
  {
    name: "create_branch",
    description:
      "Request creation of a new safe working branch. This always waits for explicit user approval.",
    parametersJsonSchema: {
      type: "object",
      properties: { branchName: { type: "string" } },
      additionalProperties: false,
    },
  },
  {
    name: "apply_patch",
    description:
      "Request approval to apply a unified diff to the approved AI working branch. This never applies automatically.",
    parametersJsonSchema: {
      type: "object",
      properties: {
        filePath: { type: "string" },
        branchName: { type: "string" },
        expectedFileSha: { type: "string" },
        patch: { type: "string" },
      },
      required: ["filePath", "branchName", "expectedFileSha", "patch"],
      additionalProperties: false,
    },
  },
];

const requireString = (args: ToolArgs, key: string) => {
  const value = args[key];
  if (typeof value !== "string" || !value.trim())
    throw new Error(`Invalid ${key}`);
  return value.trim();
};

const requireSafePath = (args: ToolArgs) => {
  const path = requireString(args, "filePath");
  if (path.startsWith("/") || path.split("/").includes(".."))
    throw new Error("Invalid repository file path");
  return path;
};

const safeBranchName = (value: string) => {
  if (
    !/^[A-Za-z0-9][A-Za-z0-9._/-]{0,79}$/.test(value) ||
    value.includes("..") ||
    value.endsWith("/") ||
    value.includes("//")
  )
    throw new Error("Invalid branch name");
  return value;
};

const getReviewContext = (context: ToolContext) =>
  prisma.review.findFirst({
    where: { id: context.reviewId, repository: { userId: context.userId } },
    select: {
      review: true,
      prNumber: true,
      prTitle: true,
      repository: { select: { owner: true, name: true, fullName: true } },
    },
  });

export const chatToolDeclarations = declarations;

export const executeChatTool = async (
  name: string,
  args: ToolArgs,
  context: ToolContext,
) => {
  const review = await getReviewContext(context);
  if (!review) throw new Error("Review not found");
  const token = await getGithubAccesstoken();

  switch (name) {
    case "get_pull_request":
      return getPullRequest(
        token,
        review.repository.owner,
        review.repository.name,
        review.prNumber,
      );
    case "get_pull_request_diff": {
      const result = await getPullRequestDiff(
        token,
        review.repository.owner,
        review.repository.name,
        review.prNumber,
      );
      return {
        ...result,
        diff: result.diff.slice(0, 24000),
        truncated: result.diff.length > 24000,
      };
    }
    case "get_file": {
      const path = requireString(args, "path");
      const files = await getRepoFileContents(
        token,
        review.repository.owner,
        review.repository.name,
        path,
      );
      return files[0]
        ? {
            ...files[0],
            content: files[0].content.slice(0, 16000),
            truncated: files[0].content.length > 16000,
          }
        : { path, content: "File not found" };
    }
    case "search_code":
      return searchGithubCode(
        token,
        requireString(args, "query"),
        typeof args.repository === "string"
          ? args.repository
          : review.repository.fullName,
      );
    case "get_review":
      return {
        prNumber: review.prNumber,
        title: review.prTitle,
        review: review.review,
      };
    case "propose_patch": {
      const filePath = requireSafePath(args);
      const instruction = requireString(args, "instruction");
      const [file, pullRequest] = await Promise.all([
        getGithubFile(
          token,
          review.repository.owner,
          review.repository.name,
          filePath,
        ),
        getPullRequestDiff(
          token,
          review.repository.owner,
          review.repository.name,
          review.prNumber,
        ),
      ]);
      return {
        type: "patch_context",
        filePath: file.path,
        expectedFileSha: file.sha,
        instruction,
        currentFile: file.content.slice(0, 20000),
        pullRequestDiff: pullRequest.diff.slice(0, 24000),
        truncated:
          file.content.length > 20000 || pullRequest.diff.length > 24000,
        approvalRequired: true,
        applied: false,
      };
    }
    case "create_branch": {
      const pullRequest = await getPullRequest(
        token,
        review.repository.owner,
        review.repository.name,
        review.prNumber,
      );
      const requested =
        typeof args.branchName === "string" && args.branchName.trim()
          ? args.branchName.trim()
          : `ai/fix-pr-${review.prNumber}`;
      const branchName = safeBranchName(requested);
      if (
        branchName === pullRequest.base ||
        ["main", "master", "production"].includes(branchName)
      )
        throw new Error("Protected branch cannot be modified");
      if (
        await githubBranchExists(
          token,
          review.repository.owner,
          review.repository.name,
          branchName,
        )
      )
        throw new Error("BRANCH_ALREADY_EXISTS");
      const approval = await prisma.agentApproval.create({
        data: {
          userId: context.userId,
          reviewId: context.reviewId,
          toolName: name,
          payload: {
            owner: review.repository.owner,
            repo: review.repository.name,
            baseBranch: pullRequest.base,
            branchName,
          },
          expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        },
      });
      return {
        approvalRequired: true,
        approvalId: approval.id,
        branchName,
        baseBranch: pullRequest.base,
        status: "WAITING_FOR_APPROVAL",
      };
    }
    case "apply_patch": {
      const filePath = requireSafePath({ filePath: args.filePath });
      const branchName = safeBranchName(requireString(args, "branchName"));
      const expectedFileSha = requireString(args, "expectedFileSha");
      const patch = requireString(args, "patch");
      const pullRequest = await getPullRequest(
        token,
        review.repository.owner,
        review.repository.name,
        review.prNumber,
      );
      if (
        branchName === pullRequest.base ||
        ["main", "master", "production"].includes(branchName)
      )
        throw new Error("Protected branch cannot be modified");
      const file = await getGithubFile(
        token,
        review.repository.owner,
        review.repository.name,
        filePath,
        branchName,
      );
      if (file.sha !== expectedFileSha) throw new Error("STALE_SHA");
      if (
        !patch.includes("@@ ") ||
        !patch.includes("--- ") ||
        !patch.includes("+++ ")
      )
        throw new Error("PATCH_INVALID");
      const approval = await prisma.agentApproval.create({
        data: {
          userId: context.userId,
          reviewId: context.reviewId,
          toolName: name,
          payload: {
            owner: review.repository.owner,
            repo: review.repository.name,
            branchName,
            filePath,
            expectedFileSha,
            patch,
          },
          expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        },
      });
      return {
        approvalRequired: true,
        approvalId: approval.id,
        filePath,
        branchName,
        status: "WAITING_FOR_APPROVAL",
      };
    }
    case "get_finding":
      return {
        error: "FINDING_NOT_AVAILABLE",
        message:
          "This installation does not persist individual finding records yet.",
      };
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
};

export const approveCreateBranch = async (
  approvalId: string,
  userId: string,
) => {
  const approval = await prisma.agentApproval.findFirst({
    where: {
      id: approvalId,
      userId,
      toolName: "create_branch",
      status: "pending",
    },
  });
  if (!approval || approval.expiresAt <= new Date())
    throw new Error("APPROVAL_EXPIRED");
  const claimed = await prisma.agentApproval.updateMany({
    where: { id: approval.id, status: "pending" },
    data: { status: "running" },
  });
  if (claimed.count !== 1) throw new Error("APPROVAL_ALREADY_USED");
  const payload = approval.payload as {
    owner: string;
    repo: string;
    baseBranch: string;
    branchName: string;
  };
  const token = await getGithubAccesstoken();
  try {
    const result = await createGithubBranch(
      token,
      payload.owner,
      payload.repo,
      payload.baseBranch,
      payload.branchName,
    );
    await prisma.agentApproval.update({
      where: { id: approval.id },
      data: { status: "consumed", consumedAt: new Date() },
    });
    await prisma.conversationMessage.create({
      data: {
        reviewId: approval.reviewId,
        role: "ASSISTANT",
        message: `Branch ${payload.branchName} was created successfully. It is the approved working branch for the next change.`,
      },
    });
    return result;
  } catch (error) {
    await prisma.agentApproval.update({
      where: { id: approval.id },
      data: { status: "failed" },
    });
    const message =
      error instanceof Error ? error.message : "Branch creation failed";
    if (message.includes("Reference already exists"))
      throw new Error("BRANCH_ALREADY_EXISTS");
    throw new Error("BRANCH_CREATION_FAILED");
  }
};

export const approveApplyPatch = async (approvalId: string, userId: string) => {
  const approval = await prisma.agentApproval.findFirst({
    where: {
      id: approvalId,
      userId,
      toolName: "apply_patch",
      status: "pending",
    },
  });
  if (!approval || approval.expiresAt <= new Date())
    throw new Error("APPROVAL_EXPIRED");
  const claimed = await prisma.agentApproval.updateMany({
    where: { id: approval.id, status: "pending" },
    data: { status: "running" },
  });
  if (claimed.count !== 1) throw new Error("APPROVAL_ALREADY_USED");
  const payload = approval.payload as {
    owner: string;
    repo: string;
    branchName: string;
    filePath: string;
    expectedFileSha: string;
    patch: string;
  };
  const token = await getGithubAccesstoken();
  const file = await getGithubFile(
    token,
    payload.owner,
    payload.repo,
    payload.filePath,
    payload.branchName,
  );
  if (file.sha !== payload.expectedFileSha) {
    await prisma.agentApproval.update({
      where: { id: approval.id },
      data: { status: "failed" },
    });
    throw new Error("STALE_SHA");
  }
  const { applyUnifiedPatch } = await import("@/module/chat/patch-application");
  let updatedContent: string;
  try {
    updatedContent = applyUnifiedPatch(
      file.content,
      payload.patch,
      payload.filePath,
    );
  } catch (error) {
    await prisma.agentApproval.update({
      where: { id: approval.id },
      data: { status: "failed" },
    });
    throw error;
  }
  let result;
  try {
    result = await updateGithubFile(
      token,
      payload.owner,
      payload.repo,
      payload.filePath,
      updatedContent,
      file.sha,
      payload.branchName,
      "fix: apply AI review changes",
    );
  } catch {
    await prisma.agentApproval.update({
      where: { id: approval.id },
      data: { status: "failed" },
    });
    throw new Error("GITHUB_UPDATE_FAILED");
  }
  await prisma.agentApproval.update({
    where: { id: approval.id },
    data: { status: "consumed", consumedAt: new Date() },
  });
  await prisma.conversationMessage.create({
    data: {
      reviewId: approval.reviewId,
      role: "ASSISTANT",
      message: `Changes were applied to ${payload.filePath} on branch ${payload.branchName}. They are not committed or pushed yet.`,
    },
  });
  return { ...result, status: "COMPLETED" };
};
