import { GitPullRequest, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";

export function ReviewHistoryEmpty({ filtered, onClearFilters }: { filtered: boolean; onClearFilters?: () => void }) {
  return <Empty className="min-h-72 border"><EmptyHeader><EmptyMedia variant="icon">{filtered ? <SearchX /> : <GitPullRequest />}</EmptyMedia><EmptyTitle>{filtered ? "No matching reviews" : "No reviews yet"}</EmptyTitle><EmptyDescription>{filtered ? "Try a different search term or clear the active filter." : "Connect a repository and open a pull request to generate your first AI review."}</EmptyDescription></EmptyHeader>{filtered && onClearFilters && <Button variant="outline" onClick={onClearFilters}>Clear filters</Button>}</Empty>;
}
