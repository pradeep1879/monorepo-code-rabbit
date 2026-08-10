import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";

import { prisma } from "@repo/db"


export const auth = betterAuth({
    database: prismaAdapter(prisma, {
        provider: "postgresql", // or "mysql", "postgresql", ...etc
    }),
    socialProviders:({
      github:{
        clientId:process.env.GITHUB_CLIENT_ID!,
        clientSecret:process.env.GITHUB_CLIENT_SECRET!,
        scope: ["repo"]
      }
    }),
    trustedOrigins: ["http://localhost:3001", "https://astrology-palace-proofread.ngrok-free.dev"]
});