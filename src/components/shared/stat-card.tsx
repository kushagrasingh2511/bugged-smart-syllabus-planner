import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Accent = "primary" | "emerald" | "amber" | "rose" | "cyan";

const accentConfig: Record<Accent, {
  icon: string;
  value: string;
  glow: string;
  border: string;
}> = {
  primary: {
    icon:   "bg-primary/15 text-primary",
    value:  "text-foreground",
    glow:   "from-primary/8 to-transparent",
    border: "border-border/60",
  },
  emerald: {
    icon:   "bg-emerald-500/15 text-emerald-400",
    value:  "text-emerald-400",
    glow:   "from-emerald-500/8 to-transparent",
    border: "border-emerald-500/15",
  },
  amber: {
    icon:   "bg-amber-500/15 text-amber-400",
    value:  "text-amber-400",
    glow:   "from-amber-500/8 to-transparent",
    border: "border-amber-500/15",
  },
  rose: {
    icon:   "bg-rose-500/15 text-rose-400",
    value:  "text-rose-400",
    glow:   "from-rose-500/8 to-transparent",
    border: "border-rose-500/15",
  },
  cyan: {
    icon:   "bg-cyan-500/15 text-cyan-400",
    value:  "text-cyan-400",
    glow:   "from-cyan-500/8 to-transparent",
    border: "border-cyan-500/15",
  },
};

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  className,
  accent = "primary",
}: {
  label: string;
  value: string;
  hint?: string;
  icon: LucideIcon;
  className?: string;
  accent?: Accent;
}) {
  const cfg = accentConfig[accent];

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-[24px] border bg-card p-5",
        "transition-all duration-300 hover:-translate-y-0.5",
        "hover:shadow-[0_6px_24px_oklch(0_0_0/0.12)]",
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
          {/* Label — overline style, clearly readable */}
          <p className="text-[0.6875rem] font-bold uppercase tracking-[0.08em] text-muted-foreground">
            {label}
          </p>
          {/* Value — dominant number */}
          <p className={cn("count-up font-bold tabular-nums leading-none", cfg.value)}
             style={{ fontSize: "clamp(1.75rem, 4vw, 2.25rem)", letterSpacing: "-0.03em" }}>
            {value}
          </p>
          {/* Hint — caption */}
          {hint && (
            <p className="text-xs text-muted-foreground leading-snug">{hint}</p>
          )}
        </div>
        <div
          className={cn(
            "flex size-11 shrink-0 items-center justify-center rounded-[20px]",
            "transition-transform duration-300 group-hover:scale-110",
            cfg.icon,
          )}
        >
          <Icon className="size-5" strokeWidth={2} />
        </div>
      </div>
    </div>
  );
}
