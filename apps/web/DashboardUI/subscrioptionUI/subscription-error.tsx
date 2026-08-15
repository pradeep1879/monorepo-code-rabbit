import { AlertCircle } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

type SubscriptionErrorProps = {
  error: unknown;
  onRetry: () => void;
};

export function SubscriptionError({ error, onRetry }: SubscriptionErrorProps) {
  return (
    <div className="space-y-6">
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Failed to load subscription</AlertTitle>
        <AlertDescription>
          {error instanceof Error
            ? error.message
            : "Please try again in a moment."}
        </AlertDescription>
      </Alert>

      <Button variant="outline" onClick={onRetry}>
        Retry
      </Button>
    </div>
  );
}
