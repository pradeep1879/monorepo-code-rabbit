import { ChevronDown, ChevronUp, ExternalLink, GitBranchIcon } from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { ReviewTable } from "@/module/review/components/ReviewTable";
import type { ReviewHistoryReview } from "@/module/review/components/ReviewHistoryTypes";

export function ReviewRepositoryGroup({ repositoryId, reviews, isCollapsed, expandedReviews, onToggleRepository, onToggleReview }: { repositoryId: string; reviews: ReviewHistoryReview[]; isCollapsed: boolean; expandedReviews: Set<string>; onToggleRepository: (repositoryId: string) => void; onToggleReview: (reviewId: string) => void }) {
  const repository = reviews[0]?.repository;
  if (!repository) return null;
  return <Card className="gap-0 overflow-hidden py-0"><div className="flex flex-col gap-3 border-b px-4 py-4 sm:flex-row sm:items-center sm:justify-between"><button type="button" onClick={() => onToggleRepository(repositoryId)} className="flex items-center gap-3 text-left"><span className="flex size-8 items-center justify-center rounded-lg border bg-muted/50 text-muted-foreground"><GitBranchIcon className="size-4" /></span><span className="font-semibold">{repository.name}</span><span className="text-sm text-muted-foreground">{reviews.length} {reviews.length === 1 ? "review" : "reviews"}</span>{isCollapsed ? <ChevronDown className="size-4 text-muted-foreground" /> : <ChevronUp className="size-4 text-muted-foreground" />}</button><Link href={repository.url} target="_blank" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground sm:mr-1"><span>View repository</span><ExternalLink className="size-3.5" /></Link></div>{!isCollapsed && <ReviewTable reviews={reviews} expandedReviews={expandedReviews} onToggleReview={onToggleReview} />}</Card>;
}
