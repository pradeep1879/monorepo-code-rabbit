import { createWebhook } from "@/module/github/lib/github"
import { auth } from "@repo/auth/server"
import { prisma } from "@repo/db"
import { headers } from "next/headers"

export const connectReposiory = async (owner:string, repo:string, githubId:number) => {
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