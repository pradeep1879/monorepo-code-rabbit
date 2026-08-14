"use server";

import { headers } from "next/headers";

import {
  syncSubscriptionStateForUser,
  type SubscriptionSyncResult,
} from "@/module/payment/lib/polar-subscription";
import {
  getRemainingLimits,
  type SubscriptionStatus,
  type SubscriptionTier,
} from "@/module/payment/lib/subscription";
import { prisma } from "@repo/db";
import { auth } from "@repo/auth/server";

export interface SubscriptionData {
    user: {
        id: string;
        name: string;
        email: string;
        subscriptionTier: SubscriptionTier;
        subscriptionStatus: SubscriptionStatus | null;
        polarCustomerId: string | null;
        polarSubscriptionId: string | null;
    } | null;
    limits: {
        tier: "FREE" | "PRO";
        repositories: {
            current: number;
            limit: number | null;
            canAdd: boolean;
        };
        reviews: {
            [repositoryId: string]: {
                current: number;
                limit: number | null;
                canAdd: boolean;
            };
        };
    } | null;
}

export async function getSubscriptionData(): Promise<SubscriptionData> {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session?.user) {
        return { user: null, limits: null };
    }

    const user = await prisma.user.findUnique({
        where: { id: session.user.id }
    });

    if (!user) {
        return { user: null, limits: null };
    }

    const limits = await getRemainingLimits(user.id);

    return {
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            subscriptionTier:
                (user.subscriptionTier as SubscriptionTier) || "FREE",
            subscriptionStatus:
                (user.subscriptionStatus as SubscriptionStatus | null) || null,
            polarCustomerId: user.polarCustomerId || null,
            polarSubscriptionId: user.polarSubscriptionId || null,
        },
        limits,
    };
}

export async function syncSubscriptionStatus(): Promise<SubscriptionSyncResult> {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session?.user) {
        return {
            success: false,
            message: "Not authenticated",
        };
    }

    return syncSubscriptionStateForUser(session.user.id);
}
