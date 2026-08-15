import { Loader2, RefreshCw } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type {
  SubscriptionStatus,
  SubscriptionTier,
} from "@/module/payment/lib/subscription";
import { STATUS_LABELS } from "@/app/dashboard/subscription/subscription-constants";


type SubscriptionHeaderProps = {
  currentStatus: SubscriptionStatus | null;
  currentTier: SubscriptionTier;
  onSync: () => void;
  syncLoading: boolean;
};

export function SubscriptionHeader({
  currentStatus,
  currentTier,
  onSync,
  syncLoading,
}: SubscriptionHeaderProps) {
  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Subscription Plans
          </h1>
          <p className="mt-1 text-muted-foreground">
            Choose the perfect plan for your needs
          </p>
        </div>

        <Button variant="outline" onClick={onSync} disabled={syncLoading}>
          {syncLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 h-4 w-4" />
          )}
          Sync Status
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Badge variant="secondary">Current Plan: {currentTier}</Badge>

        {currentStatus && (
          <Badge
            variant={currentStatus === "EXPIRED" ? "destructive" : "secondary"}
          >
            Status: {STATUS_LABELS[currentStatus]}
          </Badge>
        )}
      </div>
    </>
  );
}
