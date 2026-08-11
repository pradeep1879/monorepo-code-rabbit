import { serve } from "inngest/next";
import { inngest } from "../../../inngest/client";
import { processTask } from "@/inngest/function/inngest";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [processTask],
});