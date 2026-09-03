import { GitBranch, GitPullRequest, ListChecks, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function DashboardKpiCards({
  repositories,
  openPrs,
  reviews,
  pendingReviews,
  isLoading,
}: {
  repositories: number;
  openPrs: number;
  reviews: number;
  pendingReviews: number;
  isLoading: boolean;
}) {
  const cards = [
    {
      title: "Repositories",
      value: repositories,
      detail: "Connected repositories",
      icon: GitBranch,
    },
    {
      title: "Open pull requests",
      value: openPrs,
      detail: "Authored on GitHub",
      icon: GitPullRequest,
    },
    {
      title: "AI reviews",
      value: reviews,
      detail: "Reviews generated",
      icon: Sparkles,
    },
    {
      title: "Pending reviews",
      value: pendingReviews,
      detail: "Still processing or awaiting review",
      icon: ListChecks,
    },
  ];
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.title} className="border-border/70 shadow-none">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {card.title}
            </CardTitle>
            <card.icon className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <>
                <Skeleton className="h-8 w-16" />
                <Skeleton className="mt-2 h-3 w-32" />
              </>
            ) : (
              <>
                <div className="text-3xl font-semibold tracking-tight">
                  {card.value}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {card.detail}
                </p>
              </>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
