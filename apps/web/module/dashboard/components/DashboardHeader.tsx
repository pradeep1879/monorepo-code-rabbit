import { ArrowUpRight, GitPullRequest } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function DashboardHeader() {
  return (
    <header className="flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Overview of your repositories, pull requests, and AI reviews.
        </p>
      </div>
      <Button size="sm" className="w-fit gap-2">
        <Link href="/dashboard/reviews">
          <GitPullRequest className="size-4" />
          Review a PR
          <ArrowUpRight className="size-3.5" />
        </Link>
      </Button>
    </header>
  );
}
