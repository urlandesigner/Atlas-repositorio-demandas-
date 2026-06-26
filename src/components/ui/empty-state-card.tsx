"use client"

import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

export function EmptyStateCard({
  title,
  description,
  action,
  className,
}: {
  title: string
  description: string
  action?: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "rounded-[18px] border border-dashed border-border/80 bg-muted/[0.16] px-4 py-8 text-center",
        className
      )}
    >
      <div className="mx-auto max-w-md">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
        {action ? <div className="mt-4 flex items-center justify-center">{action}</div> : null}
      </div>
    </div>
  )
}
