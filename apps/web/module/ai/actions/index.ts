"use server";

import { inngest } from "@/inngest/client";
import { canCreateReview, incrementReviewCount } from "@/module/payment/lib/subscription";
import { prisma } from "@repo/db";

export const reviewPullRequest = async (
  owner: string,
  repo: string,
  prNumber: number,
  prTitle?: string,
  prUrl?: string,
) => {
  try {
    const repository = await prisma.repository.findFirst({
      where: {
        owner,
        name: repo,
      },
      include: {
        user: {
          include: {
            accounts: {
              where: {
                providerId: "github",
              },
            },
          },
        },
      },
    });

    if (!repository) {
      throw new Error(
        `Repository ${owner}/${repo} not found in database`
      );
    }

    const canReview = await canCreateReview(repository.user.id, repository.id);
    if(!canReview){
      throw new Error("Review limit reached for this repository. Please upgrade your plan.")
    }

    const githubAccount =
      repository.user.accounts[0];

    if (!githubAccount?.accessToken) {
      throw new Error(
        "No GitHub access token found"
      );
    }

    const latestReview = await prisma.review.findFirst({
      where: { repositoryId: repository.id, prNumber },
      orderBy: { createdAt: "desc" },
    });

    const reviewRecord = latestReview?.status === "processing"
      ? latestReview
      : await prisma.review.create({
          data: {
            repositoryId: repository.id,
            prNumber,
            prTitle: prTitle || `Pull request #${prNumber}`,
            prUrl: prUrl || `https://github.com/${owner}/${repo}/pull/${prNumber}`,
            review: "",
            status: "processing",
          },
        });

    console.log("Sending Inngest event:", {
      owner,
      repo,
      prNumber,
      userId: repository.user.id,
      reviewId: reviewRecord.id,
    });

    const result = await inngest.send({
      name: "pr.review.request",

      data: {
        owner,
        repo,
        prNumber,
        userId: repository.user.id,
        reviewId: reviewRecord.id,
      },
    });

    console.log(
      "Inngest event sent successfully:",
      result
    );
    
    await incrementReviewCount(repository.user.id, repository.id);

    return {
      success: true,
      message: "Review queued",
      reviewId: reviewRecord.id,
    };
  } catch (error) {
    console.error(
      "Failed to queue PR review:",
      error
    );

    throw error;
  }
};
