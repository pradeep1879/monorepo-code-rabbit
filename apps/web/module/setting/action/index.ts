"use server";

import { deleteWebhook } from "@/module/github/lib/github";
import { auth } from "@repo/auth/server";
import { prisma } from "@repo/db";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

export const getUserProfile = async () => {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      throw new Error("Unauthorized");
    }

    const user = await prisma.user.findUnique({
      where: {
        id: session.user.id,
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        createdAt: true,
      },
    });

    return user;
  } catch (error) {
    console.error("Error while fetching user profile:", error);
    return null;
  }
};

export const updateUserProfile = async (
  {
    name,
    email
  }:{
  name?: string;
  email?: string;
}) => {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      throw new Error("Unauthorized");
    }

    const updateUser = await prisma.user.update({
      where: {
        id: session.user.id,
      },
      data: {
        name: name,
        email: email,
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    revalidatePath("/dashboard/settings", "page");

    return {
      success: true,
      user: updateUser,
    };
  } catch (error) {
    console.error("Error while fetching user profile:", error);
    return { success: false, error: "Failed to update profile" };
  }
};



export const getConnectedRepositories = async () => {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      throw new Error("Unauthorized");
    }

    const connectedRepos = await prisma.repository.findMany({
      where:{
        userId: session.user.id,
      },
      select:{
        id: true,
        name: true,
        fullName: true,
        url: true,
        createdAt: true
      },
      orderBy:{
        createdAt: "desc"
      }
    })
    return connectedRepos
  } catch (error) {
    console.error("Error while fetching user profile:", error);
    return { success: false, error: "Failed to update profile" };

  }
}


export const diconnectRepository = async (repositoryId:string) => {
  try {
      const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      throw new Error("Unauthorized");
    }

    const repository = await prisma.repository.findUnique({
      where:{
        id: repositoryId,
        userId: session.user.id,
      }
    });
    if(!repository){
      throw new Error("Repository not found")
    }
    await deleteWebhook(repository.owner, repository.name)

    await prisma.repository.delete({
      where: {
        id: repositoryId,
        userId: session.user.id
      }
    });

    revalidatePath("/dashboard/settings" , "page")
    revalidatePath("/dashboard/repository", "page")

    return {success:true}

  } catch {
    return {success:false, error: "Failed to diconnect repository"}
  }
}


export const diconnectAllRepositories = async() => {
  try {
    const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  const repositories = await prisma.repository.findMany({
      where:{
        userId: session.user.id,
      }
    });

    await Promise.all(repositories.map(async (repo) => {
      await deleteWebhook(repo.owner, repo.name)
    }));

    const result = await prisma.repository.deleteMany({
      where:{
        userId: session.user.id
      }
    })

    revalidatePath("/dashboard/settings" , "page")
    revalidatePath("/dashboard/repository", "page")

    return {success: true, count:result.count}
  } catch {
    return {success:false, error: "Failed to diconnect repository"}
  }
}


