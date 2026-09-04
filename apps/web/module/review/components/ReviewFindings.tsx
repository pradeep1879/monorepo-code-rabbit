"use client";

import { AlertTriangle, CheckCircle2, CircleDot, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useUpdateReviewFindingStatus } from "@/hooks/reviewHooks/usegeReview";
import type { ReviewFinding } from "@/module/review/components/ReviewHistoryTypes";
import type { FindingStatus } from "@/module/review/lib/findings";

const severityClass: Record<string, string> = {
  critical: "border-red-500/40 text-red-400",
  high: "border-orange-500/40 text-orange-400",
  medium: "border-yellow-500/40 text-yellow-400",
  low: "border-blue-500/40 text-blue-400",
};

const statusOptions: Array<{ value: FindingStatus; label: string }> = [
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In progress" },
  { value: "resolved", label: "Resolved" },
];

const statusIcon = {
  open: CircleDot,
  in_progress: AlertTriangle,
  resolved: CheckCircle2,
};

export function ReviewFindings({ findings }: { findings: ReviewFinding[] }) {
  const updateStatus = useUpdateReviewFindingStatus();

  if (!findings.length) return null;

  return (
    <section className="mt-6 border-t border-border/60 pt-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-base font-semibold text-foreground">Findings</h3>
        <span className="text-xs text-muted-foreground">
          {findings.length} {findings.length === 1 ? "issue" : "issues"}
        </span>
      </div>
      <div className="space-y-3">
        {findings.map((finding) => {
          const Icon = statusIcon[finding.status as FindingStatus] ?? CircleDot;
          const isUpdating =
            updateStatus.isPending &&
            updateStatus.variables?.findingId === finding.id;
          return (
            <div
              key={finding.id}
              className="rounded-lg border border-border/70 bg-background/30 p-3"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      variant="outline"
                      className={severityClass[finding.severity]}
                    >
                      {finding.severity}
                    </Badge>
                    <h4 className="font-medium text-foreground">
                      {finding.title}
                    </h4>
                  </div>
                  <p className="mt-2 text-sm leading-5 text-muted-foreground">
                    {finding.description}
                  </p>
                  {(finding.filePath || finding.lineStart) && (
                    <p className="mt-2 font-mono text-xs text-muted-foreground">
                      {finding.filePath ?? "Unknown file"}
                      {finding.lineStart
                        ? `:${finding.lineStart}${finding.lineEnd && finding.lineEnd !== finding.lineStart ? `-${finding.lineEnd}` : ""}`
                        : ""}
                    </p>
                  )}
                </div>
                <label className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
                  <Icon className="size-3.5" />
                  <select
                    value={finding.status}
                    disabled={isUpdating}
                    aria-label={`Status for ${finding.title}`}
                    onChange={(event) =>
                      updateStatus.mutate({
                        findingId: finding.id,
                        status: event.target.value as FindingStatus,
                      })
                    }
                    className="rounded-md border border-border bg-background px-2 py-1.5 text-xs text-foreground outline-none focus:ring-2 focus:ring-ring"
                  >
                    {statusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {isUpdating && <Loader2 className="size-3.5 animate-spin" />}
                </label>
              </div>
            </div>
          );
        })}
      </div>
      {updateStatus.isError && (
        <p className="mt-2 text-xs text-destructive">
          Unable to update this finding. Please try again.
        </p>
      )}
    </section>
  );
}
