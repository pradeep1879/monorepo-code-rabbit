import { ChevronUp } from "lucide-react";
import { ReviewMarkdown } from "@/module/review/components/ReviewMarkdown";
import { ReviewFindings } from "@/module/review/components/ReviewFindings";
import type { ReviewHistoryReview } from "@/module/review/components/ReviewHistoryTypes";

export function ExpandedReview({
  review,
  onCollapse,
}: {
  review: ReviewHistoryReview;
  onCollapse: () => void;
}) {
  return (
    <div className="border-t bg-muted/10 px-4 py-5 sm:px-6 sm:py-6">
      <div className="max-w-4xl">
        <ReviewMarkdown content={review.review} />
        <ReviewFindings findings={review.findings} />
        <button
          type="button"
          onClick={onCollapse}
          className="mt-5 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
        >
          Show less
          <ChevronUp className="size-3" />
        </button>
      </div>
    </div>
  );
}
