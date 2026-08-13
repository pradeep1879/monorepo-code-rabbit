"use client"
import { useGetReview } from '@/hooks/reviewHooks/usegeReview'
import { CheckCircle2, Clock3, ExternalLink, GitBranchIcon, GitPullRequest, Loader2, LoaderPinwheel, Sparkles, XCircle } from 'lucide-react';
import React from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

import {
  Badge,
} from "@/components/ui/badge";

import {
  Skeleton,
} from "@/components/ui/skeleton";

import {
  ScrollArea,
} from "@/components/ui/scroll-area";

import {
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar";

import {
  Separator,
} from "@/components/ui/separator"
import { formatDistanceToNow } from 'date-fns';
import Link from "next/link";



const ReviewPage = () => {

  const {data, isLoading} = useGetReview();

  const getStatusBadge = (
    status: string
  ) => {
    switch (status) {
      case "completed":
        return (
          <Badge
            variant="secondary"
            className="gap-1"
          >
            <CheckCircle2 className="h-3 w-3" />
            Completed
          </Badge>
        );

      case "failed":
        return (
          <Badge
            variant="destructive"
            className="gap-1"
          >
            <XCircle className="h-3 w-3" />
            Failed
          </Badge>
        );

      default:
        return (
          <Badge className="gap-1">
            <Loader2 className="h-3 w-3 animate-spin" />
            Processing
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">
            Review History
          </h1>

          <p className="text-muted-foreground">
            View all AI generated pull request
            reviews.
          </p>
        </div>

        <div className="hidden md:flex items-center gap-2 rounded-xl border px-4 py-2 bg-muted/40">
          <Sparkles className="h-4 w-4 text-primary" />

          <span className="text-sm font-medium">
            AI Powered Reviews
          </span>
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="grid gap-5">
          {Array.from({ length: 5 }).map(
            (_, i) => (
              <Card
                key={i}
                className="overflow-hidden"
              >
                <CardHeader className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-6 w-56" />

                    <Skeleton className="h-6 w-24 rounded-full" />
                  </div>

                  <Skeleton className="h-4 w-72" />
                </CardHeader>

                <CardContent className="space-y-4">
                  <Skeleton className="h-4 w-full" />

                  <Skeleton className="h-4 w-[90%]" />

                  <Skeleton className="h-4 w-[80%]" />
                </CardContent>
              </Card>
            )
          )}
        </div>
      )}

      {/* Empty */}
      {!isLoading &&
        data?.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <GitPullRequest className="mb-4 h-12 w-12 text-muted-foreground" />

              <h3 className="text-lg font-semibold">
                No reviews yet
              </h3>

              <p className="mt-2 max-w-md text-sm text-muted-foreground">
                Connect a repository and open a
                pull request to generate your
                first AI review.
              </p>
            </CardContent>
          </Card>
        )}

      {/* Reviews */}
      {!isLoading &&
        data &&
        data.length > 0 && (
          <ScrollArea className="h-[calc(100vh-220px)] pr-4">
            <div className="space-y-5">
              {data.map((review) => (
                <Card
                  key={review.id}
                  className="group overflow-hidden transition-all hover:border-primary/40 hover:shadow-lg"
                >
                  <CardHeader className="space-y-4">
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>
                              <GitBranchIcon className="h-4 w-4" />
                            </AvatarFallback>
                          </Avatar>

                          <div>
                            <CardTitle className="text-lg">
                              PR #
                              {review.prNumber}{" "}
                              —{" "}
                              {
                                review.prTitle
                              }
                            </CardTitle>

                            <CardDescription className="flex items-center gap-2 pt-1">
                              <GitBranchIcon className="h-3.5 w-3.5" />

                              {
                                review
                                  .repository
                                  .fullName
                              }
                            </CardDescription>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock3 className="h-3.5 w-3.5" />

                            {formatDistanceToNow(
                              new Date(
                                review.createdAt
                              ),
                              {
                                addSuffix: true,
                              }
                            )}
                          </div>
                        </div>
                      </div>

                      {getStatusBadge(
                        review.status
                      )}
                    </div>
                  </CardHeader>

                  <Separator />

                  <CardContent className="space-y-5 pt-6">
                    <div className="rounded-xl border bg-muted/30 p-4">
                      <p className="line-clamp-6 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                        {review.review}
                      </p>
                    </div>

                    <div className="flex items-center justify-between">
                      <Link
                        href={review.prUrl}
                        target="_blank"
                        className="inline-flex items-center gap-2 text-sm font-medium text-primary transition-opacity hover:opacity-80"
                      >
                        View Pull Request
                        <ExternalLink className="h-4 w-4" />
                      </Link>

                      <Badge
                        variant="outline"
                        className="rounded-full"
                      >
                        AI Review
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        )}
    </div>
  )
}

export default ReviewPage
