import { CheckCircle2, Clock3, Loader2, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function ReviewStatusBadge({ status }: { status: string }) {
  if (status === "completed") return <Badge className="border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"><CheckCircle2 /> Completed</Badge>;
  if (status === "failed") return <Badge variant="destructive"><XCircle /> Failed</Badge>;
  if (status === "pending") return <Badge variant="secondary"><Clock3 /> Pending</Badge>;
  return <Badge variant="secondary"><Loader2 className="animate-spin" /> Reviewing...</Badge>;
}
