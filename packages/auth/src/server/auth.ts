import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";

import { prisma } from "@repo/db"
import { polarClient } from "@/module/payment/config/polar";
import {
  polar,
  checkout,
  portal,
  usage,
  webhooks,
} from "@polar-sh/better-auth";
import {
  syncPolarCustomerForEmail,
  syncSubscriptionStateFromPolarSubscription,
} from "@/module/payment/lib/polar-subscription";


export const auth = betterAuth({
    database: prismaAdapter(prisma, {
        provider: "postgresql", // or "mysql", "postgresql", ...etc
    }),
    trustedOrigins: ["http://localhost:3001", "https://astrology-palace-proofread.ngrok-free.dev"],

    socialProviders:({
      github:{
        clientId:process.env.GITHUB_CLIENT_ID!,
        clientSecret:process.env.GITHUB_CLIENT_SECRET!,
        scope: ["repo"]
      }
    }),

   plugins: [
    polar({
        client: polarClient,
        createCustomerOnSignUp: true,
        use: [
            checkout({
                products: [
                  {
                    productId: "731a3ba1-947f-4493-81f0-08f86f6ec085",
                    slug: "CodeRabbitMonorepo-Sandbox-Product" // Custom slug for easy reference in Checkout URL, e.g. /checkout/CodeRabbit
                  }
                ],
                successUrl: process.env.POLAR_SUCCESS_URL || "/dashboard/subscription?success=true",
                authenticatedUsersOnly: true
            }),
            portal({
              returnUrl: process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "http://localhost:3001/dashboard"
            }),
            usage(),
            webhooks({
              secret: process.env.POLAR_WEBHOOK_SECRET!,
              onSubscriptionActive: async (payload) => {
                await syncSubscriptionStateFromPolarSubscription(
                  payload.data
                );
              },
              onSubscriptionCreated: async (payload) => {
                await syncSubscriptionStateFromPolarSubscription(
                  payload.data
                );
              },
              onSubscriptionUpdated: async (payload) => {
                await syncSubscriptionStateFromPolarSubscription(
                  payload.data
                );
              },
              onSubscriptionCanceled: async (payload) => {
                await syncSubscriptionStateFromPolarSubscription(
                  payload.data
                );
              },
              onSubscriptionRevoked: async (payload) => {
                await syncSubscriptionStateFromPolarSubscription(
                  payload.data
                );
              },
              onSubscriptionUncanceled: async (payload) => {
                await syncSubscriptionStateFromPolarSubscription(
                  payload.data
                );
              },
              onOrderPaid: async () => {},
              onCustomerCreated: async (payload) => {
                await syncPolarCustomerForEmail(
                  payload.data.id,
                  payload.data.email
                );
              },
              onCustomerUpdated: async (payload) => {
                await syncPolarCustomerForEmail(
                  payload.data.id,
                  payload.data.email
                );
              }
            })
        ],
    })
  ]
});