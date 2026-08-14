"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Button } from "@/components/ui/button";

import { Badge } from "@/components/ui/badge";

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";

import {
  Check,
  X,
  Loader2,
  RefreshCw,
  Sparkles,
  Crown,
  FolderGit2,
  GitPullRequest,
  AlertCircle,
} from "lucide-react";


import {
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  useEffect,
  useEffectEvent,
  useRef,
  useState,
} from "react";

import { toast } from "sonner";

import { useSearchParams } from "next/navigation";
import type {
  SubscriptionStatus,
  SubscriptionTier,
} from "@/module/payment/lib/subscription";
import { checkout, customer } from "@repo/auth/client";
import { getSubscriptionData, syncSubscriptionStatus } from "@/module/payment/action";

const PLAN_FEATURES = {
  FREE: [
    {
      name: "Up to 5 repositories",
      included: true,
    },
    {
      name: "Up to 5 reviews per repository",
      included: true,
    },
    {
      name: "Basic code reviews",
      included: true,
    },
    {
      name: "Community support",
      included: true,
    },
    {
      name: "Advanced analytics",
      included: false,
    },
    {
      name: "Priority support",
      included: false,
    },
  ],

  PRO: [
    {
      name: "Unlimited repositories",
      included: true,
    },
    {
      name: "Unlimited reviews",
      included: true,
    },
    {
      name: "Advanced code reviews",
      included: true,
    },
    {
      name: "Email support",
      included: true,
    },
    {
      name: "Advanced analytics",
      included: true,
    },
    {
      name: "Priority support",
      included: true,
    },
  ],
};

const STATUS_LABELS: Record<
  SubscriptionStatus,
  string
> = {
  ACTIVE: "Active",
  CANCELED: "Canceled",
  EXPIRED: "Expired",
};

function getCheckoutUrl(result: unknown): string | null {
  if (
    result &&
    typeof result === "object" &&
    "url" in result &&
    typeof result.url === "string"
  ) {
    return result.url;
  }

  if (
    result &&
    typeof result === "object" &&
    "data" in result &&
    result.data &&
    typeof result.data === "object" &&
    "url" in result.data &&
    typeof result.data.url === "string"
  ) {
    return result.data.url;
  }

  return null;
}

function isAlreadyActiveSubscriptionError(
  error: unknown
): boolean {
  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message.includes(
      "AlreadyActiveSubscriptionError"
    );
  }

  try {
    return JSON.stringify(error).includes(
      "AlreadyActiveSubscriptionError"
    );
  } catch {
    return false;
  }
}

const SubscriptionPage = () => {
  const [syncLoading, setSyncLoading] =
    useState(false);

  const [checkoutLoading, setCheckoutLoading] =
    useState(false);

  const autoSyncRef = useRef(false);
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["subscription-data"],
    queryFn: getSubscriptionData,
    refetchOnWindowFocus: false,
  });

  const refreshSubscriptionData = async () => {
    await queryClient.invalidateQueries({
      queryKey: ["subscription-data"],
    });

    await refetch();
  };

  const handleManageBilling =
    async () => {
      try {
        const result =
          await customer.portal();
        const portalUrl =
          getCheckoutUrl(result);

        if (portalUrl) {
          window.open(
            portalUrl,
            "_blank"
          );
          return;
        }

        toast.error(
          "Billing portal URL is unavailable"
        );
      } catch {
        toast.error(
          "Failed to open billing portal"
        );
      }
    };

  const handleSync = async (
    options?: { silent?: boolean }
  ) => {
    try {
      setSyncLoading(true);

      const result =
        await syncSubscriptionStatus();

      await refreshSubscriptionData();

      if (result.success) {
        if (!options?.silent) {
          toast.success(result.message);
        }
      } else {
        if (!options?.silent) {
          toast.error(
            result.message ||
              "Failed to sync subscription"
          );
        }
      }

      return result;
    } catch {
      if (!options?.silent) {
        toast.error(
          "Failed to sync subscription"
        );
      }
      return null;
    } finally {
      setSyncLoading(false);
    }
  };

  const runAutoSync = useEffectEvent(
    async (silent: boolean) => {
      await handleSync({ silent });
    }
  );

  useEffect(() => {
    if (!data?.user || autoSyncRef.current) {
      return;
    }

    const shouldSyncAfterCheckout =
      searchParams.get("success") === "true";
    const shouldRepairFreeState =
      data.user.subscriptionTier === "FREE" &&
      Boolean(data.user.polarCustomerId);

    if (
      !shouldSyncAfterCheckout &&
      !shouldRepairFreeState
    ) {
      return;
    }

    autoSyncRef.current = true;
    const timeoutId = window.setTimeout(() => {
      void runAutoSync(!shouldSyncAfterCheckout);
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [data, searchParams]);

  const handleUpgrade = async () => {
    try {
      setCheckoutLoading(true);

      const syncResult = await handleSync({
        silent: true,
      });

      if (syncResult?.success && syncResult.tier === "PRO") {
        toast.success(
          "Your subscription is already active"
        );
        await handleManageBilling();
        return;
      }

      const result = await checkout({
        slug: "CodeRabbitMonorepo-new",
      });

      const checkoutUrl =
        getCheckoutUrl(result);

      if (checkoutUrl) {
        window.location.assign(checkoutUrl);
        return;
      }

      toast.error(
        "Checkout URL is unavailable"
      );
    } catch (error) {
      if (
        isAlreadyActiveSubscriptionError(error)
      ) {
        const syncResult =
          await handleSync({
            silent: true,
          });

        if (
          syncResult?.success &&
          syncResult.tier === "PRO"
        ) {
          toast.success(
            "You already have an active subscription"
          );
          await handleManageBilling();
          return;
        }
      }

      toast.error(
        "Failed to start checkout"
      );
    } finally {
      setCheckoutLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-8 w-64 animate-pulse rounded-md bg-muted" />

            <div className="h-4 w-96 animate-pulse rounded-md bg-muted" />
          </div>

          <div className="h-10 w-36 animate-pulse rounded-md bg-muted" />
        </div>

        <div className="h-40 animate-pulse rounded-2xl bg-muted" />

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="h-125 animate-pulse rounded-2xl bg-muted" />

          <div className="h-125 animate-pulse rounded-2xl bg-muted" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>
            Failed to load subscription
          </AlertTitle>
          <AlertDescription>
            {error instanceof Error
              ? error.message
              : "Please try again in a moment."}
          </AlertDescription>
        </Alert>

        <Button
          variant="outline"
          onClick={() => void refetch()}
        >
          Retry
        </Button>
      </div>
    );
  }

  const currentTier =
    (data?.user?.subscriptionTier as
      | SubscriptionTier
      | undefined) ?? "FREE";
  const currentStatus =
    data?.user?.subscriptionStatus ??
    null;

  const hasProAccess =
    currentTier === "PRO";
  const canManageSubscription =
    hasProAccess;

  const repoUsage =
    data?.limits?.repositories;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">
            Subscription Plans
          </h1>

          <p className="text-muted-foreground">
            Choose the perfect plan
            for your needs
          </p>
        </div>

        <Button
          variant="outline"
          onClick={() => {
            void handleSync();
          }}
          disabled={syncLoading}
        >
          {syncLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 h-4 w-4" />
          )}

          Sync Status
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Badge variant="secondary">
          Current Plan: {currentTier}
        </Badge>

        {currentStatus && (
          <Badge
            variant={
              currentStatus === "EXPIRED"
                ? "destructive"
                : "secondary"
            }
          >
            Status:{" "}
            {
              STATUS_LABELS[
                currentStatus
              ]
            }
          </Badge>
        )}
      </div>

      <Card className="border-border/60 bg-card/50 backdrop-blur">
        <CardHeader>
          <CardTitle>
            Current Usage
          </CardTitle>

          <CardDescription>
            Your current plan limits and
            usage
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="grid gap-8 lg:grid-cols-2">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FolderGit2 className="h-4 w-4 text-muted-foreground" />

                  <span className="font-medium">
                    Repositories
                  </span>
                </div>

                <Badge variant="secondary">
                  {
                    repoUsage?.current
                  }
                  /
                  {repoUsage?.limit ??
                    "∞"}
                </Badge>
              </div>

              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{
                    width: `${
                      repoUsage?.limit
                        ? (repoUsage.current /
                            repoUsage.limit) *
                          100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <GitPullRequest className="h-4 w-4 text-muted-foreground" />

                  <span className="font-medium">
                    Reviews per Repository
                  </span>
                </div>

                <span className="text-sm font-medium">
                  {hasProAccess
                    ? "Unlimited"
                    : "5 per repo"}
                </span>
              </div>

              <p className="text-sm text-muted-foreground">
                {hasProAccess
                  ? "PRO tier allows unlimited reviews"
                  : "Free tier allows 5 reviews per repository"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card
          className={`relative overflow-hidden border-2 transition-all ${
            !hasProAccess
              ? "border-primary shadow-lg shadow-primary/10"
              : "border-border/60"
          }`}
        >
          {!hasProAccess && (
            <Badge className="absolute right-4 top-4">
              Current Plan
            </Badge>
          )}

          <CardHeader className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-primary/10 p-3">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>

              <div>
                <CardTitle className="text-2xl">
                  Free
                </CardTitle>

                <CardDescription>
                  Perfect for getting
                  started
                </CardDescription>
              </div>
            </div>

            <div className="flex items-end gap-1">
              <span className="text-5xl font-bold">
                $0
              </span>

              <span className="pb-1 text-lg text-muted-foreground">
                /month
              </span>
            </div>
          </CardHeader>

          <CardContent className="space-y-8">
            <div className="space-y-4">
              {PLAN_FEATURES.FREE.map(
                (feature) => (
                  <div
                    key={feature.name}
                    className="flex items-center gap-3"
                  >
                    {feature.included ? (
                      <Check className="h-4 w-4 text-primary" />
                    ) : (
                      <X className="h-4 w-4 text-muted-foreground" />
                    )}

                    <span
                      className={
                        feature.included
                          ? ""
                          : "text-muted-foreground"
                      }
                    >
                      {feature.name}
                    </span>
                  </div>
                )
              )}
            </div>

            <Button
              variant="outline"
              className="w-full"
              disabled
            >
              Current Plan
            </Button>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-primary/30 bg-card/80 backdrop-blur">
          {hasProAccess && (
            <Badge className="absolute right-4 top-4">
              Active Plan
            </Badge>
          )}

          <div className="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-primary via-primary/70 to-primary" />

          <CardHeader className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-primary/10 p-3">
                <Crown className="h-5 w-5 text-primary" />
              </div>

              <div>
                <CardTitle className="text-2xl">
                  Pro
                </CardTitle>

                <CardDescription>
                  For professional
                  developers
                </CardDescription>
              </div>
            </div>

            <div className="flex items-end gap-1">
              <span className="text-5xl font-bold">
                $99.99
              </span>

              <span className="pb-1 text-lg text-muted-foreground">
                /month
              </span>
            </div>
          </CardHeader>

          <CardContent className="space-y-8">
            <div className="space-y-4">
              {PLAN_FEATURES.PRO.map(
                (feature) => (
                  <div
                    key={feature.name}
                    className="flex items-center gap-3"
                  >
                    <Check className="h-4 w-4 text-primary" />

                    <span>
                      {feature.name}
                    </span>
                  </div>
                )
              )}
            </div>

            {canManageSubscription ? (
              <Button
                className="w-full"
                onClick={
                  handleManageBilling
                }
              >
                Manage Subscription
              </Button>
            ) : (
              <Button
                className="w-full"
                onClick={handleUpgrade}
                disabled={
                  checkoutLoading
                }
              >
                {checkoutLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Redirecting...
                  </>
                ) : (
                  "Upgrade to Pro"
                )}
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {hasProAccess && (
        <Alert className="border-primary/30">
          <Crown className="h-4 w-4" />

          <AlertTitle>
            {currentStatus === "CANCELED"
              ? "PRO Subscription Cancels At Period End"
              : "PRO Subscription Active"}
          </AlertTitle>

          <AlertDescription>
            {currentStatus === "CANCELED"
              ? "Your PRO access is still available until the current billing period ends."
              : "You currently have access to all premium CodeRabbit features."}
          </AlertDescription>
        </Alert>
      )}

      {!hasProAccess &&
        currentStatus === "EXPIRED" && (
          <Alert className="border-border/60">
            <AlertCircle className="h-4 w-4" />

            <AlertTitle>
              PRO access expired
            </AlertTitle>

            <AlertDescription>
              Your account is currently on
              the FREE plan. Upgrade again
              any time to restore unlimited
              repositories and reviews.
            </AlertDescription>
          </Alert>
        )}
    </div>
  );
};

export default SubscriptionPage;
