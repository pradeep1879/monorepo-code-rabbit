import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";

export function ReviewHistoryError({ onRetry }: { onRetry: () => void }) {
  return <Empty className="min-h-72 border"><EmptyHeader><EmptyMedia variant="icon"><RefreshCw /></EmptyMedia><EmptyTitle>Something went wrong</EmptyTitle><EmptyDescription>We couldn&apos;t load your review history.</EmptyDescription></EmptyHeader><Button variant="outline" onClick={onRetry}><RefreshCw />Try again</Button></Empty>;
}
