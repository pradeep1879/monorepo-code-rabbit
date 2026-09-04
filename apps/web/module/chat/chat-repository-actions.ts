import { prisma } from "@repo/db";
import {
  createGithubPullRequest,
  getGithubAccesstoken,
  getGithubFile,
  githubBranchExists,
  updateGithubFile,
} from "@/module/github/lib/github";

type ActionRequest = {
  reviewId: string;
  userId: string;
  owner: string;
  repo: string;
};

const expiresAt = () => new Date(Date.now() + 10 * 60 * 1000);

const createApproval = (request: ActionRequest, toolName: string, payload: object) =>
  prisma.agentApproval.create({
    data: {
      userId: request.userId,
      reviewId: request.reviewId,
      toolName,
      payload,
      expiresAt: expiresAt(),
    },
  });

export const requestCommitApproval = async (
  request: ActionRequest & {
    branchName: string;
    filePath: string;
    content: string;
    expectedFileSha: string;
    message: string;
  },
) => {
  const approval = await createApproval(request, "commit_changes", {
    owner: request.owner,
    repo: request.repo,
    branchName: request.branchName,
    filePath: request.filePath,
    content: request.content,
    expectedFileSha: request.expectedFileSha,
    message: request.message,
  });
  return {
    approvalRequired: true,
    approvalId: approval.id,
    branchName: request.branchName,
    filePath: request.filePath,
    status: "WAITING_FOR_APPROVAL",
  };
};

export const requestPullRequestApproval = async (
  request: ActionRequest & {
    headBranch: string;
    baseBranch: string;
    title: string;
    body: string;
  },
) => {
  const approval = await createApproval(request, "create_pull_request", {
    owner: request.owner,
    repo: request.repo,
    headBranch: request.headBranch,
    baseBranch: request.baseBranch,
    title: request.title,
    body: request.body,
  });
  return {
    approvalRequired: true,
    approvalId: approval.id,
    headBranch: request.headBranch,
    baseBranch: request.baseBranch,
    status: "WAITING_FOR_APPROVAL",
  };
};

const claimApproval = async (approvalId: string, userId: string, toolName: string) => {
  const approval = await prisma.agentApproval.findFirst({
    where: { id: approvalId, userId, toolName, status: "pending" },
  });
  if (!approval || approval.expiresAt <= new Date()) throw new Error("APPROVAL_EXPIRED");
  const claimed = await prisma.agentApproval.updateMany({
    where: { id: approval.id, status: "pending" },
    data: { status: "running" },
  });
  if (claimed.count !== 1) throw new Error("APPROVAL_ALREADY_USED");
  return approval;
};

export const approveCommitChanges = async (approvalId: string, userId: string) => {
  const approval = await claimApproval(approvalId, userId, "commit_changes");
  const payload = approval.payload as {
    owner: string;
    repo: string;
    branchName: string;
    filePath: string;
    content: string;
    expectedFileSha: string;
    message: string;
  };
  try {
    const token = await getGithubAccesstoken();
    const current = await getGithubFile(
      token,
      payload.owner,
      payload.repo,
      payload.filePath,
      payload.branchName,
    );
    if (current.sha !== payload.expectedFileSha) throw new Error("STALE_SHA");
    const result = await updateGithubFile(
      token,
      payload.owner,
      payload.repo,
      payload.filePath,
      payload.content,
      current.sha,
      payload.branchName,
      payload.message,
    );
    await prisma.agentApproval.update({
      where: { id: approval.id },
      data: { status: "consumed", consumedAt: new Date() },
    });
    await prisma.conversationMessage.create({
      data: {
        reviewId: approval.reviewId,
        role: "ASSISTANT",
        message: `Committed ${payload.filePath} to branch ${payload.branchName}.`,
      },
    });
    return { ...result, status: "COMPLETED" };
  } catch (error) {
    await prisma.agentApproval.update({
      where: { id: approval.id },
      data: { status: "failed" },
    });
    throw new Error(error instanceof Error ? error.message : "COMMIT_FAILED");
  }
};

export const approveCreatePullRequest = async (approvalId: string, userId: string) => {
  const approval = await claimApproval(approvalId, userId, "create_pull_request");
  const payload = approval.payload as {
    owner: string;
    repo: string;
    headBranch: string;
    baseBranch: string;
    title: string;
    body: string;
  };
  try {
    const token = await getGithubAccesstoken();
    if (!(await githubBranchExists(token, payload.owner, payload.repo, payload.headBranch)))
      throw new Error("BRANCH_NOT_FOUND");
    const result = await createGithubPullRequest(
      token,
      payload.owner,
      payload.repo,
      payload.headBranch,
      payload.baseBranch,
      payload.title,
      payload.body,
    );
    await prisma.agentApproval.update({
      where: { id: approval.id },
      data: { status: "consumed", consumedAt: new Date() },
    });
    await prisma.conversationMessage.create({
      data: {
        reviewId: approval.reviewId,
        role: "ASSISTANT",
        message: `Pull request #${result.number} was created from ${payload.headBranch} into ${payload.baseBranch}.`,
      },
    });
    return { ...result, status: "COMPLETED" };
  } catch (error) {
    await prisma.agentApproval.update({
      where: { id: approval.id },
      data: { status: "failed" },
    });
    const message = error instanceof Error ? error.message : "PULL_REQUEST_FAILED";
    if (message.includes("already exists")) throw new Error("PULL_REQUEST_ALREADY_EXISTS");
    throw new Error(message);
  }
};
