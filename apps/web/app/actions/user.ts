"use server";

import { prisma } from "@repo/db";



export async function createUser() {
  await prisma.user.create({
    data: {
      email: "test1@gmail.com",
      name: "Pradeep1",
    },
  });
}

export async function getUser() {
  return prisma.user.findMany()
}