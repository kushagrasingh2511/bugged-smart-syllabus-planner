"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type Accent = "primary" | "emerald" | "amber" | "rose" | "cyan";

const accentConfig: Record<Accent, {
  icon: string;
  value: string;
  glow: string;
  border: string;
  hoverShadow: string;
}> = {
  primary: {
    icon:        "bg-primary/15 text-primary",
    value:       "text-foreground",
    glow:        "from-primary/8 to-transparent",
    border:      "border-border/60",
    hoverShadow: "0 8px 32px oklch(0.68 0.22 270 / 0.18), 0 2px 8px oklch(0 0 0 / 0.10)",
  },
  emerald: {
    icon:        "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
    value:       "text-emerald-600 dark:text-emerald-400",
    glow:        "from-emerald-500/8 to-transparent",
    border:      "border-emerald-500/15",
    hoverShadow: "0 8px 32px oklch(0.68 0.18 145 / 0.16), 0 2px 8px oklch(0 0 0 / 0.10)",
  },
  amber: {
    icon:        "bg-amber-500/15 text-amber-700 dark:text-amber-400",
    value:       "text-amber-700 dark:text-amber-400",
    glow:        "from-amber-500/8 to-transparent",
    border:      "border-amber-500/15",
    hoverShadow: "0 8px 32px oklch(0.74 0.14 85 / 0.18), 0 2px 8px oklch(0 0 0 / 0.10)",
  },
  rose: {
    icon:        "bg-rose-500/15 text-rose-600 dark:text-rose-400",
    value:       "text-rose-600 dark:text-rose-400",
    glow:        "from-rose-500/8 to-transparent",
    border:      "border-rose-500/15",
    hoverShadow: "0 8px 32px oklch(0.68 0.22 25 / 0.16), 0 2px 8px oklch(0 0 0 / 0.10)",
  },
  cyan: {
    icon:        "bg-cyan-500/15 text-cyan-700 dark:text-cyan-400",
    value:       "text-cyan-700 dark:text-cyan-400",
    glow:        "from-cyan-500/8 to-transparent",
    border:      "border-cyan-500/15",
    hoverShadow: "0 8px 32px oklch(0.65 0.18 200 / 0.16), 0 2px 8px oklch(0 0 0 / 0.10)",
  },
};

export function StatCard({
  label,
  value,
  hint,
  icon,
  className,
  accent = "primary",
}: {
  label: string;
  value: string;
  hint?: string;
  icon: ReactNode;
  className?: string;
  accent?: Accent;
}) {
  const cfg = accentConfig[accent];

  return (
    <motion.div
      whileHover={{
        y: -3,
        boxShadow: cfg.hoverShadow,
        transition: { duration: 0.2, ease: "easeOut" },
      }}
      className={cn(
        "group relative overflow-hidden rounded-card border bg-card p-5",
        "transition-colors duration-200",
        cfg.border,
        className,
      )}
    >
      {/* Gradient accent top-left */}
      <div
        className={cn("pointer-events-none absolute inset-0 bg-gradient-to-br opacity-70", cfg.glow)}
        aria-hidden
      />

      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-2">
          <p className="text-overline text-muted-foreground">{label}</p>
          <p className={cn("count-up stat-dominant tabular-nums leading-none", cfg.value)}>
            {value}
          </p>
          {hint && (
            <p className="text-caption text-muted-foreground leading-snug">{hint}</p>
          )}
        </div>
        <div
          className={cn(
            "flex size-11 shrink-0 items-center justify-center rounded-card-sm",
            "transition-transform duration-300 group-hover:scale-110",
            cfg.icon,
          )}
        >
          {icon}
        </div>
      </div>
    </motion.div>
  );
}
