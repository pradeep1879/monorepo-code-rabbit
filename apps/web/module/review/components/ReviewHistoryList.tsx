import type { ReviewHistoryReview } from "@/module/review/components/ReviewHistoryTypes";
import { ReviewRepositoryGroup } from "@/module/review/components/ReviewRepositoryGroup";

export function ReviewHistoryList({ repositoryGroups, collapsedRepositories, expandedReviews, onToggleRepository, onToggleReview }: { repositoryGroups: Array<[string, ReviewHistoryReview[]]>; collapsedRepositories: Set<string>; expandedReviews: Set<string>; onToggleRepository: (repositoryId: string) => void; onToggleReview: (reviewId: string) => void }) {
  return <div className="space-y-5">{repositoryGroups.map(([repositoryId, reviews]) => <ReviewRepositoryGroup key={repositoryId} repositoryId={repositoryId} reviews={reviews} isCollapsed={collapsedRepositories.has(repositoryId)} expandedReviews={expandedReviews} onToggleRepository={onToggleRepository} onToggleReview={onToggleReview} />)}</div>;
}
