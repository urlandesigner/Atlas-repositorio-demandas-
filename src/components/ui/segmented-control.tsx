"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Alternador de visualização/modo (2–4 opções, sempre uma ativa).
 * Para filtros de lista use FilterPill; para conteúdo em painéis use Tabs.
 */
function SegmentedControl({
  className,
  ...props
}: React.ComponentProps<"div"> & { "aria-label": string }) {
  return (
    <div
      role="group"
      data-slot="segmented-control"
      className={cn(
        "inline-flex w-fit items-center rounded-lg border border-border bg-card p-1",
        className
      )}
      {...props}
    />
  )
}

function SegmentedControlItem({
  className,
  active = false,
  ...props
}: React.ComponentProps<"button"> & { active?: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      data-slot="segmented-control-item"
      className={cn(
        "inline-flex h-7 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/20 disabled:pointer-events-none disabled:opacity-50",
        active
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
        className
      )}
      {...props}
    />
  )
}

export { SegmentedControl, SegmentedControlItem }
