import Link from "next/link";
import { GraduationCap } from "lucide-react";

import { APP_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function BrandLogo({
  href,
  className,
  showTagline = false,
  inverted = false,
}: {
  href?: string;
  className?: string;
  showTagline?: boolean;
  inverted?: boolean;
}) {
  const content = (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div
        className={cn(
          "flex size-9 items-center justify-center rounded-xl shadow-sm",
          inverted
            ? "bg-white/15 text-primary-foreground"
            : "bg-primary text-primary-foreground shadow-primary/25",
        )}
      >
        <GraduationCap className="size-5" strokeWidth={2.25} />
      </div>
      <div className="text-left leading-tight">
        <span
          className={cn(
            "block text-sm font-semibold tracking-tight",
            inverted && "text-primary-foreground",
          )}
        >
          {APP_NAME}
        </span>
        {showTagline ? (
          <span
            className={cn(
              "block text-xs text-muted-foreground",
              inverted && "text-primary-foreground/70",
            )}
          >
            Academic planner
          </span>
        ) : null}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="transition-opacity hover:opacity-90">
        {content}
      </Link>
    );
  }

  return content;
}
