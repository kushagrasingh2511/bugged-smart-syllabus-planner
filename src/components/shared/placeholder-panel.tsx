import type { LucideIcon } from "lucide-react";
import { Construction } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function PlaceholderPanel({
  title,
  description,
  phase,
  icon: Icon = Construction,
  steps,
}: {
  title: string;
  description: string;
  phase?: number;
  icon?: LucideIcon;
  steps?: string[];
}) {
  return (
    <Card className="overflow-hidden border-dashed border-border/80 bg-card/60 shadow-sm backdrop-blur-sm">
      <CardContent className="flex flex-col items-center px-6 py-12 text-center sm:px-10 sm:py-14">
        <div className="relative mb-6">
          <div
            className="absolute inset-0 rounded-2xl bg-primary/20 blur-xl"
            aria-hidden
          />
          <div className="relative flex size-14 items-center justify-center rounded-2xl border border-primary/10 bg-gradient-to-br from-primary/15 to-primary/5 text-primary">
            <Icon className="size-7" strokeWidth={1.75} />
          </div>
        </div>
        {phase ? (
          <Badge variant="secondary" className="mb-3">
            Phase {phase}
          </Badge>
        ) : null}
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
        {steps && steps.length > 0 ? (
          <ul className="mt-8 w-full max-w-sm space-y-2 text-left">
            {steps.map((step, index) => (
              <li
                key={step}
                className={cn(
                  "flex items-start gap-3 rounded-lg border border-border/60 bg-muted/30 px-3 py-2.5 text-sm",
                )}
              >
                <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-primary/10 text-xs font-semibold text-primary">
                  {index + 1}
                </span>
                <span className="text-muted-foreground">{step}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </CardContent>
    </Card>
  );
}
