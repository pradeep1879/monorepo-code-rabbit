import { defineConfig, env } from "prisma/config";
import dotenv from "dotenv";
import path from "path";

// Load root .env
dotenv.config({
  path: path.resolve(__dirname, "../../.env"),
});

export default defineConfig({
  schema: "prisma/schema.prisma",

  migrations: {
    path: "prisma/migrations",
  },

  datasource: {
    url: env("DATABASE_URL"),
  },
});