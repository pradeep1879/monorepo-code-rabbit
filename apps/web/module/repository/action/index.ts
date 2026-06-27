import { createWebhook, getRepositories } from "@/module/github/lib/github"
import { auth } from "@repo/auth/server"
import { prisma } from "@repo/db"
import { headers } from "next/headers"

export const connectRepository = async (owner:string, repo:string, githubId:number) => {
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

    // trigger repository indexing for RAG
    try {
      
    } catch (error) {
      
    }
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


  return githubRepos.map((repo:any) => ({
    ...repo,
    isConnected: connectedRepoIds.has(repo.id.toString())
  }));


}