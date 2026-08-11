"use server"
import { inngest } from "@/inngest/client"
import { createWebhook, getRepositories } from "@/module/github/lib/github"
import { auth } from "@repo/auth/server"
import { prisma } from "@repo/db"
import { headers } from "next/headers"

export const connectRepository = async (owner:string, repo:string, githubId:number | string) => {
  const  session = await auth.api.getSession({
    headers: await headers()
  })

  if(!session?.user){
    throw new Error("Unauthorized")
  }

  // chech if user can connect repository

  const webhook = await createWebhook(owner, repo)

  if(webhook){
    await prisma.repository.create({
     data:{
      githubId: BigInt(githubId),
      fullName:`${owner}/${repo}`,
      name: repo,
      owner,
      url: `https://github.com/${owner}/${repo}`,
      userId: session.user.id
     }     
    });
    // increase repo count for usage tracking
    // trigger repository indexing for RAG(fire and forget)

    try {
      await inngest.send({
        name: "repository.connected",
        data:{
          owner,
          repo,
          userId: session.user.id
        }
      })
    } catch (error) {
      console.log("Failed to trigger repo indexing:", error)
    }
    console.log("Repository connected successfully");
  }

  return webhook
}

export const fetchRepositories = async (page:number = 1, perPage:number = 10) => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  const githubRepos = await getRepositories(page, perPage);

  const dbRepos = await prisma.repository.findMany({
    where:{
      userId: session.user.id
    }
  });

  const connectedRepoIds = new Set(
    dbRepos.map((repo) => repo.githubId.toString())
  );


  return githubRepos.map((repo) => ({
    ...repo,
    isConnected: connectedRepoIds.has(repo.id.toString())
  }));


}