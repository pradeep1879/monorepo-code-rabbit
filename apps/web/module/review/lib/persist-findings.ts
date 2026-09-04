import { prisma } from "@repo/db";
import { parseReviewFindings } from "./findings";

export const persistReviewFindings = async (
  reviewId: string,
  review: string,
) => {
  const findings = parseReviewFindings(review);

  await prisma.$transaction([
    prisma.reviewFinding.deleteMany({ where: { reviewId } }),
    ...(findings.length
      ? [
          prisma.reviewFinding.createMany({
            data: findings.map((finding) => ({
              reviewId,
              ...finding,
            })),
          }),
        ]
      : []),
  ]);

  return findings.length;
};

export const backfillMissingReviewFindings = async (userId: string) => {
  const reviews = await prisma.review.findMany({
    where: {
      status: "completed",
      repository: { userId },
      findings: { none: {} },
    },
    select: { id: true, review: true },
    take: 100,
  });

  await Promise.all(
    reviews
      .filter((review) => review.review.trim())
      .map((review) => persistReviewFindings(review.id, review.review)),
  );
};
