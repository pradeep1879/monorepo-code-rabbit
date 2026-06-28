"use client"
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useConnectRepositories } from "@/hooks/repository/useConnectRepo";
import { useRepositories } from "@/hooks/repository/useRepositories";
import RepositorySkeleton from "@/module/repository/components/RepoSkeleton";
import { Repository } from "@repo/types";
import { GitBranch, Search, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import React, { useEffect, useMemo, useRef, useState } from "react";

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
  } = useRepositories();

  const { mutateAsync: connectRepo } = useConnectRepositories();

  const allRepositories = useMemo(
    () => data?.pages.flatMap((page) => page as Repository[]) || [],
    [data],
  );

  const filteredRepositories = useMemo(() => {
    const query = searchQuery.toLowerCase();

    return allRepositories.filter((repo) => {
      return (
        repo.name.toLowerCase().includes(query) ||
        repo.full_name.toLowerCase().includes(query)
      );
    });
  }, [searchQuery, allRepositories]);

  useEffect(() => {
    const observerElement = observerRef.current;

    if (!observerElement) return;

    const observer = new IntersectionObserver(
      async (entries) => {
        const first = entries[0]!;

        if (first.isIntersecting && hasNextPage && !isFetchingNextPage) {
          await fetchNextPage();
        }
      },
      {
        threshold: 0.5,
      },
    );

    observer.observe(observerElement);

    return () => {
      observer.disconnect();
    };
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
        <div className="space-y-2">
          <Skeleton className="h-9 w-52" />
          <Skeleton className="h-5 w-80" />
        </div>

        <Skeleton className="h-10 w-full" />

        <div className="grid gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <RepositorySkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center py-20 text-red-500">
        Failed to load repositories
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Repositories</h1>

        <p className="text-muted-foreground">
          Manage and view all your GitHub repositories
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 size-4 text-muted-foreground" />

        <Input
          placeholder="Search repositories..."
          className="pl-9"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Repository List */}
      <div className="grid gap-4">
        {filteredRepositories.map((repo) => (
          <Card
            key={repo.id}
            className="transition-all duration-200 hover:shadow-md"
          >
            <CardContent className="p-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                {/* Left */}
                <div className="space-y-3 flex-1">
                  <div>
                    <a
                      href={repo.html_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-lg font-semibold hover:underline"
                    >
                      {repo.full_name}
                    </a>

                    {repo.description && (
                      <p className="mt-1 text-sm text-muted-foreground">
                        {repo.description}
                      </p>
                    )}
                  </div>

                  {/* Meta */}
                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    {repo.language && (
                      <div className="flex items-center gap-1">
                        <GitBranch className="size-4" />
                        {repo.language}
                      </div>
                    )}

                    <div className="flex items-center gap-1">
                      <Star className="size-4" />
                      {repo.stargazers_count}
                    </div>
                  </div>

                  {/* Topics */}
                  {repo.topics?.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {repo.topics.slice(0, 5).map((topic) => (
                        <Badge key={topic} variant="secondary">
                          {topic}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {/* Right */}
                <div className="flex items-center gap-2">
                  {repo.isConnected ? (
                    <Button disabled variant="secondary">
                      Connected
                    </Button>
                  ) : (
                    <Button
                      onClick={() => handleConnectRepo(repo)}
                      disabled={localConnectingId === repo.id}
                    >
                      {localConnectingId === repo.id
                        ? "Connecting..."
                        : "Connect"}
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Infinite Scroll Skeletons */}
        {isFetchingNextPage &&
          Array.from({ length: 3 }).map((_, i) => (
            <RepositorySkeleton key={`skeleton-${i}`} />
          ))}
      </div>

      {/* Observer Trigger */}
      <div ref={observerRef} className="h-10 w-full" />

      {/* Empty State */}
      {!isLoading && filteredRepositories.length === 0 && (
        <div className="rounded-lg border border-dashed py-16 text-center">
          <p className="text-muted-foreground">No repositories found</p>
        </div>
      )}

      {/* No More Repositories */}
      {!hasNextPage && filteredRepositories.length > 0 && (
        <div className="text-center text-sm text-muted-foreground py-4">
          No more repositories
        </div>
      )}
    </div>
  );
};

export default RepositoryPage;
