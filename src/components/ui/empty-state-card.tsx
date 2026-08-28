"use client"

import type { ReactNode } from "react"
import type { LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * Estado vazio. size="compact" para painéis/cards, size="page" para o corpo
 * inteiro de uma página (mais respiro + ícone em destaque).
 */
export function EmptyStateCard({
  title,
  description,
  action,
  icon: Icon,
  size = "compact",
  className,
  ...props
}: {
  title: string
  description: string
  action?: ReactNode
  icon?: LucideIcon
  size?: "compact" | "page"
} & React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "border-dashed text-center",
        size === "page"
          ? "rounded-[12px] border border-border/60 bg-muted/15 px-6 py-16"
          : "rounded-[18px] border border-border/80 bg-muted/[0.16] px-4 py-8",
        className
      )}
      {...props}
    >
      <div className={cn("mx-auto", size === "page" ? "max-w-lg" : "max-w-md")}>
        {Icon ? (
          <div className="mx-auto mb-4 flex size-10 items-center justify-center rounded-full bg-primary/10 text-accent-ink">
            <Icon className="size-5" />
          </div>
        ) : null}
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
        {action ? <div className="mt-4 flex items-center justify-center gap-3">{action}</div> : null}
      </div>
    </div>
  )
}
