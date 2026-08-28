"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

function FilterPillGroup({ className, ...props }: React.ComponentProps<"div"> & { "aria-label": string }) {
  return (
    <div
      role="group"
      data-slot="filter-pill-group"
      className={cn("flex flex-wrap gap-1.5", className)}
      {...props}
    />
  )
}

function FilterPill({
  className,
  active = false,
  size = "default",
  ...props
}: React.ComponentProps<"button"> & { active?: boolean; size?: "sm" | "default" }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      data-slot="filter-pill"
      className={cn(
        "rounded-full border text-xs font-medium whitespace-nowrap outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/20 disabled:pointer-events-none disabled:opacity-50",
        size === "sm" ? "px-2.5 py-1" : "px-3 py-1.5",
        active
          ? "border-brand/30 bg-brand-muted/50 text-brand-muted-foreground"
          : "border-hairline-strong text-muted-foreground hover:bg-muted hover:text-foreground",
        className
      )}
      {...props}
    />
  )
}

export { FilterPillGroup, FilterPill }
