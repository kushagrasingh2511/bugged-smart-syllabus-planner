import * as React from "react"

import { cn } from "@/lib/utils"

/*
  Card radius tokens (from design system):
  - Main card:      24px  → rounded-card
  - Secondary card: 20px  → rounded-card-sm
  - Hero card:      32px  → rounded-hero

  Use the `variant` prop to control visual weight:
  - default  = standard card
  - elevated = shadow + stronger border
  - hero     = 32px radius, gradient accent
  - flush    = no padding (for header+content splits)
*/

function Card({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<"div"> & {
  variant?: "default" | "elevated" | "hero" | "flush"
}) {
  return (
    <div
      data-slot="card"
      data-variant={variant}
      className={cn(
        "group/card flex flex-col overflow-hidden",
        "bg-card text-card-foreground",
        // Default: 24px radius, subtle border
        variant === "default"  && "rounded-[24px] border border-border/60",
        variant === "elevated" && "rounded-[24px] border border-border/60 shadow-[0_2px_8px_oklch(0_0_0/0.10),0_0_0_1px_oklch(1_0_0/0.06)]",
        variant === "hero"     && "rounded-[32px] border border-primary/15 bg-gradient-to-br from-primary/8 via-card to-card",
        variant === "flush"    && "rounded-[24px] border border-border/60",
        className
      )}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "flex flex-col gap-1 px-6 py-5",
        "[.border-b]:pb-4",
        className
      )}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn(
        "text-[1.125rem] font-semibold leading-snug tracking-tight text-foreground",
        className
      )}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn(
        "text-sm text-muted-foreground leading-relaxed",
        className
      )}
      {...props}
    />
  )
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn("self-start", className)}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("px-6 pb-5", className)}
      {...props}
    />
  )
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn(
        "flex items-center border-t border-border/60 bg-muted/30 px-6 py-4",
        className
      )}
      {...props}
    />
  )
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
}
