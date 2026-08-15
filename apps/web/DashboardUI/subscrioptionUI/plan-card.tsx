import type { LucideIcon } from "lucide-react";
import { Check, X } from "lucide-react";
import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { PlanFeature } from "@/app/dashboard/subscription/subscription-constants";


type PlanCardProps = {
  action: ReactNode;
  description: string;
  features: PlanFeature[];
  highlighted?: boolean;
  icon: LucideIcon;
  isCurrent?: boolean;
  price: string;
  title: string;
};

export function PlanCard({
  action,
  description,
  features,
  highlighted = false,
  icon: Icon,
  isCurrent = false,
  price,
  title,
}: PlanCardProps) {
  return (
    <Card
      className={cn(
        "relative flex h-full flex-col overflow-hidden border-2",
        highlighted
          ? "border-primary/30 bg-card/80 backdrop-blur"
          : isCurrent
            ? "border-primary shadow-lg shadow-primary/10"
            : "border-border/60"
      )}
    >
      {isCurrent && (
        <Badge className="absolute right-4 top-4">
          {highlighted ? "Active Plan" : "Current Plan"}
        </Badge>
      )}

      {highlighted && (
        <div className="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-primary via-primary/70 to-primary" />
      )}

      <CardHeader className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-primary/10 p-3">
            <Icon className="h-5 w-5 text-primary" />
          </div>

          <div>
            <CardTitle className="text-2xl">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
        </div>

        <div className="flex items-end gap-1">
          <span className="text-5xl font-bold">{price}</span>
          <span className="pb-1 text-lg text-muted-foreground">/month</span>
        </div>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col justify-between gap-8">
        <div className="space-y-4">
          {features.map((feature) => (
            <div key={feature.name} className="flex items-center gap-3">
              {feature.included ? (
                <Check className="h-4 w-4 text-primary" />
              ) : (
                <X className="h-4 w-4 text-muted-foreground" />
              )}

              <span className={feature.included ? "" : "text-muted-foreground"}>
                {feature.name}
              </span>
            </div>
          ))}
        </div>

        {action}
      </CardContent>
    </Card>
  );
}
