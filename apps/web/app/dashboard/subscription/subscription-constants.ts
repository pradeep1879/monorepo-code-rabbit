import type {
  SubscriptionStatus,
} from "@/module/payment/lib/subscription";

export type PlanFeature = {
  name: string;
  included: boolean;
};

export const PLAN_FEATURES: Record<"FREE" | "PRO", PlanFeature[]> = {
  FREE: [
    { name: "Up to 5 repositories", included: true },
    { name: "Up to 5 reviews per repository", included: true },
    { name: "Basic code reviews", included: true },
    { name: "Community support", included: true },
    { name: "Advanced analytics", included: false },
    { name: "Priority support", included: false },
  ],
  PRO: [
    { name: "Unlimited repositories", included: true },
    { name: "Unlimited reviews", included: true },
    { name: "Advanced code reviews", included: true },
    { name: "Email support", included: true },
    { name: "Advanced analytics", included: true },
    { name: "Priority support", included: true },
  ],
};

export const STATUS_LABELS: Record<SubscriptionStatus, string> = {
  ACTIVE: "Active",
  CANCELED: "Canceled",
  EXPIRED: "Expired",
};
