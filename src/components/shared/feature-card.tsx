import Link from "next/link";
import { ArrowUpRight, type LucideIcon } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const accentStyles = [
  "from-violet-500/15 to-violet-500/5 text-violet-600 dark:text-violet-400",
  "from-sky-500/15 to-sky-500/5 text-sky-600 dark:text-sky-400",
  "from-emerald-500/15 to-emerald-500/5 text-emerald-600 dark:text-emerald-400",
  "from-amber-500/15 to-amber-500/5 text-amber-600 dark:text-amber-400",
  "from-rose-500/15 to-rose-500/5 text-rose-600 dark:text-rose-400",
] as const;

export function FeatureCard({
  title,
  description,
  href,
  icon: Icon,
  accentIndex = 0,
}: {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  accentIndex?: number;
}) {
  const accent = accentStyles[accentIndex % accentStyles.length];

  return (
    <Link href={href} className="group block h-full">
      <Card
        className={cn(
          "h-full border-border/60 bg-card/90 shadow-sm transition-all duration-200",
          "hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-md hover:shadow-primary/5",
        )}
      >
        <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0 pb-2">
          <div
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br",
              accent,
            )}
          >
            <Icon className="size-5" strokeWidth={2} />
          </div>
          <ArrowUpRight
            className="size-4 shrink-0 text-muted-foreground/50 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-primary"
            aria-hidden
          />
        </CardHeader>
        <CardContent className="pt-0">
          <CardTitle className="text-base font-semibold">{title}</CardTitle>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
