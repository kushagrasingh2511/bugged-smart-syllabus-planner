import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  // Base — chip radius (9999px), strong contrast text
  [
    "inline-flex items-center justify-center gap-1 overflow-hidden",
    "h-5 w-fit shrink-0 px-2.5 py-0.5",
    "text-[0.6875rem] font-semibold whitespace-nowrap",
    "rounded-[9999px] border border-transparent",
    "transition-colors",
    "[&>svg]:pointer-events-none [&>svg]:size-3",
  ].join(" "),
  {
    variants: {
      variant: {
        default:     "bg-primary/20 text-primary border-primary/25",
        secondary:   "bg-white/10 text-foreground border-white/12",
        destructive: "bg-destructive/15 text-destructive border-destructive/25",
        outline:     "border-border/70 text-foreground bg-transparent",
        ghost:       "bg-transparent text-muted-foreground border-transparent hover:bg-white/6",
        success:     "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
        warning:     "bg-amber-500/15 text-amber-400 border-amber-500/25",
        info:        "bg-sky-500/15 text-sky-400 border-sky-500/25",
        link:        "text-primary underline-offset-4 hover:underline",
      },
    },
    defaultVariants: { variant: "default" },
  }
)

function Badge({
  className,
  variant = "default",
  render,
  ...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      { className: cn(badgeVariants({ variant }), className) },
      props
    ),
    render,
    state: { slot: "badge", variant },
  })
}

export { Badge, badgeVariants }
