
import { polarClient } from "@/module/payment/config/polar";
import type { Subscription as PolarSubscription } from "@polar-sh/sdk/models/components/subscription";

import type {
  SubscriptionStatus as AppSubscriptionStatus,
  SubscriptionTier,
} from "./subscription";
import { prisma } from "@repo/db";

type SyncableUser = {
  id: string;
  email: string;
  subscriptionTier: string;
  subscriptionStatus: string | null;
  polarCustomerId: string | null;
  polarSubscriptionId: string | null;
};

type PersistedSubscriptionState = {
  subscriptionTier: SubscriptionTier;
  subscriptionStatus: AppSubscriptionStatus | null;
  polarCustomerId: string | null;
  polarSubscriptionId: string | null;
};

export type SubscriptionSyncResult = {
  success: boolean;
  message: string;
  userId?: string;
  tier?: SubscriptionTier;
  status?: AppSubscriptionStatus | null;
  polarCustomerId?: string | null;
  polarSubscriptionId?: string | null;
};

const ACTIVE_POLAR_STATUSES = new Set(["active", "trialing", "past_due"]);
const EXPIRED_POLAR_STATUSES = new Set([
  "canceled",
  "unpaid",
  "incomplete",
  "incomplete_expired",
]);

function getRelevantDate(subscription: PolarSubscription): number {
  return Math.max(
    subscription.endedAt?.getTime() ?? 0,
    subscription.endsAt?.getTime() ?? 0,
    subscription.currentPeriodEnd.getTime(),
    subscription.currentPeriodStart.getTime(),
    subscription.modifiedAt?.getTime() ?? 0,
    subscription.createdAt.getTime()
  );
}

function hasCurrentAccess(
  subscription: PolarSubscription,
  now: Date
): boolean {
  if (ACTIVE_POLAR_STATUSES.has(subscription.status)) {
    return true;
  }

  const accessEndsAt =
    subscription.endsAt ??
    subscription.endedAt ??
    subscription.currentPeriodEnd;

  return (
    subscription.cancelAtPeriodEnd &&
    accessEndsAt.getTime() > now.getTime()
  );
}

function deriveSubscriptionState(
  subscription: PolarSubscription | null,
  fallbackCustomerId: string | null,
  hadPreviousSubscription: boolean
): PersistedSubscriptionState {
  if (!subscription) {
    return {
      subscriptionTier: "FREE",
      subscriptionStatus: hadPreviousSubscription ? "EXPIRED" : null,
      polarCustomerId: fallbackCustomerId,
      polarSubscriptionId: null,
    };
  }

  const now = new Date();
  const accessEndsAt =
    subscription.endsAt ??
    subscription.endedAt ??
    subscription.currentPeriodEnd;

  const hasAccess = hasCurrentAccess(subscription, now);
  const shouldShowCanceled =
    hasAccess &&
    (subscription.cancelAtPeriodEnd ||
      subscription.status === "canceled" ||
      subscription.canceledAt !== null);

  const status: AppSubscriptionStatus = hasAccess
    ? shouldShowCanceled
      ? "CANCELED"
      : "ACTIVE"
    : EXPIRED_POLAR_STATUSES.has(subscription.status) ||
        accessEndsAt.getTime() <= now.getTime()
      ? "EXPIRED"
      : "CANCELED";

  return {
    subscriptionTier: hasAccess ? "PRO" : "FREE",
    subscriptionStatus: status,
    polarCustomerId: subscription.customerId ?? fallbackCustomerId,
    polarSubscriptionId: subscription.id,
  };
}

function pickBestSubscription(
  subscriptions: PolarSubscription[]
): PolarSubscription | null {
  if (subscriptions.length === 0) {
    return null;
  }

  const now = new Date();

  //@ts-ignore
  return [...subscriptions].sort((left, right) => {
    const leftRank = hasCurrentAccess(left, now)
      ? ACTIVE_POLAR_STATUSES.has(left.status)
        ? 3
        : 2
      : 1;
    const rightRank = hasCurrentAccess(right, now)
      ? ACTIVE_POLAR_STATUSES.has(right.status)
        ? 3
        : 2
      : 1;

    if (leftRank !== rightRank) {
      return rightRank - leftRank;
    }

    return getRelevantDate(right) - getRelevantDate(left);
  })[0];
}

async function findPolarCustomerIdByEmail(
  email: string
): Promise<string | null> {
  const result = await polarClient.customers.list({
    email,
    limit: 10,
  });

  const customers = result.result.items;
  const exactMatch = customers.find(
    (customer) =>
      customer.email?.toLowerCase() === email.toLowerCase()
  );

  return exactMatch?.id ?? null;
}

async function persistSubscriptionState(
  user: SyncableUser,
  nextState: PersistedSubscriptionState
): Promise<void> {
  const updateData: Partial<PersistedSubscriptionState> = {};

  if (user.subscriptionTier !== nextState.subscriptionTier) {
    updateData.subscriptionTier = nextState.subscriptionTier;
  }

  if (user.subscriptionStatus !== nextState.subscriptionStatus) {
    updateData.subscriptionStatus = nextState.subscriptionStatus;
  }

  if (
    nextState.polarCustomerId &&
    nextState.polarCustomerId !== user.polarCustomerId
  ) {
    const conflictingCustomerUser =
      await prisma.user.findFirst({
        where: {
          polarCustomerId: nextState.polarCustomerId,
          NOT: { id: user.id },
        },
        select: { id: true },
      });

    if (!conflictingCustomerUser) {
      updateData.polarCustomerId = nextState.polarCustomerId;
    } else {
      console.error(
        "Polar customer ID already belongs to another user",
        {
          userId: user.id,
          polarCustomerId: nextState.polarCustomerId,
          conflictingUserId: conflictingCustomerUser.id,
        }
      );
    }
  }

  if (
    nextState.polarSubscriptionId !== user.polarSubscriptionId
  ) {
    if (nextState.polarSubscriptionId) {
      const conflictingSubscriptionUser =
        await prisma.user.findFirst({
          where: {
            polarSubscriptionId:
              nextState.polarSubscriptionId,
            NOT: { id: user.id },
          },
          select: { id: true },
        });

      if (!conflictingSubscriptionUser) {
        updateData.polarSubscriptionId =
          nextState.polarSubscriptionId;
      } else {
        console.error(
          "Polar subscription ID already belongs to another user",
          {
            userId: user.id,
            polarSubscriptionId:
              nextState.polarSubscriptionId,
            conflictingUserId:
              conflictingSubscriptionUser.id,
          }
        );
      }
    } else {
      updateData.polarSubscriptionId = null;
    }
  }

  if (Object.keys(updateData).length === 0) {
    return;
  }

  await prisma.user.update({
    where: { id: user.id },
    data: updateData,
  });
}

export async function syncSubscriptionStateForUser(
  userId: string
): Promise<SubscriptionSyncResult> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      subscriptionTier: true,
      subscriptionStatus: true,
      polarCustomerId: true,
      polarSubscriptionId: true,
    },
  });

  if (!user) {
    return {
      success: false,
      message: "User not found",
    };
  }

  try {
    const polarCustomerId =
      user.polarCustomerId ??
      (await findPolarCustomerIdByEmail(user.email));

    if (!polarCustomerId) {
      return {
        success: false,
        message: "No Polar customer found for this account",
        userId: user.id,
        tier: (user.subscriptionTier as SubscriptionTier) ?? "FREE",
        status:
          (user.subscriptionStatus as AppSubscriptionStatus | null) ??
          null,
        polarCustomerId: null,
        polarSubscriptionId: user.polarSubscriptionId,
      };
    }

    const response =
      await polarClient.subscriptions.list({
        customerId: polarCustomerId,
        limit: 100,
      });

    const subscriptions = response.result.items;
    const bestSubscription =
      pickBestSubscription(subscriptions);
    const nextState = deriveSubscriptionState(
      bestSubscription,
      polarCustomerId,
      Boolean(
        subscriptions.length > 0 ||
          user.polarSubscriptionId ||
          user.subscriptionStatus
      )
    );

    await persistSubscriptionState(user, nextState);

    return {
      success: true,
      message: bestSubscription
        ? "Subscription synced successfully"
        : "No active subscription found",
      userId: user.id,
      tier: nextState.subscriptionTier,
      status: nextState.subscriptionStatus,
      polarCustomerId: nextState.polarCustomerId,
      polarSubscriptionId: nextState.polarSubscriptionId,
    };
  } catch (error) {
    console.error("Failed to sync subscription state", {
      userId,
      error,
    });

    return {
      success: false,
      message: "Failed to sync subscription with Polar",
      userId: user.id,
      tier: (user.subscriptionTier as SubscriptionTier) ?? "FREE",
      status:
        (user.subscriptionStatus as AppSubscriptionStatus | null) ??
        null,
      polarCustomerId: user.polarCustomerId,
      polarSubscriptionId: user.polarSubscriptionId,
    };
  }
}

export async function syncSubscriptionStateFromPolarSubscription(
  subscription: PolarSubscription
): Promise<SubscriptionSyncResult> {
  const customerEmail = subscription.customer.email ?? null;
  const matchingUser =
    (subscription.customerId
      ? await prisma.user.findFirst({
          where: {
            polarCustomerId: subscription.customerId,
          },
          select: {
            id: true,
            email: true,
            subscriptionTier: true,
            subscriptionStatus: true,
            polarCustomerId: true,
            polarSubscriptionId: true,
          },
        })
      : null) ??
    (subscription.id
      ? await prisma.user.findFirst({
          where: {
            polarSubscriptionId: subscription.id,
          },
          select: {
            id: true,
            email: true,
            subscriptionTier: true,
            subscriptionStatus: true,
            polarCustomerId: true,
            polarSubscriptionId: true,
          },
        })
      : null) ??
    (customerEmail
      ? await prisma.user.findUnique({
          where: {
            email: customerEmail,
          },
          select: {
            id: true,
            email: true,
            subscriptionTier: true,
            subscriptionStatus: true,
            polarCustomerId: true,
            polarSubscriptionId: true,
          },
        })
      : null);

  if (!matchingUser) {
    console.error(
      "No local user found for Polar subscription event",
      {
        polarCustomerId: subscription.customerId,
        polarSubscriptionId: subscription.id,
        customerEmail,
      }
    );

    return {
      success: false,
      message:
        "No matching user found for Polar subscription event",
      polarCustomerId: subscription.customerId,
      polarSubscriptionId: subscription.id,
    };
  }

  if (
    subscription.customerId &&
    matchingUser.polarCustomerId !==
      subscription.customerId
  ) {
    await persistSubscriptionState(matchingUser, {
      subscriptionTier:
        (matchingUser.subscriptionTier as SubscriptionTier) ??
        "FREE",
      subscriptionStatus:
        (matchingUser.subscriptionStatus as AppSubscriptionStatus | null) ??
        null,
      polarCustomerId: subscription.customerId,
      polarSubscriptionId:
        matchingUser.polarSubscriptionId,
    });
  }

  const fullSyncResult =
    await syncSubscriptionStateForUser(
      matchingUser.id
    );

  if (fullSyncResult.success) {
    return {
      ...fullSyncResult,
      message: "Subscription event processed",
    };
  }

  const nextState = deriveSubscriptionState(
    subscription,
    subscription.customerId,
    true
  );

  await persistSubscriptionState(matchingUser, nextState);

  return {
    success: true,
    message:
      "Subscription event processed with fallback state",
    userId: matchingUser.id,
    tier: nextState.subscriptionTier,
    status: nextState.subscriptionStatus,
    polarCustomerId: nextState.polarCustomerId,
    polarSubscriptionId: nextState.polarSubscriptionId,
  };
}

export async function syncPolarCustomerForEmail(
  customerId: string,
  email: string | null | undefined
): Promise<void> {
  if (!email) {
    return;
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      polarCustomerId: true,
    },
  });

  if (!user) {
    return;
  }

  if (user.polarCustomerId === customerId) {
    return;
  }

  const conflictingUser = await prisma.user.findFirst({
    where: {
      polarCustomerId: customerId,
      NOT: { id: user.id },
    },
    select: { id: true },
  });

  if (conflictingUser) {
    console.error(
      "Polar customer ID conflict while syncing customer",
      {
        email,
        customerId,
        conflictingUserId: conflictingUser.id,
      }
    );
    return;
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { polarCustomerId: customerId },
  });
}
