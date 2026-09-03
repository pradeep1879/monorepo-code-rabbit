"use client";

import { useMemo } from "react";
import {
  useDashboardStats,
  useMonthlyActivity,
} from "@/hooks/dashbordHooks/useDashboard";

import { useGetReview } from "@/hooks/reviewHooks/usegeReview";
import { DashboardHeader } from "@/module/dashboard/components/DashboardHeader";
import { DashboardKpiCards } from "@/module/dashboard/components/DashboardKpiCards";
import {
  NeedsAttention,
  RecentReviews,
  RepositoryHealth,
  ReviewHealth,
} from "@/module/dashboard/components/DashboardReviewSections";

import { ReviewActivity } from "@/module/dashboard/components/ReviewActivity";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DashboardPage() {

  const stats = useDashboardStats();
  const activity = useMonthlyActivity();
  const reviews = useGetReview();

  const reviewData = useMemo(() => reviews.data ?? [], [reviews.data]);
  const pendingReviews = useMemo(
    () =>
      reviewData.filter(
        (review) => !["completed", "failed"].includes(review.status),
      ).length,
    [reviewData],
  );
  const isLoading = stats.isLoading || reviews.isLoading;

  return (
    <div className="space-y-6">
      <DashboardHeader />
      <DashboardKpiCards
        repositories={stats.data?.totalRepo ?? 0}
        openPrs={stats.data?.totalPrs ?? 0}
        reviews={stats.data?.totalReviews ?? 0}
        pendingReviews={pendingReviews}
        isLoading={isLoading}
      />
      {reviews.isError ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-destructive">
            Unable to load review data.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <NeedsAttention reviews={reviewData} />
          <ReviewHealth reviews={reviewData} />
        </div>
      )}
      <RecentReviews reviews={reviewData} />
      <ReviewActivity data={activity.data} isLoading={activity.isLoading} />
      <RepositoryHealth reviews={reviewData} />
      <Card className="shadow-none">
        <CardHeader>
          <CardTitle>Recent activity</CardTitle>
        </CardHeader>
        <CardContent>
          {reviewData.length ? (
            <div className="space-y-3">
              {reviewData.slice(0, 6).map((review) => (
                <div
                  key={review.id}
                  className="flex items-center gap-3 text-sm"
                >
                  <span className="flex size-7 items-center justify-center rounded-full bg-primary/10">
                    <span className="size-1.5 rounded-full bg-primary" />
                  </span>
                  <span>
                    AI review {review.status} for PR #{review.prNumber} in{" "}
                    {review.repository.name}
                  </span>
                </div>
              ))}
            </div>
          ) : reviews.isLoading ? (
            <Skeleton className="h-24 w-full" />
          ) : (
            <p className="py-5 text-sm text-muted-foreground">
              No recent activity yet.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
