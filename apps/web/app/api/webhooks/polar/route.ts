import { NextResponse } from "next/server";

import { validateEvent } from "@polar-sh/sdk/webhooks";
import type { WebhookCustomerCreatedPayload } from "@polar-sh/sdk/models/components/webhookcustomercreatedpayload";
import type { WebhookCustomerUpdatedPayload } from "@polar-sh/sdk/models/components/webhookcustomerupdatedpayload";
import type { WebhookSubscriptionActivePayload } from "@polar-sh/sdk/models/components/webhooksubscriptionactivepayload";
import type { WebhookSubscriptionCreatedPayload } from "@polar-sh/sdk/models/components/webhooksubscriptioncreatedpayload";
import type { WebhookSubscriptionRevokedPayload } from "@polar-sh/sdk/models/components/webhooksubscriptionrevokedpayload";
import type { WebhookSubscriptionUncanceledPayload } from "@polar-sh/sdk/models/components/webhooksubscriptionuncanceledpayload";
import type { WebhookSubscriptionUpdatedPayload } from "@polar-sh/sdk/models/components/webhooksubscriptionupdatedpayload";
import type { WebhookSubscriptionCanceledPayload } from "@polar-sh/sdk/models/components/webhooksubscriptioncanceledpayload";
import { syncPolarCustomerForEmail, syncSubscriptionStateFromPolarSubscription } from "@/module/payment/lib/polar-subscription";


function getWebhookSecret(): string | null {
  return process.env.POLAR_WEBHOOK_SECRET ?? null;
}

export async function POST(request: Request) {
  const secret = getWebhookSecret();

  if (!secret) {
    console.error(
      "POLAR_WEBHOOK_SECRET is not configured for /api/webhooks/polar"
    );

    return NextResponse.json(
      { error: "Webhook secret is not configured" },
      { status: 500 }
    );
  }

  const rawBody = await request.text();

  try {
    const event = validateEvent(
      rawBody,
      Object.fromEntries(request.headers.entries()),
      secret
    );
    const eventType = (event as { type: string }).type;

    switch (eventType) {
      case "customer.created":
      case "customer.updated":
        {
          const customerEvent = event as
            | WebhookCustomerCreatedPayload
            | WebhookCustomerUpdatedPayload;

        await syncPolarCustomerForEmail(
          customerEvent.data.id,
          customerEvent.data.email
        );
        }
        break;
      case "subscription.created":
      case "subscription.active":
      case "subscription.updated":
      case "subscription.canceled":
      case "subscription.revoked":
      case "subscription.expired":
      case "subscription.uncanceled":
        {
          const subscriptionEvent = event as
            | WebhookSubscriptionCreatedPayload
            | WebhookSubscriptionActivePayload
            | WebhookSubscriptionUpdatedPayload
            | WebhookSubscriptionCanceledPayload
            | WebhookSubscriptionRevokedPayload
            | WebhookSubscriptionUncanceledPayload;

        await syncSubscriptionStateFromPolarSubscription(
          subscriptionEvent.data
        );
        }
        break;
      default:
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Failed to process Polar webhook", error);

    return NextResponse.json(
      { error: "Invalid webhook payload" },
      { status: 400 }
    );
  }
}
