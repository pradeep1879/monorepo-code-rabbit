import { FolderGit2, GitPullRequest } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { SubscriptionData } from "@/module/payment/action";

type RepositoryUsage = NonNullable<SubscriptionData["limits"]>["repositories"];

type UsageCardProps = {
  hasProAccess: boolean;
  repoUsage: RepositoryUsage | undefined;
};

export function UsageCard({ hasProAccess, repoUsage }: UsageCardProps) {
  return (
    <Card className="border-border/60 bg-card/50 shadow-sm backdrop-blur">
      <CardHeader>
        <CardTitle>Current Usage</CardTitle>
        <CardDescription>Your current plan limits and usage</CardDescription>
      </CardHeader>

      <CardContent>
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FolderGit2 className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Repositories</span>
              </div>

              <Badge variant="secondary">
                {repoUsage?.current}/{repoUsage?.limit ?? "∞"}
              </Badge>
            </div>

            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{
                  width: `${
                    repoUsage?.limit
                      ? (repoUsage.current / repoUsage.limit) * 100
                      : 0
                  }%`,
                }}
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <GitPullRequest className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Reviews per Repository</span>
              </div>

              <span className="shrink-0 text-sm font-medium">
                {hasProAccess ? "Unlimited" : "5 per repo"}
              </span>
            </div>

            <p className="text-sm text-muted-foreground">
              {hasProAccess
                ? "PRO tier allows unlimited reviews"
                : "Free tier allows 5 reviews per repository"}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
