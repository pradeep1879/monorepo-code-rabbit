import { Fragment } from "react";
import { ExpandedReview } from "@/module/review/components/ExpandedReview";
import { ReviewTableRow } from "@/module/review/components/ReviewTableRow";
import type { ReviewHistoryReview } from "@/module/review/components/ReviewHistoryTypes";

export function ReviewTable({ reviews, expandedReviews, onToggleReview }: { reviews: ReviewHistoryReview[]; expandedReviews: Set<string>; onToggleReview: (reviewId: string) => void }) {
  return <div className="overflow-x-hidden"><table className="w-full table-fixed lg:min-w-230"><thead className="hidden bg-muted/20 text-[11px] font-medium uppercase tracking-wide text-muted-foreground lg:table-header-group"><tr><th className="w-[25%] px-4 py-3 text-left">Pull Request</th><th className="w-[34%] px-4 py-3 text-left">Review Summary</th><th className="w-[14%] px-4 py-3 text-left">Status</th><th className="w-[16%] px-4 py-3 text-left">Reviewed At</th><th className="w-12 px-4 py-3" aria-label="Actions" /></tr></thead><tbody className="block lg:table-row-group">{reviews.map((review) => { const isExpanded = expandedReviews.has(review.id); return <Fragment key={review.id}><ReviewTableRow review={review} isExpanded={isExpanded} onExpand={() => onToggleReview(review.id)} />{isExpanded && <tr className="border-b last:border-0"><td colSpan={5} className="block p-0 lg:table-cell"><ExpandedReview review={review} onCollapse={() => onToggleReview(review.id)} /></td></tr>}</Fragment>; })}</tbody></table></div>;
}
