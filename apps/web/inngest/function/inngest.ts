import { prisma } from "@repo/db";
import { inngest } from "../client";
import { getRepoFileContents } from "@/module/github/lib/github";
import { indexCodebase } from "@/module/ai/lib/rag";


export const processTask = inngest.createFunction(
  { id: "process-task", triggers: { event: "app/task.created" } },
  async ({ event, step }) => {
    const result = await step.run("handle-task", async () => {
      return { processed: true, id: event.data.id };
    });

    await step.sleep("pause", "1s");

    return { message: `Task ${event.data.id} complete`, result };
  }
);


export const indexRepo =  inngest.createFunction(
  {
    id: "index-repo",

    triggers: [
      {
        event: "repository.connected",
      },
    ],
  },

  async ({ event, step }) => {
    const { owner, repo, userId } = event.data;
    const repositoryWhere = { owner, name: repo, userId };

    await step.run("mark-indexing", async () => {
      await prisma.repository.updateMany({
        where: repositoryWhere,
        data: { indexingStatus: "processing", indexingError: null },
      });
    });

    try {
      const files = await step.run("fetch-file", async () => {
        const account = await prisma.account.findFirst({
          where: { userId, providerId: "github" },
        });

        if (!account?.accessToken) throw new Error("No Github access token found");
        return await getRepoFileContents(account.accessToken, owner, repo);
      });

      await step.run("index-codebase", async () => {
        await indexCodebase(`${owner}/${repo}`, files);
      });

      await step.run("mark-indexed", async () => {
        await prisma.repository.updateMany({
          where: repositoryWhere,
          data: { indexingStatus: "completed", indexingError: null },
        });
      });

      return { success: true, indexedFiles: files.length };
    } catch (error) {
      await prisma.repository.updateMany({
        where: repositoryWhere,
        data: {
          indexingStatus: "failed",
          indexingError: error instanceof Error ? error.message : "Indexing failed",
        },
      });
      throw error;
    }
  }
)
