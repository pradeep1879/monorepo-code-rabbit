import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({
  path: path.resolve(__dirname, "../../.env"),
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",

  outputFileTracingRoot: path.join(__dirname, "../../"),

  transpilePackages: ["@repo/db"],

  allowedDevOrigins: ['astrology-palace-proofread.ngrok-free.dev']
};

export default nextConfig;