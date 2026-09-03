import {
  Check,
  ExternalLink,
  GitBranch,
  Loader2,
  Star,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Repository } from "@repo/types";

export function RepositoryCard({
  repo,
  isConnecting,
  onConnect,
}: {
  repo: Repository;
  isConnecting: boolean;
  onConnect: (repo: Repository) => void;
}) {
  return (
    <Card className="gap-0 border-border/70 py-0 transition-colors hover:border-primary/40">
      <CardContent className="p-4 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg border bg-muted/50 text-muted-foreground">
                <GitBranch className="size-4" />
              </div>
              <div className="min-w-0">
                <a
                  href={repo.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="wrap-break-word text-base font-semibold tracking-tight transition-colors hover:text-primary hover:underline"
                >
                  {repo.full_name}
                </a>
                {repo.description && (
                  <p className="mt-1.5 max-w-3xl text-sm leading-5 text-muted-foreground">
                    {repo.description}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground sm:pl-12">
              {repo.language && (
                <span className="inline-flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-primary/70" />
                  {repo.language}
                </span>
              )}
              <span className="inline-flex items-center gap-1.5">
                <Star className="size-3.5" />
                {repo.stargazers_count.toLocaleString()}
              </span>
              <a
                href={repo.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground"
              >
                <ExternalLink className="size-3.5" />
                View on GitHub
              </a>
            </div>

            {repo.topics?.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5 sm:pl-12">
                {repo.topics.slice(0, 6).map((topic) => (
                  <Badge
                    key={topic}
                    variant="secondary"
                    className="h-6 px-2 text-[11px]"
                  >
                    {topic}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="flex shrink-0 items-center lg:pt-1">
            {repo.isConnected ? (
              repo.indexingStatus === "pending" ||
              repo.indexingStatus === "processing" ? (
                <Badge variant="secondary" className="h-8 gap-1.5 px-3">
                  <Loader2 className="animate-spin" />
                  Indexing...
                </Badge>
              ) : repo.indexingStatus === "failed" ? (
                <Badge variant="destructive" className="h-8 gap-1.5 px-3">
                  <XCircle />
                  Indexing failed
                </Badge>
              ) : (
                <Badge className="h-8 gap-1.5 border-emerald-500/20 bg-emerald-500/10 px-3 text-emerald-600 dark:text-emerald-400">
                  <Check />
                  Connected
                </Badge>
              )
            ) : (
              <Button
                onClick={() => onConnect(repo)}
                disabled={isConnecting}
                size="sm"
                className="min-w-24"
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="animate-spin" />
                    Connecting...
                  </>
                ) : (
                  "Connect"
                )}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
