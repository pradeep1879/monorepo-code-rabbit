"use server";

import { inngest } from "@/inngest/client";
import { prisma } from "@repo/db";

export const reviewPullRequest = async (
  owner: string,
  repo: string,
  prNumber: number
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

    const githubAccount =
      repository.user.accounts[0];

    if (!githubAccount?.accessToken) {
      throw new Error(
        "No GitHub access token found"
      );
    }

    console.log("Sending Inngest event:", {
      owner,
      repo,
      prNumber,
      userId: repository.user.id,
    });

    const result = await inngest.send({
      name: "pr.review.request",

      data: {
        owner,
        repo,
        prNumber,
        userId: repository.user.id,
      },
    });

    console.log(
      "Inngest event sent successfully:",
      result
    );

    return {
      success: true,
      message: "Review queued",
    };
  } catch (error) {
    console.error(
      "Failed to queue PR review:",
      error
    );

    throw error;
  }
};