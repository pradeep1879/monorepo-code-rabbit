import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function ReviewHistorySkeleton() {
  return <div className="space-y-5">{Array.from({ length: 2 }).map((_, index) => <Card key={index} className="gap-0 overflow-hidden py-0"><div className="flex items-center gap-3 border-b px-4 py-4"><Skeleton className="size-8 rounded-lg" /><Skeleton className="h-5 w-40" /><Skeleton className="h-4 w-20" /></div>{Array.from({ length: 3 }).map((__, rowIndex) => <div key={rowIndex} className="flex gap-4 border-b px-4 py-5 last:border-0"><Skeleton className="h-10 w-1/4" /><Skeleton className="h-10 flex-1" /><Skeleton className="h-5 w-20" /></div>)}</Card>)}</div>;
}
