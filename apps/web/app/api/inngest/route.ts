import { serve } from "inngest/next";
import { inngest } from "../../../inngest/client";
import { indexRepo, processTask } from "@/inngest/function/inngest";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [processTask, indexRepo],
});