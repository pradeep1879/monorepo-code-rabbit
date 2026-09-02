import { FolderGit2, RefreshCw, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

export function RepositoryEmptyState({
  filtered,
  onClear,
}: {
  filtered: boolean;
  onClear: () => void;
}) {
  return (
    <Empty className="min-h-64 border">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          {filtered ? <SearchX /> : <FolderGit2 />}
        </EmptyMedia>
        <EmptyTitle>
          {filtered ? "No repositories found" : "No repositories yet"}
        </EmptyTitle>
        <EmptyDescription>
          {filtered
            ? "Try a different search term."
            : "Connect a GitHub repository to start generating AI code reviews."}
        </EmptyDescription>
      </EmptyHeader>
      {filtered && (
        <Button variant="outline" onClick={onClear}>
          Clear search
        </Button>
      )}
    </Empty>
  );
}

export function RepositoryErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <Empty className="min-h-64 border">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <RefreshCw />
        </EmptyMedia>
        <EmptyTitle>Something went wrong</EmptyTitle>
        <EmptyDescription>
          We couldn&apos;t load your repositories.
        </EmptyDescription>
      </EmptyHeader>
      <Button variant="outline" onClick={onRetry}>
        <RefreshCw />
        Try again
      </Button>
    </Empty>
  );
}
