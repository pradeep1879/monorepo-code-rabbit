"use client";

import { Button } from "@/components/ui/button";
import { Crown, Loader2, Sparkles } from "lucide-react";

import { PLAN_FEATURES } from "./subscription-constants";
import { PlanCard } from "../../../DashboardUI/subscrioptionUI/plan-card";
import { SubscriptionAlerts } from "../../../DashboardUI/subscrioptionUI/subscription-alerts";
import { SubscriptionError } from "../../../DashboardUI/subscrioptionUI/subscription-error";
import { SubscriptionHeader } from "../../../DashboardUI/subscrioptionUI/subscription-header";
import { SubscriptionLoading } from "../../../DashboardUI/subscrioptionUI/subscription-loading";
import { UsageCard } from "../../../DashboardUI/subscrioptionUI/usage-card";
import { useSubscriptionActions } from "@/hooks/subscriptionHook/useSubscription-actions";

const SubscriptionPage = () => {
  const subscription = useSubscriptionActions();

  if (subscription.isLoading) {
    return <SubscriptionLoading />;
  }

  if (subscription.isError) {
    return (
      <SubscriptionError
        error={subscription.error}
        onRetry={() => void subscription.refetch()}
      />
    );
  }

  const canManageSubscription = subscription.hasProAccess;

  return (
    <div className="space-y-6">
      <SubscriptionHeader
        currentStatus={subscription.currentStatus}
        currentTier={subscription.currentTier}
        onSync={() => void subscription.handleSync()}
        syncLoading={subscription.syncLoading}
      />

      <UsageCard
        hasProAccess={subscription.hasProAccess}
        repoUsage={subscription.repoUsage}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <PlanCard
          action={
            <Button variant="outline" className="w-full" disabled>
              Current Plan
            </Button>
          }
          description="Perfect for getting started"
          features={PLAN_FEATURES.FREE}
          icon={Sparkles}
          isCurrent={!subscription.hasProAccess}
          price="$0"
          title="Free"
        />

        <PlanCard
          action={
            canManageSubscription ? (
              <Button
                className="w-full"
                onClick={subscription.handleManageBilling}
              >
                Manage Subscription
              </Button>
            ) : (
              <Button
                className="w-full"
                onClick={subscription.handleUpgrade}
                disabled={subscription.checkoutLoading}
              >
                {subscription.checkoutLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Redirecting...
                  </>
                ) : (
                  "Upgrade to Pro"
                )}
              </Button>
            )
          }
          description="For professional developers"
          features={PLAN_FEATURES.PRO}
          highlighted
          icon={Crown}
          isCurrent={subscription.hasProAccess}
          price="$99.99"
          title="Pro"
        />
      </div>

      <SubscriptionAlerts
        currentStatus={subscription.currentStatus}
        hasProAccess={subscription.hasProAccess}
      />
    </div>
  );
};

export default SubscriptionPage;
