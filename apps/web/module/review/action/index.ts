"use server"

import { auth } from "@repo/auth/server"
import { prisma } from "@repo/db"
import { headers } from "next/headers"


export const getReview = async() => {
  const session = await auth.api.getSession({
    headers: await headers()
  })

  if(!session){
    throw new Error("Unauthorized")
  }

  const reviews = await prisma.review.findMany({
    where:{
      repository:{
        userId: session.user.id
      }
    },
    include:{
      repository: true
    },
    orderBy:{
      createdAt: "desc"
    },
    take: 50
  })

  return reviews;
}