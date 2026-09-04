import type { getReview } from "@/module/review/action";

export type ReviewHistoryReview = Awaited<ReturnType<typeof getReview>>[number];
export type StatusFilter = "all" | "completed" | "processing" | "failed";
export type ReviewFinding = ReviewHistoryReview["findings"][number];
