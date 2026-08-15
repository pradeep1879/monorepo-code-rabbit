import { AlertCircle, Crown } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

type SubscriptionAlertsProps = {
  currentStatus: "ACTIVE" | "CANCELED" | "EXPIRED" | null;
  hasProAccess: boolean;
};

export function SubscriptionAlerts({
  currentStatus,
  hasProAccess,
}: SubscriptionAlertsProps) {
  return (
    <>
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

      {!hasProAccess && currentStatus === "EXPIRED" && (
        <Alert className="border-border/60">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>PRO access expired</AlertTitle>
          <AlertDescription>
            Your account is currently on the FREE plan. Upgrade again any time
            to restore unlimited repositories and reviews.
          </AlertDescription>
        </Alert>
      )}
    </>
  );
}
