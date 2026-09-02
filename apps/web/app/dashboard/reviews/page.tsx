"use client";

import { useMemo, useState, type Dispatch, type SetStateAction } from "react";
import { useGetReview } from "@/hooks/reviewHooks/usegeReview";
import { ReviewHistoryEmpty } from "@/module/review/components/ReviewHistoryEmpty";
import { ReviewHistoryError } from "@/module/review/components/ReviewHistoryError";
import { ReviewHistoryHeader } from "@/module/review/components/ReviewHistoryHeader";
import { ReviewHistoryList } from "@/module/review/components/ReviewHistoryList";
import { ReviewHistorySkeleton } from "@/module/review/components/ReviewHistorySkeleton";
import type { StatusFilter } from "@/module/review/components/ReviewHistoryTypes";
import { ScrollArea } from "@/components/ui/scroll-area";

const ReviewPage = () => {
  const { data, isError, isLoading, refetch } = useGetReview();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [collapsedRepositories, setCollapsedRepositories] = useState<
    Set<string>
  >(new Set());
  const [expandedReviews, setExpandedReviews] = useState<Set<string>>(
    new Set(),
  );

  const filteredReviews = useMemo(() => {
    const query = search.trim().toLowerCase();
    return (data ?? []).filter((review) => {
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "processing"
          ? !["completed", "failed"].includes(review.status)
          : review.status === statusFilter);
      const matchesSearch =
        !query ||
        [
          review.prTitle,
          String(review.prNumber),
          review.repository.fullName,
          review.review,
        ].some((value) => value.toLowerCase().includes(query));
      return matchesStatus && matchesSearch;
    });
  }, [data, search, statusFilter]);

  const repositoryGroups = useMemo(() => {
    const groups = new Map<string, typeof filteredReviews>();
    for (const review of filteredReviews) {
      const reviews = groups.get(review.repository.id) ?? [];
      reviews.push(review);
      groups.set(review.repository.id, reviews);
    }
    return [...groups.entries()];
  }, [filteredReviews]);

  const toggleSetValue = (
    setter: Dispatch<SetStateAction<Set<string>>>,
    id: string,
  ) => {
    setter((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (isLoading)
    return (
      <div className="flex min-h-[calc(100vh-8rem)] flex-col gap-6">
        <ReviewHistoryHeader
          search={search}
          onSearchChange={setSearch}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
        />
        <ReviewHistorySkeleton />
      </div>
    );
  if (isError) return <ReviewHistoryError onRetry={() => void refetch()} />;

  return (
    <div className="flex min-h-[calc(100vh-8rem)] flex-col gap-6">
      <ReviewHistoryHeader
        search={search}
        onSearchChange={setSearch}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
      />
      {!data?.length ? (
        <ReviewHistoryEmpty filtered={false} />
      ) : !repositoryGroups.length ? (
        <ReviewHistoryEmpty
          filtered
          onClearFilters={() => {
            setSearch("");
            setStatusFilter("all");
          }}
        />
      ) : (
        <ScrollArea className="min-h-0 flex-1 pr-3">
          <ReviewHistoryList
            repositoryGroups={repositoryGroups}
            collapsedRepositories={collapsedRepositories}
            expandedReviews={expandedReviews}
            onToggleRepository={(id) =>
              toggleSetValue(setCollapsedRepositories, id)
            }
            onToggleReview={(id) => toggleSetValue(setExpandedReviews, id)}
          />
        </ScrollArea>
      )}
    </div>
  );
};

export default ReviewPage;
