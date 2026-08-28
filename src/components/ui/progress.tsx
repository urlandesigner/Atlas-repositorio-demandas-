"use client"

import * as React from "react"
import { Progress as ProgressPrimitive } from "@base-ui/react/progress"

import type { StatusTone } from "@/components/ui/status-badge"
import { cn } from "@/lib/utils"

const SIZE_CLASS = {
  xs: "h-1",
  sm: "h-1.5",
  md: "h-2",
} as const

const TONE_CLASS: Record<StatusTone | "primary" | "brand" | "foreground", string> = {
  primary: "bg-primary",
  brand: "bg-brand/55",
  foreground: "bg-foreground",
  success: "bg-success",
  warning: "bg-warning",
  info: "bg-info",
  danger: "bg-destructive",
  neutral: "bg-muted-foreground/50",
  impact: "bg-impact",
}

/** Barra de progresso 0–100. `tone` define a cor do preenchimento via tokens. */
function Progress({
  value,
  max = 100,
  size = "sm",
  tone = "primary",
  className,
  indicatorClassName,
  ...props
}: ProgressPrimitive.Root.Props & {
  size?: keyof typeof SIZE_CLASS
  tone?: keyof typeof TONE_CLASS
  indicatorClassName?: string
}) {
  return (
    <ProgressPrimitive.Root data-slot="progress" value={value} max={max} {...props}>
      <ProgressPrimitive.Track
        data-slot="progress-track"
        className={cn("block w-full overflow-hidden rounded-full bg-muted", SIZE_CLASS[size], className)}
      >
        <ProgressPrimitive.Indicator
          data-slot="progress-indicator"
          className={cn("block h-full rounded-full transition-[width]", TONE_CLASS[tone], indicatorClassName)}
        />
      </ProgressPrimitive.Track>
    </ProgressPrimitive.Root>
  )
}

export { Progress }
