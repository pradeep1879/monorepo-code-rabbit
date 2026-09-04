"use server";

import { auth } from "@repo/auth/server";
import { prisma } from "@repo/db";
import { headers } from "next/headers";
import {
  findingStatuses,
  type FindingStatus,
} from "@/module/review/lib/findings";

export const getReview = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  const reviews = await prisma.review.findMany({
    where: {
      repository: {
        userId: session.user.id,
      },
    },
    include: {
      repository: true,
      findings: {
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 50,
  });

  return reviews;
};

export const updateReviewFindingStatus = async (
  findingId: string,
  status: FindingStatus,
) => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user) throw new Error("Unauthorized");
  if (!findingStatuses.includes(status))
    throw new Error("Invalid finding status");

  const finding = await prisma.reviewFinding.findFirst({
    where: {
      id: findingId,
      review: { repository: { userId: session.user.id } },
    },
    select: { id: true },
  });
  if (!finding) throw new Error("Finding not found");

  return prisma.reviewFinding.update({
    where: { id: finding.id },
    data: {
      status,
      resolvedAt: status === "resolved" ? new Date() : null,
    },
  });
};
