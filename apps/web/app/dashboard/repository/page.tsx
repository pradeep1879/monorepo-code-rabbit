"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Repository } from "@repo/types";
import { useConnectRepositories } from "@/hooks/repository/useConnectRepo";
import { useRepositories } from "@/hooks/repository/useRepositories";
import RepositorySkeleton from "@/module/repository/components/RepoSkeleton";
import {
  RepositoryEmptyState,
  RepositoryErrorState,
} from "@/module/repository/components/RepositoryEmptyState";
import { RepositoryHeader } from "@/module/repository/components/RepositoryHeader";
import { RepositoryList } from "@/module/repository/components/RepositoryList";

const RepositoryPage = () => {
  const [localConnectingId, setLocalConnectingId] = useState<
    number | string | null
  >(null);
  const [searchQuery, setSearchQuery] = useState("");
  const observerRef = useRef<HTMLDivElement | null>(null);
  const {
    data,
    isLoading,
    isError,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    refetch,
  } = useRepositories();
  const { mutateAsync: connectRepo } = useConnectRepositories();

  const allRepositories = useMemo(
    () => data?.pages.flatMap((page) => page as Repository[]) || [],
    [data],
  );
  const filteredRepositories = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return allRepositories;
    return allRepositories.filter((repo) =>
      [
        repo.name,
        repo.full_name,
        repo.description ?? "",
        repo.language ?? "",
        ...(repo.topics ?? []),
      ].some((value) => value.toLowerCase().includes(query)),
    );
  }, [allRepositories, searchQuery]);

  useEffect(() => {
    const observerElement = observerRef.current;
    if (!observerElement) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting && hasNextPage && !isFetchingNextPage)
          void fetchNextPage();
      },
      { threshold: 0.5 },
    );
    observer.observe(observerElement);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const handleConnectRepo = async (repo: Repository) => {
    try {
      setLocalConnectingId(repo.id);
      await connectRepo({
        owner: repo.full_name.split("/")[0],
        repo: repo.name,
        githubId: repo.id,
      });
    } catch (error) {
      console.error(error);
    } finally {
      setLocalConnectingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <RepositoryHeader searchQuery="" onSearchChange={() => undefined} />
        <div className="grid gap-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <RepositorySkeleton key={index} />
          ))}
        </div>
      </div>
    );
  }

  if (isError) return <RepositoryErrorState onRetry={() => void refetch()} />;

  return (
    <div className="flex min-h-[calc(100vh-8rem)] flex-col gap-6">
      <RepositoryHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />
      {filteredRepositories.length > 0 ? (
        <RepositoryList
          repositories={filteredRepositories}
          connectingId={localConnectingId}
          onConnect={handleConnectRepo}
          isFetchingNextPage={isFetchingNextPage}
          observerRef={observerRef}
        />
      ) : (
        <RepositoryEmptyState
          filtered={allRepositories.length > 0}
          onClear={() => setSearchQuery("")}
        />
      )}
      {!hasNextPage && filteredRepositories.length > 0 && (
        <p className="pb-2 text-center text-xs text-muted-foreground">
          No more repositories
        </p>
      )}
    </div>
  );
};

export default RepositoryPage;
