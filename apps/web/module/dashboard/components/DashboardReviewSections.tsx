import { ArrowRight, CheckCircle2, GitBranch, Sparkles } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ReviewHistoryReview } from "@/module/review/components/ReviewHistoryTypes";

const attentionStatus = new Set(["failed", "processing", "pending"]);
const getSummary = (value: string) =>
  value
    .split("\n")
    .map((line) =>
      line.replace(/^#{1,6}\s+|^[-*]\s+|\d+\.\s+|[*_]/g, "").trim(),
    )
    .find(Boolean) ?? "Review details are available.";

export function NeedsAttention({
  reviews,
}: {
  reviews: ReviewHistoryReview[];
}) {
  const items = reviews
    .filter((review) => attentionStatus.has(review.status))
    .slice(0, 5);
  return (
    <Card className="shadow-none">
      <CardHeader>
        <CardTitle>Needs attention</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.length ? (
          items.map((review) => (
            <Link
              key={review.id}
              href={review.prUrl}
              target="_blank"
              className="flex items-center justify-between gap-3 rounded-lg border border-border/60 p-3 transition-colors hover:bg-muted/40"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">
                  PR #{review.prNumber} · {review.prTitle}
                </p>
                <p className="mt-1 truncate text-xs text-muted-foreground">
                  {review.repository.fullName} · {getSummary(review.review)}
                </p>
              </div>
              <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
            </Link>
          ))
        ) : (
          <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
            <CheckCircle2 className="size-4 text-emerald-500" />
            You&apos;re all caught up.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function ReviewHealth({ reviews }: { reviews: ReviewHistoryReview[] }) {
  const counts = { completed: 0, processing: 0, failed: 0 };
  reviews.forEach((review) => {
    if (review.status in counts)
      counts[review.status as keyof typeof counts] += 1;
  });
  return (
    <Card className="shadow-none">
      <CardHeader>
        <CardTitle>Review health</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-3 gap-2">
          {Object.entries(counts).map(([label, count]) => (
            <div key={label} className="rounded-lg border border-border/60 p-3">
              <p className="text-xs capitalize text-muted-foreground">
                {label}
              </p>
              <p className="mt-1 text-xl font-semibold">{count}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          Finding severity and resolution metrics are unavailable because
          findings are not persisted in the current data model.
        </p>
      </CardContent>
    </Card>
  );
}

export function RecentReviews({ reviews }: { reviews: ReviewHistoryReview[] }) {
  return (
    <Card className="shadow-none">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Recent AI reviews</CardTitle>
        <Link
          href="/dashboard/reviews"
          className="text-xs text-primary hover:underline"
        >
          View all
        </Link>
      </CardHeader>
      <CardContent className="space-y-1">
        {reviews.slice(0, 5).map((review) => (
          <Link
            key={review.id}
            href={review.prUrl}
            target="_blank"
            className="flex items-center justify-between gap-3 rounded-lg p-3 hover:bg-muted/40"
          >
            <div className="flex min-w-0 items-center gap-3">
              <Sparkles className="size-4 shrink-0 text-primary" />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">
                  PR #{review.prNumber} · {review.prTitle}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {review.repository.fullName}
                </p>
              </div>
            </div>
            <Badge variant="outline" className="shrink-0 capitalize">
              {review.status}
            </Badge>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}

export function RepositoryHealth({
  reviews,
}: {
  reviews: ReviewHistoryReview[];
}) {
  const groups = new Map<
    string,
    { name: string; count: number; pending: number }
  >();
  reviews.forEach((review) => {
    const current = groups.get(review.repository.id) ?? {
      name: review.repository.name,
      count: 0,
      pending: 0,
    };
    current.count += 1;
    if (attentionStatus.has(review.status)) current.pending += 1;
    groups.set(review.repository.id, current);
  });
  return (
    <Card className="shadow-none">
      <CardHeader>
        <CardTitle>Repository health</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        {[...groups.values()].slice(0, 6).map((repo) => (
          <div
            key={repo.name}
            className="flex items-center justify-between rounded-lg p-3"
          >
            <div className="flex items-center gap-2">
              <GitBranch className="size-4 text-muted-foreground" />
              <span className="text-sm font-medium">{repo.name}</span>
            </div>
            <span className="text-xs text-muted-foreground">
              {repo.count} reviews · {repo.pending} pending
            </span>
          </div>
        ))}
        {!groups.size && (
          <p className="py-5 text-sm text-muted-foreground">
            No repository review data yet.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
