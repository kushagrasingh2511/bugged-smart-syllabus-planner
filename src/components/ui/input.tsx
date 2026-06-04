import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        // Size & radius — 16px radius from design token
        "h-10 w-full min-w-0 rounded-[16px]",
        // Colors — stronger contrast than default
        "border border-border/80 bg-background/80 px-3.5 py-2",
        "text-[0.9375rem] text-foreground",
        "placeholder:text-muted-foreground/60",
        // Transitions
        "transition-all duration-150 outline-none",
        // Focus — clear ring
        "focus-visible:border-primary/60 focus-visible:ring-2 focus-visible:ring-primary/25",
        // Dark mode
        "dark:border-white/12 dark:bg-white/5 dark:focus-visible:border-primary/50",
        // File input
        "file:inline-flex file:h-7 file:border-0 file:bg-primary/10 file:text-primary file:text-sm file:font-medium file:mr-3 file:rounded-md file:px-2",
        // Disabled
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        // Invalid
        "aria-invalid:border-destructive/60 aria-invalid:ring-2 aria-invalid:ring-destructive/25",
        className
      )}
      {...props}
    />
  )
}

export { Input }
