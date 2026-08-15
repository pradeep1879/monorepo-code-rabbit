"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { useEffect, useEffectEvent, useRef, useState } from "react";
import { toast } from "sonner";

import { checkout, customer } from "@repo/auth/client";
import {
  getSubscriptionData,
  syncSubscriptionStatus,
} from "@/module/payment/action";
import type {
  SubscriptionStatus,
  SubscriptionTier,
} from "@/module/payment/lib/subscription";
import { getCheckoutUrl, isAlreadyActiveSubscriptionError } from "@/app/dashboard/subscription/subscription-utils";


export function useSubscriptionActions() {
  const [syncLoading, setSyncLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const autoSyncRef = useRef(false);
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();

  const query = useQuery({
    queryKey: ["subscription-data"],
    queryFn: getSubscriptionData,
    refetchOnWindowFocus: false,
  });

  const refreshSubscriptionData = async () => {
    await queryClient.invalidateQueries({
      queryKey: ["subscription-data"],
    });

    await query.refetch();
  };

  const handleManageBilling = async () => {
    try {
      const result = await customer.portal();
      const portalUrl = getCheckoutUrl(result);

      if (portalUrl) {
        window.open(portalUrl, "_blank");
        return;
      }

      toast.error("Billing portal URL is unavailable");
    } catch {
      toast.error("Failed to open billing portal");
    }
  };

  const handleSync = async (options?: { silent?: boolean }) => {
    try {
      setSyncLoading(true);

      const result = await syncSubscriptionStatus();

      await refreshSubscriptionData();

      if (result.success) {
        if (!options?.silent) {
          toast.success(result.message);
        }
      } else if (!options?.silent) {
        toast.error(result.message || "Failed to sync subscription");
      }

      return result;
    } catch {
      if (!options?.silent) {
        toast.error("Failed to sync subscription");
      }
      return null;
    } finally {
      setSyncLoading(false);
    }
  };

  const runAutoSync = useEffectEvent(async (silent: boolean) => {
    await handleSync({ silent });
  });

  useEffect(() => {
    if (!query.data?.user || autoSyncRef.current) {
      return;
    }

    const shouldSyncAfterCheckout = searchParams.get("success") === "true";
    const shouldRepairFreeState =
      query.data.user.subscriptionTier === "FREE" &&
      Boolean(query.data.user.polarCustomerId);

    if (!shouldSyncAfterCheckout && !shouldRepairFreeState) {
      return;
    }

    autoSyncRef.current = true;
    const timeoutId = window.setTimeout(() => {
      void runAutoSync(!shouldSyncAfterCheckout);
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [query.data, runAutoSync, searchParams]);

  const handleUpgrade = async () => {
    try {
      setCheckoutLoading(true);

      const syncResult = await handleSync({ silent: true });

      if (syncResult?.success && syncResult.tier === "PRO") {
        toast.success("Your subscription is already active");
        await handleManageBilling();
        return;
      }

      const result = await checkout({
        slug: "CodeRabbitMonorepo-Sandbox-Product",
      });

      const checkoutUrl = getCheckoutUrl(result);

      if (checkoutUrl) {
        window.location.assign(checkoutUrl);
        return;
      }

      toast.error("Checkout URL is unavailable");
    } catch (error) {
      if (isAlreadyActiveSubscriptionError(error)) {
        const syncResult = await handleSync({ silent: true });

        if (syncResult?.success && syncResult.tier === "PRO") {
          toast.success("You already have an active subscription");
          await handleManageBilling();
          return;
        }
      }

      toast.error("Failed to start checkout");
    } finally {
      setCheckoutLoading(false);
    }
  };

  const currentTier =
    (query.data?.user?.subscriptionTier as SubscriptionTier | undefined) ??
    "FREE";
  const currentStatus =
    (query.data?.user?.subscriptionStatus as SubscriptionStatus | null) ??
    null;
  const hasProAccess = currentTier === "PRO";

  return {
    ...query,
    syncLoading,
    checkoutLoading,
    currentTier,
    currentStatus,
    hasProAccess,
    repoUsage: query.data?.limits?.repositories,
    handleManageBilling,
    handleSync,
    handleUpgrade,
  };
}
