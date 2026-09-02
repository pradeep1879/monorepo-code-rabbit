import type { RefObject } from "react";
import type { Repository } from "@repo/types";
import RepositorySkeleton from "@/module/repository/components/RepoSkeleton";
import { RepositoryCard } from "@/module/repository/components/RepositoryCard";

export function RepositoryList({
  repositories,
  connectingId,
  onConnect,
  isFetchingNextPage,
  observerRef,
}: {
  repositories: Repository[];
  connectingId: number | string | null;
  onConnect: (repo: Repository) => void;
  isFetchingNextPage: boolean;
  observerRef: RefObject<HTMLDivElement | null>;
}) {
  return (
    <>
      <div className="grid gap-3">
        {repositories.map((repo) => (
          <RepositoryCard
            key={repo.id}
            repo={repo}
            isConnecting={connectingId === repo.id}
            onConnect={onConnect}
          />
        ))}
        {isFetchingNextPage &&
          Array.from({ length: 3 }).map((_, index) => (
            <RepositorySkeleton key={`skeleton-${index}`} />
          ))}
      </div>
      <div ref={observerRef} className="h-4 w-full" aria-hidden="true" />
    </>
  );
}
