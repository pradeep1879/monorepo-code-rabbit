import { inngest } from "../client";

import {
  getPullRequestDiff,
  postReviewComment,
} from "@/module/github/lib/github";

import { retrieveContext } from "@/module/ai/lib/rag";

import { generateText } from "ai";
import { google } from "@ai-sdk/google";
import { prisma } from "@repo/db";


export const generateReview = inngest.createFunction(
    {
      id: "generate-review",

      retries: 2,

      concurrency: {
        limit: 5,
      },

      triggers: {
        event: "pr.review.request",
      },
    },

    async ({ event, step }) => {
      //  console.log(
      //   "generateReview TRIGGERED",
      //   event.data
      // );
      const {
        owner,
        repo,
        prNumber,
        userId,
        reviewId,
      } = event.data;

      if (reviewId) {
        await step.run("mark-reviewing", async () => {
          await prisma.review.updateMany({
            where: { id: reviewId },
            data: { status: "processing" },
          });
        });
      }

      try {
      // Fetch PR data
      const {
        diff,
        title,
        description,
        token,
      } = await step.run(
        "fetch-pr-data",
        async () => {
          const account =
            await prisma.account.findFirst({
              where: {
                userId,
                providerId: "github",
              },
            });

          if (!account?.accessToken) {
            throw new Error(
              "No GitHub access token found"
            );
          }

          const data =
            await getPullRequestDiff(
              account.accessToken,
              owner,
              repo,
              prNumber
            );

          return {
            ...data,
            token: account.accessToken,
          };
        }
      );

      // Retrieve vector context
      const context = await step.run(
        "retrieve-context",
        async () => {
          const query = `${title} ${description ?? ""}`;
          return await retrieveContext(
            query,
            `${owner}/${repo}`
          );
        }
      );

      // Prevent token explosion
      const limitedContext = context
        .join("\n\n")
        .slice(0, 12000);

      // Generate AI review
      const review = await step.run(
        "generate-ai-review",
        async () => {
          const prompt = `
          You are an expert software engineer and code reviewer.

          Analyze this pull request.

          PR TITLE:
          ${title}

          PR DESCRIPTION:
          ${description || "No description"}

          REPOSITORY CONTEXT:
          ${limitedContext}

          CODE DIFF:
          \`\`\`diff
          ${diff}
          \`\`\`

          Provide:

          1. Walkthrough
          2. Summary
          3. Strengths
          4. Issues
          5. Suggestions
          6. Final Verdict
          7. Short Poem

          Format in markdown.
          `;

          const { text } = await generateText({
              model: google(
                "gemini-3-flash-preview"
              ),
              prompt,
            });

          return text;
        }
      );

      // Post GitHub comment
      await step.run(
        "post-comment",
        async () => {
          await postReviewComment(
            token,
            owner,
            repo,
            prNumber,
            review
          );
        }
      );

      // Save review
      await step.run(
        "save-review",
        async () => {
          const repository =
            await prisma.repository.findFirst({
              where: {
                owner,
                name: repo,
              },
            });

          if (repository) {
            if (reviewId) {
              await prisma.review.update({
                where: { id: reviewId },
                data: {
                  prTitle: title,
                  prUrl: `https://github.com/${owner}/${repo}/pull/${prNumber}`,
                  review,
                  status: "completed",
                },
              });
            } else {
              await prisma.review.create({
                data: {
                  repositoryId: repository.id,
                  prNumber,
                  prTitle: title,
                  prUrl: `https://github.com/${owner}/${repo}/pull/${prNumber}`,
                  review,
                  status: "completed",
                },
              });
            }
          }
        }
      );

      return {
        success: true,
      };
      } catch (error) {
        if (reviewId) {
          await prisma.review.updateMany({
            where: { id: reviewId },
            data: { status: "failed" },
          });
        }
        throw error;
      }
    }
);
