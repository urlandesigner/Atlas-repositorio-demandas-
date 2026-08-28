import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Rótulo + controle de formulário — padrão de ~40 formulários do app.
 * size="default" (14px, foreground) é o mais comum; size="sm" (12px, muted)
 * para formulários densos onde o rótulo é só uma pista secundária.
 */
function Field({
  label,
  size = "default",
  labelClassName,
  className,
  children,
  ...props
}: {
  label: React.ReactNode
  size?: "default" | "sm"
  labelClassName?: string
} & React.ComponentProps<"label">) {
  return (
    <label data-slot="field" className={cn("flex flex-col gap-1.5", className)} {...props}>
      <span
        className={cn(
          "font-medium",
          size === "sm" ? "text-xs text-muted-foreground" : "text-sm text-foreground",
          labelClassName
        )}
      >
        {label}
      </span>
      {children}
    </label>
  )
}

export { Field }
