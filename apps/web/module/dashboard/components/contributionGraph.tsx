

import React from "react";
import { useTheme } from "@/lib/provider/them-provider";

import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { useContributionStats } from "@/hooks/dashbordHooks/useDashboard";



const ContributionGraph = () => {
  const { theme } = useTheme();

  const { data, isLoading } = useContributionStats();

  const getColor = (level: number) => {
    if (theme === "dark") {
      switch (level) {
        case 0:
          return "bg-zinc-800";
        case 1:
          return "bg-emerald-900";
        case 2:
          return "bg-emerald-700";
        case 3:
          return "bg-emerald-500";
        case 4:
          return "bg-emerald-400";
        default:
          return "bg-zinc-800";
      }
    }

    switch (level) {
      case 0:
        return "bg-zinc-200";
      case 1:
        return "bg-emerald-200";
      case 2:
        return "bg-emerald-400";
      case 3:
        return "bg-emerald-500";
      case 4:
        return "bg-emerald-600";
      default:
        return "bg-zinc-200";
    }
  };

  if (isLoading) {
    return (
      <Card className="overflow-hidden border-0 shadow-sm">
        <CardContent className="space-y-6 p-6">
          <div className="space-y-2">
            <Skeleton className="h-6 w-52" />
            <Skeleton className="h-4 w-72" />
          </div>

          <div className="grid grid-cols-53 gap-1">
            {Array.from({ length: 371 }).map((_, i) => (
              <Skeleton
                key={i}
                className="h-3 w-3 rounded-sm"
              />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="flex h-55 items-center justify-center text-muted-foreground">
          No contribution data found
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden border-0 shadow-sm">
      <CardContent className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">
              Contribution Activity
            </h2>

            <p className="text-sm text-muted-foreground">
              Your GitHub contribution graph
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Less</span>

            {[0, 1, 2, 3, 4].map((level) => (
              <div
                key={level}
                className={`h-3 w-3 rounded-sm ${getColor(
                  level
                )}`}
              />
            ))}

            <span>More</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <div className="grid grid-flow-col grid-rows-7 gap-1 min-w-max">
            {data.map(
              (
                day: {
                  date: string;
                  count: number;
                  level: number;
                },
                index: number
              ) => (
                <div
                  key={`${day.date}-${index}`}
                  title={`${day.count} contributions on ${day.date}`}
                  className={`
                    h-3 w-3 rounded-sm transition-all duration-200
                    hover:scale-125 hover:ring-2 hover:ring-primary/30
                    ${getColor(day.level)}
                  `}
                />
              )
            )}
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Total Contributions:{" "}
            <span className="font-medium text-foreground">
              {data.reduce(
                (
                  acc: number,
                  curr: { count: number }
                ) => acc + curr.count,
                0
              )}
            </span>
          </span>

          <span>Last 12 months</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default ContributionGraph;